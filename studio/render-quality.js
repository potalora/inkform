const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const finite=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):fallback;
const mode=value=>['auto','efficient','high'].includes(value)?value:'auto';
// Bounds backing-store work, independent of CSS layout. Scale affects runtime previews only.
export function choosePixelRatio({width=1,height=1,dpr=1,quality='auto',scale=1}={}){
 const chosen=mode(quality),caps={efficient:1,auto:2,high:2.5},pixels={efficient:750000,auto:width<=700?1500000:2400000,high:6000000};
 const area=finite(width,1)*finite(height,1),ratio=Math.min(finite(dpr,1),caps[chosen],Math.sqrt(pixels[chosen]/area));
 return Math.max(.1,ratio*clamp(finite(scale,1),.6,1));
}
// RAF intervals describe callback cadence, not GPU duration or presented FPS. Ignore suspension gaps.
export function createAdaptiveQuality({quality='auto',windowSize=60}={}){
 const enabled=mode(quality)==='auto',size=Math.round(clamp(finite(windowSize,60),4,120));let scale=1,slow=0,fast=0,samples=[];
 function sample(frameMs){
  if(!enabled)return scale;
  if(!Number.isFinite(frameMs)||frameMs<=0||frameMs>250){samples=[];slow=fast=0;return scale;}
  samples.push(frameMs);if(samples.length<size)return scale;
  samples.sort((a,b)=>a-b);const cadence=samples[Math.floor((size-1)*.75)];samples=[];
  if(cadence>28){slow++;fast=0;}else if(cadence<20){fast++;slow=0;}else slow=fast=0;
  if(slow>=2){scale=Math.max(.6,Math.round((scale-.1)*10)/10);slow=fast=0;}
  else if(fast>=6){scale=Math.min(1,Math.round((scale+.1)*10)/10);slow=fast=0;}
  return scale;
 }
 return {sample,getScale:()=>scale,reset(){scale=1;slow=fast=0;samples=[];}};
}
