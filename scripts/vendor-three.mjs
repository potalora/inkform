import {readFile,writeFile,copyFile} from 'node:fs/promises';
const root='node_modules/three',out='studio/vendor';
const {version}=JSON.parse(await readFile(`${root}/package.json`,'utf8'));
if(version!=='0.186.1')throw Error('Install the locked Three version before vendoring.');
const files=['build/three.core.js','build/three.webgpu.js','build/three.tsl.js','build/three.module.js','examples/jsm/controls/OrbitControls.js','examples/jsm/loaders/HDRLoader.js','examples/jsm/lights/RectAreaLightTexturesLib.js','LICENSE'];
await Promise.all(files.map(path=>copyFile(`${root}/${path}`,`${out}/${path.split('/').at(-1)}`)));
await writeFile(`${out}/three-version.json`,JSON.stringify({version,source:`https://registry.npmjs.org/three/-/three-${version}.tgz`,license:'MIT'},null,2)+'\n');
