import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApplication} from '../studio/application.js';
import {project, addTattoo, MAX_TATTOOS} from '../studio/model.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return {promise, resolve, reject};
}
async function until(predicate, label = 'application state') {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (predicate()) return;
    await tick();
  }
  assert.fail(`Timed out waiting for ${label}`);
}
function hostNode() {
  return {
    children: [], dataset: {},
    appendChild(node) { this.children.push(node); node.parentNode = this; return node; },
    removeChild(node) { this.children = this.children.filter(child => child !== node); node.parentNode = null; },
  };
}
function harness({full = false, extraStudy = false, initialGate, engineGate, failBackup = false, failRestore = false, update = async () => {}, dispose = () => {}} = {}) {
  const study = project('Original study');
  study.notes = 'Original notes';
  const asset = {id: 'artwork', name: 'A rose', url: '/rose.png', width: 100, height: 150};
  if (full) for (let index = 0; index < MAX_TATTOOS; index++) addTattoo(study, asset);
  const persisted = {revision: 0, projects: [study, ...(extraStudy ? [project('Another study')] : [])], activeProjectId: study.id, assets: [asset]};
  const calls = [], engines = [], layouts = [], downloads = [], timers = new Map();
  let timerId = 0;
  const clock = {setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); }};
  const browser = {location: {search: ''}, document: {body: {inert: false}}, Blob: globalThis.Blob, confirm: () => true};
  const api = async (path, method = 'GET', payload) => {
    calls.push({path, method, payload: payload === undefined ? undefined : structuredClone(payload)});
    if (path === 'workspace' && method === 'GET') {
      if (initialGate) await initialGate.promise;
      return structuredClone(persisted);
    }
    if (path === 'workspace' && method === 'PUT') {
      persisted.projects = structuredClone(payload.projects);
      persisted.activeProjectId = payload.activeProjectId;
      return {revision: ++persisted.revision};
    }
    if (path === 'assets' && method === 'POST') return {id: 'uploaded-artwork', url: '/new.png', ...payload};
    if (path === 'backup') {
      if (failBackup) throw Error('Backup server unavailable');
      return {version: 3, assets: structuredClone(persisted.assets)};
    }
    if (path === 'restore' && method === 'POST') {
      if (failRestore) throw Error('Restore server unavailable');
      return structuredClone(persisted);
    }
    throw Error(`Unexpected API request ${method} ${path}`);
  };
  const createStudio = async (host, options) => {
    const canvas = {style: {}, remove() { this.parentNode?.removeChild(this); }};
    host.appendChild(canvas);
    const engine = {
      options, canvas, renderer: {domElement: canvas}, updates: [], views: [], lighting: [], qualities: [], disposed: 0,
      async update(...args) { this.updates.push(structuredClone(args)); await update(...args); },
      view(name) { this.views.push(name); },
      restoreCamera(camera) { this.restoredCamera = structuredClone(camera); },
      getCamera() { return {position: [0, 1, 4], target: [0, 1, 0]}; },
      getAnchor() { return {faceIndex: 1, barycentric: [.2, .3, .5]}; },
      refreshLayout() { this.refreshed = (this.refreshed || 0) + 1; },
      setPlaceMode(value) { this.placing = value; },
      setLighting(value) { this.lighting.push(value); },
      setQuality(value) { this.qualities.push(value); },
      raytrace() { this.traces = (this.traces || 0) + 1; },
      cancelRaytrace() { this.cancelled = (this.cancelled || 0) + 1; },
      dispose() { this.disposed++; canvas.remove(); return dispose(this); },
    };
    engines.push(engine);
    if (engineGate) await engineGate.promise;
    return engine;
  };
  const observeLayout = options => {
    const layout = {options, disposed: 0, measure: () => ({x: 0, y: 0, width: 800, height: 700}), dispose() { this.disposed++; }};
    layouts.push(layout);
    return layout;
  };
  const app = createApplication({createStudio, api, browser, observeLayout, clock,
    regions: [{id: 'leftUpperArm', label: 'Left upper arm'}],
    fileServices: {
      raster: async () => ({width: 100, height: 100, dataUrl: 'data:image/png;base64,test'}),
      download: (name, blob) => downloads.push({name, blob}),
    },
  });
  const host = hostNode();
  const attach = () => app.attachViewport(host, {});
  const mount = async () => { const release = attach(); await until(() => app.getSnapshot().ui.ready, 'ready viewport'); return release; };
  return {app, host, attach, mount, persisted, study, asset, calls, engines, layouts, downloads, timers, browser};
}

