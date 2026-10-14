import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadJsx} from './helpers/load-jsx.mjs';
import {createApplication} from '../studio/application.js';
import {BODY_DEFAULTS} from '../studio/model.js';
import {bodyParams} from '../studio/body-controls.js';
import {BODY_MODELS, resolveBodyModel, SELECTABLE_BODY_MODELS} from '../studio/model-catalog.js';
import {SKIN_TONES} from '../studio/skin-tones.js';

const {BodyPanel, bodySourceItems, anatomyItems} = await loadJsx(new URL('../studio/ui/body-panel.jsx', import.meta.url));
const params = bodyParams.map(([id]) => id);

function study(body = {}) {
  return {id: 'saved-study', name: 'Saved study', body: {...BODY_DEFAULTS, ...body}, tattoos: [], selectedIds: []};
}

function render(saved, ui = {}) {
  return renderToStaticMarkup(React.createElement(BodyPanel, {
    app: {actions: {}},
    snapshot: {study: saved, ui: {blocked: false, stats: {renderer: 'WebGPU'}, preview: {phase: 'idle'}, ...ui}},
  }));
}

// Inspect each element's own opening tag: nearby disabled/hidden controls
// must not satisfy the assertion. Select content is bounded too.
function element(html, id) {
  const match = new RegExp(`<([a-z][\\w-]*)\\b[^>]*\\bid="${id}"[^>]*>`).exec(html);
  assert.ok(match, `Rendered element #${id} exists`);
  const start = match.index + match[0].length;
  const end = html.indexOf(`</${match[1]}>`, start);
  return {opening: match[0], content: end < 0 ? '' : html.slice(start, end)};
}

function hasAttribute(opening, name) {
  return new RegExp(`\\s${name}(?:="[^"]*")?(?=\\s|>)`).test(opening);
}

function assertDisabled(html, id, expected) {
  assert.equal(hasAttribute(element(html, id).opening, 'disabled'), expected, `#${id} disabled`);
}

function assertHidden(html, id, expected) {
  assert.equal(hasAttribute(element(html, id).opening, 'hidden'), expected, `#${id} hidden`);
}

function assertSelect(html, id, name, selectedLabel, disabled) {
  const {opening, content} = element(html, id);
  assert.match(opening, /^<button\b/);
  assert.ok(opening.includes('role="combobox"'), `#${id} exposes its select role`);
  assert.ok(opening.includes(`aria-label="${name}"`), `#${id} has its own accessible name`);
  assert.ok(content.includes(`>${selectedLabel}</span>`), `#${id} displays its selected label`);
  assertDisabled(html, id, disabled);
}

function assertShapeWrappers(html, hidden) {
  const wrappers = [...html.matchAll(/<[a-z][\w-]*\b[^>]*\bdata-shape-control=""[^>]*>/g)];
  assert.ok(wrappers.length >= 5, 'Proportion groups, profile and reset have capability wrappers');
  for (const [opening] of wrappers) assert.equal(hasAttribute(opening, 'hidden'), hidden, opening);
}

function assertToneButtons(html, disabled) {
  for (const tone of SKIN_TONES) {
    const match = new RegExp(`<button\\b[^>]*\\bdata-tone="${tone.id}"[^>]*>`).exec(html);
    assert.ok(match, `Tone button ${tone.id} exists`);
    assert.equal(hasAttribute(match[0], 'disabled'), disabled, `${tone.id} disabled`);
    assert.match(match[0], new RegExp(`aria-label="${tone.label}"`));
  }
}

test('real MHR disables unsupported proportions and its single neutral anatomy', () => {
  const saved = study({bodyModelId: 'mhr-v1'}), before = structuredClone(saved), html = render(saved);
  assertSelect(html, 'body', 'Anatomy model', 'Neutral reference', true);
  assert.deepEqual(anatomyItems(resolveBodyModel(saved.body)), [{value: 'male', label: 'Neutral reference'}]);
  for (const id of [...params, 'body-profile', 'reset-body']) assertDisabled(html, id, true);
  assertHidden(html, 'body-fixed-note', false);
  assertHidden(html, 'body-shape-hint', true);
  assert.equal(element(html, 'body-model-source').content, 'Meta MHR');
  assertShapeWrappers(html, true);
  assert.deepEqual(saved, before, 'Rendering a fixed model does not normalize saved proportions');
});

test('source-colored Drummyfish disables every tone editor and explains its fixed colors', () => {
  const html = render(study({bodyModelId: 'drummyfish-v1'}));
  for (const id of ['skin', 'skin-color', 'skin-hex']) assertDisabled(html, id, true);
  assertToneButtons(html, true);
  assertHidden(html, 'body-skin-fixed-note', false);
  assertHidden(html, 'body-skin-controls', true);
  const editableHtml = render(study());
  for (const id of ['skin', 'skin-color', 'skin-hex']) assertDisabled(editableHtml, id, false);
  assertToneButtons(editableHtml, false);
  assertHidden(editableHtml, 'body-skin-fixed-note', true);
  assertHidden(editableHtml, 'body-skin-controls', false);
});

test('MakeHuman restores both anatomies, editable proportions and labeled range bounds', () => {
  const saved = study({body: 'female'}), html = render(saved);
  assertSelect(html, 'body', 'Anatomy model', 'Female', false);
  assert.deepEqual(anatomyItems(resolveBodyModel(saved.body)), [
    {value: 'male', label: 'Male'}, {value: 'female', label: 'Female'},
  ]);
  for (const [id, label, min, max, step] of bodyParams) {
    assertDisabled(html, id, false);
    const {opening} = element(html, id);
    for (const [name, value] of Object.entries({type: 'range', min, max, step})) {
      assert.match(opening, new RegExp(`\\b${name}="${value}"`), id);
    }
    assert.ok(html.includes(`<label for="${id}">${label}</label>`), `${id} has its own label`);
  }
  for (const id of ['body-profile', 'reset-body']) assertDisabled(html, id, false);
  assertHidden(html, 'body-fixed-note', true);
  assertHidden(html, 'body-shape-hint', false);
  assertShapeWrappers(html, false);
});

