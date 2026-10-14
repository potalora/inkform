// Metres. Orbit frames head-to-knee on desktop and head-to-torso on phones;
// Front/Side/Back fit the whole body. Custom poses restore separately, and
// viewport changes never activate a preset.
const scaleVector=(values,scale)=>values.map(value=>value*scale);
export function cameraView(name,{stature=175.3,compact=false}={}){
 const scale=Number.isFinite(stature)&&stature>0?stature/175.3:1;
 const positions={body:[.4,1.2,2.8],front:[0,.93,3.8],side:[3.8,.93,0],back:[0,.93,-3.8]};
 const selected=Object.hasOwn(positions,name)?name:'body';
 if(selected==='body'&&compact)return {position:scaleVector([.17,1.50,1.25],scale),target:scaleVector([0,1.45,0],scale)};
 return {position:scaleVector(positions[selected],scale),target:scaleVector(selected==='body'?[0,1.13,0]:[0,.90,0],scale)};
}
