import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createArtworkPreview, startArtworkResolve} from '../studio/artwork-preview.js';

function clock(){
 let id=0,now=0;const jobs=new Map();
 return {jobs,schedule(fn,delay){jobs.set(++id,{fn,time:now+delay});return id;},cancel(id){jobs.delete(id);},flush(){while(jobs.size){const [id,job]=[...jobs].sort((a,b)=>a[1].time-b[1].time)[0];jobs.delete(id);now=job.time;job.fn();}},get now(){return now;}};
}

class Element extends EventTarget{
 constructor(){super();this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.isConnected=true;this.attributes={};this.textContent='';}
 setAttribute(key,value){this.attributes[key]=String(value);}
 removeAttribute(key){delete this.attributes[key];}
 focus(){this.focused=true;}
 click(){this.dispatchEvent(new Event('click'));}
}
function fixture(options={}){
 const timer=clock(),images=[],document=new Element(),motion=new Element();motion.matches=false;document.hidden=false;
 class Image extends Element{constructor(){super();images.push(this);this.naturalWidth=600;this.naturalHeight=900;}load(){this.onload?.();}fail(){this.onerror?.();}}
 document.defaultView={Image,matchMedia:()=>motion,setTimeout:timer.schedule,clearTimeout:timer.cancel};
 const dialog=new Element();dialog.ownerDocument=document;dialog.open=false;
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;if(!options.deferredClose)dialog.dispatchEvent(new Event('close'));};
 const ids=['image','canvas','title','position','add','remove','previous','next','status'];const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
 if(options.removeControl===false)delete nodes.remove;
 nodes.canvas.getContext=()=>({clearRect(){},drawImage(){}});
 nodes.image.removeAttribute=key=>{delete nodes.image[key];};
 const close=new Element();dialog.querySelector=selector=>selector==='[data-preview-close]'?close:nodes[selector.replace('#artwork-preview-','')];
 const added=[],preview=createArtworkPreview({dialog,onAdd:id=>added.push(id),onRemove:options.onRemove});
 return {timer,images,document,motion,dialog,nodes,close,added,preview};
}
const assets=[{id:'a',name:'A',url:'/a.png',width:600,height:900},{id:'b',name:'B',url:'/b.png',width:900,height:600}];

test('pixel resolve is finite, bounded and cancellation rejects already queued callbacks',()=>{
 const timer=clock(),draws=[];let finished=0;
 startArtworkResolve({draw:step=>draws.push(step),onFinish:()=>finished++,...{schedule:timer.schedule,cancelScheduled:timer.cancel}});
 timer.flush();assert.ok(draws.length<=8);assert.ok(timer.now<=320);assert.equal(finished,1);assert.equal(timer.jobs.size,0);
 const stop=startArtworkResolve({draw:step=>draws.push(step),onFinish:()=>finished++,schedule:timer.schedule,cancelScheduled:timer.cancel});
 const queued=[...timer.jobs.values()][0].fn;stop();const count=draws.length;queued();timer.flush();assert.equal(draws.length,count);assert.equal(finished,1);
});

test('reduced motion skips the resolve and immediately finishes the still',()=>{
 let draws=0,finished=0;
 startArtworkResolve({draw:()=>draws++,onFinish:()=>finished++,reducedMotion:true,schedule:()=>{throw Error('must not schedule');}});
 assert.equal(draws,0);assert.equal(finished,1);
});

test('out of order image loads never replace the current artwork; navigation clamps',()=>{
 const f=fixture(),trigger=new Element();f.preview.open(assets[0],assets,trigger);
 const staleLoad=f.images[0].onload;f.nodes.next.click();f.images[1].load();staleLoad();f.timer.flush();
 assert.equal(f.nodes.image.src,'/b.png');assert.equal(f.nodes.title.textContent,'B');assert.equal(f.nodes.position.textContent,'2 of 2');
 assert.equal(f.nodes.next.disabled,true);f.nodes.next.click();assert.equal(f.images.length,2);
 f.close.click();assert.equal(trigger.focused,true);assert.equal(f.timer.jobs.size,0);
 f.preview.destroy();
});

test('changing reduced motion or hiding the document stops drawing and reveals the full resolution image',()=>{
 for(const reason of ['motion','hidden']){
  const f=fixture();f.preview.open(assets[0],assets);f.images[0].load();assert.ok(f.timer.jobs.size>0);
  if(reason==='motion'){f.motion.matches=true;f.motion.dispatchEvent(new Event('change'));}
  else{f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));}
  assert.equal(f.timer.jobs.size,0);assert.equal(f.nodes.canvas.hidden,true);assert.equal(f.nodes.image.hidden,false);assert.equal(f.nodes.image.src,'/a.png');f.preview.destroy();
 }
});