test('application snapshots are cached, deeply immutable copies and subscriptions unsubscribe', async t => {
  const h = harness(); t.after(() => h.app.dispose());
  const initial = h.app.getSnapshot();
  assert.equal(h.app.getSnapshot(), initial);
  let notifications = 0;
  const unsubscribe = h.app.subscribe(() => { notifications++; });
  await h.app.initialize();
  const loaded = h.app.getSnapshot();
  assert.notEqual(loaded, initial); assert.equal(loaded, h.app.getSnapshot());
  assert.ok(Object.isFrozen(loaded)); assert.ok(Object.isFrozen(loaded.study.body)); assert.ok(Object.isFrozen(loaded.workspace.projects));
  assert.throws(() => { loaded.study.body.stature = 190; }, TypeError);
  assert.throws(() => { loaded.workspace.assets.push({id: 'injected'}); }, TypeError);
  assert.equal(h.persisted.projects[0].body.stature, h.study.body.stature);
  assert.equal(notifications, 1); unsubscribe();
  h.app.actions.setArtSearch('rose');
  assert.equal(notifications, 1); assert.equal(loaded.ui.artSearch, '');
  assert.equal(h.app.getSnapshot().ui.artSearch, 'rose');
});

test('capacity failure leaves study, history, navigation and placement focus unchanged', async t => {
  const h = harness({full: true}); t.after(() => h.app.dispose()); await h.mount();
  h.app.actions.showSurface('artwork');
  const before = h.app.getSnapshot();
  const renders = h.engines[0].updates.length;
  assert.equal(h.app.actions.addArtwork(h.asset.id), false);
  const after = h.app.getSnapshot();
  assert.deepEqual(after.study, before.study); assert.equal(after.ui.surface, 'artwork');
  assert.equal(after.ui.focusPlacement, before.ui.focusPlacement);
  assert.equal(after.ui.canUndo, before.ui.canUndo); assert.equal(h.engines[0].updates.length, renders);
  assert.match(after.ui.status, /hold 16 tattoos/); assert.doesNotMatch(after.ui.status, /Added to study/);
  assert.equal(h.app.hasUnsavedChanges(), false); assert.equal(h.timers.size, 0);
});

test('UI-only commands and renderer telemetry reuse the immutable domain snapshot', async t => {
  const h = harness(); t.after(() => h.app.dispose()); await h.mount();
  const before = h.app.getSnapshot(), engine = h.engines[0];
  const events = [
    () => h.app.actions.setArtSearch('rose'),
    () => h.app.actions.showSurface('body'),
    () => h.app.actions.togglePanel(),
    () => h.app.actions.openDialog('help'),
    () => h.app.actions.closeDialog(),
    () => h.app.actions.setImportExisting(true),
    () => h.app.actions.setLighting('neutral'),
    () => h.app.actions.setQuality('efficient'),
    () => engine.options.onStats({renderer: 'WebGPU', warnings: ['Test warning']}),
    () => engine.options.onStats({renderer: 'WebGPU', warnings: []}),
    () => engine.options.onPreview({phase: 'rendering', samples: 10}),
    () => engine.options.onMeasurements({waist: 80}),
  ];
  let previous = before, notifications = 0;
  const unsubscribe = h.app.subscribe(() => { notifications++; });
  for (const event of events) {
    event();
    const next = h.app.getSnapshot();
    assert.notEqual(next, previous); assert.notEqual(next.ui, previous.ui);
    assert.equal(next.workspace, before.workspace); assert.equal(next.study, before.study);
    assert.equal(next.workspace.assets, before.workspace.assets);
    assert.ok(Object.isFrozen(next.ui)); assert.ok(Object.isFrozen(next.study.body));
    previous = next;
  }
  unsubscribe();
  assert.equal(notifications, events.length);
  assert.equal(before.ui.artSearch, ''); assert.equal(before.ui.surface, 'composition');
  assert.deepEqual(before.ui.stats, {}); assert.deepEqual(before.ui.preview, {phase: 'idle'});
  assert.deepEqual(before.ui.measurements, {});
  assert.equal(previous.ui.artSearch, 'rose'); assert.equal(previous.ui.stats.renderer, 'WebGPU');
  assert.equal(previous.ui.preview.samples, 10); assert.equal(previous.ui.measurements.waist, 80);
});

