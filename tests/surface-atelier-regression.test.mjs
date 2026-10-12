import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {geometryFrom} from '../studio/body-loader.js';
import {blendBodyShape} from '../studio/body-shapes.js';
import {morphPositions} from '../studio/geometry-kernel.js';
import {buildSurfacePatch} from '../studio/surface-map.js';

async function bodyAt(name,mass,muscle,arms=0){
 const root=new URL('../studio/models/atelier/',import.meta.url),data=JSON.parse(await readFile(new URL(name+'.json',root),'utf8'));
 const spec=JSON.parse(await readFile(new URL('shapes.json',root),'utf8')).bodies[name],bytes=await readFile(new URL(spec.positions,root));
 const base=new Float32Array(data.positions),grid=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4),source=blendBodyShape(base,grid,mass,muscle),endpoint=spec.endpoints.find(e=>e.weight===mass&&e.muscle===muscle),positions=morphPositions(source,{stature:175.3,arms},new Float32Array(data.anatomicalWeights),endpoint.landmarks),geometry=geometryFrom({...data,positions});
 const groups=new Map(),normal=geometry.attributes.normal,v=new THREE.Vector3(),sum=new THREE.Vector3();
 for(let id=0;id<base.length/3;id++){const key=base.slice(id*3,id*3+3).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(id);}
 for(const ids of groups.values()){if(ids.length<2)continue;sum.set(0,0,0);for(const id of ids)sum.add(v.fromBufferAttribute(normal,id));sum.normalize();for(const id of ids)normal.setXYZ(id,sum.x,sum.y,sum.z);}
 return {positions,normals:normal.array,indices:geometry.index.array,basePositions:base,clothingMasks:new Float32Array(data.clothingMask),torsoMasks:new Float32Array(data.torsoClothingMask),geometry,data};
}

test('small Atelier upper-arm artwork maps once without remote folded chart islands',async()=>{
 const body=await bodyAt('male',100,0);
 try{
  // Stable topology anchor, independent of ongoing named-anchor revisions.
  const anchor={faceIndex:28205,barycentric:[.1699973239689051,.5350240665285417,.29497860950255317]};
  const patch=buildSurfacePatch({...body,anchor,width:.07,height:.1});
  assert.equal(patch.mappingQuality.coverage.complete,true,'the requested image remains supported');
  assert.equal(patch.mappingQuality.components,1,'a local tattoo must not add a remote UV-fold island');
  assert.equal(patch.sourceFaceIndices.length,patch.indices.length/3);
 }finally{body.geometry.dispose();}
});

test('original Waterdrop size and rotation retain full image support on the Atelier arm',async t=>{
 const body=await bodyAt('male',50,50,8);
 try{
  const anchor=body.data.metadata.regionAnchors.leftUpperArm;
  for(const settings of [{},{flip:true},{offsetX:.012,offsetY:.01}]){
   const patch=buildSurfacePatch({...body,anchor,width:.111,height:.111*710/844,rotation:-26*Math.PI/180,...settings});
   assert.equal(patch.mappingQuality.components,1);
   assert.equal(patch.mappingQuality.coverage.covered,81,JSON.stringify(settings));
   assert.deepEqual(patch.warnings,[],'a rejected remote branch must not generate a local seam warning');
   assert.equal(new Set(patch.indices).size,patch.positions.length/3,'no unused remote vertices remain');
   assert.equal(patch.sourceFaceIndices.length,patch.indices.length/3);
   for(let face=0;face<patch.sourceFaceIndices.length;face++)for(let k=0;k<3;k++){
    const emitted=patch.indices[face*3+k],original=body.indices[patch.sourceFaceIndices[face]*3+k];
    for(let axis=0;axis<3;axis++){
     assert.equal(patch.positions[emitted*3+axis],body.positions[original*3+axis],'source face corner identity survives compaction');
     assert.equal(patch.basePositions[emitted*3+axis],body.basePositions[original*3+axis],'base shape remains aligned with the emitted face');
    }
    assert.equal(patch.clothingMasks[emitted],body.clothingMasks[original]);
   }
   t.diagnostic(JSON.stringify({settings,triangles:patch.indices.length/3,quality:patch.mappingQuality,warnings:patch.warnings}));
  }
 }finally{body.geometry.dispose();}
});

test('an oversized palm still reports genuine missing support after component pruning',async()=>{
 const body=await bodyAt('male',50,50,8);
 try{
  const patch=buildSurfacePatch({...body,anchor:body.data.metadata.regionAnchors.rightHand,width:.07,height:.1});
  assert.equal(patch.mappingQuality.components,1);
  assert.equal(patch.mappingQuality.coverage.complete,false);
  assert.ok(patch.warnings.some(w=>w.includes('Some image area')));
 }finally{body.geometry.dispose();}
});

test('overlapping complete folded branches choose the local center support',async()=>{
 const body=await bodyAt('female',100,100);
 try{
  const anchor=body.data.metadata.regionAnchors.leftUpperArm;
  const patch=buildSurfacePatch({...body,anchor,width:.07,height:.1});
  assert.equal(patch.mappingQuality.components,1);
  assert.equal(patch.mappingQuality.coverage.complete,true);
  assert.ok(patch.sourceFaceIndices.includes(anchor.faceIndex),'the retained center branch remains on the selected anchor');
 }finally{body.geometry.dispose();}
});
