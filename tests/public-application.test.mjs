import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplication} from '../studio/application.js';
import {project} from '../studio/model.js';

function setup({empty = false} = {}) {
  const study = project('Kept study');
  let saved = {revision: 0, projects: empty ? [] : [study], activeProjectId: empty ? null : study.id, assets: []};
  const calls = [], downloads = [];
  const api = async (path, method = 'GET', body) => {
    calls.push([path, method]);
    if (path === 'workspace' && method === 'GET') return structuredClone(saved);
    if (path === 'workspace' && method === 'PUT') {
      saved = {...saved, ...structuredClone(body), revision: saved.revision + 1};
      return structuredClone(saved);
    }
    if (path === 'backup') return {version: 3, ...structuredClone(saved)};
    throw Error('Unexpected request: ' + path);
  };
  const app = createApplication({api, storageMode: 'browser',
    browser: {location: {search: ''}, document: {body: {}}, Blob, confirm: () => true},
    fileServices: {download: (name, blob) => downloads.push({name, blob})},
  });
  return {app, calls, downloads, get saved() { return saved; }};
}

test('public initialization creates one saved study without fetching the private archive', async t => {
  const h = setup({empty: true}); t.after(() => h.app.dispose());
  await h.app.initialize();
  assert.deepEqual(h.calls, [['workspace', 'GET'], ['workspace', 'PUT']]);
  assert.equal(h.saved.projects.length, 1);
  assert.equal(h.saved.activeProjectId, h.saved.projects[0].id);
  assert.equal(h.app.getSnapshot().ui.storageMode, 'browser');
  assert.equal(h.app.getSnapshot().ui.saveLabel, 'Saved in this browser');
});

test('workspace export is available after storage loads without a working renderer', async t => {
  const h = setup(); t.after(() => h.app.dispose());
  await h.app.initialize();
  assert.equal(h.app.getSnapshot().ui.ready, false);
  assert.equal(h.app.getSnapshot().ui.dataBlocked, false);
  await h.app.actions.exportBackup();
  assert.equal(h.downloads.length, 1);
  const backup = JSON.parse(await h.downloads[0].blob.text());
  assert.deepEqual(backup.projects, h.saved.projects);
  assert.match(h.app.getSnapshot().ui.dataStatus, /download started/i);
});

test('oversized backup is rejected before reading it and preserves the workspace', async t => {
  const h = setup(); t.after(() => h.app.dispose()); await h.app.initialize();
  let reads = 0;
  const before = h.app.getSnapshot().workspace;
  const result = await h.app.actions.restoreBackup({size: 161 * 1024 * 1024, text: async () => { reads++; return '{}'; }});
  assert.equal(result, false); assert.equal(reads, 0);
  assert.match(h.app.getSnapshot().ui.dataStatus, /160 MiB/);
  assert.deepEqual(h.app.getSnapshot().workspace, before);
});
