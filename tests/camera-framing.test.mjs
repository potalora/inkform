import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cameraView} from '../studio/camera-framing.js';

// Canvas bounds exclude the header and desktop pane. Compact layout follows
// viewport media queries, not canvas width (landscape desktop can be narrow).
const canvases=[[960,658,false],[390,438,true],[524,328,false],[390,737,true]];
function projectedBounds(name,width,height,compact=false,verticalBounds=[0,1.753]){
 const view=cameraView(name),camera=new THREE.PerspectiveCamera(34,width/height,.01,20);
 camera.position.fromArray(view.position);camera.lookAt(...view.target);
 camera.zoom=compact?.76:height<600?.8:1;
 camera.setViewOffset(width,height,0,compact?16:Math.min(40,height*.06),width,height);
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const points=[];
 for(const x of [-.45,.45])for(const y of verticalBounds)for(const z of [-.18,.18]){
  const p=new THREE.Vector3(x,y,z).project(camera);
  assert.ok(p.z>-1&&p.z<1,'subject stays between clipping planes');
  points.push([(p.x+1)*width/2,(1-p.y)*height/2]);
 }
 return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
}

test('Orbit working view keeps the head and knees visible while making the body prominent',()=>{
 for(const [width,height,compact] of canvases){
  const bounds=projectedBounds('body',width,height,compact,[.55,1.753]);
  assert.ok(bounds.top>=24,`${width}x${height}: head retains breathing room (${bounds.top})`);
  assert.ok(bounds.bottom<=height-24,`${width}x${height}: knees retain lower canvas clearance (${bounds.bottom})`);
  assert.ok(bounds.left>=0&&bounds.right<=width,`${width}x${height}: upper body clears canvas edges`);
  if(width===960){
   const full=projectedBounds('body',width,height,compact);
   assert.ok((full.bottom-full.top)/height>.95,'working view fills the frame instead of showing a distant whole-body overview');
  }
 }
});

test('named whole-body views stay inside desktop and compact canvases',()=>{
 for(const name of ['front','side','back'])for(const [width,height,compact] of canvases){
  const bounds=projectedBounds(name,width,height,compact);
  assert.ok(bounds.top>=0&&bounds.bottom<=height&&bounds.left>=0&&bounds.right<=width,`${name} fits ${width}x${height}`);
 }
});

test('compact Orbit frames the upper body more closely without changing whole-body presets',()=>{
 const wide=cameraView('body'),compact=cameraView('body',{compact:true});
 const distance=pose=>new THREE.Vector3(...pose.position).distanceTo(new THREE.Vector3(...pose.target));
 assert.ok(distance(compact)<distance(wide)*.5,'phone Orbit gives the torso a close working view instead of fitting the hips');
 assert.ok(compact.target[1]>wide.target[1],'phone Orbit aims at the upper torso');
 for(const name of ['front','side','back'])assert.deepEqual(cameraView(name,{compact:true}),cameraView(name),'whole-body presets do not depend on viewport');
 const scaled=cameraView('body',{compact:true,stature:175.3*1.1});
 for(const key of ['position','target'])assert.deepEqual(scaled[key],compact[key].map(value=>value*1.1));
});

test('camera angles are near eye level, with front, back and side on their correct axes',()=>{
 for(const name of ['body','front','side','back']){
  const {position,target}=cameraView(name),delta=new THREE.Vector3(...position).sub(new THREE.Vector3(...target));
  assert.ok(Math.atan2(Math.abs(delta.y),Math.hypot(delta.x,delta.z))*180/Math.PI<10);
  assert.ok(delta.length()<=4.5,'body reset stays within orbit distance limit');
 }
 assert.ok(cameraView('front').position[2]>0);assert.ok(cameraView('back').position[2]<0);
 assert.equal(cameraView('front').position[0],0);assert.equal(cameraView('back').position[0],0);
 assert.ok(cameraView('side').position[0]>0);assert.equal(cameraView('side').position[2],0);
});

test('stature scales camera and target together, invalid stature safely defaults, and returned vectors are independent',()=>{
 for(const name of ['body','front','side','back']){
  const original=cameraView(name),scaled=cameraView(name,{stature:175.3*1.1});
  for(const key of ['position','target'])assert.deepEqual(scaled[key],original[key].map(value=>value*1.1));
  for(const stature of [0,-1,NaN,Infinity,'175.3',null])assert.deepEqual(cameraView(name,{stature}),original);
 }
 const changed=cameraView('body');changed.position[0]=100;changed.target[1]=100;
 assert.deepEqual(cameraView('unknown'),cameraView('body'));assert.notEqual(cameraView('body').position[0],100);
});

test('body contact follows separated soles and clears an elevated body',async()=>{
 const {createBodyContact,disposeAtelierGroup}=await import('../studio/gallery-environment.js');
 const contact=createBodyContact(),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.2,0,-.05,-.1,.01,.2,.1,0,-.05,.2,.01,.2,0,1.75,0],3));
 contact.update(geometry);
 assert.ok(contact.group.children[0].position.x<0&&contact.group.children[1].position.x>0);
 for(const mesh of contact.group.children){assert.equal(mesh.visible,true);assert.equal(mesh.userData.rasterOnly,true);assert.ok(mesh.scale.x<.25&&mesh.scale.y<.4,'occlusion stays close to soles');}
 geometry.translate(0,.2,0);contact.update(geometry);assert.ok(contact.group.children.every(mesh=>!mesh.visible),'airborne feet must not leave contact stamps');
 geometry.dispose();disposeAtelierGroup(contact.group);
});