test('blocked application snapshots disable each body editing control during conversion', () => {
  const html = render(study(), {blocked: true});
  for (const id of ['body-model', 'body', ...params, 'body-profile', 'reset-body', 'skin', 'skin-color', 'skin-hex', 'raytrace']) {
    assertDisabled(html, id, true);
  }
  assertToneButtons(html, true);
});

test('startup query selects Body through the real application snapshot without a renderer', () => {
  for (const [search, surface] of [
    ['?panel=body', 'body'], ['', 'composition'], ['?panel=artwork', 'composition'],
    ['?panel=unknown', 'composition'], ['?bodyModelId=mhr-v1', 'composition'],
  ]) {
    const app = createApplication({browser: {location: {search}}});
    assert.equal(app.getSnapshot().ui.surface, surface, search);
    assert.equal(app.getSnapshot().study, null);
    assert.equal(app.getSnapshot().ui.ready, false);
    app.dispose();
  }
});

test('retired sources are selected disabled choices only in their original saved studies', () => {
  for (const bodyModelId of ['drummyfish-v1', 'atelier-v1']) {
    const saved = study({bodyModelId, clothing: true, hair: true}), before = structuredClone(saved), html = render(saved);
    const label = `${BODY_MODELS[bodyModelId].label} · saved reference`;
    assert.deepEqual(bodySourceItems(resolveBodyModel(saved.body)).find(item => item.value === bodyModelId), {
      value: bodyModelId, label, disabled: true,
    });
    assertSelect(html, 'body-model', 'Body source', label, false);
    assertHidden(html, 'body-legacy-note', false);
    const note = element(html, 'body-legacy-note').content;
    assert.match(note, /Saved reference/);
    assert.match(note, /original study stays unchanged/);
    if (bodyModelId === 'drummyfish-v1') assert.match(note, /Hair and underwear are part of this body/);
    else assert.doesNotMatch(note, /hair|underwear/);
    for (const id of ['clothing', 'hair', 'hair-control']) assert.ok(!html.includes(`id="${id}"`));
    assert.deepEqual(saved, before, 'Displaying an older study does not rewrite it');
  }
  const saved = study(), model = resolveBodyModel(saved.body), html = render(saved), sources = bodySourceItems(model);
  assertSelect(html, 'body-model', 'Body source', model.label, false);
  assert.ok(sources.every(option => !['drummyfish-v1', 'atelier-v1'].includes(option.value)));
  assert.deepEqual(sources.map(option => option.value), SELECTABLE_BODY_MODELS.map(source => source.id));
  assertHidden(html, 'body-legacy-note', true);
});

test('saved out-of-range refinements remain intact with an explanation instead of normalization', () => {
  const saved = study({waist: -30, build: 1, skin: 'custom', skinColor: '#123456'}), before = structuredClone(saved), html = render(saved);
  assertHidden(html, 'body-limit-note', false);
  assert.match(element(html, 'waist').opening, /value="-30"/);
  assert.match(element(html, 'skin-hex').opening, /value="#123456"/);
  assert.deepEqual(saved, before);
});

test('ray-trace controls expose renderer capability and active preview status', () => {
  const fallback = render(study(), {stats: {renderer: 'WebGL'}});
  assertDisabled(fallback, 'raytrace', true);
  assert.match(element(fallback, 'raytrace').opening, /title="Refined previews are not available in this browser/);
  assertHidden(fallback, 'cancel-raytrace', true);
  const active = render(study(), {preview: {phase: 'rendering', samples: 16}});
  assertDisabled(active, 'raytrace', true);
  assertHidden(active, 'cancel-raytrace', false);
  assert.match(element(active, 'raytrace-announcement').opening, /role="status"/);
  assert.match(element(active, 'raytrace-status').content, /16 samples/);
  assert.equal(element(active, 'cancel-raytrace').content, 'Cancel');
  const complete = render(study(), {preview: {phase: 'complete', samples: 32, denoised: true}});
  assertHidden(complete, 'cancel-raytrace', false);
  assert.equal(element(complete, 'cancel-raytrace').content, 'Back to editing');
  assert.match(element(complete, 'raytrace-status').content, /Preview ready\. Export image to save it\./);
  const failed = render(study(), {preview: {phase: 'error', message: 'Preview failed'}});
  assertDisabled(failed, 'raytrace', false);
  assert.match(element(failed, 'raytrace-status').content, /Preview failed/);
});

test('Body offers a direct refined preview without rendering settings or accuracy disclosures', () => {
  const html = render(study());
  assert.doesNotMatch(html, /id="(?:lighting|render-quality|render-info)"/);
  assert.doesNotMatch(html, /Lighting and quality|Representation and accuracy|light transport|rendering resolution/);
  assert.equal(element(html, 'raytrace').content, 'Refine preview');
  assertDisabled(html, 'raytrace', false);
  assertHidden(html, 'raytrace-status', true);
  assert.ok(html.includes('https://skintone.google/get-started'), 'The skin-tone source remains available');
  assert.ok(html.includes('https://creativecommons.org/licenses/by/4.0/'), 'The compact attribution retains its license link');
});
