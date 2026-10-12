import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {geometryFrom} from '../studio/body-loader.js';
import {buildSurfacePatch} from '../studio/surface-map.js';
import {blendBodyShape} from '../studio/body-shapes.js';
import {createGeometryKernel,morphPositions} from '../studio/geometry-kernel.js';
import {BODY_PROFILES} from '../studio/body-profiles.js';
import {REGIONS} from '../studio/regions.js';
import {resolveBodyModel} from '../studio/model-catalog.js';

const root=new URL('../studio/models/atelier/',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const manifest=await read('shapes.json'),bodies={};
for(const anatomy of ['male','female']){
 const data=await read(anatomy+'.json'),spec=manifest.bodies[anatomy],bytes=await readFile(new URL(spec.positions,root));
 const base=new Float32Array(data.positions),weights=new Float32Array(data.anatomicalWeights),grid=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4),groups=new Map();
 for(let i=0;i<base.length/3;i++){const key=base.slice(i*3,i*3+3).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 bodies[anatomy]={data,spec,base,weights,grid,groups:[...groups.values()].filter(ids=>ids.length>1)};
}

function geometry(body,positions){
 const g=geometryFrom({...body.data,positions}),n=g.attributes.normal,normal=new THREE.Vector3(),sum=new THREE.Vector3();
 // Match live seam-normal welding before testing the actual surface mapper.
 for(const ids of body.groups){sum.set(0,0,0);for(const id of ids)sum.add(normal.fromBufferAttribute(n,id));sum.normalize();for(const id of ids)n.setXYZ(id,sum.x,sum.y,sum.z);}
 return g;
}
function pointAt(positions,indices,anchor){return [0,1,2].map(axis=>anchor.barycentric.reduce((sum,weight,k)=>sum+weight*positions[indices[anchor.faceIndex*3+k]*3+axis],0));}
function landmarksAt(endpoints,mass,muscle){
 const x=Math.min(1,Math.floor(mass/50)),y=Math.min(1,Math.floor(muscle/50)),u=mass/50-x,v=muscle/50-y,corners=[y*3+x,y*3+x+1,(y+1)*3+x,(y+1)*3+x+1],weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
 return Object.fromEntries(['L','R'].map(side=>[side,Object.fromEntries(['shoulder','elbow','wrist','hip','knee','ankle'].map(joint=>[joint,[0,1,2].map(axis=>corners.reduce((sum,corner,i)=>sum+endpoints[corner].landmarks[side][joint][axis]*weights[i],0))]))]));
}

test('Atelier named arm anchors belong to their own limb and fit the persisted model face bounds',()=>{
 const faceCount=resolveBodyModel('atelier-v1').faceCount;
 for(const [anatomy,body] of Object.entries(bodies)){
  assert.equal(body.data.indices.length/3,faceCount,'Server/catalog anchor bounds must match actual asset topology');
  for(const {id} of REGIONS){const anchor=body.data.metadata.regionAnchors[id];assert.ok(anchor,anatomy+' '+id);assert.ok(Number.isInteger(anchor.faceIndex)&&anchor.faceIndex>=0&&anchor.faceIndex<faceCount);assert.equal(anchor.barycentric.length,3);assert.ok(anchor.barycentric.every(value=>Number.isFinite(value)&&value>=0&&value<=1));assert.ok(Math.abs(anchor.barycentric.reduce((a,b)=>a+b,0)-1)<1e-6);}
  for(const region of ['leftUpperArm','rightUpperArm','leftForearm','rightForearm']){
   const anchor=body.data.metadata.regionAnchors[region],channel=region.startsWith('left')?0:1;
   const own=anchor.barycentric.reduce((sum,weight,k)=>sum+weight*body.weights[body.data.indices[anchor.faceIndex*3+k]*5+channel],0);
   const opposite=anchor.barycentric.reduce((sum,weight,k)=>sum+weight*body.weights[body.data.indices[anchor.faceIndex*3+k]*5+(1-channel)],0);
   assert.ok(own>.5,`${anatomy} ${region} belongs to its named arm rather than torso`);assert.ok(opposite<1e-6,`${anatomy} ${region} must not bind the opposite arm`);
   assert.ok(pointAt(body.base,body.data.indices,anchor)[0]*(channel===0?1:-1)>0);
  }
 }
});

test('all 17 Atelier regions retain finite nonempty surface patches across all 18 authored body endpoints',t=>{
 let patches=0,incomplete=0,disconnected=0;const warnings={},regionIssues={};
 for(const [anatomy,body] of Object.entries(bodies)){
  const original=body.base.slice(),anchors=structuredClone(body.data.metadata.regionAnchors);
  for(const endpoint of body.spec.endpoints){
   const positions=blendBodyShape(body.base,body.grid,endpoint.weight,endpoint.muscle),g=geometry(body,positions);
   try{for(const {id} of REGIONS){
    const anchor=anchors[id],context=`${anatomy} mass ${endpoint.weight} muscle ${endpoint.muscle} ${id}`,point=pointAt(positions,body.data.indices,anchor);
    assert.ok(point.every(Number.isFinite),context+' anchor');
    const patch=buildSurfacePatch({positions,normals:g.attributes.normal.array,indices:g.index.array,basePositions:body.base,clothingMasks:body.data.clothingMask,anchor,width:.07,height:.1});
    assert.ok(patch.indices.length>0,context+' nonempty');assert.ok(patch.positions.every(Number.isFinite),context+' positions');assert.ok(patch.normals.every(Number.isFinite),context+' normals');assert.ok(patch.uvs.every(Number.isFinite),context+' UVs');
    assert.equal(patch.sourceFaceIndices.length,patch.indices.length/3,context+' original face provenance');assert.ok(patch.sourceFaceIndices.every(face=>Number.isInteger(face)&&face>=0&&face<body.data.indices.length/3));
    if(!patch.mappingQuality.coverage.complete){incomplete++;(regionIssues[id]??={incomplete:0,disconnected:0}).incomplete++;assert.ok(patch.warnings.some(w=>w.includes('Some image area')),context+' reports unavailable image area');}
    if(patch.mappingQuality.components>1){disconnected++;(regionIssues[id]??={incomplete:0,disconnected:0}).disconnected++;assert.ok(patch.warnings.some(w=>w.includes('one continuous tattoo map')),context+' reports disconnected cropped patch');}
    for(const warning of patch.warnings)warnings[warning]=(warnings[warning]||0)+1;
    patches++;
   }}finally{g.dispose();}
  }
  assert.deepEqual(body.base,original,'Mapping must not alter the source geometry');assert.deepEqual(body.data.metadata.regionAnchors,anchors,'Mapping must not rewrite saved model anchors');
 }
 assert.equal(patches,306);t.diagnostic(JSON.stringify({patches,incomplete,disconnected,regionIssues,warnings,note:'Finite patches and explicit warnings are engineering checks, not certification of full image coverage or visual fit.'}));
});

test('Atelier authored endpoints and bounded fit profiles retain JavaScript/WASM parity and protected regions',async t=>{
 const kernel=await createGeometryKernel({bytes:await readFile(new URL('../studio/wasm/morph.wasm',import.meta.url))});assert.equal(kernel.backend,'WASM');let cases=0,maxError=0;
 const refinements=[{stature:205,arms:8,legs:6,armsRight:-8,legsLeft:-6,shoulders:6,waist:-12,hips:12,bust:-12,abdomen:12},{stature:150,arms:-8,legs:-6,armsLeft:8,legsRight:6,shoulders:-6,waist:12,hips:-12,bust:12,abdomen:-12}];
 for(const [anatomy,body] of Object.entries(bodies)){
  const states=[...body.spec.endpoints.flatMap(endpoint=>refinements.map(refinement=>({...refinement,mass:endpoint.weight,muscle:endpoint.muscle}))),...BODY_PROFILES.map(profile=>({...profile.values,stature:175.3}))];
  for(const state of states){
   const source=blendBodyShape(body.base,body.grid,state.mass,state.muscle),landmarks=landmarksAt(body.spec.endpoints,state.mass,state.muscle),js=morphPositions(source,state,body.weights,landmarks),wasm=kernel.morph(source,state,body.weights,landmarks),scale=state.stature/175.3;
   for(let i=0;i<js.length;i++){assert.ok(Number.isFinite(wasm[i]),anatomy+' finite shape');const error=Math.abs(js[i]-wasm[i]);maxError=Math.max(maxError,error);assert.ok(error<3e-7,anatomy+' JS/WASM parity');}
   let protectedVertices=0;for(let i=0;i<source.length/3;i++)if(body.weights.subarray(i*5,i*5+5).every(weight=>weight===0)){protectedVertices++;for(let k=0;k<3;k++)assert.equal(wasm[i*3+k],Math.fround(source[i*3+k]*scale),'Unweighted head/accessory attachment regions retain source-fitted shape');}
   assert.ok(protectedVertices>100,anatomy+' includes protected source anatomy');cases++;
  }
 }
 assert.equal(cases,48);t.diagnostic(JSON.stringify({cases,maxError,note:'CPU numerical parity does not establish contact, self-intersection, or visual acceptance.'}));
});
