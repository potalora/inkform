import {REGIONS} from './regions.js';
import {preloadRenderer} from './renderer-loader.js';
import {createApplication} from './application.js';
import {createLocalApi} from './local-api.js';
import {mountStudio} from './ui-app.js';

const api = createLocalApi();
const createStudio = preloadRenderer(() => import('./scene.js?v=public-beta-1'));
const app = createApplication({createStudio, regions: REGIONS, api, storageMode: 'browser'});
const unmount = mountStudio(document.getElementById('app'), app);

// Ask after a user gesture. A refusal leaves ordinary saving available, and
// the backup dialog continues to explain why an exported copy matters.
window.addEventListener('pointerdown', async () => {
  try { app.actions.setStoragePersistence(await navigator.storage?.persist?.() === true); }
  catch { app.actions.setStoragePersistence(false); }
}, {once: true});
window.addEventListener('beforeunload', event => {
  if (app.hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('pagehide', event => {
  if (!event.persisted) { unmount(); api.close(); }
});
