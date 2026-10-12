import React, {memo, useEffect, useRef, useState} from 'react';
import {BODY_DEFAULTS} from '../model.js';
import {bodyParams} from '../body-controls.js';
import {BODY_PROFILES, bodyProfileId} from '../body-profiles.js';
import {resolveBodyModel, SELECTABLE_BODY_MODELS} from '../model-catalog.js';
import {SKIN_TONES, LEGACY_SKIN_COLORS, skinColor} from '../skin-tones.js';
import {Button, Field, RangeControl} from './primitives.jsx';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const BUSY_PHASES = new Set(['loading', 'baking', 'preparing', 'rendering', 'denoising']);
const MEASUREMENTS = [['leftUpperArm', 'Left arm'], ['rightUpperArm', 'Right arm'], ['waist', 'Waist'], ['hips', 'Hips']];

function bodyValue(id, value) {
  if (id === 'stature') return Number(value).toFixed(1) + ' cm';
  if (id === 'mass' || id === 'muscle') return `${value} / 100`;
  return `${value > 0 ? '+' : ''}${value}`;
}

function previewDescription(preview) {
  const samples = Math.floor(preview.samples || 0);
  const labels = {
    idle: '',
    loading: 'Loading preview renderer…',
    baking: 'Preparing skin and ink…',
    preparing: 'Preparing light transport…',
    rendering: 'Refining light',
    denoising: 'Finishing light and fine detail…',
    complete: `${preview.denoised ? 'Denoised ray-traced' : 'Ray-traced'} preview · ${samples} samples.${preview.denoiseWarning ? ' Noise filter unavailable; showing the traced image.' : ''} Move the view to continue editing.`,
    error: preview.message,
  };
  return labels[preview.phase] || '';
}

