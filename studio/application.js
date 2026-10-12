import {createWorkspaceSync} from './workspace-sync.js';
import {createStudyController} from './study-controller.js';
import {createWorkspaceFiles} from './workspace-files.js';
import {observeViewportLayout} from './viewport-layout.js';
import {bodyParams} from './body-controls.js';
import {project, copy, editable, selection, addTattoo, transform, duplicateSelection, deleteSelection} from './model.js';
import {applyBodyProfile, SHAPE_DEFAULTS} from './body-profiles.js';

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

/** The application owns commands and mutable domain state. Views receive copies. */
export function createApplication({
  createStudio, regions = [], api, browser = globalThis,
  observeLayout = observeViewportLayout, fileServices = {}, clock,
  storageMode = 'browser',
} = {}) {
  const state = {
    workspace: null, studio: null, dirty: false, saving: false, conflict: false,
    saveTask: null, renderTask: null, lastRenderOK: true, rendering: false,
    renderAgain: false, convertingBody: false, ready: false, currentView: 'body',
  };
  const ui = {
    storageMode, storagePersistence: 'unknown',
    loading: true, error: '', blocked: false, status: 'Opening your workspace…',
    saveLabel: 'Connecting…', saveError: false, retry: {hidden: true, text: 'Retry save'},
    surface: new URLSearchParams(browser.location?.search || '').get('panel') === 'body' ? 'body' : 'composition',
    panelState: 'normal', placing: false, artSearch: '', importExisting: false,
    lighting: 'studio', quality: 'auto', stats: {}, preview: {phase: 'idle'},
    measurements: {}, dataStatus: '', dialog: null, nameRequest: null, focusPlacement: 0,
  };
  const listeners = new Set(), gestures = new Set();
  let snapshot, controller, files, initialization, viewportGeneration = 0;
  let previewAdapter = null, nameResolve = null, releaseViewport = null;

  function publish(domainChanged = true) {
    const workspace = domainChanged || !snapshot
      ? (state.workspace ? copy(state.workspace) : null)
      : snapshot.workspace;
    const study = domainChanged || !snapshot
      ? workspace?.projects.find(p => p.id === workspace.activeProjectId) || null
      : snapshot.study;
    const history = study && controller ? controller.hist() : null;
    snapshot = freeze({workspace, study, regions, ui: copy({
      ...ui, ready: state.ready, currentView: state.currentView,
      blocked: ui.blocked || state.convertingBody || !state.ready, rendering: state.rendering,
      dataBlocked: ui.blocked || state.convertingBody || !state.workspace,
      canUndo: !!history?.past.length, canRedo: !!history?.future.length,
    })});
    for (const listener of listeners) listener();
  }
  // Only proven UI-only events reuse the frozen domain snapshot. Domain owners
  // and ambiguous persistence callbacks retain the default invalidating path.
  const publishUI = () => publish(false);
  const say = message => { ui.status = message; publish(); };
  const sayUI = message => { ui.status = message; publishUI(); };
  const setInteractionBlocked = blocked => {
    ui.blocked = blocked;
    if (browser.document?.body) browser.document.body.inert = blocked;
    publish();
  };
  const sync = createWorkspaceSync(state, {
    api, clock, say,
    savedStatus(message, bad = false) {
      ui.saveLabel = storageMode === 'browser' && message === 'Saved to workspace' ? 'Saved in this browser' : message;
      ui.saveError = bad; publish();
    },
    setRetry(value) { ui.retry = {...ui.retry, ...value}; publish(); },
    setRenderBusy() { publish(); },
  });
  function placeMode(value) {
    ui.placing = value;
    state.studio?.setPlaceMode(value);
    say(value ? 'Tap visible skin to anchor the selection. Locked tattoos will not move.' : 'Drag to orbit · choose tattoos to edit.');
  }
  function chooseCamera(name) {
    if (!state.studio) return false;
    state.currentView = name;
    state.studio.view(name);
    publish();
    return sync.renderScene();
  }
  function askName(title, value) {
    if (nameResolve) return Promise.resolve(null);
    ui.nameRequest = {title, value};
    const result = new Promise(resolve => { nameResolve = resolve; });
    publishUI();
    return result;
  }
  controller = createStudyController(state, {
    ...sync, api, say, render: publish, askName, placeMode, chooseCamera,
    setInteractionBlocked,
    setLoading(value) { ui.loading = value; publish(); },
    setCameraSelection() { publish(); },
  });
  function showSurface(surface) {
    if (!['composition', 'artwork', 'body'].includes(surface)) return;
    ui.surface = surface;
    if (ui.panelState === 'collapsed') ui.panelState = 'normal';
    publishUI();
  }
  function focusPlacement() { ui.focusPlacement++; publishUI(); }
  files = createWorkspaceFiles(state, {
    api, ...sync, active: controller.active, mutate: controller.mutate, say,
    setInteractionBlocked, getInteractionBlocked: () => ui.blocked,
    getStatus: () => ui.status, setDataStatus(value) { ui.dataStatus = value; publish(); },
    showSurface, focusPlacement, publish, regions, bodyParams,
    browser: {
      document: browser.document, Image: browser.Image, Blob: browser.Blob,
      fetch: browser.fetch?.bind(browser), localStorage: browser.localStorage, indexedDB: browser.indexedDB,
    },
    confirm: message => browser.confirm(message), ...fileServices,
  });
  const canEdit = () => !!state.workspace && state.ready && !ui.blocked && !state.convertingBody;
  const canManageData = () => !!state.workspace && !ui.blocked && !state.convertingBody;
  function mutate(change, options) {
    if (!canEdit()) return false;
    return controller.mutate(change, options);
  }
  function gesture(id, change, options = {}) {
    if (!canEdit()) return false;
    if (!gestures.has(id)) { controller.hist().push(controller.active()); gestures.add(id); }
    return controller.mutate(change, {...options, history: false});
  }
  const guarded = fn => (...args) => canEdit() ? fn(...args) : false;
  const report = async (operation, onError = error => say(error.message)) => {
    try { return await operation(); } catch (error) { onError(error); return false; }
  };
  const backupFailure = error => { ui.dataStatus = 'Backup did not complete: ' + error.message; publish(); };

  const actions = {
    showSurface,
    togglePanel() {
      ui.panelState = {normal: 'expanded', expanded: 'collapsed', collapsed: 'normal'}[ui.panelState];
      publishUI();
    },
    setArtSearch(value) { ui.artSearch = value; publishUI(); },
    setImportExisting(value) {
      ui.importExisting = value;
      sayUI(value ? 'Existing tattoos need isolated flat artwork, not a photo on skin. Position them first, then Lock in place to protect them.' : 'New ideas are added directly to this study and remain editable.');
    },
    addArtwork: guarded(id => {
      const asset = state.workspace.assets.find(a => a.id === id);
      if (!asset) return false;
      const added = mutate(p => addTattoo(p, asset, false));
      if (added) {
        showSurface('composition'); focusPlacement();
        say('Added to study as a new idea. Choose a body area or Place on body, then adjust width.');
      }
      return added;
    }),
    previewArtwork: guarded((id, opener) => {
      const asset = state.workspace.assets.find(a => a.id === id);
      if (!asset) return;
      const query = ui.artSearch.trim().toLocaleLowerCase();
      previewAdapter?.open(asset, state.workspace.assets.filter(a => a.name.toLocaleLowerCase().includes(query)), opener);
    }),
    removeArtwork: guarded(id => files.removeArtwork(id)),
    uploadFiles: guarded(input => files.uploadFiles(input, {existing: ui.importExisting})),
    selectLayer(id, checked) {
      mutate(p => { p.selectedIds = checked ? [...new Set([...p.selectedIds, id])] : p.selectedIds.filter(x => x !== id); }, {history: false});
    },
    layerAction(id, action) {
      mutate(p => {
        const item = p.tattoos.find(t => t.id === id), index = p.tattoos.indexOf(item);
        if (!item) return;
        if (action === 'visible' || action === 'locked') item[action] = !item[action];
        else {
          const next = index + (action === 'up' ? -1 : 1);
          if (next >= 0 && next < p.tattoos.length) [p.tattoos[index], p.tattoos[next]] = [p.tattoos[next], p.tattoos[index]];
        }
      });
    },
    selectAll() { mutate(p => { p.selectedIds = p.tattoos.map(t => t.id); }, {history: false}); },
    clearSelection() { mutate(p => { p.selectedIds = []; }, {history: false}); },
    duplicateLayers() { mutate(duplicateSelection); },
    removeLayers() { mutate(deleteSelection); },
    togglePlace: guarded(() => placeMode(!ui.placing)),
    stopPlacing: guarded(() => placeMode(false)),
    renameLayer(value) { mutate(p => { const item = editable(p)[0]; if (item) item.name = value.trim().slice(0, 120) || 'Untitled tattoo'; }); },
    setRegion: guarded(async region => {
      if (region === 'custom') return placeMode(true);
      if (!regions.some(r => r.id === region)) return;
      mutate(p => { for (const item of editable(p)) {
        item.region = region; item.placement = state.studio.getAnchor(region); item.offsetX = 0; item.offsetY = 0;
      } });
      if (await sync.renderScene()) await chooseCamera('detail');
    }),
    editTattoo(key, value) {
      if (!canEdit() || !['width', 'rotation', 'offsetX', 'offsetY', 'opacity'].includes(key) || !Number.isFinite(value)) return false;
      const first = editable(controller.active())[0]; if (!first) return false;
      const change = key === 'width' ? {scale: value / first.width} : key === 'rotation' ? {rotate: value - first.rotation} :
        key === 'offsetX' ? {x: value - first.offsetX} : key === 'offsetY' ? {y: value - first.offsetY} : {opacity: value};
      return gesture(key, p => transform(p, change));
    },
    endGesture(key) { gestures.delete(key); },
    nudge(x, y) { mutate(p => transform(p, {x, y})); },
    setFlip(value) { mutate(p => transform(p, {flip: value})); },
    lockSelection(value) { mutate(p => { for (const item of selection(p)) item.locked = value; }); },
    setNotes(value) { gesture('notes', p => { p.notes = value.slice(0, 5000); }, {scene: false}); },
    editBody(key, value) {
      if (!bodyParams.some(p => p[0] === key) || !Number.isFinite(value)) return false;
      return gesture(key, p => { p.body[key] = value; });
    },
    setBodyProfile(id) { mutate(p => { p.body = applyBodyProfile(p.body, id); }); },
    resetBody() { mutate(p => { p.body = {...p.body, ...SHAPE_DEFAULTS}; }); },
    setSkinTone(id) { mutate(p => { p.body.skin = id; if (id === 'custom' && !/^#[0-9a-f]{6}$/i.test(p.body.skinColor || '')) p.body.skinColor = '#e0c1ad'; }); },
    setSkinColor(hex) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
      return gesture('skin-color', p => { p.body.skin = 'custom'; p.body.skinColor = hex.toLowerCase(); });
    },
    changeAnatomy: guarded(value => { gestures.clear(); return controller.changeAnatomy(value); }),
    useBodyModel: guarded(value => { gestures.clear(); return controller.useBodyModel(value); }),
    switchProject: guarded(id => { gestures.clear(); return controller.switchProject(id); }),
    saveAlternative: guarded(() => { gestures.clear(); return controller.saveAlternative(); }),
    async newProject() {
      if (!canEdit()) return false;
      const name = await askName('Name your new study', 'New study'); if (!name?.trim() || !canEdit()) return false;
      const next = project(name.trim().slice(0, 120));
      state.workspace.projects.push(next);
      const switched = await controller.switchProject(next.id);
      if (switched) showSurface('artwork');
      else { state.workspace.projects = state.workspace.projects.filter(p => p.id !== next.id); publish(); }
      return switched;
    },
    async renameProject() {
      if (!canEdit()) return;
      const name = await askName('Rename your study', controller.active().name);
      if (name?.trim()) mutate(p => { p.name = name.trim().slice(0, 120); }, {scene: false});
    },
    deleteProject: guarded(async () => {
      const original = controller.active();
      if (!browser.confirm(`Delete “${original.name}”? Artwork stays in your library. Export a backup first if you want to keep this study.`)) return false;
      let next = state.workspace.projects.find(p => p.id !== original.id), created = false;
      if (!next) { next = project(); state.workspace.projects.push(next); created = true; }
      if (!await controller.switchProject(next.id)) {
        if (created) state.workspace.projects = state.workspace.projects.filter(p => p.id !== next.id);
        publish(); return false;
      }
      state.workspace.projects = state.workspace.projects.filter(p => p.id !== original.id);
      gestures.clear(); sync.scheduleSave(); publish(); return true;
    }),
    undo: guarded(() => { gestures.clear(); const p = controller.hist().undo(controller.active()); if (p) controller.setProject(p); }),
    redo: guarded(() => { gestures.clear(); const p = controller.hist().redo(controller.active()); if (p) controller.setProject(p); }),
    chooseCamera: guarded(chooseCamera),
    setLighting: guarded(value => { ui.lighting = value; state.studio.setLighting(value); publishUI(); }),
    setQuality: guarded(value => { ui.quality = value; state.studio.setQuality(value); publishUI(); }),
    raytrace: guarded(() => { ui.lighting = 'studio'; state.studio.setLighting('studio'); publishUI(); return state.studio.raytrace(); }),
    cancelRaytrace: guarded(() => state.studio.cancelRaytrace()),
    saveImage: guarded(() => report(() => files.saveImage())),
    exportBackup: () => canManageData() ? report(() => files.exportBackup(), backupFailure) : false,
    async restoreBackup(file) {
      if (!file || !canManageData()) return false;
      return report(async () => {
        if (file.size > 160 * 1024 * 1024) throw Error('Workspace backups must be smaller than 160 MiB.');
        const backup = JSON.parse(await file.text());
        if (backup.version !== 3) throw Error('Choose an INKFORM workspace backup.');
        if (!browser.confirm('Replace all current studies and artwork with this backup? A download of your current workspace will start first. Keep that file as a separate copy.')) return false;
        setInteractionBlocked(true);
        try {
          if (!await sync.flush()) throw Error('Save or resolve the conflict before restoring a backup.');
          await files.exportBackup();
          state.workspace = await api('restore', 'POST', {backup, revision: state.workspace.revision});
          state.dirty = false; controller.clearHistory(); gestures.clear(); placeMode(false);
          publish(); await sync.renderScene(); await chooseCamera('body');
          ui.dataStatus = storageMode === 'browser' ? 'Workspace restored and saved in this browser.' : 'Workspace restored and saved to your private workspace.';
          publish();
          return true;
        } finally { setInteractionBlocked(false); }
      }, backupFailure);
    },
    async retrySave() {
      if (!canEdit()) return false;
      if (!state.conflict) return sync.flush();
      return report(async () => {
        await files.exportBackup();
        if (!browser.confirm('A backup download of your open edits has started. Keep that file, then load the current saved workspace?')) return false;
        setInteractionBlocked(true);
        try {
          state.workspace = await api('workspace'); state.conflict = false; state.dirty = false;
          controller.clearHistory(); gestures.clear(); ui.retry.hidden = true;
          publish(); await sync.renderScene(); ui.saveLabel = 'Saved copy loaded'; return true;
        } finally { setInteractionBlocked(false); }
      });
    },
    openDialog(name) { ui.dialog = name; publishUI(); },
    setStoragePersistence(value) { ui.storagePersistence = value === true ? 'granted' : 'not-granted'; publishUI(); },
    closeDialog() { ui.dialog = null; publishUI(); },
    resolveName(value) {
      const resolve = nameResolve; nameResolve = null; ui.nameRequest = null; publishUI(); resolve?.(value);
    },
  };

  async function initialize() {
    if (!initialization) initialization = (async () => {
      state.workspace = await api('workspace');
      if (!state.workspace.projects.length) {
        const first = project('My first study');
        const saved = await api('workspace', 'PUT', {revision: state.workspace.revision, projects: [first], activeProjectId: first.id});
        state.workspace = {...state.workspace, ...saved, projects: [first], activeProjectId: first.id};
      }
      ui.saveLabel = storageMode === 'browser' ? 'Saved in this browser' : 'Saved to workspace';
      publish();
    })().catch(error => { initialization = null; throw error; });
    return initialization;
  }
  function attachViewport(host, elements) {
    const priorCleanup = releaseViewport?.();
    const generation = ++viewportGeneration;
    ui.loading = true; ui.error = ''; ui.saveError = false; ui.saveLabel = 'Connecting…';
    publish();
    let cancelled = false, engine = null, layout = null, pendingEngine = null, disposalTask = null, cleanupTask = null;
    const live = () => !cancelled && generation === viewportGeneration;
    const disposeEngine = value => {
      if (value && !disposalTask) disposalTask = Promise.resolve(value.dispose()).catch(error => console.error('Renderer cleanup failed', error));
      return disposalTask;
    };
    const cleanup = () => {
      if (cancelled) return cleanupTask;
      cancelled = true; layout?.dispose();
      if (engine) {
        if (state.studio === engine) { state.studio = null; state.ready = false; }
        disposeEngine(engine);
      }
      publish();
      cleanupTask = pendingEngine ? pendingEngine.then(disposeEngine, () => {}) : disposalTask;
      return cleanupTask;
    };
    releaseViewport = cleanup;
    (async () => {
      try {
        await priorCleanup;
        if (!live()) return;
        if (state.renderTask) await state.renderTask;
        await initialize(); if (!live()) return;
        layout = observeLayout({...elements, host, onChange: () => engine?.refreshLayout()});
        pendingEngine = createStudio(host, {
          getClearViewport: layout.measure, initialBody: controller.active().body,
          onMeasurements(value) { if (live()) { ui.measurements = value; publishUI(); } },
          onCamera(camera) {
            if (!live() || !state.ready) return;
            const old = controller.active().camera;
            if (!old || ['position', 'target'].some(k => camera[k].some((v, i) => Math.abs(v - old[k][i]) > 1e-5))) {
              controller.active().camera = camera; sync.scheduleSave();
            }
          },
          onPlace(anchor) {
            if (!live() || !canEdit() || !editable(controller.active()).length) return;
            mutate(p => { for (const item of editable(p)) { item.placement = copy(anchor); item.region = 'custom'; } });
            say('Anchored to the surface. Use the movement controls to refine the composition.');
          },
          onSelect(id, {additive}) {
            if (!live()) return;
            mutate(p => { p.selectedIds = additive ? (p.selectedIds.includes(id) ? p.selectedIds.filter(x => x !== id) : [...p.selectedIds, id]) : [id]; }, {history: false});
          },
          onStats(value) {
            if (!live()) return;
            const previous = [...new Set(ui.stats.warnings || [])].join(' ');
            ui.stats = value;
            if (value.warnings?.length) sayUI([...new Set(value.warnings)].join(' '));
            else if (previous && ui.status === previous) sayUI('Drag to orbit · choose tattoos to edit.');
            else publishUI();
          },
          onPreview(value) { if (live()) { ui.preview = value; publishUI(); } },
          onError() { if (live()) { state.lastRenderOK = false; sayUI('Preview paused. Change the view to retry, or reload the studio. Your saved study is safe.'); } },
        });
        engine = await pendingEngine;
        if (!live()) { await disposeEngine(engine); return; }
        state.studio = engine;
        if (!await sync.renderScene()) throw Error('The body preview could not be rendered.');
        if (!live()) return;
        if (new URLSearchParams(browser.location?.search || '').get('view') === 'studio') await chooseCamera('body');
        else if (controller.active().camera) engine.restoreCamera(controller.active().camera);
        else await chooseCamera('body');
        if (!live()) return;
        state.ready = true; ui.loading = false; ui.error = ''; ui.saveError = false;
        ui.saveLabel = storageMode === 'browser' ? 'Saved in this browser' : 'Saved to workspace';
        say(controller.active().tattoos.length ? 'Drag to orbit. Choose Place on body to move selected ink.' : 'Choose artwork to begin your study.');
      } catch (error) {
        if (!live()) return;
        await cleanup();
        if (generation !== viewportGeneration) return;
        console.error(error); ui.error = error.message; ui.loading = false; ui.saveLabel = 'Not connected'; ui.saveError = true; publish();
      }
    })();
    return cleanup;
  }
  publish();
  return {
    actions, initialize, attachViewport,
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setArtworkPreview(adapter) { previewAdapter = adapter; },
    hasUnsavedChanges: () => state.dirty || state.saving,
    flush: sync.flush,
    dispose() {
      releaseViewport?.(); previewAdapter?.destroy(); previewAdapter = null;
      actions.resolveName(null); listeners.clear();
      (clock?.clearTimeout || clearTimeout)(state.saveTimer);
    },
  };
}