test('domain edits, persistence acknowledgements and study switches invalidate cached domain copies', async t => {
  const h = harness({extraStudy: true}); t.after(() => h.app.dispose()); await h.mount();
  const before = h.app.getSnapshot(), originalStature = before.study.body.stature;
  const nextStudyId = before.workspace.projects[1].id;
  h.app.actions.editBody('stature', originalStature + 3);
  h.app.actions.endGesture('stature');
  const edited = h.app.getSnapshot();
  assert.notEqual(edited.workspace, before.workspace); assert.notEqual(edited.study, before.study);
  assert.equal(edited.study.body.stature, originalStature + 3);
  assert.equal(before.study.body.stature, originalStature);
  assert.equal(await h.app.flush(), true);
  const saved = h.app.getSnapshot();
  assert.notEqual(saved.workspace, edited.workspace);
  assert.equal(saved.workspace.revision, h.persisted.revision);
  assert.equal(edited.workspace.revision, before.workspace.revision);
  h.app.actions.setArtSearch('after saving');
  assert.equal(h.app.getSnapshot().workspace, saved.workspace);
  assert.equal(await h.app.actions.switchProject(nextStudyId), true);
  const switched = h.app.getSnapshot();
  assert.notEqual(switched.workspace, saved.workspace); assert.notEqual(switched.study, saved.study);
  assert.equal(switched.study.id, nextStudyId); assert.equal(switched.workspace.activeProjectId, nextStudyId);
  assert.equal(saved.study.id, before.study.id); assert.equal(saved.workspace.activeProjectId, before.study.id);
  assert.equal(before.study.camera, null);
  assert.equal(switched.workspace.projects[0].body.stature, originalStature + 3);
  assert.ok(Object.isFrozen(switched.workspace.projects[0].camera));
});

test('body and skin gestures produce one undo step and notes are owned before blur', async t => {
  const h = harness(); t.after(() => h.app.dispose()); await h.mount();
  const original = h.app.getSnapshot().study.body.stature;
  h.app.actions.editBody('stature', 181); h.app.actions.editBody('stature', 184); h.app.actions.editBody('stature', 188);
  h.app.actions.undo(); assert.equal(h.app.getSnapshot().study.body.stature, original); assert.equal(h.app.getSnapshot().ui.canUndo, false);
  h.app.actions.redo(); assert.equal(h.app.getSnapshot().study.body.stature, 188);
  const originalTone = h.app.getSnapshot().study.body.skin;
  h.app.actions.setSkinColor('#aabbcc'); h.app.actions.setSkinColor('#112233');
  h.app.actions.endGesture('skin-color'); h.app.actions.undo();
  assert.equal(h.app.getSnapshot().study.body.skin, originalTone);
  h.app.actions.setNotes('Typed without blur'); h.app.actions.setNotes('Typed without blur, then refined');
  assert.equal(h.app.getSnapshot().study.notes, 'Typed without blur, then refined');
  await h.app.flush();
  assert.equal(h.persisted.projects[0].notes, 'Typed without blur, then refined');
  h.app.actions.undo(); assert.equal(h.app.getSnapshot().study.notes, 'Original notes');
  h.app.actions.redo(); assert.equal(h.app.getSnapshot().study.notes, 'Typed without blur, then refined');
});

test('persisted domain actions update the workspace while UI changes keep one canvas and renderer', async t => {
  const h = harness(); t.after(() => h.app.dispose()); await h.mount();
  const engine = h.engines[0], canvas = h.host.children[0], renders = engine.updates.length;
  h.app.actions.showSurface('body'); h.app.actions.togglePanel(); h.app.actions.setArtSearch('rose');
  h.app.actions.openDialog('help'); h.app.actions.closeDialog();
  engine.options.onStats({renderer: 'WebGPU', kernel: 'WASM', pixelRatio: 1});
  engine.options.onPreview({phase: 'rendering', samples: 10});
  engine.options.onMeasurements({waist: 80});
  h.app.actions.setLighting('neutral'); h.app.actions.setQuality('efficient');
  assert.equal(h.engines.length, 1); assert.equal(h.host.children.length, 1); assert.equal(h.host.children[0], canvas);
  assert.equal(engine.updates.length, renders); assert.equal(engine.disposed, 0);
  assert.deepEqual(engine.lighting, ['neutral']); assert.deepEqual(engine.qualities, ['efficient']);
  assert.equal(h.app.actions.addArtwork(h.asset.id), true);
  h.app.actions.renameLayer('My rose'); h.app.actions.editTattoo('width', 12); h.app.actions.endGesture('width');
  h.app.actions.setSkinColor('#ABCDEF'); h.app.actions.endGesture('skin-color');
  h.app.actions.editBody('mass', 72); h.app.actions.endGesture('mass'); h.app.actions.setNotes('Ask about fit.');
  assert.equal(await h.app.flush(), true);
  const saved = h.persisted.projects[0];
  assert.equal(saved.tattoos.length, 1); assert.equal(saved.tattoos[0].name, 'My rose'); assert.equal(saved.tattoos[0].width, 12);
  assert.equal(saved.body.skinColor, '#abcdef'); assert.equal(saved.body.mass, 72); assert.equal(saved.notes, 'Ask about fit.');
  assert.equal(h.app.hasUnsavedChanges(), false); assert.equal(h.host.children[0], canvas);
});

