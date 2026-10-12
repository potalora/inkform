export const PARAM_KEYS=['stature','build','shoulders','waist','hips','arms','legs','bust','armsLeft','armsRight','legsLeft','legsRight','abdomen'];
const defaults=[175.3,0,0,0,0,14,0,0,0,0,0,0,0],ranges=[[150,205],[-30,40],[-20,25],[-25,35],[-20,30],[-25,40],[-25,35],[-25,35],[-20,20],[-20,20],[-20,20],[-20,20],[-20,20]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const step=(v,a,b)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const gaussian=(y,c,w)=>Math.exp(-(((y-c)/w)**2));
function parameters(params={}){return PARAM_KEYS.map((key,i)=>{const value=Number(params[key]??defaults[i]);return clamp(Number.isFinite(value)&&(i!==0||value!==0)?value:defaults[i],...ranges[i]);});}
function validate(positions,weights){if(!(positions instanceof Float32Array)||positions.length%3)throw new TypeError('Positions must be a Float32Array of xyz triples');if(weights!==undefined&&(!(weights instanceof Float32Array)||weights.length!==positions.length/3*5||weights.some(v=>!Number.isFinite(v)||v<0||v>1)))throw new TypeError('Anatomical weights must contain five finite 0..1 values per vertex');}
export function anatomicalFallback(positions){const out=new Float32Array(positions.length/3*5);for(let i=0,j=0;i<positions.length;i+=3,j+=5){const x=positions[i],y=positions[i+1],arm=step(Math.abs(x),.145,.215)*step(y,.78,.94)*(1-step(y,1.44,1.54)),leg=(1-step(y,.78,.90))*step(y,.06,.16)*(1-arm),torso=(1-arm)*(1-leg)*step(y,.78,.94)*(1-step(y,1.44,1.54));out[j+(x>=0?0:1)]=arm;out[j+(x>=0?2:3)]=leg;out[j+4]=torso;}return out;}
export const LANDMARK_ORDER=['shoulder','elbow','wrist','hip','knee','ankle'];
const defaultLeft=[[.1890469823,1.3980539215,.0180785311],[.2290096871,1.1457393332,.0180785311],[.2430754104,.8769810203,.0510779025],[.1099849814,.9313387459,-.0077345465],[.1533840999,.511723546,.0272516897],[.2004714042,.0722178226,.0154192527]];
function landmarkValues(landmarks){const out=new Float64Array(36);for(let side=0;side<2;side++)for(let j=0;j<6;j++){const p=landmarks?.[side?'R':'L']?.[LANDMARK_ORDER[j]]??(landmarks===undefined?defaultLeft[j].map((v,k)=>side&&k===0?-v:v):null);if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))throw new TypeError('Bilateral shoulder/elbow/wrist/hip/knee/ankle landmarks must contain finite xyz arrays');out.set(p,side*18+j*3);}return out;}
function axisCenter(values,offset,y,component){const start=y>=values[offset+4]?offset:offset+3,a=values[start+1],b=values[start+4],t=clamp((y-a)/(b-a||1),0,1);return values[start+component]+(values[start+3+component]-values[start+component])*t;}
export function morphPositions(positions,params={},weights,landmarks){
 validate(positions,weights);weights??=anatomicalFallback(positions);const [stature,build,shoulders,waist,hips,arms,legs,bust,armsLeft,armsRight,legsLeft,legsRight,abdomen]=parameters(params),scale=stature/175.3,out=new Float32Array(positions.length),centers=landmarkValues(landmarks);
 for(let i=0,j=0;i<positions.length;i+=3,j+=5){const x=positions[i],y=positions[i+1],z=positions[i+2],al=weights[j],ar=weights[j+1],ll=weights[j+2],lr=weights[j+3],torso=weights[j+4];
 const girth=build/100,local=shoulders/100*gaussian(y,1.39,.13)+waist/100*gaussian(y,1.10,.16)+hips/100*gaussian(y,.91,.16);
 const armL=clamp(girth+(arms+armsLeft)/100,-.65,1.5),armR=clamp(girth+(arms+armsRight)/100,-.65,1.5),legL=clamp(girth+(legs+legsLeft)/100,-.65,1.5),legR=clamp(girth+(legs+legsRight)/100,-.65,1.5),torsoX=clamp(girth+local,-.65,1.5),torsoZ=clamp(girth+local*.65,-.65,1.5);
 const axL=axisCenter(centers,0,y,0),axR=axisCenter(centers,18,y,0),lxL=axisCenter(centers,9,y,0),lxR=axisCenter(centers,27,y,0);
 const azL=axisCenter(centers,0,y,2),azR=axisCenter(centers,18,y,2),lzL=axisCenter(centers,9,y,2),lzR=axisCenter(centers,27,y,2);
 // Apply each influence once, to displacement about that region's unweighted axis.
 const dx=al*(x-axL)*armL+ar*(x-axR)*armR+ll*(x-lxL)*legL+lr*(x-lxR)*legR+torso*x*torsoX;
 const dz=al*(z-azL)*armL+ar*(z-azR)*armR+ll*(z-lzL)*legL+lr*(z-lzR)*legR+z*torso*torsoZ+Math.max(0,z)*torso*(bust/100*gaussian(y,1.30,.12)+abdomen/100*gaussian(y,1.10,.16));
 out[i]=(dx===0?x:x+dx)*scale;out[i+1]=y*scale;out[i+2]=(dz===0?z:z+dz)*scale;
 }return out;
}
export async function createGeometryKernel({bytes,forceFallback=false}={}){
 if(forceFallback)return {backend:'JavaScript',morph:morphPositions};
 try{
  if(!bytes){const response=await fetch(new URL('./wasm/morph.wasm',import.meta.url));if(!response.ok)throw new Error('Geometry WASM unavailable');bytes=await response.arrayBuffer();}
  const {instance}=await WebAssembly.instantiate(bytes,{env:{abort(){throw new Error('Geometry WASM aborted');}}});const {memory,morph}=instance.exports,base=memory.buffer.byteLength;
  return {backend:'WASM',morph(positions,params={},weights,landmarks){validate(positions,weights);weights??=anatomicalFallback(positions);const centers=landmarkValues(landmarks),size=positions.byteLength,p=base,landmarkPtr=p+PARAM_KEYS.length*8,input=landmarkPtr+centers.byteLength,output=input+size,weightPtr=output+size,required=weightPtr+weights.byteLength;if(required>memory.buffer.byteLength)memory.grow(Math.ceil((required-memory.buffer.byteLength)/65536));new Float64Array(memory.buffer,p,PARAM_KEYS.length).set(parameters(params));new Float64Array(memory.buffer,landmarkPtr,36).set(centers);new Float32Array(memory.buffer,input,positions.length).set(positions);new Float32Array(memory.buffer,weightPtr,weights.length).set(weights);morph(input,output,positions.length,p,weightPtr,landmarkPtr);return new Float32Array(memory.buffer,output,positions.length).slice();}};
 }catch(error){return {backend:'JavaScript',morph:morphPositions,error};}
}
