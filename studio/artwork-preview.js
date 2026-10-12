/** A short resolve: seven tiny canvas draws, then the original image. */
export function startArtworkResolve({draw,onFinish,reducedMotion=false,isActive=()=>true,
 schedule=(callback,delay)=>setTimeout(callback,delay),cancelScheduled=id=>clearTimeout(id)}){
 const sizes=[16,24,36,54,80,120,180];
 let stopped=false,timer=null,index=0;
 function cancel(){stopped=true;if(timer!==null)cancelScheduled(timer);timer=null;}
 function finish(){cancel();onFinish();}
 function step(){
  timer=null;if(stopped)return;
  if(!isActive()){cancel();return;}
  if(index===sizes.length){finish();return;}
  try{draw(sizes[index++]);}catch{finish();return;}
  timer=schedule(step,40);
 }
 if(reducedMotion){finish();}else{step();}
 return cancel;
}

/** Native dialog controller. It owns only the preview's image and controls. */
export function createArtworkPreview({dialog,onAdd,onRemove}){
 const doc=dialog.ownerDocument,view=doc.defaultView;
 const find=id=>dialog.querySelector(`#artwork-preview-${id}`);
 const image=find('image'),canvas=find('canvas'),title=find('title'),position=find('position');
 const add=find('add'),remove=find('remove'),previous=find('previous'),next=find('next'),status=find('status');
 const closeButton=dialog.querySelector('[data-preview-close]');
 const motion=view.matchMedia?.('(prefers-reduced-motion: reduce)');
 const listeners=[];let assets=[],current=null,index=-1,trigger=null,loader=null;
 let generation=0,destroyed=false,restoreFocus=true,stopResolve=null,ready=false;
 canvas.setAttribute('aria-hidden','true');
 if(remove){remove.hidden=typeof onRemove!=='function';remove.disabled=true;}
 function canRemove(){return typeof onRemove==='function'&&typeof current?.id==='string'&&current.id.trim().length>0;}
 function listen(target,event,handler){target?.addEventListener(event,handler);listeners.push(()=>target?.removeEventListener(event,handler));}
 function stop(){stopResolve?.();stopResolve=null;delete dialog.dataset.resolving;canvas.hidden=true;}
 function invalidate(){
  generation++;stop();ready=false;
  if(loader){loader.onload=null;loader.onerror=null;loader.src='';loader=null;}
 }
 function still(){stop();if(ready&&dialog.open)image.hidden=false;}
 function clear(){image.hidden=true;image.removeAttribute('src');canvas.hidden=true;}
 function updateNavigation(){previous.disabled=index<=0;next.disabled=index<0||index>=assets.length-1;position.textContent=index<0?'':`${index+1} of ${assets.length}`;}
 function show(asset){
  invalidate();current=asset;clear();add.disabled=true;
  if(remove)remove.disabled=!canRemove();
  index=assets.findIndex(candidate=>candidate.id===asset?.id);updateNavigation();
  title.textContent=asset?.name||'Artwork';image.alt=asset?.name||'Artwork';
  dialog.dataset.previewState='loading';status.textContent='Loading artwork…';
  // The canvas shares the image's exact aspect ratio, without allocating a DPR buffer.
  const width=Number(asset?.width),height=Number(asset?.height);
  const ratio=width>0&&height>0?`${width} / ${height}`:'';
  canvas.style.aspectRatio=ratio;image.style.aspectRatio=ratio;
  if(!asset?.url){dialog.dataset.previewState='error';status.textContent='This artwork is unavailable. Choose another artwork.';return;}
  const token=generation,request=new view.Image();loader=request;
  const active=()=>!destroyed&&dialog.open&&token===generation;
  request.onload=()=>{
   if(!active())return;
   request.onload=null;request.onerror=null;loader=null;
   if(!(request.naturalWidth>0&&request.naturalHeight>0)){fail();return;}
   ready=true;image.src=asset.url;
   const aspect=`${request.naturalWidth} / ${request.naturalHeight}`;image.style.aspectRatio=aspect;canvas.style.aspectRatio=aspect;
   add.disabled=false;dialog.dataset.previewState='ready';status.textContent='';
   const context=canvas.getContext('2d');
   if(!context||motion?.matches||doc.hidden){still();return;}
   canvas.hidden=false;dialog.dataset.resolving='true';
   stopResolve=startArtworkResolve({
    draw:longEdge=>{
     const scale=longEdge/Math.max(request.naturalWidth,request.naturalHeight);
     canvas.width=Math.max(1,Math.round(request.naturalWidth*scale));canvas.height=Math.max(1,Math.round(request.naturalHeight*scale));
     context.imageSmoothingEnabled=true;context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(request,0,0,canvas.width,canvas.height);
    },
    isActive:()=>active()&&!doc.hidden&&!motion?.matches,
    onFinish:()=>{if(active())still();},
    schedule:(callback,delay)=>view.setTimeout(callback,delay),cancelScheduled:id=>view.clearTimeout(id)
   });
  };
  function fail(){
   if(!active())return;
   ready=false;loader=null;request.onload=null;request.onerror=null;stop();clear();add.disabled=true;
   dialog.dataset.previewState='error';status.textContent='This artwork could not load. Try another artwork.';
  }
  request.onerror=fail;request.src=asset.url;
 }
 function navigate(delta){
  if(!dialog.open||destroyed)return;
  const target=index+delta;if(index<0||target<0||target>=assets.length)return;
  show(assets[target]);
 }
 function closed(){
  if(dialog.open)return;
  invalidate();clear();add.disabled=true;status.textContent='';
  if(remove)remove.disabled=true;
  if(restoreFocus&&trigger?.isConnected)trigger.focus({preventScroll:true});
  trigger=null;restoreFocus=true;
 }
 listen(previous,'click',()=>navigate(-1));listen(next,'click',()=>navigate(1));
 listen(closeButton,'click',()=>dialog.close());listen(dialog,'close',closed);
 listen(dialog,'keydown',event=>{
  if(!dialog.open||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();navigate(event.key==='ArrowLeft'?-1:1);}
 });
 listen(add,'click',()=>{
  if(!dialog.open||add.disabled||!current)return;
  const id=current.id;restoreFocus=false;dialog.close();onAdd?.(id);
 });
 listen(remove,'click',()=>{
  if(destroyed||!dialog.open||remove.disabled||!canRemove())return;
  const id=current.id;dialog.close();
  // Native close events are queued: finish cleanup/focus before a callback
  // can delete the invoker or move focus to a replacement control.
  closed();onRemove(id);
 });
 listen(doc,'visibilitychange',()=>{if(doc.hidden)still();});
 listen(motion,'change',()=>{if(motion.matches)still();});
 return {
  open(asset,collection=[],invoker){
   if(destroyed)return;
   assets=Array.from(collection);if(asset&&!assets.some(candidate=>candidate.id===asset.id))assets=[asset];
   if(!dialog.open){trigger=invoker||doc.activeElement;restoreFocus=true;dialog.showModal();}
   show(asset);
  },
  destroy(){
   if(destroyed)return;destroyed=true;invalidate();
   if(dialog.open)dialog.close();listeners.forEach(remove=>remove());clear();
  }
 };
}
