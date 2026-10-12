// Fetch the engine alongside UI/workspace startup without delaying the shell.
// Canvas creation still belongs to application.attachViewport's lifecycle.
export function preloadRenderer(loadModule) {
  const module = Promise.resolve().then(loadModule);
  // A failed preload may precede the first mount. Keep the original rejection
  // for the application's loading/error UI while avoiding an unhandled event.
  module.catch(() => {});
  return async (...args) => (await module).createStudio(...args);
}
