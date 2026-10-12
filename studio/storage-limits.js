/** The same acceptance limits apply to private and device-local workspaces. */
export const STORAGE_LIMITS = Object.freeze({
  maxProjects: 100,
  maxLayers: 16,
  maxAssets: 500,
  maxImageBytes: 20 * 1024 ** 2,
  maxDecodedPixels: 16_777_216,
  maxArtworkBytes: 96 * 1024 ** 2,
  maxProjectJsonBytes: 8 * 1024 ** 2,
  maxProjectBytes: 2 * 1024 ** 2,
  maxRestoreBytes: 160 * 1024 ** 2,
});
