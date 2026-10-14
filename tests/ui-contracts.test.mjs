import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadJsx} from './helpers/load-jsx.mjs';
import {BODY_DEFAULTS} from '../studio/model.js';

const [{CompositionPanel}, {ArtworkPanel}, {BodyPanel}, {RangeControl, closeMenuThen}, {StudyCard, Header}] = await Promise.all([
  'composition-panel', 'artwork-panel', 'body-panel', 'primitives', 'main',
].map(name => loadJsx(new URL(`../studio/ui/${name}.jsx`, import.meta.url))));

function fixture() {
  const study = {id: 'study', name: 'Study', body: {...BODY_DEFAULTS}, tattoos: [], selectedIds: []};
  const workspace = {projects: [study], activeProjectId: study.id, assets: []};
  return {app: {actions: {}}, snapshot: {study, workspace, ui: {
    blocked: false, placing: false, artSearch: '', importExisting: false,
    lighting: 'studio', quality: 'auto', measurements: {}, preview: {phase: 'idle'},
    stats: {renderer: 'WebGPU', surface: 'Worker', pixelRatio: 1},
  }}};
}

function withUI(props, change) {
  return {...props, snapshot: {...props.snapshot, ui: {...props.snapshot.ui, ...change}}};
}

function skipped(previous, next) {
  return [CompositionPanel, ArtworkPanel, BodyPanel].map(panel => panel.compare(previous, next));
}

test('memo boundaries skip unrelated notifications, save status and render telemetry', () => {
  const previous = fixture(), next = withUI(previous, {
    status: 'Saved reference', saveLabel: 'Saved', rendering: true,
    measurements: {...previous.snapshot.ui.measurements},
    preview: {...previous.snapshot.ui.preview, elapsedMs: 350},
    stats: {...previous.snapshot.ui.stats, drawCalls: 12, triangles: 24000},
  });
  assert.deepEqual(skipped(previous, next), [true, true, true]);
  assert.deepEqual(skipped(previous, {...previous, app: {actions: {}}}), [false, false, false], 'New action bindings must reach all panels');
});

test('search, import mode and placement updates reach only panels that display them', () => {
  const previous = fixture();
  assert.deepEqual(skipped(previous, withUI(previous, {artSearch: 'rose'})), [true, false, true]);
  assert.deepEqual(skipped(previous, withUI(previous, {importExisting: true})), [true, false, true]);
  assert.deepEqual(skipped(previous, withUI(previous, {placing: true})), [false, true, true]);
  assert.deepEqual(skipped(previous, withUI(previous, {blocked: true})), [false, false, false], 'Transaction blocking must disable every panel');
});

test('tattoo edits update composition without invalidating artwork or body controls', () => {
  const previous = fixture();
  const study = {...previous.snapshot.study, notes: 'Check this placement', tattoos: [{id: 'new-layer'}]};
  const next = {...previous, snapshot: {...previous.snapshot, study}};
  assert.deepEqual(skipped(previous, next), [false, true, true]);
  const changedBody = {...study, body: {...study.body, stature: 180}};
  assert.deepEqual(skipped(previous, {...next, snapshot: {...next.snapshot, study: changedBody}}), [false, true, false]);
  const switchedStudy = {...study, id: 'other-study'};
  assert.deepEqual(skipped(previous, {...next, snapshot: {...next.snapshot, study: switchedStudy}}), [false, true, false], 'Study identity resets body input ownership even if its body object is shared');
});

test('new library assets invalidate library-dependent views', () => {
  const previous = fixture();
  const workspace = {...previous.snapshot.workspace, assets: [{id: 'rose', name: 'Rose'}]};
  assert.deepEqual(skipped(previous, {...previous, snapshot: {...previous.snapshot, workspace}}), [false, false, true]);
});

