const clamp=value=>Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):50));
/** Add bilinearly interpolated source deltas, muscle-major / mass-minor at 0,50,100. */
export function blendBodyShape(base,grid,mass=50,muscle=50){
 if(!(base instanceof Float32Array)||base.length%3)throw new TypeError('Base must contain Float32 xyz triples');
 const nested=Array.isArray(grid)&&grid.length===9,expected=base.length*9;
 if(nested?grid.some(values=>!(values instanceof Float32Array)||values.length!==base.length):!(grid instanceof Float32Array)||grid.length!==expected)throw new TypeError('Shape grid must contain nine matching Float32 delta arrays');
 const a=clamp(mass)/50,b=clamp(muscle)/50,x=Math.min(1,Math.floor(a)),y=Math.min(1,Math.floor(b)),u=a-x,v=b-y,out=new Float32Array(base.length),corners=[y*3+x,y*3+x+1,(y+1)*3+x,(y+1)*3+x+1],weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
 for(let i=0;i<base.length;i++){let value=base[i];for(let k=0;k<4;k++){const delta=nested?grid[corners[k]][i]:grid[corners[k]*base.length+i];if(delta!==0&&weights[k]!==0)value+=delta*weights[k];}out[i]=value;}return out;
}
