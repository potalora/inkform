/** The ray-traced bake targets one atlas; tiled or malformed UVs need conversion. */
export function assertBakeUVs(uvs){
 const message='Ray tracing requires finite body UV pairs in a single [0, 1] texture atlas.';
 if(!(Array.isArray(uvs)||ArrayBuffer.isView(uvs))||!uvs.length||uvs.length%2)throw new RangeError(message);
 for(const value of uvs)if(!Number.isFinite(value)||value<0||value>1)throw new RangeError(message);
}

/** Expand welded tattoo triangles into the body's original per-face UV corners.
 * A physical seam shares patch vertices but has distinct atlas coordinates.
 */
export function expandPatchUVs({bodyIndices,bodyUVs,patchIndices,patchUVs,sourceFaceIndices}){
 if(!sourceFaceIndices||patchIndices.length%3||sourceFaceIndices.length!==patchIndices.length/3)throw new RangeError('Every tattoo triangle needs its original body face.');
 const positions=new Float32Array(patchIndices.length*3),uvs=new Float32Array(patchIndices.length*2),patchVertexIndices=new Uint32Array(patchIndices.length);
 for(let i=0;i<patchIndices.length;i++){
  const face=sourceFaceIndices[Math.floor(i/3)],corner=face*3+i%3,patch=patchIndices[i];
  if(corner>=bodyIndices.length||patch*2+1>=patchUVs.length)throw new RangeError('Tattoo bake mapping is outside its source geometry.');
  const source=bodyIndices[corner]*2;
  if(source+1>=bodyUVs.length)throw new RangeError('Body face has no valid atlas coordinates.');
  positions[i*3]=bodyUVs[source];positions[i*3+1]=bodyUVs[source+1];
  uvs[i*2]=patchUVs[patch*2];uvs[i*2+1]=patchUVs[patch*2+1];patchVertexIndices[i]=patch;
 }
 return {positions,uvs,patchVertexIndices};
}

// Cardinal samples win equal-distance ties; all channels (including black ink
// and roughness) are copied. Alpha alone identifies an unoccupied bake texel.
export const BAKE_PADDING_RADIUS=8;
export const BAKE_PADDING_OFFSETS=Object.freeze([[0,-1],[-1,0],[1,0],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]].map(Object.freeze));

/** CPU reference for the bounded GPU gutter pass, useful for small bake probes. */
export function dilateBakePixels(pixels,width,height,radius=BAKE_PADDING_RADIUS){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||pixels.length!==width*height*4)throw new RangeError('Padding requires a complete RGBA bake.');
 if(!Number.isInteger(radius)||radius<0||radius>BAKE_PADDING_RADIUS)throw new RangeError('Bake padding radius is outside its bounded budget.');
 let source=new Uint8Array(pixels),dest=new Uint8Array(source.length);
 for(let pass=0;pass<radius;pass++){
  dest.set(source);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const at=(y*width+x)*4;if(source[at+3]>=128)continue;
   for(const [dx,dy]of BAKE_PADDING_OFFSETS){const sx=x+dx,sy=y+dy;if(sx<0||sy<0||sx>=width||sy>=height)continue;const from=(sy*width+sx)*4;
    if(source[from+3]>=128){dest.set(source.subarray(from,from+4),at);break;}
   }
  }
  [source,dest]=[dest,source];
 }
 return source;
}