test('body memo cannot suppress capability, lighting, quality, measurement or preview changes', () => {
  const previous = fixture();
  for (const change of [
    {lighting: 'neutral'}, {quality: 'efficient'}, {measurements: {waist: 80}},
    {preview: {phase: 'rendering', samples: 16}},
    {preview: {phase: 'error', message: 'Preview failed'}},
    {preview: {phase: 'complete', samples: 16, denoised: true}},
    {preview: {phase: 'complete', samples: 16, denoiseWarning: 'Filter unavailable'}},
    {stats: {...previous.snapshot.ui.stats, renderer: 'WebGL 2'}},
    {stats: {...previous.snapshot.ui.stats, surface: 'Main thread'}},
    {stats: {...previous.snapshot.ui.stats, pixelRatio: 2}},
  ]) assert.deepEqual(skipped(previous, withUI(previous, change)), [true, true, false]);
  const completed = withUI(previous, {preview: {phase: 'complete', samples: 16}});
  for (const change of [{samples: 32}, {denoised: true}, {denoiseWarning: 'Filter unavailable'}]) {
    assert.equal(BodyPanel.compare(completed, withUI(completed, {preview: {...completed.snapshot.ui.preview, ...change}})), false);
  }
  const failed = withUI(previous, {preview: {phase: 'error', message: 'First failure'}});
  assert.equal(BodyPanel.compare(failed, withUI(failed, {preview: {phase: 'error', message: 'Different failure'}})), false);
});

test('range controls expose formatted physical units and percentages to assistive technology', () => {
  for (const [value, format, expected] of [
    [7.5, value => `${value.toFixed(1)} cm ≈`, '7.5 cm ≈'],
    [.8, value => `${Math.round(value * 100)}%`, '80%'],
    [175.3, value => `${value.toFixed(1)} cm`, '175.3 cm'],
  ]) {
    const html = renderToStaticMarkup(React.createElement(RangeControl, {
      id: 'range', label: 'Value', value, min: 0, max: 205, step: .1, format,
      onChange() {}, onCommit() {},
    }));
    const input = /<input\b[^>]*>/.exec(html)[0];
    assert.ok(input.includes(`aria-valuetext="${expected}"`));
    assert.ok(html.includes('<label for="range">Value</label>'));
  }
});

test('skin swatches keep their own grid layout without the default secondary-button shell', () => {
  const html = renderToStaticMarkup(React.createElement(BodyPanel, fixture()));
  const swatches = [...html.matchAll(/<button\b[^>]*data-tone="[^"]+"[^>]*>/g)].map(([tag]) => tag);
  assert.equal(swatches.length, 10);
  for (const tag of swatches) {
    assert.doesNotMatch(tag, /class="[^"]*\bsecondary\b/, 'Plain controls must not inherit secondary button margin, border and full width');
    assert.match(tag, /aria-label="Monk \d+"/);
  }
});

test('closing disclosure restores its summary before the action takes focus', () => {
  const calls = [];
  const summary = {focus() { calls.push('summary focus'); }};
  const menu = {
    removeAttribute(name) { assert.equal(name, 'open'); calls.push('closed'); },
    querySelector(selector) { assert.equal(selector, ':scope > summary'); return summary; },
  };
  const event = {currentTarget: {closest(selector) { assert.equal(selector, 'details'); return menu; }}};
  assert.equal(closeMenuThen(event, () => { calls.push('dialog focus'); return 'result'; }), 'result');
  assert.deepEqual(calls, ['closed', 'summary focus', 'dialog focus'], 'Menu cleanup must not steal focus back from the action');
  assert.equal(closeMenuThen({currentTarget: {closest: () => null}}, () => 42), 42);
});

function previewMarkup(preview) {
  return renderToStaticMarkup(React.createElement(BodyPanel, withUI(fixture(), {preview})));
}

function announcement(html) {
  return /<span\b[^>]*id="raytrace-announcement"[^>]*>(.*?)<\/span>/.exec(html)[1];
}

test('sample progress changes visually without changing the phase live announcement', () => {
  const first = previewMarkup({phase: 'rendering', samples: 16});
  const next = previewMarkup({phase: 'rendering', samples: 32});
  assert.equal(announcement(first), 'Refining light');
  assert.equal(announcement(first), announcement(next));
  assert.match(first, /id="raytrace-samples" aria-live="off"> · 16 samples/);
  assert.match(next, /id="raytrace-samples" aria-live="off"> · 32 samples/);
  assert.match(next, /id="raytrace-announcement" role="status" aria-live="polite"/);
  assert.match(announcement(previewMarkup({phase: 'denoising'})), /Finishing/);
  assert.match(announcement(previewMarkup({phase: 'error', message: 'Preview failed'})), /Preview failed/);
  assert.match(announcement(previewMarkup({phase: 'complete', samples: 32, denoised: true})), /Preview ready. Export image to save it./);
});


