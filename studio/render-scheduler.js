// One owner for interactive frames and capture fences. draw() must include all renderer submission work.
export function createRenderScheduler({draw,wait=async()=>{},requestFrame=globalThis.requestAnimationFrame?.bind(globalThis),cancelFrame=globalThis.cancelAnimationFrame?.bind(globalThis),onError=()=>{}}={}){
 if(typeof draw!=='function'||typeof requestFrame!=='function'||typeof cancelFrame!=='function')throw new TypeError('Draw and animation-frame functions required');
 let frame=null,dirty=false,busy=false,disposed=false,renders=0,failures=0;const waiters=[];
 const aborted=()=>Object.assign(new Error('Renderer disposed'),{name:'AbortError'});
 function settle(error){for(const {resolve,reject} of waiters.splice(0))error?reject(error):resolve();}
 function schedule(){if(frame===null&&!busy&&!disposed&&dirty)frame=requestFrame(()=>{frame=null;void run();});}
 async function run(){
  if(busy||disposed)return;busy=true;
  try{
   do{
    dirty=false;await draw();renders++;if(disposed)break;
    if(waiters.length)await wait();
   }while(!disposed&&dirty&&waiters.length);
   if(!disposed&&!dirty)settle();
  }catch(error){failures++;dirty=false;settle(error);if(!disposed)try{onError(error);}catch{/* Error reporting must not strand the queue. */}}
  finally{busy=false;schedule();}
 }
 function request(){if(disposed)return false;dirty=true;schedule();return true;}
 function flush(){
  if(disposed)return Promise.reject(aborted());
  const result=new Promise((resolve,reject)=>waiters.push({resolve,reject}));
  if(!busy){dirty=true;if(frame!==null){cancelFrame(frame);frame=null;}void run();}
  return result;
 }
 function dispose(){if(disposed)return;disposed=true;dirty=false;if(frame!==null){cancelFrame(frame);frame=null;}settle(aborted());}
 return {request,flush,dispose,getStats:()=>({renders,failures,inFlight:busy?1:0,pending:dirty,disposed})};
}
