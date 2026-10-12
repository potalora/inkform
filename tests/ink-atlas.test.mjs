import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {float,texture,uv} from 'three/tsl';

const api=await import('../studio/ink-atlas.js').catch(()=>({}));
function fixture(){
 const body=new THREE.BufferGeometry();
 body.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,1,0,0,1,1,0,0,1,0],3));
 body.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,.25,0,0,.25,.75,0,1,.25,.75,.25],2));body.setIndex([0,1,2,3,4,5]);
 const patch=new THREE.BufferGeometry();patch.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,1,1,0],3));
 patch.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));patch.setIndex([0,1,2,1,3,2]);
 const material=new THREE.MeshBasicNodeMaterial({map:new THREE.Texture(),transparent:true,blending:THREE.MultiplyBlending,opacity:.6,premultipliedAlpha:true});
 material.opacityNode=float(.6);const mesh=new THREE.Mesh(patch,material);mesh.visible=false;
 return {body,decal:{mesh,sourceFaceIndices:new Uint32Array([0,1])},dispose(){body.dispose();patch.dispose();material.map.dispose();material.dispose();}};
}
function renderer(webgpu=true){
 let target={name:'prior'},color=new THREE.Color('#123456'),alpha=.25;
 const prior=target,draws=[],targets=[];
 const r={backend:webgpu?{isWebGPUBackend:true,device:{limits:{maxTextureDimension2D:4096},queue:{async onSubmittedWorkDone(){r.fences++;}}}}:{isWebGPUBackend:false},domElement:{clientWidth:1200,width:1200},toneMapping:THREE.NeutralToneMapping,autoClear:false,fences:0,
 getRenderTarget:()=>target,setRenderTarget(value){target=value;targets.push(value);},getClearColor(out){return out.copy(color);},getClearAlpha:()=>alpha,setClearColor(value,a=1){color.set(value);alpha=a;},render(scene,camera){draws.push({scene,camera,target});},draws,targets,prior};
 return r;
}
test('ink atlas exposes lazy edit-time composition',async()=>{
 assert.equal(typeof api.createInkAtlas,'function');const r=renderer(),atlas=api.createInkAtlas(r,{size:32});
 assert.equal(atlas.texture,null);assert.equal(r.targets.length,0);await atlas.dispose();
 await assert.rejects(atlas.update({}),/closed|disposed/i);
});
test('composition preserves seam corners and includes supplied hidden bake patches in input order',async()=>{
 assert.equal(typeof api.createInkAtlas,'function');const f=fixture(),r=renderer(),atlas=api.createInkAtlas(r,{size:32});
 try{
  await atlas.update({bodyGeometry:f.body,decals:[f.decal,f.decal]});
  const {scene}=r.draws[0],patch=scene.children[1];
  assert.equal(scene.children.length,3);
  assert.deepEqual([...patch.geometry.attributes.position.array],[0,0,0,.25,0,0,0,.25,0,.75,0,0,1,.25,0,.75,.25,0]);
  assert.deepEqual([...patch.geometry.attributes.uv.array],[0,0,1,0,0,1,1,0,1,1,0,1]);
  assert.equal(patch.material.opacityNode,f.decal.mesh.material.opacityNode);
  assert.equal(patch.material.blending,THREE.MultiplyBlending);assert.ok(scene.children[2].renderOrder>patch.renderOrder);
  assert.equal(f.decal.mesh.visible,false);assert.equal(f.decal.mesh.material.toneMapped,true);
  assert.equal(atlas.texture.colorSpace,THREE.LinearSRGBColorSpace);
  const texture=atlas.texture;await atlas.update({bodyGeometry:f.body,decals:[]});assert.equal(atlas.texture,texture);
  assert.equal(r.getRenderTarget(),r.prior);assert.equal(r.autoClear,false);assert.equal(r.toneMapping,THREE.NeutralToneMapping);
  assert.equal(r.getClearAlpha(),.25);assert.equal(r.getClearColor(new THREE.Color()).getHexString(),'123456');
 }finally{await atlas.dispose();f.dispose();}
});
test('UV camera accounts for Three render-target sampling flips on both backends',async()=>{
 assert.equal(typeof api.createInkAtlas,'function');
 const bitmapDescriptor=Object.getOwnPropertyDescriptor(globalThis,'ImageBitmap');
 if(!bitmapDescriptor)globalThis.ImageBitmap=class ImageBitmap{};
 try{
 for(const webgpu of [true,false]){
  const f=fixture(),r=renderer(webgpu),atlas=api.createInkAtlas(r,{size:16});
  try{await atlas.update({bodyGeometry:f.body,decals:[]});const camera=r.draws[0].camera;
   // Exercise Three's actual dynamic DataTexture-to-render-target UV flip.
   const white=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1),node=texture(white);
   node.setupUV({isFlipY:()=>!webgpu},uv());node.update();
   if(!webgpu)assert.equal(node._flipYUniform.value,false);
   node.value=atlas.texture;node.update();const flips=node._flipYUniform?.value===true;
   for(const v of [0,.25,1]){const clip=new THREE.Vector3(.2,v,0).project(camera);const rasterRow=webgpu?(1-clip.y)/2:(1+clip.y)/2;const sampledRow=flips?1-v:v;assert.equal(rasterRow,sampledRow);}
   white.dispose();
   if(!webgpu)assert.equal(r.fences,0);
  }finally{await atlas.dispose();f.dispose();}
 }
 }finally{if(!bitmapDescriptor)delete globalThis.ImageBitmap;}
});
test('allocation follows compact width and enabled GPU texture limits',async()=>{
 assert.equal(typeof api.createInkAtlas,'function');
 for(const [width,limit,want]of [[430,4096,2048],[1200,4096,4096],[1200,1024,1024]]){
  const f=fixture(),r=renderer();r.domElement.clientWidth=width;r.backend.device.limits.maxTextureDimension2D=limit;const atlas=api.createInkAtlas(r);
  try{await atlas.update({bodyGeometry:f.body,decals:[]});assert.equal(atlas.texture.image.width,want);}finally{await atlas.dispose();f.dispose();}
 }
});
test('invalid UVs fail before render-target mutation and render failures clean resources then allow retry',async()=>{
 assert.equal(typeof api.createInkAtlas,'function');const f=fixture(),r=renderer(),atlas=api.createInkAtlas(r,{size:16});
 f.body.attributes.uv.array[0]=2;await assert.rejects(atlas.update({bodyGeometry:f.body,decals:[]}),/UV|atlas/i);assert.equal(atlas.texture,null);assert.equal(r.targets.length,0);f.body.attributes.uv.array[0]=0;
 let targetDisposals=0,geometryDisposals=0,materialDisposals=0;
 r.render=(scene,camera)=>{const target=r.getRenderTarget();target.addEventListener('dispose',()=>targetDisposals++);for(const mesh of scene.children){mesh.geometry.addEventListener('dispose',()=>geometryDisposals++);mesh.material.addEventListener('dispose',()=>materialDisposals++);}throw Error('draw failed');};
 await assert.rejects(atlas.update({bodyGeometry:f.body,decals:[f.decal]}),/draw failed/);
 assert.equal(atlas.texture,null);assert.equal(targetDisposals,1);assert.equal(geometryDisposals,2);assert.equal(materialDisposals,2);assert.equal(r.getRenderTarget(),r.prior);
 r.render=(scene,camera)=>r.draws.push({scene,camera,target:r.getRenderTarget()});await atlas.update({bodyGeometry:f.body,decals:[]});assert.ok(atlas.texture);
 await atlas.dispose();f.dispose();
});
test('state-capture failure does not leave a newly allocated texture behind',async()=>{
 const f=fixture(),r=renderer(),atlas=api.createInkAtlas(r,{size:16});
 r.getClearColor=()=>{throw Error('state capture failed');};
 try{await assert.rejects(atlas.update({bodyGeometry:f.body,decals:[]}),/state capture failed/);assert.equal(atlas.texture,null);assert.equal(r.getRenderTarget(),r.prior);}finally{await atlas.dispose();f.dispose();}
});
test('transient bake geometry remains alive until the submitted WebGPU work completes',async()=>{
 const f=fixture(),r=renderer(),atlas=api.createInkAtlas(r,{size:16});let release,geometryDisposals=0;
 const gate=new Promise(resolve=>{release=resolve;});r.backend.device.queue.onSubmittedWorkDone=()=>gate;
 r.render=(scene,camera)=>{if(scene.isScene)for(const mesh of scene.children)mesh.geometry.addEventListener('dispose',()=>geometryDisposals++);};
 const update=atlas.update({bodyGeometry:f.body,decals:[f.decal]});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(geometryDisposals,0);release();await update;assert.equal(geometryDisposals,2);
 await atlas.dispose();f.dispose();
});
