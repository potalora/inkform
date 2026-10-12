// Topology-driven discrete exponential map, following Schmidt, Grimm & Wyvill (2006).
// Tangent frames are parallel transported across welded edges; only connected surface is visited.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
function transport(v,a,b){const axis=cross(a,b),s=len(axis),c=Math.max(-1,Math.min(1,dot(a,b)));if(s<1e-8)return c>0?v:mul(v,-1);const k=mul(axis,1/s);return add(add(mul(v,c),mul(cross(k,v),s)),mul(k,dot(k,v)*(1-c)));}
function step(a,b,na,nb,frame){const moved=unit(transport(frame,na,nb)),middle=unit(add(frame,moved)),side=unit(cross(unit(add(na,nb)),middle)),edge=sub(b,a),angle=Math.acos(Math.max(-1,Math.min(1,dot(na,nb)))),correction=angle<1e-5?1:angle/(2*Math.sin(angle/2));return {frame:moved,uv:[dot(edge,middle)*correction,dot(edge,side)*correction]};}
// Exact separating-axis test removes triangles whose UV bounding box alone overlaps the image.
function overlapsImage(triangle){
 const axes=[[1,0],[0,1]];for(let i=0;i<3;i++){const a=triangle[i],b=triangle[(i+1)%3];axes.push([a[1]-b[1],b[0]-a[0]]);}
 for(const [x,y]of axes){const projected=triangle.map(p=>p[0]*x+p[1]*y),lo=Math.min(0,x)+Math.min(0,y),hi=Math.max(0,x)+Math.max(0,y);if(Math.max(...projected)<lo-1e-10||Math.min(...projected)>hi+1e-10)return false;}return true;
}
class Heap{a=[];push(x){let i=this.a.length;this.a.push(x);while(i){const p=(i-1)>>1;if(this.a[p][0]<=x[0])break;this.a[i]=this.a[p];i=p;}this.a[i]=x;}pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let j=i*2+1;if(j+1<this.a.length&&this.a[j+1][0]<this.a[j][0])j++;if(this.a[j][0]>=last[0])break;this.a[i]=this.a[j];i=j;}this.a[i]=last;}return first;}}
// Base positions and index arrays are immutable model topology. Deformed coordinates remain per-call.
const topologyCache=new WeakMap();
function topology(basePositions,indices){
 let byIndex=topologyCache.get(basePositions);if(!byIndex){byIndex=new WeakMap();topologyCache.set(basePositions,byIndex);}let result=byIndex.get(indices);if(result)return result;
 const ids=new Int32Array(basePositions.length/3),originalIds=[],adj=[],weld=new Map(),triangles=[],counts=new Map();
 for(let i=0;i<ids.length;i++){const o=i*3,key=Math.round(basePositions[o]*1e6)+','+Math.round(basePositions[o+1]*1e6)+','+Math.round(basePositions[o+2]*1e6);let id=weld.get(key);if(id===undefined){id=originalIds.length;weld.set(key,id);originalIds.push(i);adj.push(new Set());}ids[i]=id;}
 for(let i=0;i<indices.length;i+=3){const t=[ids[indices[i]],ids[indices[i+1]],ids[indices[i+2]]];triangles.push(t);for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3];adj[a].add(b);adj[b].add(a);const key=a<b?a+':'+b:b+':'+a,entry=counts.get(key);if(entry)entry.count++;else counts.set(key,{a,b,count:1});}}
 result={ids,originalIds,adj,triangles,edges:[...counts.values()].map(e=>[e.a,e.b]),boundaryEdges:[...counts.values()].filter(e=>e.count===1).map(e=>[e.a,e.b])};byIndex.set(indices,result);return result;
}
// Interior9×9 sampling detects definite gaps; complete=true is an indicator, not a proof of full image coverage.
function mappingQuality(uvs,indices){
 const adjacency=new Map();for(let i=0;i<indices.length;i+=3){const t=indices.slice(i,i+3);for(const a of t){if(!adjacency.has(a))adjacency.set(a,new Set());for(const b of t)adjacency.get(a).add(b);}}
 const seen=new Set();let components=0;for(const id of adjacency.keys()){if(seen.has(id))continue;components++;const stack=[id];while(stack.length){const a=stack.pop();if(seen.has(a))continue;seen.add(a);for(const b of adjacency.get(a))if(!seen.has(b))stack.push(b);}}
 let covered=0;const samples=81;for(let y=0;y<9;y++)for(let x=0;x<9;x++){const px=(x+.5)/9,py=(y+.5)/9;let hit=false;for(let i=0;i<indices.length&&!hit;i+=3){const a=indices[i]*2,b=indices[i+1]*2,c=indices[i+2]*2,den=(uvs[b+1]-uvs[c+1])*(uvs[a]-uvs[c])+(uvs[c]-uvs[b])*(uvs[a+1]-uvs[c+1]);if(Math.abs(den)<1e-12)continue;const u=((uvs[b+1]-uvs[c+1])*(px-uvs[c])+(uvs[c]-uvs[b])*(py-uvs[c+1]))/den,v=((uvs[c+1]-uvs[a+1])*(px-uvs[c])+(uvs[a]-uvs[c])*(py-uvs[c+1]))/den;hit=u>=-1e-6&&v>=-1e-6&&u+v<=1.000001;}if(hit)covered++;}
 return {components,coverage:{covered,samples,complete:covered===samples}};
}
// A folded exponential chart can put a distant surface island back inside the image.
// Retain the connected branch supporting the requested image center (including offsets).
function retainCenterComponent(attributes,indices,sourceFaces,distances){
 const uvs=attributes.find(a=>a.size===2).values,count=distances.length,parents=Int32Array.from({length:count},(_,i)=>i);
 const root=id=>{while(parents[id]!==id){parents[id]=parents[parents[id]];id=parents[id];}return id;};
 for(let i=0;i<indices.length;i+=3){const a=root(indices[i]);parents[root(indices[i+1])]=a;parents[root(indices[i+2])]=a;}
 const components=new Map();for(let i=0;i<indices.length;i+=3){const id=root(indices[i]);if(!components.has(id))components.set(id,[]);components.get(id).push(i/3);}
 if(components.size<2)return;
 function scoreTriangle(face){
  const t=indices.slice(face*3,face*3+3),[a,b,c]=t.map(id=>uvs.slice(id*2,id*2+2)),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if(Math.abs(den)>1e-12){const u=((b[1]-c[1])*(.5-c[0])+(c[0]-b[0])*(.5-c[1]))/den,v=((c[1]-a[1])*(.5-c[0])+(a[0]-c[0])*(.5-c[1]))/den;if(u>=-1e-10&&v>=-1e-10&&u+v<=1+1e-10)return [0,u*distances[t[0]]+v*distances[t[1]]+(1-u-v)*distances[t[2]]];}
  let best=[Infinity,Infinity];for(let k=0;k<3;k++){const p=[a,b,c][k],q=[a,b,c][(k+1)%3],dx=q[0]-p[0],dy=q[1]-p[1],length=dx*dx+dy*dy,s=Math.max(0,Math.min(1,((.5-p[0])*dx+(.5-p[1])*dy)/(length||1))),distance=(p[0]+s*dx-.5)**2+(p[1]+s*dy-.5)**2,geodesic=distances[t[k]]*(1-s)+distances[t[(k+1)%3]]*s;if(distance<best[0]-1e-12||Math.abs(distance-best[0])<=1e-12&&geodesic<best[1])best=[distance,geodesic];}return best;
 }
 let selected,best=[Infinity,Infinity];for(const faces of components.values())for(const face of faces){const score=scoreTriangle(face);if(score[0]<best[0]-1e-12||Math.abs(score[0]-best[0])<=1e-12&&score[1]<best[1]){selected=faces;best=score;}}
 const remap=new Map(),nextIndices=[],nextFaces=[],nextAttributes=attributes.map(()=>[]);
 for(const face of selected){nextFaces.push(sourceFaces[face]);for(const id of indices.slice(face*3,face*3+3)){let next=remap.get(id);if(next===undefined){next=remap.size;remap.set(id,next);attributes.forEach(({values,size},i)=>{for(let k=0;k<size;k++)nextAttributes[i].push(values[id*size+k]);});}nextIndices.push(next);}}
 attributes.forEach(({values},i)=>{values.length=0;for(const value of nextAttributes[i])values.push(value);});indices.length=0;for(const value of nextIndices)indices.push(value);sourceFaces.length=0;for(const face of nextFaces)sourceFaces.push(face);
}
export function buildSurfacePatch({positions,normals,indices,basePositions=positions,clothingMasks,torsoMasks,anchor,width,height,rotation=0,offsetX=0,offsetY=0,flip=false}){
 if(!(width>0&&height>0)||!anchor||anchor.faceIndex<0||anchor.faceIndex*3+2>=indices.length)throw new RangeError('Valid surface anchor and positive dimensions required');
 const {ids,originalIds,adj,triangles,edges,boundaryEdges}=topology(basePositions,indices);
 const points=originalIds.map(i=>[positions[i*3],positions[i*3+1],positions[i*3+2]]),ns=originalIds.map(()=>[0,0,0]);
 if(normals){for(let i=0;i<ids.length;i++){const n=ns[ids[i]],o=i*3;n[0]+=normals[o];n[1]+=normals[o+1];n[2]+=normals[o+2];}}
 else for(const t of triangles){const n=cross(sub(points[t[1]],points[t[0]]),sub(points[t[2]],points[t[0]]));for(const id of t){ns[id][0]+=n[0];ns[id][1]+=n[1];ns[id][2]+=n[2];}}
 let maxEdge=0;for(const [a,b] of edges){const p=points[a],q=points[b];maxEdge=Math.max(maxEdge,Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]));}
 for(let i=0;i<ns.length;i++)ns[i]=unit(ns[i]);
 const tri=[0,1,2].map(k=>ids[indices[anchor.faceIndex*3+k]]),weights=anchor.barycentric||[1/3,1/3,1/3];let origin=[0,0,0],normal=[0,0,0];tri.forEach((id,k)=>{origin=add(origin,mul(points[id],weights[k]));normal=add(normal,mul(ns[id],weights[k]));});normal=unit(normal);
 let up=Math.abs(normal[1])>.93?[0,0,-1]:[0,1,0];up=unit(sub(up,mul(normal,dot(up,normal))));const right=unit(cross(up,normal));
 const radius=width/2+height/2+Math.abs(offsetX)+Math.abs(offsetY)+maxEdge*2,dist=new Float64Array(points.length).fill(Infinity),uvs=new Array(points.length),frames=new Array(points.length),heap=new Heap();
 for(const id of tri){const s=step(origin,points[id],normal,ns[id],right);dist[id]=len(sub(points[id],origin));uvs[id]=s.uv;frames[id]=s.frame;heap.push([dist[id],id]);}
 while(heap.a.length){const [d,a]=heap.pop();if(d!==dist[a]||d>radius)continue;for(const b of adj[a]){const distance=d+len(sub(points[b],points[a]));if(distance<dist[b]&&distance<=radius){const s=step(points[a],points[b],ns[a],ns[b],frames[a]);dist[b]=distance;uvs[b]=[uvs[a][0]+s.uv[0],uvs[a][1]+s.uv[1]];frames[b]=s.frame;heap.push([distance,b]);}}}
 const co=Math.cos(rotation),si=Math.sin(rotation),mapped=uvs.map(uv=>{if(!uv)return null;const x=uv[0]-offsetX,y=uv[1]-offsetY;return [((co*x+si*y)/width)*(flip?-1:1)+.5,(-si*x+co*y)/height+.5];});
 const outP=[],outN=[],outUV=[],outI=[],outBase=[],outMasks=[],outTorso=[],outDistances=[],outWeldIds=[],outMap=new Map(),warnings=[],sourceFaces=[],discontinuities=[];let boundary=false;
 for(let faceIndex=0;faceIndex<triangles.length;faceIndex++){const t=triangles[faceIndex],coords=t.map(id=>mapped[id]);if(coords.some(v=>!v))continue;if(!overlapsImage(coords))continue;
  if(t.some((a,k)=>len(sub(uvs[a],uvs[t[(k+1)%3]]))>len(sub(points[a],points[t[(k+1)%3]]))*2.5+1e-5)){discontinuities.push(t);continue;}
  sourceFaces.push(faceIndex);
  for(const id of t){let j=outMap.get(id);if(j===undefined){j=outP.length/3;outMap.set(id,j);outDistances.push(dist[id]);outWeldIds.push(id);outP.push(...points[id]);const source=originalIds[id];outBase.push(...basePositions.slice(source*3,source*3+3));outMasks.push(clothingMasks?.[source]??0);outTorso.push(torsoMasks?.[source]??0);outN.push(...ns[id]);outUV.push(...mapped[id]);}outI.push(j);}
 }
 retainCenterComponent([{values:outP,size:3},{values:outN,size:3},{values:outUV,size:2},{values:outBase,size:3},{values:outMasks,size:1},{values:outTorso,size:1},{values:outWeldIds,size:1}],outI,sourceFaces,outDistances);
 const retainedIds=new Set(outWeldIds);
 // A rejected remote branch must not report a seam on the retained local chart.
 if(discontinuities.some(t=>t.some(id=>retainedIds.has(id)&&mapped[id].every(n=>n>=0&&n<=1))))warnings.push('This tattoo reaches a surface wrap seam. Reduce its size or move its anchor to keep the full image continuous.');
 if(!outI.length)warnings.push('The tattoo does not overlap the selected surface.');
 // Boundary edges inside the requested rectangle indicate image content has no supporting surface.
 for(const [a,b] of boundaryEdges){const u=mapped[a],v=mapped[b];if(retainedIds.has(a)&&retainedIds.has(b)&&u&&v&&[(u[0]+v[0])/2,(u[1]+v[1])/2].every(n=>n>0&&n<1)){boundary=true;break;}}
 if(boundary)warnings.push('The tattoo reaches an open mesh boundary; some image content has no supporting surface.');
 const quality=mappingQuality(outUV,outI);
 if(quality.components>1)warnings.push('This curved area cannot support one continuous tattoo map at this size and anchor. Image gaps may appear; reduce its size or move it.');
 if(!quality.coverage.complete)warnings.push('Some image area has no continuous surface mapping. Reduce the tattoo size or choose another anchor.');
 return {sourceFaceIndices:new Uint32Array(sourceFaces),mappingQuality:quality,basePositions:new Float32Array(outBase),clothingMasks:new Float32Array(outMasks),torsoMasks:new Float32Array(outTorso),positions:new Float32Array(outP),normals:new Float32Array(outN),uvs:new Float32Array(outUV),indices:new Uint32Array(outI),warnings};
}