/** Controls read immutable application snapshots; only partial color text is local. */
function BodyPanelView({app, snapshot}) {
  const {study, ui = {}} = snapshot;
  const body = study?.body || BODY_DEFAULTS;
  const color = skinColor(body);
  const [hex, setHex] = useState(color);
  const hexEditing = useRef(false);
  const hexStudy = useRef(study?.id);
  useEffect(() => {
    if (hexStudy.current !== study?.id || !hexEditing.current) setHex(color);
    hexStudy.current = study?.id;
  }, [study?.id, color]);
  if (!study) return null;

  const actions = app.actions;
  const model = resolveBodyModel(body);
  const fixed = model.supportsShapeControls === false;
  const fixedSkin = model.supportsSkinTone === false;
  const blocked = Boolean(ui.blocked);
  const anatomies = model.anatomies || ['male', 'female'];
  const stats = ui.stats || {};
  const preview = ui.preview || {phase: 'idle'};
  const busy = BUSY_PHASES.has(preview.phase);
  const legacyRefinements = bodyParams.some(([key, , min, max]) => body[key] != null && (body[key] < min || body[key] > max)) || Boolean(body.build);
  const measurements = MEASUREMENTS.filter(([key]) => ui.measurements?.[key] != null)
    .map(([key, label]) => `${label} ${ui.measurements[key].toFixed(1)} cm`).join(' · ');
  const commitColor = () => actions.endGesture('skin-color');
  const updateColor = value => {
    setHex(value);
    if (HEX_COLOR.test(value)) actions.setSkinColor(value.toLowerCase());
  };
  const commitHex = event => {
    commitColor();
    if (!HEX_COLOR.test(event.currentTarget.value)) {
      event.currentTarget.setCustomValidity('Use a six-digit color, such as #a07e56.');
      event.currentTarget.reportValidity();
    }
  };
  const ranges = group => bodyParams.filter(param => param[5] === group).map(([id, label, min, max, step]) => (
    <RangeControl key={id} id={id} label={label} value={body[id] ?? BODY_DEFAULTS[id] ?? 0}
      min={min} max={max} step={step} disabled={fixed || blocked}
      format={value => bodyValue(id, value)}
      onChange={value => actions.editBody(id, Number(value))}
      onCommit={() => actions.endGesture(id)} />
  ));

  return <section data-surface-content="body"><div data-panel-content="body">
    <h2>Body reference</h2>
    <div className="body-model-control">
      <Field label="Body source" htmlFor="body-model">
        <select id="body-model" aria-describedby="body-model-hint body-model-source" value={model.id}
          disabled={blocked} onChange={event => actions.useBodyModel(event.target.value)}>
          {model.legacyOnly && <option value={model.id} disabled>{model.label} · saved reference</option>}
          {SELECTABLE_BODY_MODELS.map(source => <option key={source.id} value={source.id}>{source.label}</option>)}
        </select>
      </Field>
      <p id="body-model-source" className="hint">{model.source}</p>
      <p id="body-model-hint" className="hint">{model.anatomyTopologyCompatible === false ? 'Changing the body or anatomy creates a new study for comparison.' : 'Changing the body creates a new study for comparison.'}</p>
      <p id="body-legacy-note" className="hint" hidden={!model.legacyOnly}>This body source is kept for saved studies. {model.id === 'drummyfish-v1' ? 'Its original texture includes hair and underwear. ' : ''}Choose another body source to create a comparison; your original study stays available.</p>
    </div>
    <p id="body-limit-note" className="hint" hidden={!legacyRefinements}>This saved study uses refinements beyond the current slider ranges. Reset proportions to return to the current fitting range; your saved values have been preserved.</p>
    <div id="body-ranges" data-shape-control="" hidden={fixed}>{ranges('main')}</div>
    <details className="control-details">
      <summary>Body options</summary>
      <p id="body-shape-hint" className="hint" hidden={fixed}>Adjust a starting shape, then refine it.</p>
      <p id="body-fixed-note" className="hint" hidden={!fixed}>Fixed reference body · proportions stay as supplied.</p>
      <Field label="Starting profile" data-shape-control="" hidden={fixed}>
        <select id="body-profile" value={bodyProfileId(body)} disabled={fixed || blocked}
          onChange={event => actions.setBodyProfile(event.target.value)}>
          {BODY_PROFILES.map(profile => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
          <option value="custom" disabled>Custom proportions</option>
        </select>
      </Field>
      <Field label="Anatomy model">
        <select id="body" value={body.body} disabled={blocked || anatomies.length < 2}
          onChange={event => actions.changeAnatomy(event.target.value)}>
          {anatomies.map(id => <option key={id} value={id}>{model.anatomyLabels?.[id] || (id === 'female' ? 'Female' : 'Male')}</option>)}
        </select>
      </Field>
    </details>
    <details className="control-details" data-shape-control="" hidden={fixed}>
      <summary>Refine proportions</summary>
      <div id="body-refinements">{ranges('refinements')}</div>
    </details>
    <details className="control-details" data-shape-control="" hidden={fixed}>
      <summary>Left and right adjustments</summary>
      <div id="body-asymmetry">{ranges('asymmetry')}</div>
    </details>
    <section className="tone-section">
      <h3>Skin tone</h3>
      <p id="body-skin-fixed-note" className="hint" hidden={!fixedSkin}>This reference keeps its original source skin colors.</p>
      <div id="body-skin-controls" hidden={fixedSkin}>
        <div id="skin-swatches" className="skin-swatches" aria-label="Skin tone references">
          {SKIN_TONES.map((tone, index) => <Button key={tone.id} variant="" type="button" data-tone={tone.id}
            aria-label={tone.label} title={tone.label} aria-pressed={body.skin === tone.id}
            disabled={fixedSkin || blocked} onClick={() => actions.setSkinTone(tone.id)}>
            <span style={{background: tone.color}} /><small>{index + 1}</small>
          </Button>)}
        </div>
        <Field label="Reference">
          <select id="skin" value={body.skin} disabled={fixedSkin || blocked} onChange={event => actions.setSkinTone(event.target.value)}>
            {SKIN_TONES.map(tone => <option key={tone.id} value={tone.id}>{tone.label}</option>)}
            <option value="custom">Custom color</option>
            <optgroup label="Earlier study colors">
              {Object.keys(LEGACY_SKIN_COLORS).map(id => <option key={id} value={id}>Saved {id}</option>)}
            </optgroup>
          </select>
        </Field>
        <div className="custom-color">
          <label htmlFor="skin-color">Custom tone</label>
          <input id="skin-color" type="color" value={color} disabled={fixedSkin || blocked}
            onChange={event => updateColor(event.target.value)} onPointerUp={commitColor} onKeyUp={commitColor} onBlur={commitColor} />
          <input id="skin-hex" type="text" value={hex} pattern="#[0-9a-fA-F]{6}" maxLength="7"
            aria-label="Custom skin tone hex color" spellCheck="false" disabled={fixedSkin || blocked}
            onFocus={() => { hexEditing.current = true; }}
            onChange={event => { event.target.setCustomValidity(''); updateColor(event.target.value); }}
            onPointerUp={commitColor} onKeyUp={commitColor}
            onBlur={event => { hexEditing.current = false; commitHex(event); }} />
        </div>
      </div>
    </section>
    <output id="body-measurements" className="hint">{measurements}</output>
    <Button id="reset-body" data-shape-control="" hidden={fixed} disabled={fixed || blocked} onClick={() => actions.resetBody()}>Reset proportions</Button>
    <details className="control-details render-options">
      <summary>Lighting and quality</summary>
      <Field label="Lighting">
        <select id="lighting" value={ui.lighting || 'studio'} disabled={blocked} onChange={event => actions.setLighting(event.target.value)}>
          <option value="studio">Tattoo studio</option>
          <option value="neutral">Neutral inspection</option>
          <option value="albedo">Unlit color reference</option>
        </select>
      </Field>
      <Field label="Interactive quality">
        <select id="render-quality" value={ui.quality || 'auto'} disabled={blocked} onChange={event => actions.setQuality(event.target.value)}>
          <option value="auto">Automatic</option>
          <option value="efficient">Efficient</option>
          <option value="high">High resolution</option>
        </select>
      </Field>
      <div className="small-actions">
        <Button id="raytrace" variant="" type="button" disabled={blocked || busy || stats.renderer !== 'WebGPU'}
          title={stats.renderer !== 'WebGPU' ? 'Requires WebGPU. Interactive preview is available.' : undefined}
          onClick={actions.raytrace}>Ray-traced preview</Button>
        <Button id="cancel-raytrace" variant="" type="button" hidden={!busy && preview.phase !== 'complete'}
          onClick={() => actions.cancelRaytrace()}>{busy ? 'Cancel' : 'Back to editing'}</Button>
      </div>
      <p id="raytrace-status" className="hint" data-phase={preview.phase}>
        <span id="raytrace-announcement" role="status" aria-live="polite">{previewDescription(preview)}</span>
        {preview.phase === 'rendering' && <span id="raytrace-samples" aria-live="off"> · {Math.floor(preview.samples || 0)} samples</span>}
      </p>
      <p className="hint">A draft still with bounced light; fine detail may look grainy. Save reference uses this draft until you return to editing.</p>
      <p id="render-info" className="hint">{`${stats.surface || 'Surface'} processing · ${stats.pixelRatio?.toFixed(2) || '1'}× rendering resolution`}</p>
    </details>
    <details className="control-details">
      <summary>Representation and accuracy</summary>
      <p className="hint">Adult reference, height 150–205 cm. Fullness, muscle and refinement values control geometry; they are not body-fat percentages or measured tissue mass. Limb differences, prostheses, pregnancy, individual folds, scars and vitiligo are not reproduced. Widths, model measurements and skin/ink colors are approximate; confirm with your artist.</p>
      <p className="hint">Monk, Ellis. “Monk Skin Tone Scale,” 2019. <a href="https://skintone.google/get-started" target="_blank" rel="noopener">Source</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Rendered skin and custom colors are adaptations.</p>
    </details>
  </div></section>;
}

export function bodyPanelPropsEqual(previous, next) {
  const a = previous.snapshot, b = next.snapshot, x = a.ui || {}, y = b.ui || {};
  const previewA = x.preview || {}, previewB = y.preview || {};
  return previous.app === next.app && a.study?.id === b.study?.id && a.study?.body === b.study?.body &&
    x.blocked === y.blocked && x.lighting === y.lighting && x.quality === y.quality &&
    MEASUREMENTS.every(([key]) => x.measurements?.[key] === y.measurements?.[key]) &&
    previewA.phase === previewB.phase && Math.floor(previewA.samples || 0) === Math.floor(previewB.samples || 0) &&
    previewA.denoised === previewB.denoised && previewA.denoiseWarning === previewB.denoiseWarning &&
    previewA.message === previewB.message &&
    x.stats?.renderer === y.stats?.renderer && x.stats?.surface === y.stats?.surface &&
    x.stats?.pixelRatio === y.stats?.pixelRatio;
}

export const BodyPanel = memo(BodyPanelView, bodyPanelPropsEqual);

export default BodyPanel;