test('unmount before delayed workspace initialization prevents renderer creation', async () => {
  const gate = deferred(), h = harness({initialGate: gate});
  const release = h.attach(); release(); gate.resolve();
  await h.app.initialize(); await tick();
  assert.equal(h.engines.length, 0); assert.equal(h.layouts.length, 0); assert.equal(h.host.children.length, 0);
  assert.equal(h.app.getSnapshot().ui.ready, false); h.app.dispose();
});

test('unmount during delayed renderer creation disposes its late result once', async () => {
  const gate = deferred(), h = harness({engineGate: gate});
  const release = h.attach(); await until(() => h.engines.length === 1, 'pending renderer');
  const engine = h.engines[0]; release(); release();
  assert.equal(h.layouts[0].disposed, 1); assert.equal(engine.disposed, 0);
  gate.resolve(); await until(() => engine.disposed === 1, 'late renderer disposal');
  assert.equal(h.host.children.length, 0); assert.equal(h.app.getSnapshot().ui.ready, false);
  engine.options.onPreview({phase: 'complete', samples: 32});
  assert.equal(h.app.getSnapshot().ui.preview.phase, 'idle');
  h.app.dispose(); assert.equal(engine.disposed, 1);
});

test('replacement mount waits for a cancelled pending renderer to be disposed', async t => {
  const gate = deferred(), h = harness({engineGate: gate});
  t.after(() => h.app.dispose());
  h.attach(); await until(() => h.engines.length === 1, 'first pending renderer');
  h.attach(); await tick();
  assert.equal(h.engines.length, 1, 'new creation cannot overlap the cancelled renderer');
  gate.resolve(); await until(() => h.app.getSnapshot().ui.ready, 'replacement viewport');
  assert.equal(h.engines.length, 2); assert.equal(h.engines[0].disposed, 1); assert.equal(h.layouts[0].disposed, 1);
  assert.equal(h.engines[1].disposed, 0); assert.equal(h.host.children.length, 1); assert.equal(h.host.children[0], h.engines[1].canvas);
  h.engines[0].options.onStats({renderer: 'obsolete'});
  assert.notEqual(h.app.getSnapshot().ui.stats.renderer, 'obsolete', 'cancelled callbacks cannot overwrite the new viewport');
});

test('viewport release publishes unavailable state and remount owns exactly one canvas', async t => {
  const h = harness(); const release = await h.mount();
  t.after(() => h.app.dispose());
  const first = h.engines[0]; release();
  assert.equal(first.disposed, 1); assert.equal(h.host.children.length, 0);
  assert.equal(h.app.getSnapshot().ui.ready, false, 'immutable snapshot must report the renderer is unavailable');
  await h.mount();
  assert.equal(h.engines.length, 2); assert.equal(h.host.children.length, 1); assert.equal(h.engines[1].disposed, 0);
  h.app.dispose(); assert.equal(h.engines[1].disposed, 1); assert.equal(h.host.children.length, 0);
});

test('failed first render disposes its renderer and layout immediately', async t => {
  t.mock.method(console, 'error', () => {});
  const h = harness({update: async () => { throw Error('Initial body failed'); }});
  t.after(() => h.app.dispose());
  h.attach(); await until(() => Boolean(h.app.getSnapshot().ui.error), 'initial render error');
  assert.match(h.app.getSnapshot().ui.error, /could not be rendered/);
  assert.equal(h.app.getSnapshot().ui.ready, false);
  assert.equal(h.engines[0].disposed, 1, 'failed initialization must release allocated renderer resources');
  assert.equal(h.layouts[0].disposed, 1, 'failed initialization must release observers');
  assert.equal(h.host.children.length, 0);
});

