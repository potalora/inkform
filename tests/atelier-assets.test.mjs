import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const dir=fileURLToPath(new URL('../studio/models/atelier/',import.meta.url));
const json=name=>JSON.parse(readFileSync(dir+name));
const shapes=json('shapes.json');
const bodies=Object.fromEntries(['male','female'].map(sex=>[sex,json(sex+'.json')]));
const finite=a=>a.every(Number.isFinite);
function geometry(d){
 const n=d.positions.length/3;assert.ok(Number.isInteger(n)&&n>100);assert.ok(finite(d.positions));
 assert.equal(d.normals.length,n*3);assert.ok(finite(d.normals));assert.equal(d.uvs.length,n*2);assert.ok(finite(d.uvs));
 assert.equal(d.anatomicalWeights.length,n*5);assert.ok(d.anatomicalWeights.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
 assert.equal(d.indices.length%3,0);assert.ok(d.indices.every(i=>Number.isInteger(i)&&i>=0&&i<n));
 return n;
}
function grid(name,n){
 const b=readFileSync(dir+name);assert.equal(b.byteLength,n*3*9*4);const v=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);
 assert.ok(finite(v));assert.ok(v.subarray(n*3*4,n*3*5).every(x=>x===0),'center endpoint must be exact zero');return v;
}
function anchorPoint(d,a){return [0,1,2].map(c=>a.barycentric.reduce((s,w,k)=>s+w*d.positions[d.indices[a.faceIndex*3+k]*3+c],0));}

test('Atelier bodies retain shared complete skin topology, valid attributes and nine source-derived endpoints',()=>{
 assert.equal(shapes.bodyModelId,'atelier-v1');assert.deepEqual(shapes.axes,[0,50,100]);assert.equal(shapes.order,'muscle-major-weight-minor');
 assert.deepEqual(bodies.male.indices,bodies.female.indices);assert.deepEqual(bodies.male.uvs,bodies.female.uvs);
 for(const [sex,d] of Object.entries(bodies)){
  const n=geometry(d),spec=shapes.bodies[sex];assert.equal(n,28074);assert.equal(d.indices.length/3,52544);
  assert.equal(d.metadata.bodyModelId,'atelier-v1');assert.equal(d.clothingMask.length,n);assert.ok(d.clothingMask.some(x=>x===1));assert.ok(d.clothingMask.some(x=>x===0));
  assert.equal(spec.vertexCount,n);const g=grid(spec.positions,n);assert.equal(spec.endpoints.length,9);
  for(let block=0;block<9;block++){
   let lo=Infinity,hi=-Infinity;
   for(let i=1;i<d.positions.length;i+=3){const y=d.positions[i]+g[block*n*3+i];lo=Math.min(lo,y);hi=Math.max(hi,y);}
   assert.ok(Math.abs(lo)<2e-6);assert.ok(Math.abs(hi-1.753)<2e-6);
   for(const side of ['L','R'])for(const key of ['shoulder','elbow','wrist','hip','knee','ankle'])assert.ok(finite(spec.endpoints[block].landmarks[side][key]));
  }
 }
});

test('Atelier region anchors belong to expected bilateral limbs and front/back surfaces',()=>{
 const names=['leftUpperArm','rightUpperArm','leftForearm','rightForearm','chest','back','abdomen','leftThigh','rightThigh','leftCalf','rightCalf','neck','leftHand','rightHand','leftFoot','rightFoot','head'];
 for(const d of Object.values(bodies)){
  assert.deepEqual(Object.keys(d.metadata.regionAnchors).sort(),names.slice().sort());
  for(const [name,a] of Object.entries(d.metadata.regionAnchors)){
   assert.ok(Number.isInteger(a.faceIndex)&&a.faceIndex>=0&&a.faceIndex<d.indices.length/3);assert.equal(a.barycentric.length,3);assert.ok(finite(a.barycentric));assert.ok(a.barycentric.every(x=>x>=-1e-5&&x<=1.00001));assert.ok(Math.abs(a.barycentric.reduce((a,b)=>a+b,0)-1)<1e-6);
   const p=anchorPoint(d,a);if(name.startsWith('left'))assert.ok(p[0]>.05,name);if(name.startsWith('right'))assert.ok(p[0]<-.05,name);
   if(/UpperArm|Forearm|Hand/.test(name)){
    const column=name.startsWith('left')?0:1;const influence=a.barycentric.reduce((s,w,k)=>s+w*d.anatomicalWeights[d.indices[a.faceIndex*3+k]*5+column],0);assert.ok(influence>.4,`${name} arm influence ${influence}`);
   }
  }
  assert.ok(anchorPoint(d,d.metadata.regionAnchors.back)[2]<0);assert.ok(anchorPoint(d,d.metadata.regionAnchors.chest)[2]>0);
 }
});

test('Atelier source-fitted accessories have matching grids and closed solid garment hems',()=>{
 for(const [sex,d] of Object.entries(bodies)){
  assert.deepEqual(d.accessories.map(a=>a.kind),['eyes','brows','hair','tank','shorts']);
  for(const descriptor of d.accessories){
   const a=json(descriptor.file),n=geometry(a);assert.equal(a.metadata.bodyModelId,'atelier-v1');
   const spec=shapes.bodies[sex].accessories[descriptor.kind];assert.equal(spec.vertexCount,n);assert.equal(a.metadata.shapePositions,spec.positions);grid(spec.positions,n);
   if(descriptor.optionalTexture)assert.ok(statSync(dir+descriptor.optionalTexture.split('/').at(-1)).size>0);
   if(descriptor.hideWithClothing){
    const edges=new Map();for(let i=0;i<a.indices.length;i+=3){const face=a.indices.slice(i,i+3);for(let j=0;j<3;j++){const x=face[j],y=face[(j+1)%3],key=x<y?`${x},${y}`:`${y},${x}`;edges.set(key,(edges.get(key)||0)+1);}}
    assert.ok([...edges.values()].every(n=>n===2),`${descriptor.kind} must be a solid shell with closed hem edges`);
   }
  }
 }
});

test('Atelier production files have pinned provenance and bounded delivery cost',()=>{
 const provenance=json('provenance.json');assert.equal(provenance.sourceCommit,'c252d1fc7f00ba59d87b66b3d32fa3471fc6ee44');assert.equal(provenance.assetLicense,'CC0-1.0');
 let total=0;for(const [name,item] of Object.entries(provenance.files).filter(([name])=>!['skin-recipe.json','skin-recipe-4k.json','README.md'].includes(name))){const b=readFileSync(dir+name);assert.equal(b.byteLength,item.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),item.sha256,name);total+=b.byteLength;}
 assert.ok(total<40_000_000,`production data ${total} should remain below 40MB for both anatomies`);
});