test('failed or missing artwork clears prior imagery, disables add, and keeps recovery navigation',()=>{
 const f=fixture();f.preview.open(assets[0],assets);f.images[0].load();f.timer.flush();f.nodes.next.click();f.images[1].fail();
 assert.equal(f.dialog.dataset.previewState,'error');assert.equal(f.nodes.image.hidden,true);assert.equal(f.nodes.canvas.hidden,true);assert.equal(f.nodes.add.disabled,true);assert.equal(f.nodes.previous.disabled,false);assert.match(f.nodes.status.textContent,/could not load/i);
 f.preview.open({...assets[0],url:''},assets);assert.equal(f.nodes.add.disabled,true);assert.match(f.nodes.status.textContent,/unavailable/i);f.preview.destroy();
});

test('add closes before callback; closed dialogs ignore keyboard and stale image callbacks',()=>{
 const f=fixture(),trigger=new Element();let openAtAdd=true;
 f.preview.destroy();const preview=createArtworkPreview({dialog:f.dialog,onAdd:id=>{openAtAdd=f.dialog.open;f.added.push(id);}});
 preview.open(assets[0],assets,trigger);const late=f.images[0].onload;f.images[0].load();f.nodes.add.click();
 assert.equal(openAtAdd,false);assert.deepEqual(f.added,['a']);assert.equal(trigger.focused,undefined);assert.equal(f.timer.jobs.size,0);
 const event=new Event('keydown',{cancelable:true});Object.defineProperty(event,'key',{value:'ArrowRight'});f.dialog.dispatchEvent(event);late();assert.equal(f.images.length,1);assert.equal(f.timer.jobs.size,0);preview.destroy();
});

test('arrow keys navigate only the open dialog and destroy removes control listeners',()=>{
 const f=fixture();f.preview.open(assets[0],assets);
 const key=new Event('keydown',{cancelable:true});Object.defineProperty(key,'key',{value:'ArrowRight'});f.dialog.dispatchEvent(key);
 assert.equal(key.defaultPrevented,true);assert.equal(f.nodes.title.textContent,'B');
 f.images[1].load();assert.equal(f.nodes.canvas.style.aspectRatio,'600 / 900');
 f.timer.flush();assert.ok(f.nodes.canvas.width<=180&&f.nodes.canvas.height<=180);assert.equal(f.nodes.image.hidden,false);
 const oldLoad=f.images[0].onload;f.preview.destroy();f.nodes.previous.click();oldLoad?.();
 assert.equal(f.images.length,2);assert.equal(f.timer.jobs.size,0);assert.equal(f.dialog.open,false);
});

test('remove uses the current artwork, closes and cancels before callback, and restores focus',()=>{
 const trigger=new Element(),removed=[];
 const f=fixture({deferredClose:true,onRemove:id=>{
  assert.equal(f.dialog.open,false);assert.equal(f.timer.jobs.size,0);assert.equal(trigger.focused,true);removed.push(id);
 }});
 f.preview.open(assets[0],assets,trigger);f.nodes.next.click();f.images[1].load();
 assert.equal(f.nodes.remove.disabled,false);assert.equal(f.nodes.remove.hidden,false);assert.ok(f.timer.jobs.size>0);
 const queued=[...f.timer.jobs.values()][0].fn;
 f.nodes.remove.click();assert.deepEqual(removed,['b']);assert.equal(f.nodes.remove.disabled,true);
 f.nodes.remove.click();queued();f.timer.flush();assert.deepEqual(removed,['b']);assert.equal(f.nodes.image.hidden,true);assert.equal(f.nodes.canvas.hidden,true);
 f.preview.destroy();
});

test('remove remains available for failed and unavailable images, and rejects stale loads',()=>{
 for(const failure of ['failed','missing','pending']){
  const removed=[],trigger=new Element(),f=fixture({onRemove:id=>removed.push(id)});
  f.preview.open(failure==='missing'?{...assets[0],url:''}:assets[0],assets,trigger);
  const staleLoad=f.images[0]?.onload;
  if(failure==='failed')f.images[0].fail();
  assert.equal(f.nodes.add.disabled,true);assert.equal(f.nodes.remove.disabled,false);
  f.nodes.remove.click();staleLoad?.();f.timer.flush();
  assert.deepEqual(removed,['a']);assert.equal(trigger.focused,true);assert.equal(f.nodes.image.hidden,true);assert.equal(f.timer.jobs.size,0);
  if(failure==='pending'){assert.equal(f.images[0].onload,null);assert.equal(f.images[0].src,'');}
  f.preview.destroy();
 }
});

test('remove without a callback is hidden; missing controls and invalid artwork are safe',()=>{
 const f=fixture();f.preview.open(assets[0],assets);f.images[0].load();f.nodes.remove.click();
 assert.equal(f.nodes.remove.hidden,true);assert.equal(f.nodes.remove.disabled,true);assert.equal(f.dialog.open,true);f.preview.destroy();
 const missing=fixture({removeControl:false,onRemove:()=>assert.fail('must not remove')});
 missing.preview.open(assets[0],assets);missing.preview.destroy();
 const invalid=fixture({onRemove:()=>assert.fail('must not remove')});invalid.preview.open({name:'Unknown',url:''});
 assert.equal(invalid.nodes.remove.disabled,true);invalid.nodes.remove.click();assert.equal(invalid.dialog.open,true);invalid.preview.destroy();
});
