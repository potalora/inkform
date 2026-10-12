import {buildSurfacePatch} from './surface-map.js';
import {measureBody} from './body-metrics.js';

// Identical operation handler for a module worker and the supported main-thread fallback.
export function createSurfaceHandler(){
 const bodies=new Map();let disposed=false;
 function handle({type,payload}={}){
  if(disposed)throw Error('Surface processor disposed');
  if(type==='releaseBody'){
   if(typeof payload?.id!=='string')throw new TypeError('Body identity required');
   return {released:bodies.delete(payload.id)};
  }
  if(type==='setBody'){
   const {id,basePositions,indices,weights}=payload||{};
   if(typeof id!=='string'||!id||!(basePositions instanceof Float32Array)||basePositions.length%3||!ArrayBuffer.isView(indices)||!(weights instanceof Float32Array)||weights.length!==basePositions.length/3*5)throw new TypeError('Valid body geometry and weights required');
   bodies.set(id,{...payload,positions:basePositions,normals:undefined,state:{}});return {ready:true};
  }
  if(type!=='compute')throw new TypeError('Unknown surface operation');
  const body=bodies.get(payload?.id);if(!body)throw Error('Body must be registered before computing surfaces');
  const positions=payload.positions??body.positions,normals=payload.normals??body.normals,state=payload.state??body.state;
  if(!(positions instanceof Float32Array)||positions.length!==body.basePositions.length)throw new TypeError('Deformed position shape does not match body');
  if(normals!==undefined&&(!(normals instanceof Float32Array)||normals.length!==positions.length))throw new TypeError('Normal shape does not match body');
  const patches=(payload.jobs||[]).map(({id,...job})=>({id,patch:buildSurfacePatch({positions,normals,indices:body.indices,basePositions:body.basePositions,clothingMasks:body.clothingMasks,torsoMasks:body.torsoMasks,...job})}));
  const measurements=payload.measure?measureBody(positions,body.indices,body.weights,body.metadata,state):null;
  body.positions=positions;body.normals=normals;body.state=state;
  return {patches,measurements};
 }
 return {handle,dispose(){disposed=true;bodies.clear();}};
}

// Collect by buffer identity so added output attributes transfer automatically and shared buffers transfer once.
export function collectTransferables(value,buffers=new Set()){
 if(ArrayBuffer.isView(value)){if(value.buffer instanceof ArrayBuffer)buffers.add(value.buffer);}
 else if(value&&typeof value==='object')for(const item of Object.values(value))collectTransferables(item,buffers);
 return [...buffers];
}

if(typeof WorkerGlobalScope!=='undefined'&&globalThis instanceof WorkerGlobalScope){
 const handler=createSurfaceHandler();
 globalThis.addEventListener('message',({data})=>{
  try{const result=handler.handle(data);globalThis.postMessage({requestId:data.requestId,result},collectTransferables(result));}
  catch(error){globalThis.postMessage({requestId:data.requestId,error:{name:error.name,message:error.message}});}
 });
}
