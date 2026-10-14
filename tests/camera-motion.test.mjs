import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from '../studio/vendor/OrbitControls.js';
import {createCameraMotion} from '../studio/camera-motion.js';
import {restoreCameraPose} from '../studio/camera-floor.js';

function fixture(t){
 const root={addEventListener(){},removeEventListener(){}},element={style:{},addEventListener(){},removeEventListener(){},ownerDocument:root,getRootNode:()=>root};
 const camera=new PerspectiveCamera(34,1,.01,20),controls=new OrbitControls(camera,element);
 controls.enableDamping=true;controls.dampingFactor=.09;
 const front={position:[0,.93,3.8],target:[0,.9,0]},back={position:[0,.93,-3.8],target:[0,.9,0]};
 restoreCameraPose(camera,controls,front);
 let time=0,id=0;const frames=new Map(),readPose=()=>({position:camera.position.toArray(),target:controls.target.toArray()});
 const motion=createCameraMotion({readPose,applyPose:pose=>restoreCameraPose(camera,controls,pose),now:()=>time,
  requestFrame(fn){frames.set(++id,fn);return id;},cancelFrame(id){frames.delete(id);}});
 t.after(()=>{motion.dispose();controls.dispose();});
 return {motion,camera,controls,frames,front,back,readPose,
  advance(ms){time+=ms;const callbacks=[...frames.values()];frames.clear();for(const callback of callbacks)callback(time);}};
}
const nearPose=(actual,expected)=>{for(const key of ['position','target'])actual[key].forEach((value,i)=>assert.ok(Math.abs(value-expected[key][i])<1e-8,`${key}[${i}]`));};

test('front to back eases around the subject, reaches its endpoint and stops scheduling',t=>{
 const h=fixture(t);h.motion.start(h.back);nearPose(h.readPose(),h.front);
 h.advance(17);const early=h.camera.position.distanceTo(new Vector3(...h.front.position));
 h.advance(153);
 assert.ok(Math.abs(h.camera.position.z)<1e-8,'halfway view is beside the body');
 assert.ok(Math.abs(h.camera.position.x)>3.79,'arc retains working distance instead of crossing the body');
 assert.ok(early<.1,'ease starts gently');
 h.advance(153);assert.ok(h.motion.active);h.advance(17);
 nearPose(h.readPose(),h.back);assert.equal(h.motion.active,false);assert.equal(h.frames.size,0);
 h.advance(400);nearPose(h.readPose(),h.back);
});

test('rapid presets retarget from the displayed pose and ignore an obsolete frame callback',t=>{
 const h=fixture(t);h.motion.start(h.back);h.advance(100);const visible=h.readPose(),stale=[...h.frames.values()][0];
 const detail={position:[.62,1.135,0],target:[0,1.1,0]};h.motion.start(detail);
 nearPose(h.readPose(),visible);const frames=h.frames.size;stale();
 nearPose(h.readPose(),visible);assert.equal(h.frames.size,frames,'obsolete callback cannot fork a second clock');
 h.advance(340);nearPose(h.readPose(),detail);assert.equal(h.frames.size,0);
});

test('interruption keeps the visible pose and retains real controls damping for further input',t=>{
 const h=fixture(t);h.controls.rotateLeft(.8);const visible=h.readPose();h.motion.start(h.back);
 nearPose(h.readPose(),visible);assert.equal(h.controls.enableDamping,true,'clearing residual input does not disable damping');
 h.advance(120);const interrupted=h.readPose();h.motion.cancel();h.advance(500);
 nearPose(h.readPose(),interrupted);assert.equal(h.frames.size,0);
 h.controls.rotateLeft(.1);assert.notDeepEqual(h.readPose(),interrupted,'manual control responds after interruption');
});

test('every sampled close detail pose respects the camera floor constraint',t=>{
 const h=fixture(t);h.motion.start({position:[.2,-.2,.15],target:[0,.005,0]});
 for(let i=0;i<20;i++){
  h.advance(17);assert.ok(h.camera.position.y>=.02-1e-8);assert.ok(h.controls.target.y>=.02-1e-8);
 }
 assert.equal(h.frames.size,0);assert.equal(h.controls.enableDamping,true);
});

test('reduced motion and explicit finishing settle immediately; disposal prevents stale work',t=>{
 const h=fixture(t);h.motion.start(h.back);h.advance(80);h.motion.setReducedMotion(true);
 nearPose(h.readPose(),h.back);assert.equal(h.frames.size,0);
 h.motion.start(h.front);nearPose(h.readPose(),h.front);assert.equal(h.frames.size,0);
 h.motion.setReducedMotion(false);h.motion.start(h.back);h.motion.finish();
 nearPose(h.readPose(),h.back);assert.equal(h.frames.size,0);
 h.motion.start(h.front,{immediate:true});nearPose(h.readPose(),h.front);assert.equal(h.frames.size,0);
 h.motion.start(h.back);const stale=[...h.frames.values()][0];h.motion.dispose();stale();h.motion.start(h.back);
 nearPose(h.readPose(),h.front);assert.equal(h.frames.size,0);
});

test('choosing the already displayed preset does not create idle animation frames',t=>{
 const h=fixture(t);h.motion.start(h.front);assert.equal(h.frames.size,0);assert.equal(h.motion.active,false);
});
