import {createSurfaceHandler} from './surface-worker.js';

// Clone at the ownership boundary: transferring a preview must never detach live Three geometry.
export function createSurfaceClient({workerFactory=()=>new Worker(new URL('./surface-worker.js',import.meta.url),{type:'module'}),forceFallback=false}={}){
 let worker=null,local=null,disposed=false,sequence=0,pending=null,queue=Promise.resolve();const committed=new Map();
 const aborted=()=>Object.assign(Error('Surface processor disposed'),{name:'AbortError'});
 const transport=message=>Object.assign(Error(message||'Surface worker unavailable'),{transport:true});
 if(!forceFallback)try{worker=workerFactory();}catch{/* Native workers can be unavailable; preserve the same geometry path. */}
 if(worker){
  worker.onmessage=({data})=>{if(!pending||data.requestId!==pending.requestId)return;const {resolve,reject}=pending;pending=null;if(data.error)reject(Object.assign(Error(data.error.message),{name:data.error.name||'Error'}));else resolve(data.result);};
  worker.onerror=event=>{event.preventDefault?.();failTransport(event.message);};
  worker.onmessageerror=()=>failTransport('Surface worker response could not be decoded');
 }
 function failTransport(message){if(disposed)return;const current=pending;pending=null;worker?.terminate();worker=null;current?.reject(transport(message));}
 function fallback(){
  worker?.terminate();worker=null;
  if(!local){local=createSurfaceHandler();for(const {body,shape} of committed.values()){local.handle({type:'setBody',payload:body});if(shape)local.handle({type:'compute',payload:{id:body.id,...shape,jobs:[],measure:false}});}}
  return local;
 }
 function send(message){return new Promise((resolve,reject)=>{pending={requestId:message.requestId,resolve,reject};try{worker.postMessage(message);}catch(error){pending=null;reject(transport(error.message));}});}
 function commit({type,payload}){
  if(type==='setBody')committed.set(payload.id,{body:payload,shape:null});
  else if(type==='releaseBody')committed.delete(payload.id);
  else{const record=committed.get(payload.id);if(record){const shape={...record.shape};for(const key of ['positions','normals','state'])if(payload[key]!==undefined)shape[key]=payload[key];record.shape=shape;}}
 }
 async function execute(message){
  if(disposed)throw aborted();let result;
  if(worker){try{result=await send(message);}catch(error){if(disposed)throw aborted();if(!error.transport)throw error;result=fallback().handle(message);}}
  else result=fallback().handle(message);
  if(disposed)throw aborted();commit(message);return result;
 }
 function enqueue(type,payload){
  if(disposed)return Promise.reject(aborted());let owned;
  try{owned=structuredClone(payload);}catch(error){return Promise.reject(error);}
  const message={requestId:++sequence,type,payload:owned},task=queue.then(()=>execute(message));queue=task.catch(()=>{});return task;
 }
 return {
  setBody:body=>enqueue('setBody',body),compute:request=>enqueue('compute',request),releaseBody:id=>enqueue('releaseBody',{id}),
  get backend(){return worker?'Worker':'Main thread';},
  dispose(){if(disposed)return;disposed=true;worker?.terminate();worker=null;const current=pending;pending=null;current?.reject(aborted());local?.dispose();committed.clear();}
 };
}
