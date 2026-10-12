import React, {memo, useEffect, useState} from 'react';
import {editable, selection} from '../model.js';
import {REGIONS} from '../regions.js';
import {Eye, EyeOff, LockKeyhole, LockKeyholeOpen, ArrowUp, ArrowDown} from 'lucide-react';
import {Button, Field, RangeControl, closeMenuThen} from './primitives.jsx';

function CompositionPanelView({app, snapshot}) {
  const {workspace, study, ui} = snapshot;
  const actions = app.actions;
  const chosen = selection(study);
  const hasTattoos = study.tattoos.length > 0;
  const items = editable(study);
  const tattoo = items[0] || chosen[0];
  const disabled = ui.blocked || !items.length;
  const hasLocked = chosen.some(layer => layer.locked);
  const name = chosen.length === 1 ? chosen[0].name : chosen.length ? 'Multiple tattoos' : '';
  const selectedId = chosen.length === 1 ? chosen[0].id : null;
  const [nameDraft, setNameDraft] = useState(name);
  useEffect(() => setNameDraft(name), [study.id, selectedId, name]);

  const title = chosen.length === 1 ? chosen[0].name : chosen.length ? `${chosen.length} tattoos selected` : 'Choose a tattoo';
  const summary = chosen.length === 1 && hasLocked
    ? 'Locked in place. Unlock to adjust this tattoo.'
    : chosen.length === 1
    ? `${chosen[0].existing ? 'Existing tattoo' : 'New idea'} · approximate placement`
    : chosen.length
    ? `${chosen.length} selected · ${items.length} editable · ${chosen.length - items.length} locked${hasLocked ? '. Unlock to adjust locked tattoos.' : items.length > 1 ? '. Changes apply as a group.' : ''}`
    : hasTattoos ? 'Select a tattoo below to adjust its placement.' : 'Add artwork, choose a body area, then adjust width.';

  const menuAction = closeMenuThen;

  function range(id, label, min, max, step) {
    const value = tattoo?.[id] ?? (id === 'opacity' ? .9 : 0);
    const format = number => id === 'rotation' ? `${number.toFixed(0)}°`
      : id === 'opacity' ? `${Math.round(number * 100)}%`
        : `${number.toFixed(1)} cm${id === 'width' ? ' ≈' : ''}`;
    return <RangeControl id={id} label={label} value={value} min={min} max={max} step={step}
      disabled={disabled} format={format} onChange={next => actions.editTattoo(id, Number(next))}
      onCommit={() => actions.endGesture(id)} />;
  }

  return <section data-surface-content="composition">
    <div className="composition-heading"><h2>Your composition</h2>{!hasTattoos && <p>Add artwork to begin a placement study.</p>}
      {!hasTattoos && <Button variant="primary" id="browse-art" disabled={ui.blocked} onClick={() => actions.showSurface('artwork')}>Add artwork</Button>}
    </div>
    <div data-panel-content="tattoo">
      <div className="panel-intro">
        <h2 id="selection-title">{title}</h2>
        <p id="selection-summary">{summary}</p>
        {hasLocked && !items.length && chosen.length === 1 && <p className="locked-size">Width: {chosen[0].width.toFixed(1)} cm (approx.)</p>}
      </div>
      <Button variant="secondary" id="unlock-selection" hidden={!hasLocked} disabled={ui.blocked || !hasLocked} onClick={() => actions.lockSelection(false)}>Unlock to adjust</Button>
      <div id="tattoo-controls" hidden={!items.length}>
        <Field label="Body area">
          <select id="region" value={tattoo?.region || 'leftUpperArm'} disabled={disabled} onChange={event => actions.setRegion(event.target.value)}>
            {REGIONS.map(region => <option key={region.id} value={region.id}>{region.label}</option>)}
            <option value="custom">Custom · tap on body</option>
          </select>
        </Field>
        <Button id="place-on-body" className="secondary placement-action" disabled={disabled} aria-pressed={ui.placing} onClick={actions.togglePlace}>Place on body</Button>
        {range('width', 'Width (approx.)', .5, 40, .1)}
        {range('rotation', 'Rotation', -180, 180, 1)}
        <div className="small-actions protection-actions">
          <Button variant="ghost" id="lock-selection" hidden={!items.length} disabled={disabled} onClick={() => actions.lockSelection(true)}>Lock in place</Button>
        </div>
        <details className="control-details advanced-tattoo">
          <summary>More adjustments</summary>
          <Field label="Tattoo name">
            <input id="layer-name" maxLength="120" value={nameDraft} disabled={ui.blocked || items.length !== 1 || chosen.length !== 1}
              onChange={event => setNameDraft(event.target.value)}
              onBlur={() => { if (!ui.blocked && nameDraft !== name && items.length === 1 && chosen.length === 1) actions.renameLayer(nameDraft); }}
              onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
          </Field>
          {range('offsetX', 'Across surface', -20, 20, .1)}
          {range('offsetY', 'Along surface', -20, 20, .1)}
          <div className="nudge" aria-label="Move selected tattoos">
            <Button variant="ghost" data-nudge="-0.5,0" aria-label="Move left half a centimeter" disabled={disabled} onClick={() => actions.nudge(-.5, 0)}>←</Button>
            <Button variant="ghost" data-nudge="0,0.5" aria-label="Move up half a centimeter" disabled={disabled} onClick={() => actions.nudge(0, .5)}>↑</Button>
            <Button variant="ghost" data-nudge="0,-0.5" aria-label="Move down half a centimeter" disabled={disabled} onClick={() => actions.nudge(0, -.5)}>↓</Button>
            <Button variant="ghost" data-nudge="0.5,0" aria-label="Move right half a centimeter" disabled={disabled} onClick={() => actions.nudge(.5, 0)}>→</Button>
            <span>0.5 cm</span>
          </div>
          {range('opacity', 'Ink intensity', .1, 1, .01)}
          <label className="check"><input id="flip" type="checkbox" checked={!!tattoo?.flip} disabled={disabled} onChange={event => actions.setFlip(event.target.checked)} /> Mirror selected artwork</label>
          <p className="hint">Group edits preserve each design’s relative size and spacing. Placement is a visual guide.</p>
        </details>
      </div>
    </div>
    <div className="editor-divider" />
    <div data-left-content="layers">
      <div className="section-heading">
        <h3>Tattoos in this study <span>{study.tattoos.length}</span></h3>
        <details className="layer-menu">
          <summary>Actions</summary>
          <div className="layer-menu-content glass-surface">
            <div className="small-actions">
              <Button variant="ghost" id="select-all" disabled={ui.blocked} onClick={event => menuAction(event, actions.selectAll)}>Select all</Button>
              <Button variant="ghost" id="select-none" disabled={ui.blocked} onClick={event => menuAction(event, actions.clearSelection)}>Clear selection</Button>
            </div>
            <div className="layer-tools">
              <Button variant="ghost" id="duplicate-layers" disabled={disabled} onClick={event => menuAction(event, actions.duplicateLayers)}>Duplicate</Button>
              <Button variant="ghost" id="remove-layers" disabled={disabled} onClick={event => menuAction(event, actions.removeLayers)}>Remove</Button>
            </div>
            <p className="hint">Select several tattoos to edit together. Locked tattoos stay in place.</p>
          </div>
        </details>
      </div>
      <div id="layers" className="layers">
        {study.tattoos.length ? study.tattoos.map((layer, index) => {
          const asset = workspace.assets.find(candidate => candidate.id === layer.assetId);
          const selected = study.selectedIds.includes(layer.id);
          return <div key={layer.id} className={`layer${selected ? ' selected' : ''}${!layer.visible ? ' hidden-layer' : ''}`} data-layer={layer.id}>
            <label className="layer-selection"><input type="checkbox" data-select={layer.id} checked={selected} disabled={ui.blocked}
              aria-label={`Select ${layer.name}`} onChange={event => actions.selectLayer(layer.id, event.target.checked)} /></label>
            <img src={asset?.url} width="48" height="52" alt="" />
            <div>
              <div className="layer-title" title={layer.name}>{layer.name}</div>
              <small>{layer.existing ? 'Existing' : 'Idea'} · {layer.width.toFixed(1)} cm (approx.){layer.locked ? ' · Locked' : ''}</small>
            </div>
            <div className="layer-actions">
              <Button variant="ghost" data-action="visible" data-id={layer.id} title={`${layer.visible ? 'Hide' : 'Show'} ${layer.name}`} aria-label={`${layer.visible ? 'Hide' : 'Show'} ${layer.name}`}
                disabled={ui.blocked} onClick={() => actions.layerAction(layer.id, 'visible')}>{layer.visible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}</Button>
              <Button variant="ghost" data-action="locked" data-id={layer.id} title={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.name}`} aria-label={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.name}`} disabled={ui.blocked}
                onClick={() => actions.layerAction(layer.id, 'locked')}>{layer.locked ? <LockKeyhole size={16} aria-hidden="true" /> : <LockKeyholeOpen size={16} aria-hidden="true" />}</Button>
              <Button variant="ghost" data-action="up" data-id={layer.id} aria-label={`Move ${layer.name} up`}
                disabled={ui.blocked || index === 0} onClick={() => actions.layerAction(layer.id, 'up')}><ArrowUp size={16} aria-hidden="true" /></Button>
              <Button variant="ghost" data-action="down" data-id={layer.id} aria-label={`Move ${layer.name} down`}
                disabled={ui.blocked || index === study.tattoos.length - 1} onClick={() => actions.layerAction(layer.id, 'down')}><ArrowDown size={16} aria-hidden="true" /></Button>
            </div>
          </div>;
        }) : <div className="empty">Start with one tattoo idea.<br /><br />Add artwork, choose a body area, then adjust its approximate size.</div>}
      </div>
      {hasTattoos && <Button variant="primary" id="browse-art" className="primary" disabled={ui.blocked} onClick={() => actions.showSurface('artwork')}>Add artwork</Button>}
    </div>
  </section>;
}

export function compositionPanelPropsEqual(previous, next) {
  const a = previous.snapshot, b = next.snapshot;
  return previous.app === next.app && a.study === b.study &&
    a.workspace.assets === b.workspace.assets &&
    a.ui.blocked === b.ui.blocked && a.ui.placing === b.ui.placing;
}

export const CompositionPanel = memo(CompositionPanelView, compositionPanelPropsEqual);
