// Metres; keep the standing subject clear of the studio's fixed controls.
const scaleVector=(values,scale)=>values.map(value=>value*scale);
export function cameraView(name,{stature=175.3}={}){
 const scale=Number.isFinite(stature)&&stature>0?stature/175.3:1;
 const positions={body:[.65,1.08,4.42],front:[0,.93,3.8],side:[3.8,.93,0],back:[0,.93,-3.8]};
 const selected=Object.hasOwn(positions,name)?name:'body';
 return {position:scaleVector(positions[selected],scale),target:scaleVector(selected==='body'?[0,.85,0]:[0,.90,0],scale)};
}