test('selected tattoo placement and width stay ahead of a long composition list', () => {
  const props = fixture();
  const tattoos = Array.from({length: 24}, (_, index) => ({
    id: `layer-${index}`, assetId: 'art', name: `Design ${index + 1}`, width: 7.5,
    rotation: 0, opacity: .9, region: 'leftUpperArm', visible: true, locked: false,
  }));
  props.snapshot.study = {...props.snapshot.study, tattoos, selectedIds: ['layer-23']};
  props.snapshot.workspace.assets = [{id: 'art', name: 'Design', url: '/art.png'}];
  const html = renderToStaticMarkup(React.createElement(CompositionPanel, props));
  assert.ok(html.indexOf('id="region"') < html.indexOf('id="layers"'));
  assert.ok(html.indexOf('id="width"') < html.indexOf('id="layers"'));
  assert.match(html, /id="selection-title"[^>]*>Design 24/);
  assert.equal((html.match(/data-select="layer-/g) || []).length, 24);
  for (const id of ['place-on-body', 'duplicate-layers', 'remove-layers', 'lock-selection', 'unlock-selection', 'browse-art']) {
    assert.ok(html.includes(`id="${id}"`), `${id} remains available`);
  }
  for (const action of ['visible', 'locked', 'up', 'down']) {
    assert.equal((html.match(new RegExp(`data-action="${action}"`, 'g')) || []).length, 24);
  }
  assert.match(html, /aria-label="Hide Design 24"/);
  assert.match(html, /aria-label="Lock Design 24"/);
});


test('a locked selection keeps unlocking and its width ahead of hidden adjustments', () => {
  const props = fixture();
  props.snapshot.study = {...props.snapshot.study, selectedIds: ['locked'], tattoos: [{
    id: 'locked', assetId: 'art', name: 'Existing design', width: 16.3, rotation: -5,
    opacity: .9, region: 'custom', visible: true, existing: true, locked: true,
  }]};
  props.snapshot.workspace.assets = [{id: 'art', name: 'Design', url: '/art.png'}];
  const html = renderToStaticMarkup(React.createElement(CompositionPanel, props));
  assert.match(html, /Locked in place. Unlock to adjust this tattoo/);
  assert.match(html, /Width: 16.3 cm \(approx.\)/);
  assert.match(html, /id="tattoo-controls" hidden=""/);
  const unlock = /<button\b[^>]*id="unlock-selection"[^>]*>/.exec(html)[0];
  assert.ok(!unlock.includes('hidden='));
  assert.ok(!unlock.includes('disabled='));
  assert.ok(html.indexOf('id="unlock-selection"') < html.indexOf('id="tattoo-controls"'));
});

test('clearing selection keeps existing layers available without empty-study guidance', () => {
  const props = fixture();
  props.snapshot.study = {...props.snapshot.study, tattoos: [{
    id: 'existing', assetId: 'art', name: 'Existing design', width: 7,
    rotation: 0, opacity: .9, region: 'chest', visible: true, locked: true,
  }]};
  props.snapshot.workspace.assets = [{id: 'art', name: 'Design', url: '/art.png'}];
  const html = renderToStaticMarkup(React.createElement(CompositionPanel, props));
  assert.doesNotMatch(html, /Add artwork to begin a placement study/);
  assert.match(html, /Select a tattoo below to adjust its placement/);
  assert.match(html, /aria-label="Select Existing design"/);
  assert.equal((html.match(/id="browse-art"/g) || []).length, 1);
  assert.ok(html.indexOf('id="layers"') < html.indexOf('id="browse-art"'), 'Existing layers come before the add-artwork action');
});


test('study save indicator distinguishes confirmed saves, pending work and errors', () => {
  for (const [saveLabel, saveError, state] of [
    ['Connecting…', false, 'pending'], ['Saving…', false, 'pending'],
    ['Saved to workspace', false, 'saved'], ['Saved in this browser', false, 'saved'],
    ['Not connected', true, 'error'], ['Saved copy loaded', true, 'error'],
  ]) {
    const props = withUI(fixture(), {saveLabel, saveError, retry: {hidden: true, text: 'Retry save'}});
    const html = renderToStaticMarkup(React.createElement(StudyCard, props));
    assert.match(html, new RegExp(`data-save-state="${state}" role="status" title="${saveLabel}"`));
    assert.match(html, /aria-label="Current study" title="Study"/);
    if (state === 'error') assert.match(html, /color:var\(--danger\)/);
  }
});

test('compact study capsule retains secondary study actions and readable save state', () => {
  const props = withUI(fixture(), {saveLabel: 'Saved to workspace', saveError: false, retry: {hidden: true, text: 'Retry save'}});
  const html = renderToStaticMarkup(React.createElement(StudyCard, props));
  assert.doesNotMatch(html, /class="brand"/, 'The compact capsule is reserved for study identity and actions');
  for (const id of ['project-select', 'undo', 'redo', 'new-project', 'rename-project', 'duplicate-project', 'delete-project', 'data-open', 'notes-open']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id} remains available exactly once`);
  }
  assert.match(html, /class="save-status-short" aria-hidden="true">Saved</);
  assert.match(html, /Saved to workspace/);
  assert.doesNotMatch(html, /id="help-open"/, 'Help is grouped under Workspace rather than repeated in study actions');
});

test('artwork offers direct import and separate preview/add targets without a duplicate heading', () => {
  const props = fixture();
  props.snapshot.workspace.assets = [{id: 'art', name: 'existing_astronaut-reference.png', url: '/art.png'}];
  const html = renderToStaticMarkup(React.createElement(ArtworkPanel, props));
  assert.doesNotMatch(html, /<h2[^>]*>Artwork<\/h2>|<details/);
  assert.match(html, /type="file"[^>]*aria-label="Import artwork"/);
  assert.match(html, /id="import-existing"/);
  assert.match(html, /aria-label="Preview existing_astronaut-reference.png"/);
  assert.match(html, /aria-label="Add existing_astronaut-reference.png to study"/);
  assert.match(html, />existing astronaut reference<\/strong>/);
});

test('selected artwork uses its own compact preview and retains full title', () => {
  const props = fixture();
  props.snapshot.study = {...props.snapshot.study, tattoos: [{id: 'one', assetId: 'art', name: 'Astronaut reference', width: 7, rotation: 0, opacity: .9, region: 'leftUpperArm', visible: true, locked: false}], selectedIds: ['one']};
  props.snapshot.workspace.assets = [{id: 'art', name: 'Astronaut reference', url: '/api/assets/art'}];
  const html = renderToStaticMarkup(React.createElement(CompositionPanel, props));
  assert.match(html, /class="selection-preview"[^>]*src="\/api\/assets\/art"/);
  assert.match(html, /id="selection-title"[^>]*title="Astronaut reference"/);
  assert.ok(html.indexOf('class="selection-preview"') < html.indexOf('id="region"'));
});

test('body source details are available without preceding the main controls with metadata', () => {
  const html = renderToStaticMarkup(React.createElement(BodyPanel, fixture()));
  const disclosure = /<details\b[^>]*class="[^"]*body-source-details[^"]*"[^>]*>/.exec(html)?.[0];
  assert.ok(disclosure, 'Body source metadata uses a disclosure');
  assert.doesNotMatch(disclosure, /\bopen(?:=|\s|>)/, 'Metadata starts collapsed');
  assert.match(html, /id="body-model"/);
  assert.match(html, /id="stature"/);
});


test('image export stays distinct from automatic study saving', () => {
  const props = withUI(fixture(), {ready: true, saveLabel: 'Saved to workspace', retry: {hidden: true, text: 'Retry save'}});
  const html = renderToStaticMarkup(React.createElement(Header, props));
  assert.match(html, /id="save-image"[^>]*aria-label="Export image"/);
  assert.match(html, /class="save-label-compact" aria-hidden="true">Export</);
  assert.doesNotMatch(html, /Save reference/);
});