test('obsolete initialization failure cannot publish after deferred disposal and replacement mount', async t => {
  t.mock.method(console, 'error', () => {});
  const gate = deferred();
  let updates = 0;
  const h = harness({
    update: async () => { if (++updates === 1) throw Error('Initial body failed'); },
    dispose: engine => engine === h.engines[0] ? gate.promise : undefined,
  });
  t.after(() => h.app.dispose());
  h.attach(); await until(() => h.engines[0]?.disposed === 1, 'failed renderer disposal');
  h.attach();
  assert.equal(h.app.getSnapshot().ui.loading, true);
  const errors = [];
  const unsubscribe = h.app.subscribe(() => { if (h.app.getSnapshot().ui.error) errors.push(h.app.getSnapshot().ui.error); });
  gate.resolve(); await until(() => h.app.getSnapshot().ui.ready, 'replacement after failed renderer');
  unsubscribe();
  const recovered = h.app.getSnapshot();
  assert.equal(h.engines.length, 2); assert.equal(h.engines[0].disposed, 1); assert.equal(h.engines[1].disposed, 0);
  assert.equal(h.host.children.length, 1); assert.equal(h.host.children[0], h.engines[1].canvas);
  assert.equal(recovered.ui.error, ''); assert.equal(recovered.ui.saveError, false); assert.equal(recovered.ui.loading, false);
  assert.deepEqual(errors, [], 'obsolete failure must never reach replacement subscribers, even transiently');
});

test('replacement initialization clears a previously published viewport failure', async t => {
  t.mock.method(console, 'error', () => {});
  let updates = 0;
  const h = harness({update: async () => { if (++updates === 1) throw Error('Initial body failed'); }});
  t.after(() => h.app.dispose());
  h.attach(); await until(() => Boolean(h.app.getSnapshot().ui.error), 'published viewport failure');
  assert.equal(h.app.getSnapshot().ui.saveError, true); assert.equal(h.app.getSnapshot().ui.loading, false);
  h.attach();
  const opening = h.app.getSnapshot();
  assert.equal(opening.ui.loading, true); assert.equal(opening.ui.error, ''); assert.equal(opening.ui.saveError, false);
  await until(() => h.app.getSnapshot().ui.ready, 'recovered viewport');
  assert.equal(h.app.getSnapshot().ui.error, ''); assert.equal(h.app.getSnapshot().ui.saveError, false);
});

test('application disposal destroys artwork preview adapter and clears pending saves', async () => {
  const h = harness(); await h.mount();
  let destroyed = 0; h.app.setArtworkPreview({destroy() { destroyed++; }});
  h.app.actions.setNotes('Pending save'); assert.equal(h.timers.size, 1);
  h.app.dispose(); h.app.dispose();
  assert.equal(destroyed, 1); assert.equal(h.engines[0].disposed, 1); assert.equal(h.layouts[0].disposed, 1); assert.equal(h.timers.size, 0);
});

test('backup failures appear in the open dialog and failed restores preserve the original study', async t => {
  for (const scenario of ['invalid-json', 'wrong-version', 'export-unavailable', 'restore-unavailable']) {
    const h = harness({failBackup: scenario === 'export-unavailable', failRestore: scenario === 'restore-unavailable'});
    t.after(() => h.app.dispose()); await h.mount(); h.app.actions.openDialog('data');
    const before = h.app.getSnapshot().study;
    const result = scenario === 'export-unavailable'
      ? await h.app.actions.exportBackup()
      : await h.app.actions.restoreBackup({text: async () => scenario === 'invalid-json' ? '{invalid' : JSON.stringify({version: scenario === 'wrong-version' ? 2 : 3})});
    assert.equal(result, false, scenario);
    const snapshot = h.app.getSnapshot();
    assert.equal(snapshot.ui.dialog, 'data'); assert.match(snapshot.ui.dataStatus, /^Backup did not complete: /, scenario);
    assert.doesNotMatch(snapshot.ui.dataStatus, /Workspace exported/, 'pre-restore backup success cannot mask the later restore failure');
    if (scenario === 'wrong-version') assert.match(snapshot.ui.dataStatus, /Choose an INKFORM workspace backup/);
    if (scenario.endsWith('unavailable')) assert.match(snapshot.ui.dataStatus, /server unavailable/);
    assert.deepEqual(snapshot.study, before); assert.equal(snapshot.ui.blocked, false); assert.equal(h.browser.document.body.inert, false);
    assert.equal(h.downloads.length, scenario === 'restore-unavailable' ? 1 : 0, scenario);
  }
});
