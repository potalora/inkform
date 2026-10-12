import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {morphPositions} from '../studio/geometry-kernel.js';
import {blendBodyShape} from '../studio/body-shapes.js';
import {BODY_PROFILES} from '../studio/body-profiles.js';
const root=new URL('../studio/models/',import.meta.url),read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8')),manifest=await read('shapes.json');
const readGrid=async name=>{const b=await readFile(new URL(name,root));return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);};
const ranges={build:[-30,40],shoulders:[-20,25],waist:[-25,35],hips:[-20,30],arms:[-25,40],legs:[-25,35],bust:[-25,35],abdomen:[-20,20],armsLeft:[-20,20],armsRight:[-20,20],legsLeft:[-20,20],legsRight:[-20,20]};
// These are deliberately conservative REVIEW budgets, not anthropometric limits or proof of inversion.
function screen(reference,result,indices,scale=1){
 let normalFlags=0,collapsed=0,minArea=Infinity,maxArea=0,minEdge=Infinity,maxEdge=0;
 for(let i=0;i<indices.length;i+=3){const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3,n=[];
  for(const q of [reference,result]){const x=q[b]-q[a],y=q[b+1]-q[a+1],z=q[b+2]-q[a+2],u=q[c]-q[a],v=q[c+1]-q[a+1],w=q[c+2]-q[a+2];n.push([y*w-z*v,z*u-x*w,x*v-y*u]);}
  const oldArea=Math.hypot(...n[0]),newArea=Math.hypot(...n[1]);if(newArea<1e-12)collapsed++;
  if(oldArea>1e-6){const ratio=newArea/oldArea/scale**2;minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);if(n[0].reduce((s,v,k)=>s+v*n[1][k],0)<0)normalFlags++;}
  for(const [u,v] of [[a,b],[b,c],[c,a]]){const oldEdge=Math.hypot(reference[u]-reference[v],reference[u+1]-reference[v+1],reference[u+2]-reference[v+2]);if(oldEdge>.001){const ratio=Math.hypot(result[u]-result[v],result[u+1]-result[v+1],result[u+2]-result[v+2])/oldEdge/scale;minEdge=Math.min(minEdge,ratio);maxEdge=Math.max(maxEdge,ratio);}}
 }
 return {collapsed,normalFlags,minArea,maxArea,minEdge,maxEdge,review:normalFlags>0||minArea<.2||maxArea>5||minEdge<.5||maxEdge>2};
}
for(const [gender,bodyFile,eyeFile] of [['male','human.json','eyes.json'],['female','female.json','female-eyes.json']])test(`${gender}: source endpoints and runtime profile/extreme geometry quality screen`,async t=>{
 const body=await read(bodyFile),eyes=await read(eyeFile),base=new Float32Array(body.positions),weights=new Float32Array(body.anatomicalWeights),eyeBase=new Float32Array(eyes.positions),eyeWeights=new Float32Array(eyes.anatomicalWeights),entry=manifest.bodies[gender],grid=await readGrid(entry.positions),eyeGrid=await readGrid(entry.eyes);
 const seams=new Map();for(let i=0;i<base.length/3;i++){const key=body.positions.slice(i*3,i*3+3).join(',');if(!seams.has(key))seams.set(key,[]);seams.get(key).push(i);}const duplicateGroups=[...seams.values()].filter(a=>a.length>1);
 function landmarksAt(mass,muscle){const x=Math.min(1,Math.floor(mass/50)),y=Math.min(1,Math.floor(muscle/50)),u=mass/50-x,v=muscle/50-y,ids=[y*3+x,y*3+x+1,(y+1)*3+x,(y+1)*3+x+1],ws=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];return Object.fromEntries(['L','R'].map(side=>[side,Object.fromEntries(Object.keys(entry.endpoints[0].landmarks[side]).map(key=>[key,[0,1,2].map(k=>ids.reduce((sum,id,i)=>sum+entry.endpoints[id].landmarks[side][key][k]*ws[i],0))]))]));}
 const sourceCases=[];for(const muscle of [0,50,100])for(const mass of [0,50,100])sourceCases.push({id:`source-m${muscle}-w${mass}`,mass,muscle,arms:0});
 const runtimeCases=[...BODY_PROFILES.map(p=>({id:p.id,...p.values})),...Object.entries(ranges).flatMap(([key,values])=>values.map(value=>({id:`${key}:${value}`,mass:50,muscle:50,arms:0,[key]:value}))),{id:'height:150',mass:50,muscle:50,arms:0,stature:150},{id:'height:205',mass:50,muscle:50,arms:0,stature:205}];
 const rows=[];
 for(const params of [...sourceCases,...runtimeCases]){
  const source=blendBodyShape(base,grid,params.mass,params.muscle),result=morphPositions(source,params,weights,landmarksAt(params.mass,params.muscle)),scale=(params.stature??175.3)/175.3;
  assert.ok(result.every(Number.isFinite));const metrics=screen(source,result,body.indices,scale);assert.equal(metrics.collapsed,0,params.id+' has no collapsed triangles');
  for(const group of duplicateGroups)for(const id of group.slice(1))for(let k=0;k<3;k++)assert.equal(result[id*3+k],result[group[0]*3+k],params.id+' preserves exact UV seam coincidence');
  const eyeSource=blendBodyShape(eyeBase,eyeGrid,params.mass,params.muscle),eyeResult=morphPositions(eyeSource,params,eyeWeights);
  for(let i=0;i<eyeResult.length;i++)assert.equal(eyeResult[i],Math.fround(eyeSource[i]*scale),'local shape controls preserve source-fitted eyes');
  for(let i=0,j=0;i<source.length;i+=3,j+=5)if(weights.slice(j,j+5).every(v=>v===0))for(let k=0;k<3;k++)assert.equal(result[i+k],Math.fround(source[i+k]*scale),'unweighted source anatomy, including head, stays unchanged');
  if(params.id.startsWith('source-'))assert.deepEqual(result,source,'source-authored endpoint is not altered with neutral local controls');else rows.push({id:params.id,...metrics});
 }
 const flags=rows.filter(r=>r.review);t.diagnostic(JSON.stringify({cases:sourceCases.length+runtimeCases.length,sourceEndpoints:sourceCases.length,profiles:BODY_PROFILES.length,reviewFlags:flags.map(r=>r.id),worstArea:rows.reduce((a,b)=>a.maxArea>b.maxArea?a:b),worstEdge:rows.reduce((a,b)=>a.maxEdge>b.maxEdge?a:b)}));
 // Review flags are reported, not silently treated as acceptance. Rendering/collision review remains required.
});

