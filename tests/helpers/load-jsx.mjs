import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

/** Load actual JSX modules for CPU tests without generated files or source extraction. */
export async function loadJsx(url) {
  const result = await build({
    entryPoints: [fileURLToPath(url)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', logLevel: 'silent',
  });
  const module = {exports: {}};
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(url), module, module.exports);
  return module.exports;
}
