import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';

await build({
 stdin:{contents:"export {WebGPUPathTracer} from 'three-gpu-pathtracer/src/webgpu/WebGPUPathTracer.js'; export {OIDNDenoiser} from 'three-gpu-pathtracer/src/webgpu/denoise/OIDNDenoiser.js';",resolveDir:process.cwd(),sourcefile:'pathtracer-entry.js'},
 outfile:'studio/vendor/pathtracer.js',bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'eof',
 plugins:[{name:'shared-three-runtime',setup(build){build.onResolve({filter:/^three(?:\/(?:webgpu|tsl))?$/},args=>({path:args.path,external:true}));}}],
 banner:{js:'/* Local optional path tracer: three-gpu-pathtracer 0.0.27, three-mesh-bvh 0.9.16. MIT notices: pathtracer.LICENSE.txt. Rebuild: node scripts/build-pathtracer.mjs */'}
});
const packages=['three-gpu-pathtracer','three-mesh-bvh'];
const notices=await Promise.all(packages.map(async name=>`${name}\n\n${await readFile(`node_modules/${name}/LICENSE`,'utf8')}`));
await writeFile('studio/vendor/pathtracer.LICENSE.txt',notices.join('\n\n'));
await build({entryPoints:['node_modules/oidn-web/lib/main.js'],outfile:'studio/vendor/oidn.js',bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'eof',banner:{js:'/* Local optional OIDN WebGPU runtime: oidn-web 0.5.0. MIT notices: oidn.LICENSE.txt. Intel weight license: oidn-weights.LICENSE.txt. */'}});
const oidnNotices=await Promise.all(['oidn-web','@petamoriken/float16'].map(async name=>`${name}\n\n${await readFile(`node_modules/${name}/LICENSE`,'utf8')}`));
await writeFile('studio/vendor/oidn.LICENSE.txt',oidnNotices.join('\n\n'));
