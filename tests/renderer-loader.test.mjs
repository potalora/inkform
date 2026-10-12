import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preloadRenderer} from '../studio/renderer-loader.js';

test('renderer loading starts independently and shares one module across canvas mounts', async () => {
  let resolveModule, imports = 0;
  const module = new Promise(resolve => { resolveModule = resolve; });
  const createStudio = preloadRenderer(() => { imports++; return module; });
  // UI/workspace initialization can proceed before the renderer module arrives.
  let workspaceLoaded = false;
  await Promise.resolve().then(() => { workspaceLoaded = true; });
  assert.equal(imports, 1);
  assert.equal(workspaceLoaded, true);
  const firstHost = {}, secondHost = {}, options = {initialBody: 'test'};
  const first = createStudio(firstHost, options);
  const second = createStudio(secondHost, options);
  const calls = [];
  resolveModule({createStudio: (host, config) => { calls.push([host, config]); return {host}; }});
  assert.equal((await first).host, firstHost);
  assert.equal((await second).host, secondHost);
  assert.deepEqual(calls, [[firstHost, options], [secondHost, options]]);
  assert.equal(imports, 1);
});

test('a failed preload remains available to the application error boundary without an unhandled rejection', async () => {
  const failure = new Error('Renderer download failed');
  const createStudio = preloadRenderer(() => Promise.reject(failure));
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(createStudio({}), error => error === failure);
});
