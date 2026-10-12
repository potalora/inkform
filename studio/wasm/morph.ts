function clamp(v:f64,a:f64,b:f64):f64{return Math.max(a,Math.min(b,v));}
function gaussian(y:f64,c:f64,w:f64):f64{const t=(y-c)/w;return Math.exp(-t*t);}
function axisCenter(values:i32,offset:i32,y:f64,component:i32):f64{const start=y>=load<f64>(values+(offset+4)*8)?offset:offset+3,a=load<f64>(values+(start+1)*8),b=load<f64>(values+(start+4)*8),t=clamp((y-a)/(b-a==0?1:b-a),0,1),first=load<f64>(values+(start+component)*8);return first+(load<f64>(values+(start+3+component)*8)-first)*t;}
export function morph(input:i32,output:i32,count:i32,p:i32,weights:i32,centers:i32):void{
 const scale=load<f64>(p)/175.3,build=load<f64>(p+8)/100;
 for(let i=0,j=0;i<count;i+=3,j+=5){
  const x:f64=load<f32>(input+i*4),y:f64=load<f32>(input+(i+1)*4),z:f64=load<f32>(input+(i+2)*4);
  const al:f64=load<f32>(weights+j*4),ar:f64=load<f32>(weights+(j+1)*4),ll:f64=load<f32>(weights+(j+2)*4),lr:f64=load<f32>(weights+(j+3)*4),torso:f64=load<f32>(weights+(j+4)*4);
  const local=load<f64>(p+16)/100*gaussian(y,1.39,.13)+load<f64>(p+24)/100*gaussian(y,1.10,.16)+load<f64>(p+32)/100*gaussian(y,.91,.16);
  const armL=clamp(build+(load<f64>(p+40)+load<f64>(p+64))/100,-.65,1.5),armR=clamp(build+(load<f64>(p+40)+load<f64>(p+72))/100,-.65,1.5),legL=clamp(build+(load<f64>(p+48)+load<f64>(p+80))/100,-.65,1.5),legR=clamp(build+(load<f64>(p+48)+load<f64>(p+88))/100,-.65,1.5),torsoX=clamp(build+local,-.65,1.5),torsoZ=clamp(build+local*.65,-.65,1.5);
  const axL=axisCenter(centers,0,y,0),axR=axisCenter(centers,18,y,0),lxL=axisCenter(centers,9,y,0),lxR=axisCenter(centers,27,y,0),azL=axisCenter(centers,0,y,2),azR=axisCenter(centers,18,y,2),lzL=axisCenter(centers,9,y,2),lzR=axisCenter(centers,27,y,2);
  const dx=al*(x-axL)*armL+ar*(x-axR)*armR+ll*(x-lxL)*legL+lr*(x-lxR)*legR+torso*x*torsoX;
  const dz=al*(z-azL)*armL+ar*(z-azR)*armR+ll*(z-lzL)*legL+lr*(z-lzR)*legR+z*torso*torsoZ+Math.max(0,z)*torso*(load<f64>(p+56)/100*gaussian(y,1.30,.12)+load<f64>(p+96)/100*gaussian(y,1.10,.16));
  store<f32>(output+i*4,<f32>((dx==0?x:x+dx)*scale));store<f32>(output+(i+1)*4,<f32>(y*scale));store<f32>(output+(i+2)*4,<f32>((dz==0?z:z+dz)*scale));
 }
}
