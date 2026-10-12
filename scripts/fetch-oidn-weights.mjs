import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {OIDN_MODEL_SHA256} from '../studio/denoise-preview.js';

const revision='28883d1769d5930e13cf7f1676dd852bd81ed9e7';
const modelURL=`https://media.githubusercontent.com/media/RenderKit/oidn-weights/${revision}/rt_hdr_alb_nrm.tza`;
const model=await fetch(modelURL);if(!model.ok)throw Error(`Weight download failed: ${model.status}`);
const bytes=Buffer.from(await model.arrayBuffer());
if(bytes.length!==1841160||createHash('sha256').update(bytes).digest('hex')!==OIDN_MODEL_SHA256)throw Error('OIDN model integrity mismatch');
await writeFile('studio/vendor/rt_hdr_alb_nrm.tza',bytes);
const license=await fetch(`https://raw.githubusercontent.com/RenderKit/oidn-weights/${revision}/LICENSE.txt`);if(!license.ok)throw Error('Weight license download failed');
await writeFile('studio/vendor/oidn-weights.LICENSE.txt',await license.text());
await writeFile('studio/vendor/oidn-provenance.json',JSON.stringify({runtime:{package:'oidn-web',version:'0.5.0',license:'MIT',repository:'https://github.com/pissang/oidn-web'},weights:{repository:'https://github.com/RenderKit/oidn-weights',revision,filename:'rt_hdr_alb_nrm.tza',bytes:bytes.length,sha256:OIDN_MODEL_SHA256,license:'Apache-2.0',source:modelURL}},null,2)+'\n');
