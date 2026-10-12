import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import {readFile, writeFile} from 'node:fs/promises';

const js = await build({
  entryPoints: ['studio/ui/main.jsx'], outfile: 'studio/ui-app.js',
  bundle: true, format: 'esm', jsx: 'automatic', minify: true,
  target: ['es2022'], define: {'process.env.NODE_ENV': '"production"'},
  legalComments: 'eof', metafile: true,
});
const css = await postcss([tailwind({optimize: true})]).process(
  await readFile('studio/ui/globals.css', 'utf8'),
  {from: 'studio/ui/globals.css', to: 'studio/ui-app.css'},
);
await writeFile('studio/ui-app.css', css.css);
const inputs = Object.keys(js.metafile.inputs);
if (inputs.some(path => /(?:node_modules\/three\/|studio\/(?:scene|vendor)\.)/.test(path))) {
  throw Error('The UI bundle must not own or duplicate the Three renderer.');
}
console.log(`UI built: ${js.metafile.outputs['studio/ui-app.js'].bytes.toLocaleString()} bytes JS, ${Buffer.byteLength(css.css).toLocaleString()} bytes CSS; Three stays external.`);
