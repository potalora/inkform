const clearance=.02;

/** Keep the target and lens above ground without removing useful low angles. */
export function constrainCameraToFloor(camera,target){
 let changed=false;
 if(target.y<clearance){const lift=clearance-target.y;target.y=clearance;camera.position.y+=lift;changed=true;}
 if(camera.position.y<clearance){
  // Slide along the orbit sphere, preserving zoom and horizontal direction.
  const dx=camera.position.x-target.x,dz=camera.position.z-target.z;
  const radius=camera.position.distanceTo(target),dy=clearance-target.y;
  const horizontal=Math.hypot(dx,dz),nextHorizontal=Math.sqrt(Math.max(0,radius*radius-dy*dy));
  camera.position.set(target.x+(horizontal?dx/horizontal:0)*nextHorizontal,clearance,target.z+(horizontal?dz/horizontal:1)*nextHorizontal);
  changed=true;
 }
 if(changed){camera.lookAt(target);camera.updateMatrixWorld();}
 return changed;
}

/** Discard residual damping before an explicit preset or saved view. */
export function stopCameraMotion(controls){
 const damping=controls.enableDamping;
 try{controls.enableDamping=false;controls.update();}finally{controls.enableDamping=damping;}
}

/** Old saved views can predate the ground boundary. Reject malformed poses. */
export function restoreCameraPose(camera,controls,pose){
 if(![pose?.position,pose?.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))return false;
 stopCameraMotion(controls);
 camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);
 constrainCameraToFloor(camera,controls.target);controls.update();constrainCameraToFloor(camera,controls.target);
 return true;
}
