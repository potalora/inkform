import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from '../studio/vendor/OrbitControls.js';
import {constrainCameraToFloor,restoreCameraPose} from '../studio/camera-floor.js';
import {cameraView} from '../studio/camera-framing.js';
import {handleCameraKey} from '../studio/camera-keyboard.js';

function fixture(t){
 const document={addEventListener(){},removeEventListener(){}};
 const element={style:{},clientWidth:1000,clientHeight:700,addEventListener(){},removeEventListener(){},ownerDocument:document,getRootNode:()=>document};
 const camera=new PerspectiveCamera(34,1,.01,20),controls=new OrbitControls(camera,element);
 Object.assign(controls,{enableDamping:true,dampingFactor:.09,minDistance:.22,maxDistance:4.5,maxPolarAngle:Math.PI*.91});
 camera.position.set(0,1.1,3);controls.target.set(0,.85,0);camera.updateMatrixWorld();
 let floorCollision=false;
 controls.addEventListener('change',()=>{floorCollision=constrainCameraToFloor(camera,controls.target)||floorCollision;});
 const update=()=>{controls.update();floorCollision=constrainCameraToFloor(camera,controls.target)||floorCollision;if(floorCollision){restoreCameraPose(camera,controls,{position:camera.position.toArray(),target:controls.target.toArray()});floorCollision=false;}};
 update();t.after(()=>controls.dispose());
 const aboveFloor=()=>{assert.ok(camera.position.y>=.02-1e-8,'camera remains above the floor');assert.ok(controls.target.y>=.02-1e-8,`pan target remains above the floor (${controls.target.y})`);};
 const settle=()=>{for(let i=0;i<240;i++){update();aboveFloor();}};
 return {camera,controls,update,aboveFloor,settle};
}

test('downward keyboard and pointer-equivalent orbit stop at the floor through damping',t=>{
 const {camera,controls,settle,aboveFloor}=fixture(t),radius=camera.position.distanceTo(controls.target);
 for(let i=0;i<100;i++){
  handleCameraKey({key:'ArrowDown',preventDefault(){}},controls);aboveFloor();
 }
 settle();
 assert.ok(Math.abs(camera.position.distanceTo(controls.target)-radius)<1e-8,'floor collision preserves zoom distance');
 assert.ok(camera.position.y<controls.target.y,'above-floor views can still look upward toward the body');
 for(let i=0;i<100;i++){controls.rotateUp(-.1);aboveFloor();}
 settle();
 for(let i=0;i<50;i++){controls.dollyOut(.9);aboveFloor();}
 settle();assert.ok(Math.abs(camera.position.distanceTo(controls.target)-4.5)<1e-8);
 for(let i=0;i<100;i++){controls.dollyIn(.9);aboveFloor();}
 settle();assert.ok(Math.abs(camera.position.distanceTo(controls.target)-.22)<1e-8);
});

test('screen-space pan stops at floor without changing view direction or zoom',t=>{
 const {camera,controls,settle,aboveFloor}=fixture(t);
 const offset=camera.position.clone().sub(controls.target);
 for(let i=0;i<80;i++){controls.pan(0,-100);aboveFloor();}
 settle();
 assert.ok(Math.abs(controls.target.y-.02)<1e-8,'downward pan reaches the floor');
 assert.ok(camera.position.clone().sub(controls.target).distanceTo(offset)<1e-8,'pan boundary preserves relative offset');
 for(let i=0;i<50;i++){controls.dollyOut(.9);aboveFloor();}
 settle();
 assert.ok(camera.position.distanceTo(controls.target)<=4.5+1e-8);
 for(let i=0;i<100;i++){controls.dollyIn(.9);aboveFloor();}
 settle();
 assert.ok(Math.abs(camera.position.distanceTo(controls.target)-.22)<1e-8);
});

test('restoring underground poses corrects immediately and invalid poses leave the camera alone',t=>{
 const {camera,controls,aboveFloor}=fixture(t);
 assert.equal(restoreCameraPose(camera,controls,{position:[0,-3,2],target:[0,-1,0]}),true);aboveFloor();
 for(const pose of [{position:[0,NaN,2],target:[0,0,0]},{position:[0,1,2],target:[0,Infinity,0]},{position:['0',1,2],target:[0,0,0]},null]){
  const before={position:camera.position.toArray(),target:controls.target.toArray()};
  assert.equal(restoreCameraPose(camera,controls,pose),false);
  assert.deepEqual({position:camera.position.toArray(),target:controls.target.toArray()},before);
 }
});

test('low foot detail stays above ground and normal named views retain their framing',t=>{
 const {camera,controls,aboveFloor}=fixture(t);
 for(const pose of [{position:[0,-.55,0],target:[0,.04,0]},{position:[.2,-.2,.15],target:[0,.005,0]}]){
  camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);
  const radius=camera.position.distanceTo(controls.target);
  constrainCameraToFloor(camera,controls.target);aboveFloor();
  assert.ok(Math.abs(camera.position.distanceTo(controls.target)-radius)<1e-10);
 }
 for(const name of ['body','front','side','back']){
  const pose=cameraView(name);camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);
  assert.equal(constrainCameraToFloor(camera,controls.target),false);
  assert.deepEqual(camera.position.toArray(),pose.position);assert.deepEqual(controls.target.toArray(),pose.target);
 }
});

test('restoring a named view clears old orbit momentum instead of sliding back to the floor',t=>{
 const {camera,controls,settle}=fixture(t);
 for(let i=0;i<28;i++)controls.rotateUp(-.2);
 const pose=cameraView('front');
 restoreCameraPose(camera,controls,pose);settle();
 assert.ok(camera.position.distanceTo({x:pose.position[0],y:pose.position[1],z:pose.position[2]})<1e-8);
 assert.deepEqual(controls.target.toArray(),pose.target);
});


test('a floor collision stops residual motion so upward orbit responds immediately',t=>{
 const {camera,controls,update}=fixture(t);
 for(let i=0;i<28;i++)controls.rotateUp(-.2);
 update();const y=camera.position.y;
 controls.rotateUp(.1);update();
 assert.ok(camera.position.y>y+.01,'reversing direction must not fight old downward momentum');
});