test('all18 source corners and396 moderate single-control refinements retain bounded local geometry',async t=>{
 const bounds={shoulders:[-6,6],waist:[-12,12],hips:[-12,12],arms:[-8,8],legs:[-6,6],bust:[-12,12],abdomen:[-12,12],armsLeft:[-8,8],armsRight:[-8,8],legsLeft:[-6,6],legsRight:[-6,6]};let count=0,maxEdge=0,maxArea=0,minArea=Infinity,normalFlags=0;
 for(const [gender,name] of [['male','human'],['female','female']]){const d=await read(name+'.json'),base=new Float32Array(d.positions),weights=new Float32Array(d.anatomicalWeights),entry=manifest.bodies[gender],grid=await readGrid(entry.positions);
  for(const endpoint of entry.endpoints){const source=blendBodyShape(base,grid,endpoint.weight,endpoint.muscle);
   for(const [key,values]of Object.entries(bounds))for(const value of values){const result=morphPositions(source,{arms:0,[key]:value},weights,endpoint.landmarks),q=screen(source,result,d.indices);assert.ok(result.every(Number.isFinite));assert.equal(q.collapsed,0);assert.ok(q.minEdge>.35&&q.maxEdge<2,`${gender} m${endpoint.muscle}/w${endpoint.weight} ${key}:${value} exceeds moderate edge deformation budget`);assert.ok(q.minArea>.05&&q.maxArea<8,`${gender} ${key}:${value} exceeds moderate area deformation budget`);maxEdge=Math.max(maxEdge,q.maxEdge);maxArea=Math.max(maxArea,q.maxArea);minArea=Math.min(minArea,q.minArea);normalFlags+=q.normalFlags;count++;}
  }
 }
 assert.equal(count,396);t.diagnostic(JSON.stringify({moderateCases:count,maxEdge,maxArea,minArea,referenceNormalReviewFlags:normalFlags,note:'Engineering deformation budgets are not contact, self-intersection, or visual acceptance proof.'}));
});
