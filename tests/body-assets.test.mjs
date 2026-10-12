import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const modelRoot=new URL('../studio/models/',import.meta.url),read=async name=>JSON.parse(await readFile(new URL(name,modelRoot),'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=await read('shapes.json');
for(const [gender,bodyName,eyeName] of [['male','human.json','eyes.json'],['female','female.json','female-eyes.json']])test(`${gender}: real endpoint geometry, zero average deltas, seams, weights and eyes`,async()=>{
 const body=await read(bodyName),eyes=await read(eyeName),entry=manifest.bodies[gender];
 assert.equal(entry.vertexCount,body.positions.length/3);assert.equal(entry.eyeVertexCount,eyes.positions.length/3);
 const base=new Float32Array(body.positions);assert.equal(digest(Buffer.from(base.buffer)),entry.basePositionsSha256);
 const weights=body.anatomicalWeights;assert.equal(weights.length,entry.vertexCount*5);
 for(let i=0;i<weights.length;i+=5){assert.ok(weights.slice(i,i+5).every(x=>Number.isFinite(x)&&x>=0&&x<=1));assert.ok(weights.slice(i,i+5).reduce((a,b)=>a+b,0)<=1.000002);assert.equal((weights[i]+weights[i+1])*(weights[i+2]+weights[i+3]),0,'arms and legs have disjoint anatomical influence');}
 assert.equal(eyes.anatomicalWeights.length,entry.eyeVertexCount*5);assert.ok(eyes.anatomicalWeights.every(x=>x===0));
 for(const side of ['L','R'])for(const landmark of ['shoulder','elbow','wrist','hip','knee','ankle']){assert.equal(body.metadata.landmarks[side][landmark].length,3);assert.ok(body.metadata.sourceLandmarkReferences[side][landmark].length);}
 for(const [filename,reference,count] of [[entry.positions,body.positions,entry.vertexCount],[entry.eyes,eyes.positions,entry.eyeVertexCount]]){
  const bytes=await readFile(new URL(filename,modelRoot));assert.equal(bytes.byteLength,9*count*3*4);assert.equal(digest(bytes),entry.sha256[filename]);const grid=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4),block=count*3;
  assert.ok(grid.subarray(4*block,5*block).every(v=>v===0));assert.ok(grid.some(v=>Math.abs(v)>1e-5),'grid is real geometry rather than repeated average');
  const seamGroups=new Map();for(let i=0;i<count;i++){const key=reference.slice(i*3,i*3+3).join(',');if(!seamGroups.has(key))seamGroups.set(key,[]);seamGroups.get(key).push(i);}
  for(let endpoint=0;endpoint<9;endpoint++){
   let minY=Infinity,maxY=-Infinity;for(let i=0;i<block;i++){const value=reference[i]+grid[endpoint*block+i];assert.ok(Number.isFinite(value));if(i%3===1){minY=Math.min(minY,value);maxY=Math.max(maxY,value);}}
   if(filename===entry.positions){assert.ok(Math.abs(minY)<1e-6);assert.ok(Math.abs(maxY-minY-1.753)<2e-6);
    const offset=endpoint*block;for(let i=0;i<body.indices.length;i+=3){const a=body.indices[i]*3,b=body.indices[i+1]*3,c=body.indices[i+2]*3;const edge=(j,k)=>reference[j+k]+grid[offset+j+k]-reference[a+k]-grid[offset+a+k];const x=edge(b,0),y=edge(b,1),z=edge(b,2),u=edge(c,0),v=edge(c,1),w=edge(c,2);assert.ok(Math.hypot(y*w-z*v,z*u-x*w,x*v-y*u)>1e-12,'endpoint has no collapsed triangles');}
   }
   for(const group of seamGroups.values())for(const id of group.slice(1))for(let k=0;k<3;k++)assert.equal(grid[endpoint*block+id*3+k],grid[endpoint*block+group[0]*3+k],'UV seam copies remain coincident');
  }
 }
});
