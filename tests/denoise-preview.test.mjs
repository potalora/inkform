import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('guide raster preserves projection winding and view normals before GPU row conversion',async()=>{
 const {createGuideCamera}=await import('../studio/denoise-preview.js');
 const camera=new THREE.PerspectiveCamera(40,1,.1,10);camera.updateMatrixWorld();
 const guide=createGuideCamera(camera),point=new THREE.Vector3(.1,.3,-2);
 const beautyNDC=point.clone().project(camera),guideNDC=point.clone().project(guide);
 assert.equal(1-(1-guideNDC.y)/2,(beautyNDC.y+1)/2);
 assert.deepEqual(guide.projectionMatrix.elements,camera.projectionMatrix.elements);
 assert.deepEqual(guide.matrixWorldInverse.elements,camera.matrixWorldInverse.elements);
 assert.ok(camera.projectionMatrix.elements[5]>0);
});

test('guided denoiser converts load and asynchronous tile errors into a recoverable result',async()=>{
 const {createGuidedDenoiser}=await import('../studio/denoise-preview.js');
 class FakeDenoiser{
  constructor(options){Object.assign(this,options);this._running=false;this.resets=0;}
  reset(){this._running=false;this.resets++;}
  async denoise(){this._running=true;const unet=await this.initUNetFromURL('model',{},{});unet.tileExecute({});}
 }
 const loadError=new Error('weights unavailable');
 const failed=createGuidedDenoiser(FakeDenoiser,async()=>{throw loadError;});
 await failed.denoise();assert.equal(failed.error,loadError);assert.equal(failed._running,false);
 let execute;
 const runtime=createGuidedDenoiser(FakeDenoiser,async()=>({tileExecute(options){execute=options;},dispose(){}}));
 await runtime.denoise();const gpuError=new Error('device lost');execute.error(gpuError);
 assert.equal(runtime.error,gpuError);assert.equal(runtime._running,false);
});

test('cancelled guided pass ignores late tile callbacks and rejected model cleanup',async()=>{
 const {createGuidedDenoiser}=await import('../studio/denoise-preview.js');let inputs;
 class FakeDenoiser{
  constructor(options){Object.assign(this,options);this._requestId=0;this._unets={};this._complete=false;}
  reset(){this._running=false;this._complete=false;}
  dispose(){this.reset();}
  async denoise(){this._running=true;const unet=await this.initUNetFromURL('model',{},{});unet.tileExecute({done:()=>{this._complete=true;},progress:()=>{throw Error('late progress must not run');}});}
 }
 const denoiser=createGuidedDenoiser(FakeDenoiser,async()=>({tileExecute(options){inputs=options;return ()=>{};},dispose(){}}));
 await denoiser.denoise();denoiser.reset();inputs.done({});inputs.progress({});inputs.error(Error('late error'));
 assert.equal(denoiser._complete,false);assert.equal(denoiser.error,null);
 denoiser._unets.aux=Promise.reject(Error('model load rejected'));denoiser.dispose();
 await new Promise(resolve=>setImmediate(resolve));
});
