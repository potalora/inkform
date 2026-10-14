const copyPose=pose=>({position:[...pose.position],target:[...pose.target]});
const lerp=(a,b,t)=>a+(b-a)*t;
const orbit=pose=>{
 const [x,y,z]=pose.position.map((value,i)=>value-pose.target[i]);
 return {radius:Math.hypot(x,y,z),theta:Math.atan2(x,z),phi:Math.atan2(Math.hypot(x,z),y)};
};

// Interpolate the orbit, not a chord through the subject. Targets and radius
// move together so close detail views also retain their intended framing.
function interpolate(from,to,t){
 const a=orbit(from),b=orbit(to),turn=Math.atan2(Math.sin(b.theta-a.theta),Math.cos(b.theta-a.theta));
 const theta=a.theta+turn*t,phi=lerp(a.phi,b.phi,t),radius=lerp(a.radius,b.radius,t);
 const target=from.target.map((value,i)=>lerp(value,to.target[i],t)),horizontal=radius*Math.sin(phi);
 return {target,position:[target[0]+horizontal*Math.sin(theta),target[1]+radius*Math.cos(phi),target[2]+horizontal*Math.cos(theta)]};
}

/** A finite preset clock; rendering and OrbitControls remain owned by the scene. */
export function createCameraMotion({readPose,applyPose,now=()=>performance.now(),
 requestFrame=globalThis.requestAnimationFrame?.bind(globalThis),cancelFrame=globalThis.cancelAnimationFrame?.bind(globalThis),
 reducedMotion=false}={}){
 let frame=null,transition=null,generation=0,disposed=false;
 function cancel(){
  const active=Boolean(transition);generation++;transition=null;
  if(frame!==null)cancelFrame(frame);frame=null;
  return active;
 }
 function finish(){
  if(!transition||disposed)return false;
  const pose=transition.to;cancel();applyPose(copyPose(pose));return true;
 }
 function schedule(){
  const token=generation;
  frame=requestFrame(()=>{
   if(disposed||token!==generation||!transition)return;
   frame=null;
   const progress=Math.min(1,Math.max(0,(now()-transition.started)/340));
   if(progress===1){finish();return;}
   applyPose(interpolate(transition.from,transition.to,progress*progress*(3-2*progress)));
   schedule();
  });
 }
 function start(pose,{immediate=false}={}){
  if(disposed)return;
  const from=copyPose(readPose()),to=copyPose(pose);cancel();
  if(immediate||reducedMotion||['position','target'].every(key=>from[key].every((value,i)=>Math.abs(value-to[key][i])<1e-10))){applyPose(to);return;}
  // Applying the visible pose clears old damping without jumping to its residual endpoint.
  applyPose(from);
  transition={from,to,started:now()};schedule();
 }
 return {start,cancel,finish,setReducedMotion(value){reducedMotion=Boolean(value);if(reducedMotion)finish();},
  dispose(){cancel();disposed=true;},get active(){return Boolean(transition);}};
}
