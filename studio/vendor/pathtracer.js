/* Local optional path tracer: three-gpu-pathtracer 0.0.27, three-mesh-bvh 0.9.16. MIT notices: pathtracer.LICENSE.txt. Rebuild: node scripts/build-pathtracer.mjs */
var uu=Object.defineProperty;var fu=(o,e)=>{for(var t in e)uu(o,t,{get:e[t],enumerable:!0})};import{Box3 as Vp,DataTexture as Hp,LinearFilter as su,Vector2 as au,Scene as kp,PerspectiveCamera as Up,Color as Wp,NoToneMapping as ou,FloatType as qp,Timer as Gp,StorageTexture as Qp,MeshBasicNodeMaterial as jp,Matrix4 as Kp,WebGPUCoordinateSystem as Xp}from"three/webgpu";import{uv as Yp,uniform as Zp,varying as Jp}from"three/tsl";import{Box3 as bu}from"three";var Dt=Math.pow(2,-24),He=Symbol("SKIP_GENERATION"),jr={strategy:0,maxDepth:40,targetLeafSize:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null,[He]:!1};function W(o,e,t){return t.min.x=e[o],t.min.y=e[o+1],t.min.z=e[o+2],t.max.x=e[o+3],t.max.y=e[o+4],t.max.z=e[o+5],t}function pr(o){let e=-1,t=-1/0;for(let r=0;r<3;r++){let i=o[r+3]-o[r];i>t&&(t=i,e=r)}return e}function Kn(o,e){e.set(o)}function Xn(o,e,t){let r,i;for(let s=0;s<3;s++){let n=s+3;r=o[s],i=e[s],t[s]=r<i?r:i,r=o[n],i=e[n],t[n]=r>i?r:i}}function mr(o,e,t){for(let r=0;r<3;r++){let i=e[o+2*r],s=e[o+2*r+1],n=i-s,l=i+s;n<t[r]&&(t[r]=n),l>t[r+3]&&(t[r+3]=l)}}function Ft(o){let e=o[3]-o[0],t=o[4]-o[1],r=o[5]-o[2];return 2*(e*t+t*r+r*e)}function P(o,e){return e[o+15]===65535}function U(o,e){return e[o+6]}function G(o,e){return e[o+14]}function E(o){return o+8}function L(o,e){let t=e[o+6];return o+t*8}function Ct(o,e){return e[o+7]}function Kr(o,e,t,r,i){let s=1/0,n=1/0,l=1/0,a=-1/0,f=-1/0,c=-1/0,u=1/0,d=1/0,h=1/0,p=-1/0,y=-1/0,v=-1/0,T=o.offset||0;for(let m=(e-T)*6,x=(e+t-T)*6;m<x;m+=6){let g=o[m+0],b=o[m+1],S=g-b,w=g+b;S<s&&(s=S),w>a&&(a=w),g<u&&(u=g),g>p&&(p=g);let R=o[m+2],F=o[m+3],I=R-F,C=R+F;I<n&&(n=I),C>f&&(f=C),R<d&&(d=R),R>y&&(y=R);let D=o[m+4],A=o[m+5],M=D-A,B=D+A;M<l&&(l=M),B>c&&(c=B),D<h&&(h=D),D>v&&(v=D)}r[0]=s,r[1]=n,r[2]=l,r[3]=a,r[4]=f,r[5]=c,i[0]=u,i[1]=d,i[2]=h,i[3]=p,i[4]=y,i[5]=v}var Pe=32,hu=(o,e)=>o.candidate-e.candidate,ke=new Array(Pe).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),Xr=new Float32Array(6);function wo(o,e,t,r,i,s){let n=-1,l=0;if(s===0)n=pr(e),n!==-1&&(l=(e[n]+e[n+3])/2);else if(s===1)n=pr(o),n!==-1&&(l=pu(t,r,i,n));else if(s===2){let a=Ft(o),f=1.25*i,c=t.offset||0,u=(r-c)*6,d=(r+i-c)*6;for(let h=0;h<3;h++){let p=e[h],T=(e[h+3]-p)/Pe;if(i<Pe/4){let m=[...ke];m.length=i;let x=0;for(let b=u;b<d;b+=6,x++){let S=m[x];S.candidate=t[b+2*h],S.count=0;let{bounds:w,leftCacheBounds:R,rightCacheBounds:F}=S;for(let I=0;I<3;I++)F[I]=1/0,F[I+3]=-1/0,R[I]=1/0,R[I+3]=-1/0,w[I]=1/0,w[I+3]=-1/0;mr(b,t,w)}m.sort(hu);let g=i;for(let b=0;b<g;b++){let S=m[b];for(;b+1<g&&m[b+1].candidate===S.candidate;)m.splice(b+1,1),g--}for(let b=u;b<d;b+=6){let S=t[b+2*h];for(let w=0;w<g;w++){let R=m[w];S>=R.candidate?mr(b,t,R.rightCacheBounds):(mr(b,t,R.leftCacheBounds),R.count++)}}for(let b=0;b<g;b++){let S=m[b],w=S.count,R=i-S.count,F=S.leftCacheBounds,I=S.rightCacheBounds,C=0;w!==0&&(C=Ft(F)/a);let D=0;R!==0&&(D=Ft(I)/a);let A=1+1.25*(C*w+D*R);A<f&&(n=h,f=A,l=S.candidate)}}else{for(let g=0;g<Pe;g++){let b=ke[g];b.count=0,b.candidate=p+T+g*T;let S=b.bounds;for(let w=0;w<3;w++)S[w]=1/0,S[w+3]=-1/0}for(let g=u;g<d;g+=6){let w=~~((t[g+2*h]-p)/T);w>=Pe&&(w=Pe-1);let R=ke[w];R.count++,mr(g,t,R.bounds)}let m=ke[Pe-1];Kn(m.bounds,m.rightCacheBounds);for(let g=Pe-2;g>=0;g--){let b=ke[g],S=ke[g+1];Xn(b.bounds,S.rightCacheBounds,b.rightCacheBounds)}let x=0;for(let g=0;g<Pe-1;g++){let b=ke[g],S=b.count,w=b.bounds,F=ke[g+1].rightCacheBounds;S!==0&&(x===0?Kn(w,Xr):Xn(w,Xr,Xr)),x+=S;let I=0,C=0;x!==0&&(I=Ft(Xr)/a);let D=i-x;D!==0&&(C=Ft(F)/a);let A=1+1.25*(I*x+C*D);A<f&&(n=h,f=A,l=b.candidate)}}}}else console.warn(`BVH: Invalid build strategy value ${s} used.`);return{axis:n,pos:l}}function pu(o,e,t,r){let i=0,s=o.offset;for(let n=e,l=e+t;n<l;n++)i+=o[(n-s)*6+r*2];return i/t}var At=class{constructor(){this.boundingData=new Float32Array(6)}};function So(o,e,t,r,i,s){let n=r,l=r+i-1,a=s.pos,f=s.axis*2,c=t.offset||0;for(;;){for(;n<=l&&t[(n-c)*6+f]<a;)n++;for(;n<=l&&t[(l-c)*6+f]>=a;)l--;if(n<l){for(let u=0;u<e;u++){let d=o[n*e+u];o[n*e+u]=o[l*e+u],o[l*e+u]=d}for(let u=0;u<6;u++){let d=n-c,h=l-c,p=t[d*6+u];t[d*6+u]=t[h*6+u],t[h*6+u]=p}n++,l--}else return n}}var Io,Yr,Yn,_o,mu=Math.pow(2,32);function Zr(o){return"count"in o?1:1+Zr(o.left)+Zr(o.right)}function Ro(o,e,t){return Io=new Float32Array(t),Yr=new Uint32Array(t),Yn=new Uint16Array(t),_o=new Uint8Array(t),Zn(o,e)}function Zn(o,e){let t=o/4,r=o/2,i="count"in e,s=e.boundingData;for(let n=0;n<6;n++)Io[t+n]=s[n];if(i)return e.buffer?(_o.set(new Uint8Array(e.buffer),o),o+e.buffer.byteLength):(Yr[t+6]=e.offset,Yn[r+14]=e.count,Yn[r+15]=65535,o+32);{let{left:n,right:l,splitAxis:a}=e,f=o+32,c=Zn(f,n),u=o/32,h=c/32-u;if(h>mu)throw new Error("MeshBVH: Cannot store relative child node offset greater than 32 bits.");return Yr[t+6]=h,Yr[t+7]=a,Zn(c,l)}}function gu(o,e,t,r,i,s){let{maxDepth:n,verbose:l,targetLeafSize:a,_strictLeafSize:f=1/0,strategy:c,onProgress:u}=i,d=o.primitiveBuffer,h=o.primitiveBufferStride,p=new Float32Array(6),y=!1,v=new At;return Kr(e,t,r,v.boundingData,p),m(v,t,r,p),v;function T(x){u&&u((x-s.offset)/s.count)}function m(x,g,b,S=null,w=0){!y&&w>=n&&(y=!0,l&&console.warn(`BVH: Max depth of ${n} reached when generating BVH. Consider increasing maxDepth.`));let R=b>f;if(b<=a&&!R||w>=n)return T(g+b),x.offset=g,x.count=b,x;let F=wo(x.boundingData,S,e,g,b,c),I=F.axis===-1?-1:So(d,h,e,g,b,F);if(F.axis===-1||I===g||I===g+b){if(!R)return T(g+b),x.offset=g,x.count=b,x;F.axis=Math.max(0,pr(x.boundingData)),I=g+Math.max(1,Math.floor(b/2))}x.splitAxis=F.axis;let C=new At,D=g,A=I-g;x.left=C,Kr(e,D,A,C.boundingData,p),m(C,D,A,p,w+1);let M=new At,B=I,j=b-A;return x.right=M,Kr(e,B,j,M.boundingData,p),m(M,B,j,p,w+1),x}}function Do(o,e){let t=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,r=o.getRootRanges(e.range),i=r[0],s=r[r.length-1],n={offset:i.offset,count:s.offset+s.count-i.offset},l=new Float32Array(6*n.count);l.offset=n.offset,o.computePrimitiveBounds(n.offset,n.count,l),o._roots=r.map(a=>{let f=gu(o,l,a.offset,a.count,e,n),c=Zr(f),u=new t(32*c);return Ro(0,f,u),u})}import{Box3 as vu}from"three";var Ue=class{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){let e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}};var Jn=class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;let e=[],t=null;this.setBuffer=r=>{t&&e.push(t),t=r,this.float32Array=new Float32Array(r),this.uint16Array=new Uint16Array(r),this.uint32Array=new Uint32Array(r)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}},z=new Jn;var We,Bt,Mt=[],Jr=new Ue(()=>new vu);function Fo(o,e,t,r,i,s){We=Jr.getPrimitive(),Bt=Jr.getPrimitive(),Mt.push(We,Bt),z.setBuffer(o._roots[e]);let n=es(0,o.geometry,t,r,i,s);z.clearBuffer(),Jr.releasePrimitive(We),Jr.releasePrimitive(Bt),Mt.pop(),Mt.pop();let l=Mt.length;return l>0&&(Bt=Mt[l-1],We=Mt[l-2]),n}function es(o,e,t,r,i=null,s=0,n=0){let{float32Array:l,uint16Array:a,uint32Array:f}=z,c=o*2;if(P(c,a)){let d=U(o,f),h=G(c,a);return W(o,l,We),r(d,h,!1,n,s+o/8,We)}else{let I=function(D){let{uint16Array:A,uint32Array:M}=z,B=D*2;for(;!P(B,A);)D=E(D),B=D*2;return U(D,M)},C=function(D){let{uint16Array:A,uint32Array:M}=z,B=D*2;for(;!P(B,A);)D=L(D,M),B=D*2;return U(D,M)+G(B,A)},d=E(o),h=L(o,f),p=d,y=h,v,T,m,x;if(i&&(m=We,x=Bt,W(p,l,m),W(y,l,x),v=i(m),T=i(x),T<v)){p=h,y=d;let D=v;v=T,T=D,m=x}m||(m=We,W(p,l,m));let g=P(p*2,a),b=t(m,g,v,n+1,s+p/8),S;if(b===2){let D=I(p),M=C(p)-D;S=r(D,M,!0,n+1,s+p/8,m)}else S=b&&es(p,e,t,r,i,s,n+1);if(S)return!0;x=Bt,W(y,l,x);let w=P(y*2,a),R=t(x,w,T,n+1,s+y/8),F;if(R===2){let D=I(y),M=C(y)-D;F=r(D,M,!0,n+1,s+y/8,x)}else F=R&&es(y,e,t,r,i,s,n+1);return!!F}}import{Box3 as xr,Matrix4 as yu}from"three";var gr=new z.constructor,ei=new z.constructor,qe=new Ue(()=>new xr),Pt=new xr,Nt=new xr,rs=new xr,is=new xr,ns=!1;function Co(o,e,t,r){if(ns)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");ns=!0;let i=o._roots,s=e._roots,n,l=0,a=0,f=new yu().copy(t).invert();for(let c=0,u=i.length;c<u;c++){gr.setBuffer(i[c]),a=0;let d=qe.getPrimitive();W(0,gr.float32Array,d),d.applyMatrix4(f);for(let h=0,p=s.length;h<p&&(ei.setBuffer(s[h]),n=pe(0,0,t,f,r,l,a,0,0,d),ei.clearBuffer(),a+=s[h].byteLength/32,!n);h++);if(qe.releasePrimitive(d),gr.clearBuffer(),l+=i[c].byteLength/32,n)break}return ns=!1,n}function pe(o,e,t,r,i,s=0,n=0,l=0,a=0,f=null,c=!1){let u,d;c?(u=ei,d=gr):(u=gr,d=ei);let h=u.float32Array,p=u.uint32Array,y=u.uint16Array,v=d.float32Array,T=d.uint32Array,m=d.uint16Array,x=o*2,g=e*2,b=P(x,y),S=P(g,m),w=!1;if(S&&b)c?w=i(U(e,T),G(e*2,m),U(o,p),G(o*2,y),a,n+e/8,l,s+o/8):w=i(U(o,p),G(o*2,y),U(e,T),G(e*2,m),l,s+o/8,a,n+e/8);else if(S){let R=qe.getPrimitive();W(e,v,R),R.applyMatrix4(t);let F=E(o),I=L(o,p);W(F,h,Pt),W(I,h,Nt);let C=R.intersectsBox(Pt),D=R.intersectsBox(Nt);w=C&&pe(e,F,r,t,i,n,s,a,l+1,R,!c)||D&&pe(e,I,r,t,i,n,s,a,l+1,R,!c),qe.releasePrimitive(R)}else{let R=E(e),F=L(e,T);W(R,v,rs),W(F,v,is);let I=f.intersectsBox(rs),C=f.intersectsBox(is);if(I&&C)w=pe(o,R,t,r,i,s,n,l,a+1,f,c)||pe(o,F,t,r,i,s,n,l,a+1,f,c);else if(I)if(b)w=pe(o,R,t,r,i,s,n,l,a+1,f,c);else{let D=qe.getPrimitive();D.copy(rs).applyMatrix4(t);let A=E(o),M=L(o,p);W(A,h,Pt),W(M,h,Nt);let B=D.intersectsBox(Pt),j=D.intersectsBox(Nt);w=B&&pe(R,A,r,t,i,n,s,a,l+1,D,!c)||j&&pe(R,M,r,t,i,n,s,a,l+1,D,!c),qe.releasePrimitive(D)}else if(C)if(b)w=pe(o,F,t,r,i,s,n,l,a+1,f,c);else{let D=qe.getPrimitive();D.copy(is).applyMatrix4(t);let A=E(o),M=L(o,p);W(A,h,Pt),W(M,h,Nt);let B=D.intersectsBox(Pt),j=D.intersectsBox(Nt);w=B&&pe(F,A,r,t,i,n,s,a,l+1,D,!c)||j&&pe(F,M,r,t,i,n,s,a,l+1,D,!c),qe.releasePrimitive(D)}}return w}var we=new class{constructor(){let o=null,e=null,t=null,r=!1;this.root=null,this.buffer=null,this.uint32Array=null,this.uint16Array=null,this.setBVH=(s,n)=>{if(r)throw new Error("BVHTraversalHelper: cannot call setBVH during an active traversal.");this.root=n,this.buffer=o=s._roots[n],this.uint16Array=t=new Uint16Array(o),this.uint32Array=e=new Uint32Array(o)},this.reset=()=>{this.root=null,this.buffer=o=null,this.uint16Array=t=null,this.uint32Array=e=null},this.getRangeStart=s=>{let n=s*2;for(;!P(n,t);)s=E(s),n=s*2;return U(s,e)},this.getRangeEnd=s=>{let n=s*2;for(;!P(n,t);)s=L(s,e),n=s*2;return U(s,e)+G(n,t)};let i=(s,n,l)=>{let a=n*2,f=P(a,t);if(!s(l,f,n)&&!f){let u=E(n),d=L(n,e);i(s,u,l+1),i(s,d,l+1)}};this.traverseBuffer=s=>{if(r)throw new Error("BVHTraversalHelper: cannot start a traversal during an active traversal.");r=!0;try{i(s,0,0)}finally{r=!1}},this.traverse=s=>{this.traverseBuffer((n,l,a)=>{if(l){let f=a*2,c=e[a+6],u=t[f+14];return s(n,l,new Float32Array(o,a*4,6),c,u)}else{let f=Ct(a,e);return s(n,l,new Float32Array(o,a*4,6),f)}})}}};var Ao=new bu,$t=new Float32Array(6),Et=class{constructor(){this._roots=null,this.primitiveBuffer=null,this.primitiveBufferStride=null}init(e){e={...jr,...e},"maxLeafSize"in e&&(console.warn('BVH: "maxLeafSize" option has been deprecated. Use "targetLeafSize", instead.'),e={...e,targetLeafSize:e.maxLeafSize}),Do(this,e)}getRootRanges(){throw new Error("BVH: getRootRanges() not implemented")}writePrimitiveBounds(){throw new Error("BVH: writePrimitiveBounds() not implemented")}writePrimitiveRangeBounds(e,t,r,i){let s=1/0,n=1/0,l=1/0,a=-1/0,f=-1/0,c=-1/0;for(let u=e,d=e+t;u<d;u++){this.writePrimitiveBounds(u,$t,0);let[h,p,y,v,T,m]=$t;h<s&&(s=h),v>a&&(a=v),p<n&&(n=p),T>f&&(f=T),y<l&&(l=y),m>c&&(c=m)}return r[i+0]=s,r[i+1]=n,r[i+2]=l,r[i+3]=a,r[i+4]=f,r[i+5]=c,r}computePrimitiveBounds(e,t,r){let i=r.offset||0;for(let s=e,n=e+t;s<n;s++){this.writePrimitiveBounds(s,$t,0);let[l,a,f,c,u,d]=$t,h=(l+c)/2,p=(a+u)/2,y=(f+d)/2,v=(c-l)/2,T=(u-a)/2,m=(d-f)/2,x=(s-i)*6;r[x+0]=h,r[x+1]=v+(Math.abs(h)+v)*Dt,r[x+2]=p,r[x+3]=T+(Math.abs(p)+T)*Dt,r[x+4]=y,r[x+5]=m+(Math.abs(y)+m)*Dt}return r}shiftPrimitiveOffsets(e){let t=this._indirectBuffer;if(t)for(let r=0,i=t.length;r<i;r++)t[r]+=e;else{let r=this._roots;for(let i=0;i<r.length;i++){let s=r[i],n=new Uint32Array(s),l=new Uint16Array(s),a=s.byteLength/32;for(let f=0;f<a;f++){let c=8*f,u=2*c;P(u,l)&&(n[c+6]+=e)}}}}traverse(e,t=0){we.setBVH(this,t),we.traverse(e),we.reset()}refit(){let e=this._roots;for(let t=0,r=e.length;t<r;t++){let i=e[t],s=new Uint32Array(i),n=new Uint16Array(i),l=new Float32Array(i),a=i.byteLength/32;for(let f=a-1;f>=0;f--){let c=f*8,u=c*2;if(P(u,n)){let h=U(c,s),p=G(u,n);this.writePrimitiveRangeBounds(h,p,$t,0),l.set($t,c)}else{let h=E(c),p=L(c,s);for(let y=0;y<3;y++){let v=l[h+y],T=l[h+y+3],m=l[p+y],x=l[p+y+3];l[c+y]=v<m?v:m,l[c+y+3]=T>x?T:x}}}}}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(r=>{W(0,new Float32Array(r),Ao),e.union(Ao)}),e}shapecast(e){let{boundsTraverseOrder:t,intersectsBounds:r,intersectsRange:i,intersectsPrimitive:s,scratchPrimitive:n,iterate:l}=e;if(i&&s){let u=i;i=(d,h,p,y,v)=>u(d,h,p,y,v)?!0:l(d,h,this,s,p,y,n)}else i||(s?i=(u,d,h,p)=>l(u,d,this,s,h,p,n):i=(u,d,h)=>h);let a=!1,f=0,c=this._roots;for(let u=0,d=c.length;u<d;u++){let h=c[u];if(a=Fo(this,u,r,i,t,f),a)break;f+=h.byteLength/32}return a}bvhcast(e,t,r){let{intersectsRanges:i}=r;return Co(this,e,t,i)}};import{Box3 as _u}from"three";function Mo(){return typeof SharedArrayBuffer<"u"}import{BufferAttribute as Tu}from"three";function ss(o){return o.index?o.index.count:o.attributes.position.count}function Ge(o){return ss(o)/3}function wu(o,e=ArrayBuffer){return o>65535?new Uint32Array(new e(4*o)):new Uint16Array(new e(2*o))}function Bo(o,e){if(!o.index){let t=o.attributes.position.count,r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,i=wu(t,r);o.setIndex(new Tu(i,1));for(let s=0;s<t;s++)i[s]=s}}function Su(o,e,t){let r=ss(o)/t,i=e||o.drawRange,s=i.start/t,n=(i.start+i.count)/t,l=Math.max(0,s),a=Math.min(r,n)-l;return{offset:Math.floor(l),count:Math.floor(a)}}function Iu(o,e){return o.groups.map(t=>({offset:t.start/e,count:t.count/e}))}function os(o,e,t){let r=Su(o,e,t),i=Iu(o,t);if(!i.length)return[r];let s=[],n=r.offset,l=r.offset+r.count,a=ss(o)/t,f=[];for(let d of i){let{offset:h,count:p}=d,y=h,v=isFinite(p)?p:a-h,T=h+v;y<l&&T>n&&(f.push({pos:Math.max(n,y),isStart:!0}),f.push({pos:Math.min(l,T),isStart:!1}))}f.sort((d,h)=>d.pos!==h.pos?d.pos-h.pos:d.type==="end"?-1:1);let c=0,u=null;for(let d of f){let h=d.pos;c!==0&&h!==u&&s.push({offset:u,count:h-u}),c+=d.isStart?1:-1,u=h}return s}function Ru(o,e){let t=o[o.length-1],r=t.offset+t.count>2**16,i=o.reduce((f,c)=>f+c.count,0),s=r?4:2,n=e?new SharedArrayBuffer(i*s):new ArrayBuffer(i*s),l=r?new Uint32Array(n):new Uint16Array(n),a=0;for(let f=0;f<o.length;f++){let{offset:c,count:u}=o[f];for(let d=0;d<u;d++)l[a+d]=c+d;a+=u}return l}var Ne=class extends Et{get indirect(){return!!this._indirectBuffer}get primitiveStride(){return null}get primitiveBufferStride(){return this.indirect?1:this.primitiveStride}set primitiveBufferStride(e){}get primitiveBuffer(){return this.indirect?this._indirectBuffer:this.geometry.index.array}set primitiveBuffer(e){}constructor(e,t={}){if(e.isBufferGeometry){if(e.index&&e.index.isInterleavedBufferAttribute)throw new Error("BVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("BVH: Only BufferGeometries are supported.");if(t.useSharedArrayBuffer&&!Mo())throw new Error("BVH: SharedArrayBuffer is not available.");super(),this.geometry=e,this.resolvePrimitiveIndex=t.indirect?r=>this._indirectBuffer[r]:r=>r,this.primitiveBuffer=null,this.primitiveBufferStride=null,this._indirectBuffer=null,t={...jr,...t},t[He]||this.init(t)}init(e){let{geometry:t,primitiveStride:r}=this;if(e.indirect){let i=os(t,e.range,r),s=Ru(i,e.useSharedArrayBuffer);this._indirectBuffer=s}else Bo(t,e);super.init(e),!t.boundingBox&&e.setBoundingBox&&(t.boundingBox=this.getBoundingBox(new _u))}getRootRanges(e){return this.indirect?[{offset:0,count:this._indirectBuffer.length}]:os(this.geometry,e,this.primitiveStride)}raycastObject3D(){throw new Error("BVH: raycastObject3D() not implemented")}};import{BufferAttribute as tf,FrontSide as ua,Ray as rf,Vector3 as pa,Matrix4 as nf}from"three";import{Vector3 as Qe,Matrix4 as Eo,Line3 as Lo}from"three";import{Vector3 as Du}from"three";var se=class{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let r=1/0,i=-1/0;for(let s=0,n=e.length;s<n;s++){let a=e[s][t];r=a<r?a:r,i=a>i?a:i}this.min=r,this.max=i}setFromPoints(e,t){let r=1/0,i=-1/0;for(let s=0,n=t.length;s<n;s++){let l=t[s],a=e.dot(l);r=a<r?a:r,i=a>i?a:i}this.min=r,this.max=i}isSeparated(e){return this.min>e.max||e.min>this.max}};se.prototype.setFromBox=(function(){let o=new Du;return function(t,r){let i=r.min,s=r.max,n=1/0,l=-1/0;for(let a=0;a<=1;a++)for(let f=0;f<=1;f++)for(let c=0;c<=1;c++){o.x=i.x*a+s.x*(1-a),o.y=i.y*f+s.y*(1-f),o.z=i.z*c+s.z*(1-c);let u=t.dot(o);n=Math.min(u,n),l=Math.max(u,l)}this.min=n,this.max=l}})();import{Triangle as Bu,Vector3 as me,Vector2 as No,Line3 as Lt,Plane as Pu}from"three";import{Vector3 as nt,Vector2 as Fu,Plane as Cu,Line3 as Au}from"three";var Mu=(function(){let o=new nt,e=new nt,t=new nt;return function(i,s,n){let l=i.start,a=o,f=s.start,c=e;t.subVectors(l,f),o.subVectors(i.end,i.start),e.subVectors(s.end,s.start);let u=t.dot(c),d=c.dot(a),h=c.dot(c),p=t.dot(a),v=a.dot(a)*h-d*d,T,m;v!==0?T=(u*d-p*h)/v:T=0,m=(u+T*d)/h,n.x=T,n.y=m}})(),vr=(function(){let o=new Fu,e=new nt,t=new nt;return function(i,s,n,l){Mu(i,s,o);let a=o.x,f=o.y;if(a>=0&&a<=1&&f>=0&&f<=1){i.at(a,n),s.at(f,l);return}else if(a>=0&&a<=1){f<0?s.at(0,l):s.at(1,l),i.closestPointToPoint(l,!0,n);return}else if(f>=0&&f<=1){a<0?i.at(0,n):i.at(1,n),s.closestPointToPoint(n,!0,l);return}else{let c;a<0?c=i.start:c=i.end;let u;f<0?u=s.start:u=s.end;let d=e,h=t;if(i.closestPointToPoint(u,!0,e),s.closestPointToPoint(c,!0,t),d.distanceToSquared(u)<=h.distanceToSquared(c)){n.copy(d),l.copy(u);return}else{n.copy(c),l.copy(h);return}}}})(),Po=(function(){let o=new nt,e=new nt,t=new Cu,r=new Au;return function(s,n){let{radius:l,center:a}=s,{a:f,b:c,c:u}=n;if(r.start=f,r.end=c,r.closestPointToPoint(a,!0,o).distanceTo(a)<=l||(r.start=f,r.end=u,r.closestPointToPoint(a,!0,o).distanceTo(a)<=l)||(r.start=c,r.end=u,r.closestPointToPoint(a,!0,o).distanceTo(a)<=l))return!0;let y=n.getPlane(t);if(Math.abs(y.distanceToPoint(a))<=l){let T=y.projectPoint(a,e);if(n.containsPoint(T))return!0}return!1}})();var Nu=["x","y","z"],$e=1e-15,$o=$e*$e;function ce(o){return Math.abs(o)<$e}var Y=class extends Bu{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new me),this.satBounds=new Array(4).fill().map(()=>new se),this.points=[this.a,this.b,this.c],this.plane=new Pu,this.isDegenerateIntoSegment=!1,this.isDegenerateIntoPoint=!1,this.degenerateSegment=new Lt,this.needsUpdate=!0}intersectsSphere(e){return Po(e,this)}update(){let e=this.a,t=this.b,r=this.c,i=this.points,s=this.satAxes,n=this.satBounds,l=s[0],a=n[0];this.getNormal(l),a.setFromPoints(l,i);let f=s[1],c=n[1];f.subVectors(e,t),c.setFromPoints(f,i);let u=s[2],d=n[2];u.subVectors(t,r),d.setFromPoints(u,i);let h=s[3],p=n[3];h.subVectors(r,e),p.setFromPoints(h,i);let y=f.length(),v=u.length(),T=h.length();this.isDegenerateIntoPoint=!1,this.isDegenerateIntoSegment=!1,y<$e?v<$e||T<$e?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(e),this.degenerateSegment.end.copy(r)):v<$e?T<$e?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(t),this.degenerateSegment.end.copy(e)):T<$e&&(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(r),this.degenerateSegment.end.copy(t)),this.plane.setFromNormalAndCoplanarPoint(l,e),this.needsUpdate=!1}};Y.prototype.closestPointToSegment=(function(){let o=new me,e=new me,t=new Lt;return function(i,s=null,n=null){let{start:l,end:a}=i,f=this.points,c,u=1/0;for(let d=0;d<3;d++){let h=(d+1)%3;t.start.copy(f[d]),t.end.copy(f[h]),vr(t,i,o,e),c=o.distanceToSquared(e),c<u&&(u=c,s&&s.copy(o),n&&n.copy(e))}return this.closestPointToPoint(l,o),c=l.distanceToSquared(o),c<u&&(u=c,s&&s.copy(o),n&&n.copy(l)),this.closestPointToPoint(a,o),c=a.distanceToSquared(o),c<u&&(u=c,s&&s.copy(o),n&&n.copy(a)),Math.sqrt(u)}})();Y.prototype.intersectsTriangle=(function(){let o=new Y,e=new se,t=new se,r=new me,i=new me,s=new me,n=new me,l=new Lt,a=new Lt,f=new me,c=new No,u=new No;function d(x,g,b,S){let w=r;!x.isDegenerateIntoPoint&&!x.isDegenerateIntoSegment?w.copy(x.plane.normal):w.copy(g.plane.normal);let R=x.satBounds,F=x.satAxes;for(let D=1;D<4;D++){let A=R[D],M=F[D];if(e.setFromPoints(M,g.points),A.isSeparated(e)||(n.copy(w).cross(M),e.setFromPoints(n,x.points),t.setFromPoints(n,g.points),e.isSeparated(t)))return!1}let I=g.satBounds,C=g.satAxes;for(let D=1;D<4;D++){let A=I[D],M=C[D];if(e.setFromPoints(M,x.points),A.isSeparated(e)||(n.crossVectors(w,M),e.setFromPoints(n,x.points),t.setFromPoints(n,g.points),e.isSeparated(t)))return!1}return b&&(S||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),b.start.set(0,0,0),b.end.set(0,0,0)),!0}function h(x,g,b,S,w,R,F,I,C,D,A){let M=F/(F-I);D.x=S+(w-S)*M,A.start.subVectors(g,x).multiplyScalar(M).add(x),M=F/(F-C),D.y=S+(R-S)*M,A.end.subVectors(b,x).multiplyScalar(M).add(x)}function p(x,g,b,S,w,R,F,I,C,D,A){if(w>0)h(x.c,x.a,x.b,S,g,b,C,F,I,D,A);else if(R>0)h(x.b,x.a,x.c,b,g,S,I,F,C,D,A);else if(I*C>0||F!=0)h(x.a,x.b,x.c,g,b,S,F,I,C,D,A);else if(I!=0)h(x.b,x.a,x.c,b,g,S,I,F,C,D,A);else if(C!=0)h(x.c,x.a,x.b,S,g,b,C,F,I,D,A);else return!0;return!1}function y(x,g,b,S){let w=g.degenerateSegment,R=x.plane.distanceToPoint(w.start),F=x.plane.distanceToPoint(w.end);return ce(R)?ce(F)?d(x,g,b,S):(b&&(b.start.copy(w.start),b.end.copy(w.start)),x.containsPoint(w.start)):ce(F)?(b&&(b.start.copy(w.end),b.end.copy(w.end)),x.containsPoint(w.end)):x.plane.intersectLine(w,r)!=null?(b&&(b.start.copy(r),b.end.copy(r)),x.containsPoint(r)):!1}function v(x,g,b){let S=g.a;return ce(x.plane.distanceToPoint(S))&&x.containsPoint(S)?(b&&(b.start.copy(S),b.end.copy(S)),!0):!1}function T(x,g,b){let S=x.degenerateSegment,w=g.a;return S.closestPointToPoint(w,!0,r),w.distanceToSquared(r)<$o?(b&&(b.start.copy(w),b.end.copy(w)),!0):!1}function m(x,g,b,S){if(x.isDegenerateIntoSegment)if(g.isDegenerateIntoSegment){let w=x.degenerateSegment,R=g.degenerateSegment,F=i,I=s;w.delta(F),R.delta(I);let C=r.subVectors(R.start,w.start),D=F.x*I.y-F.y*I.x;if(ce(D))return!1;let A=(C.x*I.y-C.y*I.x)/D,M=-(F.x*C.y-F.y*C.x)/D;if(A<0||A>1||M<0||M>1)return!1;let B=w.start.z+F.z*A,j=R.start.z+I.z*M;return ce(B-j)?(b&&(b.start.copy(w.start).addScaledVector(F,A),b.end.copy(w.start).addScaledVector(F,A)),!0):!1}else return g.isDegenerateIntoPoint?T(x,g,b):y(g,x,b,S);else{if(x.isDegenerateIntoPoint)return g.isDegenerateIntoPoint?g.a.distanceToSquared(x.a)<$o?(b&&(b.start.copy(x.a),b.end.copy(x.a)),!0):!1:g.isDegenerateIntoSegment?T(g,x,b):v(g,x,b);if(g.isDegenerateIntoPoint)return v(x,g,b);if(g.isDegenerateIntoSegment)return y(x,g,b,S)}}return function(g,b=null,S=!1){this.needsUpdate&&this.update(),g.isExtendedTriangle?g.needsUpdate&&g.update():(o.copy(g),o.update(),g=o);let w=m(this,g,b,S);if(w!==void 0)return w;let R=this.plane,F=g.plane,I=F.distanceToPoint(this.a),C=F.distanceToPoint(this.b),D=F.distanceToPoint(this.c);ce(I)&&(I=0),ce(C)&&(C=0),ce(D)&&(D=0);let A=I*C,M=I*D;if(A>0&&M>0)return!1;let B=R.distanceToPoint(g.a),j=R.distanceToPoint(g.b),N=R.distanceToPoint(g.c);ce(B)&&(B=0),ce(j)&&(j=0),ce(N)&&(N=0);let Tt=B*j,wt=B*N;if(Tt>0&&wt>0)return!1;i.copy(R.normal),s.copy(F.normal);let St=i.cross(s),fr=0,dr=Math.abs(St.x),hr=Math.abs(St.y);hr>dr&&(dr=hr,fr=1),Math.abs(St.z)>dr&&(fr=2);let re=Nu[fr],tt=this.a[re],_t=this.b[re],Qr=this.c[re],rt=g.a[re],Rt=g.b[re],cu=g.c[re];if(p(this,tt,_t,Qr,A,M,I,C,D,c,l))return d(this,g,b,S);if(p(g,rt,Rt,cu,Tt,wt,B,j,N,u,a))return d(this,g,b,S);if(c.y<c.x){let jn=c.y;c.y=c.x,c.x=jn,f.copy(l.start),l.start.copy(l.end),l.end.copy(f)}if(u.y<u.x){let jn=u.y;u.y=u.x,u.x=jn,f.copy(a.start),a.start.copy(a.end),a.end.copy(f)}return c.y<u.x||u.y<c.x?!1:(b&&(u.x>c.x?b.start.copy(a.start):b.start.copy(l.start),u.y<c.y?b.end.copy(a.end):b.end.copy(l.end)),!0)}})();Y.prototype.distanceToPoint=(function(){let o=new me;return function(t){return this.closestPointToPoint(t,o),t.distanceTo(o)}})();Y.prototype.distanceToTriangle=(function(){let o=new me,e=new me,t=["a","b","c"],r=new Lt,i=new Lt;return function(n,l=null,a=null){let f=l||a?r:null;if(this.intersectsTriangle(n,f,!0))return(l||a)&&(l&&f.getCenter(l),a&&f.getCenter(a)),0;let c=1/0;for(let u=0;u<3;u++){let d,h=t[u],p=n[h];this.closestPointToPoint(p,o),d=p.distanceToSquared(o),d<c&&(c=d,l&&l.copy(o),a&&a.copy(p));let y=this[h];n.closestPointToPoint(y,o),d=y.distanceToSquared(o),d<c&&(c=d,l&&l.copy(y),a&&a.copy(o))}for(let u=0;u<3;u++){let d=t[u],h=t[(u+1)%3];r.set(this[d],this[h]);for(let p=0;p<3;p++){let y=t[p],v=t[(p+1)%3];i.set(n[y],n[v]),vr(r,i,o,e);let T=o.distanceToSquared(e);T<c&&(c=T,l&&l.copy(o),a&&a.copy(e))}}return Math.sqrt(c)}})();var K=class{constructor(e,t,r){this.isOrientedBox=!0,this.min=new Qe,this.max=new Qe,this.matrix=new Eo,this.invMatrix=new Eo,this.points=new Array(8).fill().map(()=>new Qe),this.satAxes=new Array(3).fill().map(()=>new Qe),this.satBounds=new Array(3).fill().map(()=>new se),this.alignedSatBounds=new Array(3).fill().map(()=>new se),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),r&&this.matrix.copy(r)}set(e,t,r){this.min.copy(e),this.max.copy(t),this.matrix.copy(r),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}};K.prototype.update=(function(){return function(){let e=this.matrix,t=this.min,r=this.max,i=this.points;for(let f=0;f<=1;f++)for(let c=0;c<=1;c++)for(let u=0;u<=1;u++){let d=1*f|2*c|4*u,h=i[d];h.x=f?r.x:t.x,h.y=c?r.y:t.y,h.z=u?r.z:t.z,h.applyMatrix4(e)}let s=this.satBounds,n=this.satAxes,l=i[0];for(let f=0;f<3;f++){let c=n[f],u=s[f],d=1<<f,h=i[d];c.subVectors(l,h),u.setFromPoints(c,i)}let a=this.alignedSatBounds;a[0].setFromPointsField(i,"x"),a[1].setFromPointsField(i,"y"),a[2].setFromPointsField(i,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}})();K.prototype.intersectsBox=(function(){let o=new se;return function(t){this.needsUpdate&&this.update();let r=t.min,i=t.max,s=this.satBounds,n=this.satAxes,l=this.alignedSatBounds;if(o.min=r.x,o.max=i.x,l[0].isSeparated(o)||(o.min=r.y,o.max=i.y,l[1].isSeparated(o))||(o.min=r.z,o.max=i.z,l[2].isSeparated(o)))return!1;for(let a=0;a<3;a++){let f=n[a],c=s[a];if(o.setFromBox(f,t),c.isSeparated(o))return!1}return!0}})();K.prototype.intersectsTriangle=(function(){let o=new Y,e=new Array(3),t=new se,r=new se,i=new Qe;return function(n){this.needsUpdate&&this.update(),n.isExtendedTriangle?n.needsUpdate&&n.update():(o.copy(n),o.update(),n=o);let l=this.satBounds,a=this.satAxes;e[0]=n.a,e[1]=n.b,e[2]=n.c;for(let d=0;d<3;d++){let h=l[d],p=a[d];if(t.setFromPoints(p,e),h.isSeparated(t))return!1}let f=n.satBounds,c=n.satAxes,u=this.points;for(let d=0;d<3;d++){let h=f[d],p=c[d];if(t.setFromPoints(p,u),h.isSeparated(t))return!1}for(let d=0;d<3;d++){let h=a[d];for(let p=0;p<4;p++){let y=c[p];if(i.crossVectors(h,y),t.setFromPoints(i,e),r.setFromPoints(i,u),t.isSeparated(r))return!1}}return!0}})();K.prototype.closestPointToPoint=(function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}})();K.prototype.distanceToPoint=(function(){let o=new Qe;return function(t){return this.closestPointToPoint(t,o),t.distanceTo(o)}})();K.prototype.distanceToBox=(function(){let o=["x","y","z"],e=new Array(12).fill().map(()=>new Lo),t=new Array(12).fill().map(()=>new Lo),r=new Qe,i=new Qe;return function(n,l=0,a=null,f=null){if(this.needsUpdate&&this.update(),this.intersectsBox(n))return(a||f)&&(n.getCenter(i),this.closestPointToPoint(i,r),n.closestPointToPoint(r,i),a&&a.copy(r),f&&f.copy(i)),0;let c=l*l,u=n.min,d=n.max,h=this.points,p=1/0;for(let v=0;v<8;v++){let T=h[v];i.copy(T).clamp(u,d);let m=T.distanceToSquared(i);if(m<p&&(p=m,a&&a.copy(T),f&&f.copy(i),m<c))return Math.sqrt(m)}let y=0;for(let v=0;v<3;v++)for(let T=0;T<=1;T++)for(let m=0;m<=1;m++){let x=(v+1)%3,g=(v+2)%3,b=T<<x|m<<g,S=1<<v|T<<x|m<<g,w=h[b],R=h[S];e[y].set(w,R);let I=o[v],C=o[x],D=o[g],A=t[y],M=A.start,B=A.end;M[I]=u[I],M[C]=T?u[C]:d[C],M[D]=m?u[D]:d[C],B[I]=d[I],B[C]=T?u[C]:d[C],B[D]=m?u[D]:d[C],y++}for(let v=0;v<=1;v++)for(let T=0;T<=1;T++)for(let m=0;m<=1;m++){i.x=v?d.x:u.x,i.y=T?d.y:u.y,i.z=m?d.z:u.z,this.closestPointToPoint(i,r);let x=i.distanceToSquared(r);if(x<p&&(p=x,a&&a.copy(r),f&&f.copy(i),x<c))return Math.sqrt(x)}for(let v=0;v<12;v++){let T=e[v];for(let m=0;m<12;m++){let x=t[m];vr(T,x,r,i);let g=r.distanceToSquared(i);if(g<p&&(p=g,a&&a.copy(r),f&&f.copy(i),g<c))return Math.sqrt(g)}}return Math.sqrt(p)}})();var as=class extends Ue{constructor(){super(()=>new Y)}},te=new as;import{Vector3 as zo}from"three";var yr=new zo,ls=new zo;function Oo(o,e,t={},r=0,i=1/0){let s=r*r,n=i*i,l=1/0,a=null;if(o.shapecast({boundsTraverseOrder:c=>(yr.copy(e).clamp(c.min,c.max),yr.distanceToSquared(e)),intersectsBounds:(c,u,d)=>d<l&&d<n,intersectsTriangle:(c,u)=>{c.closestPointToPoint(e,yr);let d=e.distanceToSquared(yr);return d<l&&(ls.copy(yr),l=d,a=u),d<s}}),l===1/0)return null;let f=Math.sqrt(l);return t.point?t.point.copy(ls):t.point=ls.clone(),t.distance=f,t.faceIndex=a,t}import{Vector3 as Se,Vector2 as wr,Triangle as br,DoubleSide as $u,BackSide as Eu,REVISION as qo}from"three";var ti=parseInt(qo)>=169,Lu=parseInt(qo)<=161,st=new Se,ot=new Se,at=new Se,ri=new wr,ii=new wr,ni=new wr,Vo=new Se,Ho=new Se,ko=new Se,Tr=new Se;function zu(o,e,t,r,i,s,n,l){let a;if(s===Eu?a=o.intersectTriangle(r,t,e,!0,i):a=o.intersectTriangle(e,t,r,s!==$u,i),a===null)return null;let f=o.origin.distanceTo(i);return f<n||f>l?null:{distance:f,point:i.clone()}}function Uo(o,e,t,r,i,s,n,l,a,f,c){st.fromBufferAttribute(e,s),ot.fromBufferAttribute(e,n),at.fromBufferAttribute(e,l);let u=zu(o,st,ot,at,Tr,a,f,c);if(u){if(r){ri.fromBufferAttribute(r,s),ii.fromBufferAttribute(r,n),ni.fromBufferAttribute(r,l),u.uv=new wr;let h=br.getInterpolation(Tr,st,ot,at,ri,ii,ni,u.uv);ti||(u.uv=h)}if(i){ri.fromBufferAttribute(i,s),ii.fromBufferAttribute(i,n),ni.fromBufferAttribute(i,l),u.uv1=new wr;let h=br.getInterpolation(Tr,st,ot,at,ri,ii,ni,u.uv1);ti||(u.uv1=h),Lu&&(u.uv2=u.uv1)}if(t){Vo.fromBufferAttribute(t,s),Ho.fromBufferAttribute(t,n),ko.fromBufferAttribute(t,l),u.normal=new Se;let h=br.getInterpolation(Tr,st,ot,at,Vo,Ho,ko,u.normal);u.normal.dot(o.direction)>0&&u.normal.multiplyScalar(-1),ti||(u.normal=h)}let d={a:s,b:n,c:l,normal:new Se,materialIndex:0};if(br.getNormal(st,ot,at,d.normal),u.face=d,u.faceIndex=s,ti){let h=new Se;br.getBarycoord(Tr,st,ot,at,h),u.barycoord=h}}return u}function Wo(o){return o&&o.isMaterial?o.side:o}function zt(o,e,t,r,i,s,n){let l=r*3,a=l+0,f=l+1,c=l+2,{index:u,groups:d}=o;o.index&&(a=u.getX(a),f=u.getX(f),c=u.getX(c));let{position:h,normal:p,uv:y,uv1:v}=o.attributes;if(Array.isArray(e)){let T=r*3;for(let m=0,x=d.length;m<x;m++){let{start:g,count:b,materialIndex:S}=d[m];if(T>=g&&T<g+b){let w=Wo(e[S]),R=Uo(t,h,p,y,v,a,f,c,w,s,n);if(R)if(R.faceIndex=r,R.face.materialIndex=S,i)i.push(R);else return R}}}else{let T=Wo(e),m=Uo(t,h,p,y,v,a,f,c,T,s,n);if(m)if(m.faceIndex=r,m.face.materialIndex=0,i)i.push(m);else return m}return null}import{Vector2 as Cg,Vector3 as Ag,Triangle as Mg}from"three";function Q(o,e,t,r){let i=o.a,s=o.b,n=o.c,l=e,a=e+1,f=e+2;t&&(l=t.getX(l),a=t.getX(a),f=t.getX(f)),i.x=r.getX(l),i.y=r.getY(l),i.z=r.getZ(l),s.x=r.getX(a),s.y=r.getY(a),s.z=r.getZ(a),n.x=r.getX(f),n.y=r.getY(f),n.z=r.getZ(f)}function Go(o,e,t,r,i,s,n,l){let{geometry:a,_indirectBuffer:f}=o;for(let c=r,u=r+i;c<u;c++)zt(a,e,t,c,s,n,l)}function Qo(o,e,t,r,i,s,n){let{geometry:l,_indirectBuffer:a}=o,f=1/0,c=null;for(let u=r,d=r+i;u<d;u++){let h;h=zt(l,e,t,u,null,s,n),h&&h.distance<f&&(c=h,f=h.distance)}return c}function jo(o,e,t,r,i,s,n){let{geometry:l}=t,{index:a}=l,f=l.attributes.position;for(let c=o,u=e+o;c<u;c++){let d;if(d=c,Q(n,d*3,a,f),n.needsUpdate=!0,r(n,d,i,s))return!0}return!1}function Ko(o,e=null){e&&Array.isArray(e)&&(e=new Set(e));let t=o.geometry,r=t.index?t.index.array:null,i=t.attributes.position,s,n,l,a,f=0,c=o._roots;for(let d=0,h=c.length;d<h;d++)s=c[d],n=new Uint32Array(s),l=new Uint16Array(s),a=new Float32Array(s),u(0,f),f+=s.byteLength;function u(d,h,p=!1){let y=d*2;if(P(y,l)){let v=U(d,n),T=G(y,l),m=1/0,x=1/0,g=1/0,b=-1/0,S=-1/0,w=-1/0;for(let R=3*v,F=3*(v+T);R<F;R++){let I=r[R],C=i.getX(I),D=i.getY(I),A=i.getZ(I);C<m&&(m=C),C>b&&(b=C),D<x&&(x=D),D>S&&(S=D),A<g&&(g=A),A>w&&(w=A)}return a[d+0]!==m||a[d+1]!==x||a[d+2]!==g||a[d+3]!==b||a[d+4]!==S||a[d+5]!==w?(a[d+0]=m,a[d+1]=x,a[d+2]=g,a[d+3]=b,a[d+4]=S,a[d+5]=w,!0):!1}else{let v=E(d),T=L(d,n),m=p,x=!1,g=!1;if(e){if(!m){let I=v/8+h/32,C=T/8+h/32;x=e.has(I),g=e.has(C),m=!x&&!g}}else x=!0,g=!0;let b=m||x,S=m||g,w=!1;b&&(w=u(v,h,m));let R=!1;S&&(R=u(T,h,m));let F=w||R;if(F)for(let I=0;I<3;I++){let C=v+I,D=T+I,A=a[C],M=a[C+3],B=a[D],j=a[D+3];a[d+I]=A<B?A:B,a[d+I+3]=M>j?M:j}return F}}}function ue(o,e,t,r,i){let s,n,l,a,f,c,u=1/t.direction.x,d=1/t.direction.y,h=1/t.direction.z,p=t.origin.x,y=t.origin.y,v=t.origin.z,T=e[o],m=e[o+3],x=e[o+1],g=e[o+3+1],b=e[o+2],S=e[o+3+2];return u>=0?(s=(T-p)*u,n=(m-p)*u):(s=(m-p)*u,n=(T-p)*u),d>=0?(l=(x-y)*d,a=(g-y)*d):(l=(g-y)*d,a=(x-y)*d),s>a||l>n||((l>s||isNaN(s))&&(s=l),(a<n||isNaN(n))&&(n=a),h>=0?(f=(b-v)*h,c=(S-v)*h):(f=(S-v)*h,c=(b-v)*h),s>c||f>n)?!1:((f>s||s!==s)&&(s=f),(c<n||n!==n)&&(n=c),s<=i&&n>=r)}function Xo(o,e,t,r,i,s,n,l){let{geometry:a,_indirectBuffer:f}=o;for(let c=r,u=r+i;c<u;c++){let d=f?f[c]:c;zt(a,e,t,d,s,n,l)}}function Yo(o,e,t,r,i,s,n){let{geometry:l,_indirectBuffer:a}=o,f=1/0,c=null;for(let u=r,d=r+i;u<d;u++){let h;h=zt(l,e,t,a?a[u]:u,null,s,n),h&&h.distance<f&&(c=h,f=h.distance)}return c}function Zo(o,e,t,r,i,s,n){let{geometry:l}=t,{index:a}=l,f=l.attributes.position;for(let c=o,u=e+o;c<u;c++){let d;if(d=t.resolveTriangleIndex(c),Q(n,d*3,a,f),n.needsUpdate=!0,r(n,d,i,s))return!0}return!1}function Jo(o,e,t,r,i,s,n){z.setBuffer(o._roots[e]),cs(0,o,t,r,i,s,n),z.clearBuffer()}function cs(o,e,t,r,i,s,n){let{float32Array:l,uint16Array:a,uint32Array:f}=z,c=o*2;if(P(c,a)){let d=U(o,f),h=G(c,a);Go(e,t,r,d,h,i,s,n)}else{let d=E(o);ue(d,l,r,s,n)&&cs(d,e,t,r,i,s,n);let h=L(o,f);ue(h,l,r,s,n)&&cs(h,e,t,r,i,s,n)}}var Ou=["x","y","z"];function ea(o,e,t,r,i,s){z.setBuffer(o._roots[e]);let n=us(0,o,t,r,i,s);return z.clearBuffer(),n}function us(o,e,t,r,i,s){let{float32Array:n,uint16Array:l,uint32Array:a}=z,f=o*2;if(P(f,l)){let u=U(o,a),d=G(f,l);return Qo(e,t,r,u,d,i,s)}else{let u=Ct(o,a),d=Ou[u],p=r.direction[d]>=0,y,v;p?(y=E(o),v=L(o,a)):(y=L(o,a),v=E(o));let m=ue(y,n,r,i,s)?us(y,e,t,r,i,s):null;if(m){let b=m.point[d];if(p?b<=n[v+u]:b>=n[v+u+3])return m}let g=ue(v,n,r,i,s)?us(v,e,t,r,i,s):null;return m&&g?m.distance<=g.distance?m:g:m||g||null}}import{Box3 as Vu,Matrix4 as Hu}from"three";var si=new Vu,Ot=new Y,Vt=new Y,Sr=new Hu,ta=new K,oi=new K;function ra(o,e,t,r){z.setBuffer(o._roots[e]);let i=fs(0,o,t,r);return z.clearBuffer(),i}function fs(o,e,t,r,i=null){let{float32Array:s,uint16Array:n,uint32Array:l}=z,a=o*2;if(i===null&&(t.boundingBox||t.computeBoundingBox(),ta.set(t.boundingBox.min,t.boundingBox.max,r),i=ta),P(a,n)){let c=e.geometry,u=c.index,d=c.attributes.position,h=t.index,p=t.attributes.position,y=U(o,l),v=G(a,n);if(Sr.copy(r).invert(),t.boundsTree)return W(o,s,oi),oi.matrix.copy(Sr),oi.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:m=>oi.intersectsBox(m),intersectsTriangle:m=>{m.a.applyMatrix4(r),m.b.applyMatrix4(r),m.c.applyMatrix4(r),m.needsUpdate=!0;for(let x=y*3,g=(v+y)*3;x<g;x+=3)if(Q(Vt,x,u,d),Vt.needsUpdate=!0,m.intersectsTriangle(Vt))return!0;return!1}});{let T=Ge(t);for(let m=y*3,x=(v+y)*3;m<x;m+=3){Q(Ot,m,u,d),Ot.a.applyMatrix4(Sr),Ot.b.applyMatrix4(Sr),Ot.c.applyMatrix4(Sr),Ot.needsUpdate=!0;for(let g=0,b=T*3;g<b;g+=3)if(Q(Vt,g,h,p),Vt.needsUpdate=!0,Ot.intersectsTriangle(Vt))return!0}}}else{let c=E(o),u=L(o,l);return W(c,s,si),!!(i.intersectsBox(si)&&fs(c,e,t,r,i)||(W(u,s,si),i.intersectsBox(si)&&fs(u,e,t,r,i)))}}import{Matrix4 as ku,Vector3 as li}from"three";var ai=new ku,ds=new K,Ir=new K,Uu=new li,Wu=new li,qu=new li,Gu=new li;function ia(o,e,t,r={},i={},s=0,n=1/0){e.boundingBox||e.computeBoundingBox(),ds.set(e.boundingBox.min,e.boundingBox.max,t),ds.needsUpdate=!0;let l=o.geometry,a=l.attributes.position,f=l.index,c=e.attributes.position,u=e.index,d=te.getPrimitive(),h=te.getPrimitive(),p=Uu,y=Wu,v=null,T=null;i&&(v=qu,T=Gu);let m=1/0,x=null,g=null;return ai.copy(t).invert(),Ir.matrix.copy(ai),o.shapecast({boundsTraverseOrder:b=>ds.distanceToBox(b),intersectsBounds:(b,S,w)=>w<m&&w<n?(S&&(Ir.min.copy(b.min),Ir.max.copy(b.max),Ir.needsUpdate=!0),!0):!1,intersectsRange:(b,S)=>{if(e.boundsTree)return e.boundsTree.shapecast({boundsTraverseOrder:R=>Ir.distanceToBox(R),intersectsBounds:(R,F,I)=>I<m&&I<n,intersectsRange:(R,F)=>{for(let I=R,C=R+F;I<C;I++){Q(h,3*I,u,c),h.a.applyMatrix4(t),h.b.applyMatrix4(t),h.c.applyMatrix4(t),h.needsUpdate=!0;for(let D=b,A=b+S;D<A;D++){Q(d,3*D,f,a),d.needsUpdate=!0;let M=d.distanceToTriangle(h,p,v);if(M<m&&(y.copy(p),T&&T.copy(v),m=M,x=D,g=I),M<s)return!0}}}});{let w=Ge(e);for(let R=0,F=w;R<F;R++){Q(h,3*R,u,c),h.a.applyMatrix4(t),h.b.applyMatrix4(t),h.c.applyMatrix4(t),h.needsUpdate=!0;for(let I=b,C=b+S;I<C;I++){Q(d,3*I,f,a),d.needsUpdate=!0;let D=d.distanceToTriangle(h,p,v);if(D<m&&(y.copy(p),T&&T.copy(v),m=D,x=I,g=R),D<s)return!0}}}}}),te.releasePrimitive(d),te.releasePrimitive(h),m===1/0?null:(r.point?r.point.copy(y):r.point=y.clone(),r.distance=m,r.faceIndex=x,i&&(i.point?i.point.copy(T):i.point=T.clone(),i.point.applyMatrix4(ai),y.applyMatrix4(ai),i.distance=y.sub(i.point).length(),i.faceIndex=g),r)}function na(o,e=null){e&&Array.isArray(e)&&(e=new Set(e));let t=o.geometry,r=t.index?t.index.array:null,i=t.attributes.position,s,n,l,a,f=0,c=o._roots;for(let d=0,h=c.length;d<h;d++)s=c[d],n=new Uint32Array(s),l=new Uint16Array(s),a=new Float32Array(s),u(0,f),f+=s.byteLength;function u(d,h,p=!1){let y=d*2;if(P(y,l)){let v=U(d,n),T=G(y,l),m=1/0,x=1/0,g=1/0,b=-1/0,S=-1/0,w=-1/0;for(let R=v,F=v+T;R<F;R++){let I=3*o.resolveTriangleIndex(R);for(let C=0;C<3;C++){let D=I+C;D=r?r[D]:D;let A=i.getX(D),M=i.getY(D),B=i.getZ(D);A<m&&(m=A),A>b&&(b=A),M<x&&(x=M),M>S&&(S=M),B<g&&(g=B),B>w&&(w=B)}}return a[d+0]!==m||a[d+1]!==x||a[d+2]!==g||a[d+3]!==b||a[d+4]!==S||a[d+5]!==w?(a[d+0]=m,a[d+1]=x,a[d+2]=g,a[d+3]=b,a[d+4]=S,a[d+5]=w,!0):!1}else{let v=E(d),T=L(d,n),m=p,x=!1,g=!1;if(e){if(!m){let I=v/8+h/32,C=T/8+h/32;x=e.has(I),g=e.has(C),m=!x&&!g}}else x=!0,g=!0;let b=m||x,S=m||g,w=!1;b&&(w=u(v,h,m));let R=!1;S&&(R=u(T,h,m));let F=w||R;if(F)for(let I=0;I<3;I++){let C=v+I,D=T+I,A=a[C],M=a[C+3],B=a[D],j=a[D+3];a[d+I]=A<B?A:B,a[d+I+3]=M>j?M:j}return F}}}function sa(o,e,t,r,i,s,n){z.setBuffer(o._roots[e]),hs(0,o,t,r,i,s,n),z.clearBuffer()}function hs(o,e,t,r,i,s,n){let{float32Array:l,uint16Array:a,uint32Array:f}=z,c=o*2;if(P(c,a)){let d=U(o,f),h=G(c,a);Xo(e,t,r,d,h,i,s,n)}else{let d=E(o);ue(d,l,r,s,n)&&hs(d,e,t,r,i,s,n);let h=L(o,f);ue(h,l,r,s,n)&&hs(h,e,t,r,i,s,n)}}var Qu=["x","y","z"];function oa(o,e,t,r,i,s){z.setBuffer(o._roots[e]);let n=ps(0,o,t,r,i,s);return z.clearBuffer(),n}function ps(o,e,t,r,i,s){let{float32Array:n,uint16Array:l,uint32Array:a}=z,f=o*2;if(P(f,l)){let u=U(o,a),d=G(f,l);return Yo(e,t,r,u,d,i,s)}else{let u=Ct(o,a),d=Qu[u],p=r.direction[d]>=0,y,v;p?(y=E(o),v=L(o,a)):(y=L(o,a),v=E(o));let m=ue(y,n,r,i,s)?ps(y,e,t,r,i,s):null;if(m){let b=m.point[d];if(p?b<=n[v+u]:b>=n[v+u+3])return m}let g=ue(v,n,r,i,s)?ps(v,e,t,r,i,s):null;return m&&g?m.distance<=g.distance?m:g:m||g||null}}import{Box3 as ju,Matrix4 as Ku}from"three";var ci=new ju,Ht=new Y,kt=new Y,_r=new Ku,aa=new K,ui=new K;function la(o,e,t,r){z.setBuffer(o._roots[e]);let i=ms(0,o,t,r);return z.clearBuffer(),i}function ms(o,e,t,r,i=null){let{float32Array:s,uint16Array:n,uint32Array:l}=z,a=o*2;if(i===null&&(t.boundingBox||t.computeBoundingBox(),aa.set(t.boundingBox.min,t.boundingBox.max,r),i=aa),P(a,n)){let c=e.geometry,u=c.index,d=c.attributes.position,h=t.index,p=t.attributes.position,y=U(o,l),v=G(a,n);if(_r.copy(r).invert(),t.boundsTree)return W(o,s,ui),ui.matrix.copy(_r),ui.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:m=>ui.intersectsBox(m),intersectsTriangle:m=>{m.a.applyMatrix4(r),m.b.applyMatrix4(r),m.c.applyMatrix4(r),m.needsUpdate=!0;for(let x=y,g=v+y;x<g;x++)if(Q(kt,3*e.resolveTriangleIndex(x),u,d),kt.needsUpdate=!0,m.intersectsTriangle(kt))return!0;return!1}});{let T=Ge(t);for(let m=y,x=v+y;m<x;m++){let g=e.resolveTriangleIndex(m);Q(Ht,3*g,u,d),Ht.a.applyMatrix4(_r),Ht.b.applyMatrix4(_r),Ht.c.applyMatrix4(_r),Ht.needsUpdate=!0;for(let b=0,S=T*3;b<S;b+=3)if(Q(kt,b,h,p),kt.needsUpdate=!0,Ht.intersectsTriangle(kt))return!0}}}else{let c=E(o),u=L(o,l);return W(c,s,ci),!!(i.intersectsBox(ci)&&ms(c,e,t,r,i)||(W(u,s,ci),i.intersectsBox(ci)&&ms(u,e,t,r,i)))}}import{Matrix4 as Xu,Vector3 as di}from"three";var fi=new Xu,gs=new K,Rr=new K,Yu=new di,Zu=new di,Ju=new di,ef=new di;function ca(o,e,t,r={},i={},s=0,n=1/0){e.boundingBox||e.computeBoundingBox(),gs.set(e.boundingBox.min,e.boundingBox.max,t),gs.needsUpdate=!0;let l=o.geometry,a=l.attributes.position,f=l.index,c=e.attributes.position,u=e.index,d=te.getPrimitive(),h=te.getPrimitive(),p=Yu,y=Zu,v=null,T=null;i&&(v=Ju,T=ef);let m=1/0,x=null,g=null;return fi.copy(t).invert(),Rr.matrix.copy(fi),o.shapecast({boundsTraverseOrder:b=>gs.distanceToBox(b),intersectsBounds:(b,S,w)=>w<m&&w<n?(S&&(Rr.min.copy(b.min),Rr.max.copy(b.max),Rr.needsUpdate=!0),!0):!1,intersectsRange:(b,S)=>{if(e.boundsTree){let w=e.boundsTree;return w.shapecast({boundsTraverseOrder:R=>Rr.distanceToBox(R),intersectsBounds:(R,F,I)=>I<m&&I<n,intersectsRange:(R,F)=>{for(let I=R,C=R+F;I<C;I++){let D=w.resolveTriangleIndex(I);Q(h,3*D,u,c),h.a.applyMatrix4(t),h.b.applyMatrix4(t),h.c.applyMatrix4(t),h.needsUpdate=!0;for(let A=b,M=b+S;A<M;A++){let B=o.resolveTriangleIndex(A);Q(d,3*B,f,a),d.needsUpdate=!0;let j=d.distanceToTriangle(h,p,v);if(j<m&&(y.copy(p),T&&T.copy(v),m=j,x=A,g=I),j<s)return!0}}}})}else{let w=Ge(e);for(let R=0,F=w;R<F;R++){Q(h,3*R,u,c),h.a.applyMatrix4(t),h.b.applyMatrix4(t),h.c.applyMatrix4(t),h.needsUpdate=!0;for(let I=b,C=b+S;I<C;I++){let D=o.resolveTriangleIndex(I);Q(d,3*D,f,a),d.needsUpdate=!0;let A=d.distanceToTriangle(h,p,v);if(A<m&&(y.copy(p),T&&T.copy(v),m=A,x=I,g=R),A<s)return!0}}}}}),te.releasePrimitive(d),te.releasePrimitive(h),m===1/0?null:(r.point?r.point.copy(y):r.point=y.clone(),r.distance=m,r.faceIndex=x,i&&(i.point?i.point.copy(T):i.point=T.clone(),i.point.applyMatrix4(fi),y.applyMatrix4(fi),i.distance=y.sub(i.point).length(),i.faceIndex=g),r)}function xs(o,e,t){return o===null?null:(o.point.applyMatrix4(e.matrixWorld),o.distance=o.point.distanceTo(t.ray.origin),o.object=e,o)}var hi=new K,pi=new rf,fa=new pa,da=new nf,ha=new pa,vs=["getX","getY","getZ"],Ee=class o extends Ne{static serialize(e,t={}){t={cloneBuffers:!0,...t};let r=e.geometry,i=e._roots,s=e._indirectBuffer,n=r.getIndex(),l={version:1,roots:null,index:null,indirectBuffer:null};return t.cloneBuffers?(l.roots=i.map(a=>a.slice()),l.index=n?n.array.slice():null,l.indirectBuffer=s?s.slice():null):(l.roots=i,l.index=n?n.array:null,l.indirectBuffer=s),l}static deserialize(e,t,r={}){r={setIndex:!0,indirect:!!e.indirectBuffer,...r};let{index:i,roots:s,indirectBuffer:n}=e;e.version||(console.warn("MeshBVH.deserialize: Serialization format has been changed and will be fixed up. It is recommended to regenerate any stored serialized data."),a(s));let l=new o(t,{...r,[He]:!0});if(l._roots=s,l._indirectBuffer=n||null,r.setIndex){let f=t.getIndex();if(f===null){let c=new tf(e.index,1,!1);t.setIndex(c)}else f.array!==i&&(f.array.set(i),f.needsUpdate=!0)}return l;function a(f){for(let c=0;c<f.length;c++){let u=f[c],d=new Uint32Array(u),h=new Uint16Array(u);for(let p=0,y=u.byteLength/32;p<y;p++){let v=8*p,T=2*v;P(T,h)||(d[v+6]=d[v+6]/8-p)}}}}get primitiveStride(){return 3}get resolveTriangleIndex(){return this.resolvePrimitiveIndex}constructor(e,t={}){t.maxLeafTris&&(console.warn('MeshBVH: "maxLeafTris" option has been deprecated. Use "targetLeafSize", instead.'),t={...t,targetLeafSize:t.maxLeafTris}),super(e,t)}shiftTriangleOffsets(e){return super.shiftPrimitiveOffsets(e)}writePrimitiveBounds(e,t,r){let i=this.geometry,s=this._indirectBuffer,n=i.attributes.position,l=i.index?i.index.array:null,f=(s?s[e]:e)*3,c=f+0,u=f+1,d=f+2;l&&(c=l[c],u=l[u],d=l[d]);for(let h=0;h<3;h++){let p=n[vs[h]](c),y=n[vs[h]](u),v=n[vs[h]](d),T=p;y<T&&(T=y),v<T&&(T=v);let m=p;y>m&&(m=y),v>m&&(m=v),t[r+h]=T,t[r+h+3]=m}return t}computePrimitiveBounds(e,t,r){let i=this.geometry,s=this._indirectBuffer,n=i.attributes.position,l=i.index?i.index.array:null,a=n.normalized;if(e<0||t+e-r.offset>r.length/6)throw new Error("MeshBVH: compute triangle bounds range is invalid.");let f=n.array,c=n.offset||0,u=3;n.isInterleavedBufferAttribute&&(u=n.data.stride);let d=["getX","getY","getZ"],h=r.offset;for(let p=e,y=e+t;p<y;p++){let T=(s?s[p]:p)*3,m=(p-h)*6,x=T+0,g=T+1,b=T+2;l&&(x=l[x],g=l[g],b=l[b]),a||(x=x*u+c,g=g*u+c,b=b*u+c);for(let S=0;S<3;S++){let w,R,F;a?(w=n[d[S]](x),R=n[d[S]](g),F=n[d[S]](b)):(w=f[x+S],R=f[g+S],F=f[b+S]);let I=w;R<I&&(I=R),F<I&&(I=F);let C=w;R>C&&(C=R),F>C&&(C=F);let D=(C-I)/2,A=S*2;r[m+A+0]=I+D,r[m+A+1]=D+(Math.abs(I)+D)*Dt}}return r}raycastObject3D(e,t,r=[]){let{material:i}=e;if(i===void 0)return;da.copy(e.matrixWorld).invert(),pi.copy(t.ray).applyMatrix4(da),ha.setFromMatrixScale(e.matrixWorld),fa.copy(pi.direction).multiply(ha);let s=fa.length(),n=t.near/s,l=t.far/s;if(t.firstHitOnly===!0){let a=this.raycastFirst(pi,i,n,l);a=xs(a,e,t),a&&r.push(a)}else{let a=this.raycast(pi,i,n,l);for(let f=0,c=a.length;f<c;f++){let u=xs(a[f],e,t);u&&r.push(u)}}return r}refit(e=null){return(this.indirect?na:Ko)(this,e)}raycast(e,t=ua,r=0,i=1/0){let s=this._roots,n=[],l=this.indirect?sa:Jo;for(let a=0,f=s.length;a<f;a++)l(this,a,t,e,n,r,i);return n}raycastFirst(e,t=ua,r=0,i=1/0){let s=this._roots,n=null,l=this.indirect?oa:ea;for(let a=0,f=s.length;a<f;a++){let c=l(this,a,t,e,r,i);c!=null&&(n==null||c.distance<n.distance)&&(n=c)}return n}intersectsGeometry(e,t){let r=!1,i=this._roots,s=this.indirect?la:ra;for(let n=0,l=i.length;n<l&&(r=s(this,n,e,t),!r);n++);return r}shapecast(e){let t=te.getPrimitive(),r=super.shapecast({...e,intersectsPrimitive:e.intersectsTriangle,scratchPrimitive:t,iterate:this.indirect?Zo:jo});return te.releasePrimitive(t),r}bvhcast(e,t,r){let{intersectsRanges:i,intersectsTriangles:s}=r,n=te.getPrimitive(),l=this.geometry.index,a=this.geometry.attributes.position,f=this.indirect?p=>{let y=this.resolveTriangleIndex(p);Q(n,y*3,l,a)}:p=>{Q(n,p*3,l,a)},c=te.getPrimitive(),u=e.geometry.index,d=e.geometry.attributes.position,h=e.indirect?p=>{let y=e.resolveTriangleIndex(p);Q(c,y*3,u,d)}:p=>{Q(c,p*3,u,d)};if(s){if(!(e instanceof o))throw new Error('MeshBVH: "intersectsTriangles" callback can only be used with another MeshBVH.');let p=(y,v,T,m,x,g,b,S)=>{for(let w=T,R=T+m;w<R;w++){h(w),c.a.applyMatrix4(t),c.b.applyMatrix4(t),c.c.applyMatrix4(t),c.needsUpdate=!0;for(let F=y,I=y+v;F<I;F++)if(f(F),n.needsUpdate=!0,s(n,c,F,w,x,g,b,S))return!0}return!1};if(i){let y=i;i=function(v,T,m,x,g,b,S,w){return y(v,T,m,x,g,b,S,w)?!0:p(v,T,m,x,g,b,S,w)}}else i=p}return super.bvhcast(e,t,{intersectsRanges:i})}intersectsBox(e,t){return hi.set(e.min,e.max,t),hi.needsUpdate=!0,this.shapecast({intersectsBounds:r=>hi.intersectsBox(r),intersectsTriangle:r=>hi.intersectsTriangle(r)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,r={},i={},s=0,n=1/0){return(this.indirect?ca:ia)(this,e,t,r,i,s,n)}closestPointToPoint(e,t={},r=0,i=1/0){return Oo(this,e,t,r,i)}};import{Vector3 as ge,Vector2 as Fr,Ray as sf,Matrix4 as of,FrontSide as af,BackSide as lf,Triangle as Dr,REVISION as Sa}from"three";var ga=new ge,xa=new ge,va=new ge,Le=new sf,ya=new of,lt=new ge,bs=new ge,cf=["x","y","z"],mi=parseInt(Sa)>=169,uf=parseInt(Sa)<=161,gi=new Fr,xi=new Fr,vi=new Fr,ba=new ge,Ta=new ge,wa=new ge,Ie=class extends Ne{get primitiveStride(){return 3}constructor(e,t={}){if(!e.isMesh)throw new Error("SkinnedMeshBVH: First argument must be a Mesh.");super(e.geometry,{...t,[He]:!0}),this.mesh=e,t[He]||this.init(t)}writePrimitiveBounds(e,t,r){let{mesh:i,geometry:s}=this,n=this._indirectBuffer,l=s.index?s.index.array:null,f=(n?n[e]:e)*3,c=f+0,u=f+1,d=f+2;l&&(c=l[c],u=l[u],d=l[d]),i.getVertexPosition(c,ga),i.getVertexPosition(u,xa),i.getVertexPosition(d,va);for(let h=0;h<3;h++){let p=cf[h],y=ga[p],v=xa[p],T=va[p],m=y;v<m&&(m=v),T<m&&(m=T);let x=y;v>x&&(x=v),T>x&&(x=T),t[r+h]=m,t[r+h+3]=x}return t}shapecast(e){let t=new Y;return super.shapecast({...e,intersectsPrimitive:e.intersectsTriangle,scratchPrimitive:t,iterate:ff})}raycastObject3D(e,t,r=[]){let{material:i}=e;if(i===void 0)return;let{matrixWorld:s}=e,{firstHitOnly:n}=t;ya.copy(s).invert(),Le.copy(t.ray).applyMatrix4(ya);let l=null,a=1/0;return this.shapecast({boundsTraverseOrder:f=>f.distanceToPoint(Le.origin),intersectsBounds:f=>{if(n){if(!Le.intersectBox(f,bs))return 0;let c;return f.containsPoint(Le.origin)?c=0:(bs.applyMatrix4(s),c=t.ray.origin.distanceTo(bs)),c<a?1:0}else return Le.intersectsBox(f)?1:0},intersectsTriangle:(f,c)=>{let u=null;if(i.side===af?u=Le.intersectTriangle(f.a,f.b,f.c,!0,lt):i.side===lf?u=Le.intersectTriangle(f.c,f.b,f.a,!0,lt):u=Le.intersectTriangle(f.a,f.b,f.c,!1,lt),!u)return;u=u.clone().applyMatrix4(s);let d=t.ray.origin.distanceTo(u);if(d>=t.near&&d<=t.far){if(n&&d>=a)return;let{geometry:h}=this,{index:p}=h,y=this.resolvePrimitiveIndex(c),v=y*3,T=v+0,m=v+1,x=v+2;p&&(T=p.array[T],m=p.array[m],x=p.array[x]);let g={distance:d,point:u.clone(),object:e,uv:null,uv1:null,normal:null,face:{a:T,b:m,c:x,normal:Dr.getNormal(f.a,f.b,f.c,new ge),materialIndex:0},faceIndex:y};if(mi){let R=new ge;Dr.getBarycoord(lt,f.a,f.b,f.c,R),g.barycoord=R}let b=h.attributes.uv,S=h.attributes.uv1,w=h.attributes.normal;if(b){gi.fromBufferAttribute(b,T),xi.fromBufferAttribute(b,m),vi.fromBufferAttribute(b,x),g.uv=new Fr;let R=Dr.getInterpolation(lt,f.a,f.b,f.c,gi,xi,vi,g.uv);mi||(g.uv=R)}if(S){gi.fromBufferAttribute(S,T),xi.fromBufferAttribute(S,m),vi.fromBufferAttribute(S,x),g.uv1=new Fr;let R=Dr.getInterpolation(lt,f.a,f.b,f.c,gi,xi,vi,g.uv1);mi||(g.uv1=R),uf&&(g.uv2=g.uv1)}if(w){ba.fromBufferAttribute(w,T),Ta.fromBufferAttribute(w,m),wa.fromBufferAttribute(w,x),g.normal=new ge;let R=Dr.getInterpolation(lt,f.a,f.b,f.c,ba,Ta,wa,g.normal);g.normal.dot(Le.direction)>0&&g.normal.multiplyScalar(-1),mi||(g.normal=R)}a=g.distance,l=g,n||r.push(g)}}}),n&&l&&r.push(l),r}};function ff(o,e,t,r,i,s,n){let{mesh:l,geometry:a}=t,f=a.index?a.index.array:null;for(let c=o,u=e+o;c<u;c++){let d=t.resolvePrimitiveIndex(c),h=3*d+0,p=3*d+1,y=3*d+2;if(f&&(h=f[h],p=f[p],y=f[y]),l.getVertexPosition(h,n.a),l.getVertexPosition(p,n.b),l.getVertexPosition(y,n.c),n.needsUpdate=!0,r(n,c,i,s))return!0}return!1}import{wgslFn as Ts}from"three/tsl";import{wgslFn as _a,wgsl as Ra}from"three/tsl";import{StructTypeNode as Ut}from"three/webgpu";var fe=new Ut({min:"array<f32, 3>",max:"array<f32, 3>"},"BVHBoundingBox");fe.getLength=()=>6;var oe=new Ut({bounds:"BVHBoundingBox",rightChildOrTriangleOffset:"uint",splitAxisOrTriangleCount:"uint"},"BVHNode");oe.getLength=()=>fe.getLength()+2;var Ia=new Ut({matrixWorld:"mat4x4f",inverseMatrixWorld:"mat4x4f",visible:"uint",_alignment0:"uint",_alignment1:"uint",_alignment2:"uint"},"TransformStruct"),$=new Ut({origin:"vec3f",direction:"vec3f",maxDist:"float"},"Ray"),je=new Ut({indices:"vec4u",normal:"vec3f",didHit:"bool",barycoord:"vec3f",objectIndex:"uint",side:"float",dist:"float"},"IntersectionResult"),Cr=new Ut({faceIndices:"vec4u",closestPoint:"vec3f",found:"bool",barycoord:"vec3f",objectIndex:"uint",faceNormal:"vec3f",side:"float",distanceSq:"float"},"PointQueryResult");var yi=Ra(`

	const BVH_STACK_DEPTH = 60u;
	const INFINITY = 1e20;
	const TRI_INTERSECT_EPSILON = 1e-5;

`),bi=Ra(`
	struct IntersectionResult {
		indices: vec4u,
		normal: vec3f,
		didHit: bool,
		barycoord: vec3f,
		side: f32,
		dist: f32,
	};
`),vx=_a(`

	fn getVertexAttribute(
		barycoord: vec3f,
		indices: vec3u,
		attributeBuffer: ptr<storage, array<vec3f>, read>
	) -> vec3f {

		let n0 = attributeBuffer[ indices.x ];
		let n1 = attributeBuffer[ indices.y ];
		let n2 = attributeBuffer[ indices.z ];
		return barycoord.x * n0 + barycoord.y * n1 + barycoord.z * n2;

	}

`),Da=_a(`

	fn intersectsBounds(
		ray: Ray,
		bounds: BVHBoundingBox,
		dist: ptr<function, f32>
	) -> bool {

		let boundsMin = vec3( bounds.min[0], bounds.min[1], bounds.min[2] );
		let boundsMax = vec3( bounds.max[0], bounds.max[1], bounds.max[2] );

		let invDir = 1.0 / ray.direction;
		let tMinPlane = ( boundsMin - ray.origin ) * invDir;
		let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

		let tMinHit = vec3f(
			min( tMinPlane.x, tMaxPlane.x ),
			min( tMinPlane.y, tMaxPlane.y ),
			min( tMinPlane.z, tMaxPlane.z )
		);

		let tMaxHit = vec3f(
			max( tMinPlane.x, tMaxPlane.x ),
			max( tMinPlane.y, tMaxPlane.y ),
			max( tMinPlane.z, tMaxPlane.z )
		);

		let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
		let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

		( *dist ) = max( t0, 0.0 );

		return t1 >= ( *dist );

	}

`,[$,fe]);var ws=Ts(`

	fn intersectsTriangle( ray: Ray, a: vec3f, b: vec3f, c: vec3f ) -> IntersectionResult {

		var result: IntersectionResult;
		result.didHit = false;

		let edge1 = b - a;
		let edge2 = c - a;
		let n = cross( edge1, edge2 );

		let det = - dot( ray.direction, n );

		if ( abs( det ) < TRI_INTERSECT_EPSILON ) {

			return result;

		}

		let invdet = 1.0 / det;

		let AO = ray.origin - a;
		let DAO = cross( AO, ray.direction );

		let u = dot( edge2, DAO ) * invdet;
		let v = -dot( edge1, DAO ) * invdet;
		let t = dot( AO, n ) * invdet;

		let w = 1.0 - u - v;

		if ( u < - TRI_INTERSECT_EPSILON || v < - TRI_INTERSECT_EPSILON || w < - TRI_INTERSECT_EPSILON || t < TRI_INTERSECT_EPSILON ) {

			return result;

		}

		result.didHit = true;
		result.barycoord = vec3f( w, u, v );
		result.dist = t;
		result.side = sign( det );
		result.normal = result.side * normalize( n );

		return result;

	}

`,[$,bi,yi]),df=Ts(`

	fn intersectTriangles(
		bvh_position: ptr<storage, array<vec3f>, read>,
		bvh_index: ptr<storage, array<vec3u>, read>,
		offset: u32,
		count: u32,
		ray: Ray
	) -> IntersectionResult {

		var closestResult: IntersectionResult;

		closestResult.didHit = false;
		closestResult.dist = INFINITY;

		for ( var i = offset; i < offset + count; i = i + 1u ) {

			let indices = bvh_index[ i ];
			let a = bvh_position[ indices.x ];
			let b = bvh_position[ indices.y ];
			let c = bvh_position[ indices.z ];

			var triResult = intersectsTriangle( ray, a, b, c );

			if ( triResult.didHit && triResult.dist < closestResult.dist ) {

				closestResult = triResult;
				closestResult.indices = vec4u( indices.xyz, i );

			}

		}

		return closestResult;

	}

`,[ws,$,bi,yi]),Sx=Ts(`

	fn bvhIntersectFirstHit(
		bvh_index: ptr<storage, array<vec3u>, read>,
		bvh_position: ptr<storage, array<vec3f>, read>,
		bvh: ptr<storage, array<BVHNode>,read>,
		ray: Ray,
	) -> IntersectionResult {

		var pointer = 0;
		var stack: array<u32, BVH_STACK_DEPTH>;
		stack[ 0 ] = 0u;

		var bestHit: IntersectionResult;

		bestHit.didHit = false;
		bestHit.dist = INFINITY;

		loop {

			if ( pointer < 0 || pointer >= i32( BVH_STACK_DEPTH ) ) {

				break;

			}

			let currNodeIndex = stack[ pointer ];
			let node = bvh[ currNodeIndex ];

			pointer = pointer - 1;

			var boundsHitDistance: f32 = 0.0;

			if ( ! intersectsBounds( ray, node.bounds, &boundsHitDistance ) || boundsHitDistance > bestHit.dist ) {

				continue;

			}

			let boundsInfox = node.splitAxisOrTriangleCount;
			let boundsInfoy = node.rightChildOrTriangleOffset;

			let isLeaf = ( boundsInfox & 0xffff0000u ) != 0u;

			if ( isLeaf ) {

				let count = boundsInfox & 0x0000ffffu;
				let offset = boundsInfoy;

				let localHit = intersectTriangles(
					bvh_position, bvh_index, offset,
					count, ray
				);

				if ( localHit.didHit && localHit.dist < bestHit.dist ) {

					bestHit = localHit;

				}

			} else {

				let leftIndex = currNodeIndex + 1u;
				let splitAxis = boundsInfox & 0x0000ffffu;
				let rightIndex = currNodeIndex + boundsInfoy;

				let leftToRight = ray.direction[splitAxis] >= 0.0;
				let c1 = select( rightIndex, leftIndex, leftToRight );
				let c2 = select( leftIndex, rightIndex, leftToRight );

				pointer = pointer + 1;
				stack[ pointer ] = c2;

				pointer = pointer + 1;
				stack[ pointer ] = c1;

			}

		}

		return bestHit;

	}

`,[df,Da,$,oe,bi,yi]);import{Matrix4 as ja,Mesh as _i,Group as _f}from"three";import{StorageBufferAttribute as Ri,StructTypeNode as Rf}from"three/webgpu";import{storage as Di}from"three/tsl";import{Node as hf,TSL as Fa}from"three/webgpu";var Ti=class extends hf{static get type(){return"ProxyCallNode"}constructor(e,t){super(),this.proxyNode=e,this.params=t}setup(){return this.proxyNode.proxyNode.call(...this.params)}},Ar=class{get isNode(){return!0}get proxyNode(){let{proxyObject:e,proxyProperty:t}=this,r=t.split("."),i=e;for(let s=0,n=r.length;s<n;s++)i=i?.[r[s]];return i&&"functionNode"in i?i.functionNode:i??null}constructor(e,t=null){return this.proxyObject=t,this.proxyProperty=e,new Proxy(this,{get(r,i){if(i in r)return Reflect.get(r,i);{let s=r.proxyNode;if(!s)return;let n=Reflect.get(s,i);return typeof n=="function"?n.bind(s):n}},set(r,i,s){if(i in r)return Reflect.set(r,i,s);throw new Error("NodeProxy: Cannot set members of proxied nodes.")}})}},H=(...o)=>new Ar(...o),O=(...o)=>{let e=new Ar(...o),t=(...r)=>new Ti(e,r);return Fa.nodeProxyConstructor(t,e)},Ss=class extends Ar{get proxyNode(){return super.proxyNode||this.fallbackNode}constructor(e,t){super(e,null),Object.defineProperty(this,"fallbackNode",{value:t})}setup(e){return this.proxyObject=e.getContext(),this.proxyNode.setup(e)}};var ct=(...o)=>{let e=new Ss(...o),t=(...r)=>new Ti(e,r);return Fa.nodeProxyConstructor(t,e)};import{Vector4 as Ca}from"three";var Ke=new Ca,_e=new Ca;function pf(o,e){let t=o?o.array:null,r=new Uint32Array(e.length*3);for(let i=0,s=e.length;i<s;i++){let n=3*i,l=3*e[i];for(let a=0;a<3;a++)r[n+a]=t?t[l+a]:l+a}return r}function Is(o,e,t,r){let i=new Uint32Array(r),s=new Float32Array(r);o._roots.forEach(n=>{let l=new Uint16Array(n),a=new Uint32Array(n);for(let f=0,c=n.byteLength/32;f<c;f++){let u=f*8,d=u*2,h=t*8,p=new Float32Array(n,f*32,6);if(f===0)for(let v=0;v<3;v++){let T=p[v+0],m=p[v+3];T>m?(s[h+v+0]=1,s[h+v+3]=-1):(s[h+v+0]=T,s[h+v+3]=m)}else s.set(p,h);if(e===null){t++;continue}if(P(d,l)){let v=a[u+6],T=l[d+14],{transformSlot:m,nodeOffset:x}=T===0?{transformSlot:0,nodeOffset:0}:e[v];if(m>16777215)throw new Error(`packBVHBufferUtils: transform slot ${m} exceeds the 24-bit TLAS leaf limit.`);i[h+6]=x,i[h+7]=4278190080|m&16777215}else i[h+6]=a[u+6],i[h+7]=a[u+7];t++}})}function Aa(o,e){return Ma(new Uint16Array(o),new Uint32Array(o),e)}function Ma(o,e,t){if(P(t*8*2,o))return 1;let i=e[t*8+6];return i+Ma(o,e,t+i)}function _s(o,e=0){let t=new Uint16Array(o),r=new Uint32Array(o),i=0;return s(e*8,1),i;function s(n,l){let a=n,f=n*2;if(P(f,t))i=Math.max(l,i);else{let u=L(a,r),d=E(a);s(d,l+1),s(u,l+1)}}}function Ba(o,e,t,r,i,s){let n=new Uint16Array(s),l=new Uint32Array(s),a=new Float32Array(s),f=new Uint16Array(o),c=new Uint32Array(o);for(let u=0;u<t;u++){let d=e+u,h=d*8,p=h*2,y=i*8,v=y*2,T=new Float32Array(o,d*32,6);if(u===0)for(let x=0;x<3;x++){let g=T[x+0],b=T[x+3];g>b?(a[y+x+0]=1,a[y+x+3]=-1):(a[y+x+0]=g,a[y+x+3]=b)}else a.set(T,y);P(p,f)?(l[y+6]=c[h+6]+r,n[v+14]=f[p+14],n[v+15]=65535):(l[y+6]=c[h+6],l[y+7]=c[h+7]),i++}}function Pa(o,e,t,r,i){let{geometry:s}=o,{start:n,count:l,vertexStart:a}=e;if(o.indirect){let f=pf(s.index,o._indirectBuffer);for(let c=0;c<f.length;c++)i[c+r]=f[c]-a+t}else if(s.index)for(let f=0;f<l;f++)i[f+r]=s.index.getX(f+n)-a+t;else for(let f=0;f<l;f++)i[f+r]=f+n+t}function Na(o,e,t,r,i,s){let{geometry:n,mesh:l=null}=o,{vertexStart:a,vertexCount:f}=e,c=new Float32Array(r),u=i.getLength();i.membersLayout.forEach(({name:d},h)=>{let p=n.attributes[d];s.getDefaultAttributeValue(d,Ke);for(let y=0;y<f;y++){if(p){switch(_e.fromBufferAttribute(p,y+a),p.itemSize){case 1:_e.y=Ke.y,_e.z=Ke.z,_e.w=Ke.w;break;case 2:_e.z=Ke.z,_e.w=Ke.w;break;case 3:_e.w=Ke.w;break}l&&(d==="position"||d==="normal"||d==="tangent")&&l.applyBoneTransform(y+a,_e)}else _e.copy(Ke);_e.toArray(c,(t+y)*u+h*4)}})}import{CodeNode as mf,FunctionNode as gf,Node as $a,TSL as xf}from"three/webgpu";var Rs=class extends $a{constructor(e){super(),this.literal=e}build(){return this.literal}},Mr=class extends $a{constructor(e,t="property"){super(),this.node=e,this.output=t}build(e){return this.node.build(e,this.output)}};function vf(o){return o.isNode?new Mr(o):null}function Ea(o){let e=[];for(let t of o)if(Array.isArray(t))for(let r of t){let i=vf(r);i&&e.push(i)}return e}function La(o,e){return o.map(t=>(t&&!t.isNode&&t instanceof Function&&(t=t(e)),t&&t.isNode?(t.setup(e),t.isWGSLTagCodeNode?new Mr(t,"inline"):new Mr(t)):t))}function Ds(o,e,t){let r="";for(let i=0,s=o.length;i<s;i++)if(r+=o[i],i<e.length){let n=e[i];Array.isArray(n)||(typeof n=="string"||typeof n=="number"?r+=String(n):r+=n.build(t))}return r}var Fs=class extends gf{static get type(){return"WGSLTagFnNode"}constructor(e,t,r="wgsl"){super("",Ea(t),r),this.isWGSLTagFnNode=!0,this.tokens=e,this.args=t}setup(e){super.setup(e),this._normalizedArgs=La(this.args,e)}getNodeFunction(e){let{tokens:t,_normalizedArgs:r}=this,i=e.getDataFromNode(this),s=i.nodeFunction;if(s===void 0){let n="";for(let l=0,a=t.length;l<a;l++)if(n+=t[l],l<r.length){let f=r[l];Array.isArray(f)||(typeof f=="string"||typeof f=="number"?n+=String(f):f.isStructLayoutNode?n+=f.getNodeType(e):f.isStruct?n+=f.layout.getNodeType(e):n+="_arg"+l)}n=n.replace(/\/\/.*[\n\r]/g,""),s=e.parser.parseFunction(n),i.nodeFunction=s}return s}generate(e,t){let r=super.generate(e,t),{_normalizedArgs:i}=this,s=Ds(this.tokens,i,e),{type:n}=this.getNodeFunction(e),l=e.getCodeFromNode(this,n);return l.code=s.replace(/\/\/.+[\n\r]/g,"").replace(/->\s*void/,"").trim(),r}},Cs=class extends mf{static get type(){return"WGSLTagCodeNode"}constructor(e,t,r="wgsl"){super("",Ea(t),r),this.isWGSLTagCodeNode=!0,this.tokens=e,this.args=t}setup(e){super.setup(e),this._normalizedArgs=La(this.args,e)}build(e,t){return t==="inline"?Ds(this.tokens,this._normalizedArgs,e):super.build(e,t)}generate(e){super.generate(e);let t=e.getCodeFromNode(this,this.getNodeType(e));return t.code=Ds(this.tokens,this._normalizedArgs,e),t.code}},yf=o=>{let e=(...t)=>{if(t.length===1&&t[0]&&typeof t[0]=="object"&&!t[0].isNode){let r=t[0];for(let i in r)typeof r[i]=="string"&&(r[i]=new Rs(r[i]))}return o.call(...t)};return xf.nodeProxyConstructor(e,o)},_=(o,...e)=>yf(new Fs(o,e)),ut=(o,...e)=>new Cs(o,e);import{uint as bf}from"three/tsl";var Br=bf(60);function za(o,e){let{name:t=`bvh_shapecast_fn_${Math.random().toString(36).substring(2,7)}`,shapeStruct:r,resultStruct:i=null,prefixFn:s=null,boundsOrderFn:n=null,intersectsBoundsFn:l,intersectRangeFn:a,transformShapeFn:f=null,transformResultFn:c=null,resetShapeFn:u=null}=e,{nodes:d,transforms:h}=o.storage,p="";s&&(p=ut`${s}();`);let y="";c&&(y=ut`${c}( result, objectIndex );`);let v="";f&&(v=ut`${f}( &localShape, objectIndex );`);let T="";u&&(T=ut`${u}( objectIndex );`);let m="";n&&(m=ut`
			let leftToRight = ${n}( localShape, splitAxis, node );
			c1 = select( rightIndex, leftIndex, leftToRight );
			c2 = select( leftIndex, rightIndex, leftToRight );
		`);let x=i?ut`result: ptr<function, ${i}>`:"",g=i?"result":"",b=_`
		// fn
		fn ${t}( shape: ${r}, ${x} ) -> bool {

			${p}

			var didHit = false;

			var isTLAS = true;
			var pointer: i32 = 0;
			var stack: array<u32, ${Br}>;
			stack[ 0 ] = 0u;

			var blasDidHit: bool = false;
			var objectIndex: u32 = 0;
			var localShape: ${r} = shape;

			// the stack depth the current cluster's BLAS drains back down to once it is complete
			var tlasReset: i32 = 0;

			loop {

				// The cluster's BLAS has drained back to its TLAS leaf. Finalize the cluster that
				// was just traversed and resume the TLAS.
				if ( ! isTLAS && tlasReset == pointer ) {

					if ( blasDidHit ) {

						blasDidHit = false;
						didHit = true;
						${y}

					}

					${T}

					objectIndex = 0;
					isTLAS = true;
					localShape = shape;

				}

				// check if we've finished all nodes on the stack (or overrun the stack)
				if ( pointer < 0 || pointer >= i32( ${Br} ) ) {

					break;

				}

				let nodeIndex = stack[ pointer ];
				let node = ${d}[ nodeIndex ];
				pointer = pointer - 1;

				// skip the node if we don't intersect the bounds
				if ( ${l}( localShape, node.bounds, ${g} ) == 0u ) {

					continue;

				}

				let infoX = node.splitAxisOrTriangleCount;
				let infoY = node.rightChildOrTriangleOffset;
				let isLeaf = ( infoX & 0xffff0000u ) != 0u;

				if ( isLeaf ) {

					if ( isTLAS ) {

						// the leaf encodes the placement / transform slot in the low 24 bits of infoX
						// and the cluster subtree's absolute node offset in infoY, which is pushed
						// directly as the BLAS entry node. Each TLAS leaf references one cluster.
						objectIndex = infoX & 0x00ffffffu;

						let transform = ${h}[ objectIndex ];
						if ( transform.visible != 0u ) {

							tlasReset = pointer;
							isTLAS = false;
							blasDidHit = false;

							// Transform shape into object local space
							localShape = shape;
							${v}

							pointer = pointer + 1;
							stack[ pointer ] = infoY;

						}

					} else {

						let count = infoX & 0x0000ffffu;
						let offset = infoY;
						blasDidHit = ${a}( localShape, offset, count, ${g} ) || blasDidHit;

					}

				} else {

					let leftIndex = nodeIndex + 1u;
					let splitAxis = infoX & 0x0000ffffu;
					let rightIndex = nodeIndex + infoY;

					var c1 = rightIndex;
					var c2 = leftIndex;
					${m}

					pointer = pointer + 1;
					stack[ pointer ] = c2;

					pointer = pointer + 1;
					stack[ pointer ] = c1;

				}

			}

			return didHit;

		}
	`;return b.outputType=i,b.functionName=t,b}import{float as Tf}from"three/tsl";var Oa=_`
	// fn
	fn closestPointToTriangle(
		p: vec3f,
		v0: vec3f,
		v1: vec3f,
		v2: vec3f
	) -> vec3f {

		let v10 = v1 - v0;
		let v21 = v2 - v1;
		let v02 = v0 - v2;
		let p0 = p - v0;
		let p1 = p - v1;
		let p2 = p - v2;

		let nor = cross( v10, v02 );
		let q = cross( nor, p0 );
		let d = 1.0 / dot( nor, nor );
		var u = d * dot( q, v02 );
		var v = d * dot( q, v10 );
		var w = 1.0 - u - v;

		if ( u < 0.0 ) {

			w = clamp( dot( p2, v02 ) / dot( v02, v02 ), 0.0, 1.0 );
			u = 0.0;
			v = 1.0 - w;

		} else if ( v < 0.0 ) {

			u = clamp( dot( p0, v10 ) / dot( v10, v10 ), 0.0, 1.0 );
			v = 0.0;
			w = 1.0 - u;

		} else if ( w < 0.0 ) {

			v = clamp( dot( p1, v21 ) / dot( v21, v21 ), 0.0, 1.0 );
			w = 0.0;
			u = 1.0 - v;

		}

		return vec3f( w, u, v );

	}
`,wi=_`
	// fn
	fn intersectRayTriangle( ray: ${$}, a: vec3f, b: vec3f, c: vec3f, threshold: f32 ) -> ${je} {

		const DET_EPSILON = 1e-15;

		var result: ${je};
		result.didHit = false;

		let edge1 = b - a;
		let edge2 = c - a;
		let n = cross( edge1, edge2 );

		let det = - dot( ray.direction, n );
		if ( abs( det ) < DET_EPSILON ) {

			return result;

		}

		let invdet = 1.0 / det;

		let AO = ray.origin - a;
		let DAO = cross( AO, ray.direction );

		let u = dot( edge2, DAO ) * invdet;
		if ( u < 0.0 || u > 1.0 ) {

			return result;

		}

		let v = - dot( edge1, DAO ) * invdet;
		if ( v < 0.0 || u + v > 1.0 ) {

			return result;

		}

		let t = dot( AO, n ) * invdet;
		let w = 1.0 - u - v;
		if ( t < threshold ) {

			return result;

		}

		result.didHit = true;
		result.barycoord = vec3f( w, u, v );
		result.dist = t;
		result.side = sign( det );
		result.normal = result.side * normalize( n );

		return result;

	}
`,Si=_`
	// fn
	fn ndcToCameraRay( ndc: vec2f, inverseModelViewProjection: mat4x4f ) -> ${$} {

		var homogeneous = vec4f();
		var ray: ${$};

		homogeneous = inverseModelViewProjection * vec4f( ndc, 0.0, 1.0 );
		ray.origin = homogeneous.xyz / homogeneous.w;

		homogeneous = inverseModelViewProjection * vec4f( ndc, 1.0, 1.0 );
		let toFarPlane = ( homogeneous.xyz / homogeneous.w ) - ray.origin;
		ray.maxDist = length( toFarPlane );
		ray.direction = toFarPlane / ray.maxDist;

		return ray;

	}
`;function Va(o){let{index:e,attributes:t,transforms:r}=o.storage,i=Tf(1).toVar(`bvh_rayScalar_${Math.random().toString(36).substring(2,7)}`);return o.getShapecastFn({name:"bvh_RaycastFirstHit",shapeStruct:$,resultStruct:je,boundsOrderFn:_`
			fn getBoundsOrder( ray: ${$}, splitAxis: u32, node: ${oe} ) -> bool {

				return ray.direction[ splitAxis ] >= 0.0;

			}
		`,intersectsBoundsFn:_`
			fn rayIntersectsBounds( ray: ${$}, bounds: ${fe}, result: ptr<function, ${je}> ) -> u32 {

				let boundsMin = vec3( bounds.min[0], bounds.min[1], bounds.min[2] );
				let boundsMax = vec3( bounds.max[0], bounds.max[1], bounds.max[2] );

				let invDir = 1.0 / ray.direction;
				let tMinPlane = ( boundsMin - ray.origin ) * invDir;
				let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

				let tMinHit = vec3f(
					min( tMinPlane.x, tMaxPlane.x ),
					min( tMinPlane.y, tMaxPlane.y ),
					min( tMinPlane.z, tMaxPlane.z )
				);

				let tMaxHit = vec3f(
					max( tMinPlane.x, tMaxPlane.x ),
					max( tMinPlane.y, tMaxPlane.y ),
					max( tMinPlane.z, tMaxPlane.z )
				);

				let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
				let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

				let dist = max( t0, 0.0 );
				if ( t1 < dist ) {

					return 0u;

				} else if ( ray.maxDist > 0.0 && dist * ${i} >= ray.maxDist ) {

					return 0u;

				} else if ( result.didHit && dist * ${i} >= result.dist ) {

					return 0u;

				} else {

					return 1u;

				}

			}

		`,intersectRangeFn:_`
			fn intersectRange( ray: ${$}, offset: u32, count: u32, result: ptr<function, ${je}> ) -> bool {

				var didHit = false;
				for ( var ti = offset; ti < offset + count; ti = ti + 1u ) {

					let i0 = ${e}[ ti * 3u ];
					let i1 = ${e}[ ti * 3u + 1u ];
					let i2 = ${e}[ ti * 3u + 2u ];

					let a = ${t}[ i0 ].position.xyz;
					let b = ${t}[ i1 ].position.xyz;
					let c = ${t}[ i2 ].position.xyz;

					var triResult = ${wi}( ray, a, b, c, 0.0 );
					triResult.dist *= ${i};
					if ( triResult.didHit && ( ray.maxDist <= 0.0 || triResult.dist < ray.maxDist ) && ( ! result.didHit || triResult.dist < result.dist ) ) {

						result.didHit = true;
						result.dist = triResult.dist;
						result.normal = triResult.normal;
						result.side = triResult.side;
						result.barycoord = triResult.barycoord;
						result.indices = vec4u( i0, i1, i2, ti );

						didHit = true;

					}

				}

				return didHit;

			}
		`,transformShapeFn:_`
			fn transformRay( ray: ptr<function, ${$}>, objectIndex: u32 ) -> void {

				let toLocal = ${r}[ objectIndex ].inverseMatrixWorld;
				ray.origin = ( toLocal * vec4f( ray.origin, 1.0 ) ).xyz;
				ray.direction = ( toLocal * vec4f( ray.direction, 0.0 ) ).xyz;

				let len = length( ray.direction );
				ray.direction /= len;
				${i} = 1.0 / len;

			}
		`,transformResultFn:_`
			fn transformResult( hit: ptr<function, ${je}>, objectIndex: u32 ) -> void {

				let toLocal = ${r}[ objectIndex ].inverseMatrixWorld;
				hit.normal = normalize( ( transpose( toLocal ) * vec4f( hit.normal, 0.0 ) ).xyz );
				hit.objectIndex = objectIndex;

			}
		`,resetShapeFn:_`
			fn resetRayScalar( objectIndex: u32 ) -> void {

				${i} = 1.0;

			}
		`})}function Ha(o){let{storage:e,structs:t}=o,r=t.attributes.membersLayout.map(({name:i})=>`result.${i} = a0.${i} * barycoord.x + a1.${i} * barycoord.y + a2.${i} * barycoord.z;`).join(`
`);return _`
		// fn
		fn bvh_sampleTrianglePoint( barycoord: vec3f, indices: vec3u ) -> ${t.attributes} {

			var result: ${t.attributes};
			var a0 = ${e.attributes}[ indices.x ];
			var a1 = ${e.attributes}[ indices.y ];
			var a2 = ${e.attributes}[ indices.z ];
			${r}
			return result;

		}
	`}import{mat4 as wf}from"three/tsl";function ka(o){let{index:e,attributes:t,transforms:r}=o.storage,i=wf().toVar("bvh_toWorldMat");return o.getShapecastFn({name:"bvh_ClosestPointToPoint",shapeStruct:"vec3f",resultStruct:Cr,boundsOrderFn:_`
			fn cppBoundsOrder( shape: vec3f, splitAxis: u32, node: ${oe} ) -> bool {

				let toWorld = ${i};

				// get center
				let bMin = vec3f( node.bounds.min[ 0 ], node.bounds.min[ 1 ], node.bounds.min[ 2 ] );
				let bMax = vec3f( node.bounds.max[ 0 ], node.bounds.max[ 1 ], node.bounds.max[ 2 ] );
				let center = bMin * 0.5 + bMax * 0.5;

				// determine the order in world space
				let worldCenter = ( toWorld * vec4f( center, 1.0 ) ).xyz;
				let worldAxis = normalize( toWorld[ splitAxis ].xyz );
				return dot( shape - worldCenter, worldAxis ) <= 0.0;

			}
		`,intersectsBoundsFn:_`
			fn cppIntersectsBounds( shape: vec3f, bounds: ${fe}, result: ptr<function, ${Cr}> ) -> u32 {

				// return 1u;
				// we need to check this no matter what if the result has not been found yet
				if ( ! result.found ) {

					return 1u;

				}

				let toWorld = ${i};

				// transform to world space
				let bMin = vec3f( bounds.min[ 0 ], bounds.min[ 1 ], bounds.min[ 2 ] );
				let bMax = vec3f( bounds.max[ 0 ], bounds.max[ 1 ], bounds.max[ 2 ] );
				let center = ( bMin + bMax ) * 0.5;
				let halfExtent = ( bMax - bMin ) * 0.5;
				let worldCenter = ( toWorld * vec4f( center, 1.0 ) ).xyz;
				let worldHalfExtent =
					abs( toWorld[ 0 ].xyz ) * halfExtent.x +
				    abs( toWorld[ 1 ].xyz ) * halfExtent.y +
				    abs( toWorld[ 2 ].xyz ) * halfExtent.z;
				let worldMin = worldCenter - worldHalfExtent;
				let worldMax = worldCenter + worldHalfExtent;

				// intersect if the distance to the bounds is not bigger than the already found
				let d = shape - clamp( shape, worldMin, worldMax );
				return select( 0u, 1u, dot( d, d ) < result.distanceSq );

			}
		`,intersectRangeFn:_`
			fn cppIntersectsRange( shape: vec3f, offset: u32, count: u32, result: ptr<function, ${Cr}> ) -> bool {

				var didHit = false;
				let toWorld = ${i};

				for ( var i = offset; i < offset + count; i ++ ) {

					// transform the triangle to world space
					let i0 = ${e}[ i * 3u + 0u ];
					let i1 = ${e}[ i * 3u + 1u ];
					let i2 = ${e}[ i * 3u + 2u ];
					let a = ( toWorld * vec4f( ${t}[ i0 ].position.xyz, 1.0 ) ).xyz;
					let b = ( toWorld * vec4f( ${t}[ i1 ].position.xyz, 1.0 ) ).xyz;
					let c = ( toWorld * vec4f( ${t}[ i2 ].position.xyz, 1.0 ) ).xyz;

					let barycoord = ${Oa}( shape, a, b, c );
					let closestPoint = barycoord.x * a + barycoord.y * b + barycoord.z * c;
					let delta = shape - closestPoint;
					let distSq = dot( delta, delta );

					// copy the content over
					if ( ! result.found || distSq < result.distanceSq ) {

						let normal = normalize( cross( a - b, b - c ) );

						result.closestPoint = closestPoint;
						result.barycoord = barycoord;
						result.distanceSq = distSq;
						result.faceNormal = normal;
						result.side = sign( dot( normal, delta ) );
						result.faceIndices = vec4u( i0, i1, i2, i );
						result.found = true;
						didHit = true;

					}

				}

				return didHit;

			}
		`,resetShapeFn:_`
				fn cppResetShape( objectIndex: u32 ) -> void {

					// node bounds are transformed by "toWorld" during the bounds tests. Only the
					// object-local BLAS bounds need the object's world matrix - the top-level bounds
					// are already in world space - so restore identity before top-level traversal resumes.
					${i} = mat4x4f(
						1.0, 0.0, 0.0, 0.0,
						0.0, 1.0, 0.0, 0.0,
						0.0, 0.0, 1.0, 0.0,
						0.0, 0.0, 0.0, 1.0
					);

				}
			`,transformShapeFn:_`
			fn cppTransformShape( shape: ptr<function, vec3f>, objectIndex: u32 ) -> void {

				${i} = ${r}[ objectIndex ].matrixWorld;

			}
		`,transformResultFn:_`
			fn cppTransformResult( result: ptr<function, ${Cr}>, objectIndex: u32 ) -> void {

				result.objectIndex = objectIndex;

			}
		`})}import{Matrix4 as Ps,Box3 as Sf}from"three";var Nr=24,As=(1<<Nr)-1,Wa=31-Nr,If=(1<<Wa)-1,Ms=new Ps,Bs=new Sf,Pr=new Ps,Ii=class extends Et{constructor(e,t){super(),t={getBVH:(n,l)=>{throw new Error("ClusteredBVH: getBVH callback must be provided ")},shouldCluster:n=>n.isSkinnedMesh||n.isInstancedMesh||n.isBatchedMesh,primitiveLimit:64,matrixWorld:Array.isArray(e)?new Ps:e.matrixWorld,includeInstances:!0,_strictLeafSize:1,...t};let r=Array.from(qa(e)),i=Math.ceil(Math.log2(r.length)),s=(1<<i)-1;this.objects=r,this.getBVH=t.getBVH,this.shouldCluster=t.shouldCluster,this.includeInstances=t.includeInstances,this.primitiveLimit=t.primitiveLimit,this.matrixWorld=t.matrixWorld,this.bvhMap=new WeakMap,this.idBits=i,this.idMask=s,this.primitiveBufferStride=2,this.init(t)}init(e){let t=0,{objects:r,bvhMap:i,matrixWorld:s}=this;Ms.copy(s).invert(),r.forEach(n=>{let l=[];for(let a=0,f=this._getInstanceCount(n);a<f;a++){let c=this.getBVH(n,a);l.push(c),c&&(t+=this.shouldCluster(n)?c._roots.length:this._countRelevantLeafNodes(c))}i.set(n,l)}),this.primitiveBuffer=new Uint32Array(t*2),this._fillPrimitiveBuffer(this.primitiveBuffer),super.init(e)}getRootRanges(){return[{offset:0,count:this.primitiveBuffer.length/this.primitiveBufferStride}]}refit(...e){Ms.copy(this.matrixWorld).invert(),super.refit(...e)}writePrimitiveBounds(e,t,r){let{primitiveBuffer:i,bvhMap:s,objects:n}=this,l=i[2*e+0],a=i[2*e+1],f=n[this.getObjectId(l)],c=this.getInstanceId(l),u=s.get(f)[c],d=this.getBVHRootIndex(a),h=this.getBVHNodeIndex(a);f.isInstancedMesh||f.isBatchedMesh?(f.getMatrixAt(c,Pr),Pr.premultiply(f.matrixWorld)):Pr.copy(f.matrixWorld),Pr.premultiply(Ms),W(h,new Float32Array(u._roots[d]),Bs),Bs.applyMatrix4(Pr);let{min:p,max:y}=Bs;t[r+0]=p.x,t[r+1]=p.y,t[r+2]=p.z,t[r+3]=y.x,t[r+4]=y.y,t[r+5]=y.z}getInstanceId(e){let{idMask:t,idBits:r}=this;return(e&~t)>>>r}getObjectId(e){let{idMask:t}=this;return e&t}getBVHRootIndex(e){return e>>>Nr}getBVHNodeIndex(e){return(e&As)*8}_getInstanceCount(e){let{includeInstances:t}=this;return e.isInstancedMesh&&t?e.count:e.isBatchedMesh&&t?e.instanceCount:1}_fillPrimitiveBuffer(e){let{objects:t,bvhMap:r,idBits:i,primitiveLimit:s}=this,n=0,l=(a,f,c,u)=>{if(u>As)throw new Error(`ClusteredBVH: cluster node index ${u} exceeds the ${Nr}-bit packing limit and cannot be represented.`);if(c>If)throw new Error(`ClusteredBVH: bvh root index ${c} exceeds the ${Wa}-bit packing limit and cannot be represented.`);e[2*n+0]=a<<i|f,e[2*n+1]=c<<Nr|u&As,n++};t.forEach((a,f)=>{r.get(a).forEach((c,u)=>{if(c)if(this.shouldCluster(a))for(let d=0,h=c._roots.length;d<h;d++)l(u,f,d,0);else Ua(c,s,(d,h)=>{l(u,f,d,h/8)})})})}_countRelevantLeafNodes(e){let{primitiveLimit:t}=this,r=0;return Ua(e,t,(i,s,n,l)=>{r++,l&&n>=t&&console.warn(`ClusteredBVH: a leaf node with ${n} primitives exceeds the cluster primitive limit of ${t} and cannot be subdivided further.`)}),r}};function Ua(o,e,t){let r=o._roots.length;for(let i=0;i<r;i++)we.setBVH(o,i),we.traverseBuffer((s,n,l)=>{let a=we.getRangeStart(l),c=we.getRangeEnd(l)-a;return c<e||n?(t(i,l,c,n),!0):!1});we.reset()}function qa(o,e=new Set){return Array.isArray(o)?o.forEach(t=>qa(t,e)):o.traverse(t=>{t.isMesh&&e.add(t)}),e}var ft=new ja,Fi=new ja,Df={start:0,count:0,vertexStart:0,vertexCount:0};function Ff(o){let e=o;for(;e;){if(e.visible===!1)return!1;e=e.parent}return!0}function Ga(o){return o._roots.reduce((e,t)=>e+t.byteLength,0)}function Qa(o,e){return`${o}_${e}`}var Ci=class{constructor(e,t={}){let{attributes:r={position:"vec4f"},autogenerateBvh:i=!0}=t;Array.isArray(e)||(e=[e]),e=e.map(s=>{if(s.isObject3D)return s;if(s.isBufferGeometry)return new _i(s);if(s instanceof Ne){let n=new _i;return n.geometry.boundsTree=s,n}}),this._bvhCache=new Map,this.autogenerateBvh=i,this.attributes=r,this.objects=e,this.bvh=null,this.storage=new $r,this.structs=new $r({transform:Ia}),this.fns=new $r({raycastFirstHit:Va(this),closestPointToPoint:ka(this),sampleTrianglePoint:null},O)}getRootObject(){let{objects:e}=this;if(e.isObject3D)return e;Array.isArray(e)||(e=[e]),e=e.map(r=>{if(r.isObject3D)return r;if(r.isBufferGeometry)return new _i(r);if(r instanceof Ne){let i=new _i;return i.geometry.boundsTree=r,i}});let t=new _f;return t.children=e,t}getShapecastFn(e){return za(this,e)}update(){let e=this.getRootObject(),t=0;e.traverse(N=>{N.isMesh&&t++}),this.bvh=new Ii(e,{strategy:2,getBVH:(N,Tt)=>this.getBVH(N,Tt,Df),primitiveLimit:t<3?1/0:64}),this.dispose();let{attributes:r,structs:i,bvh:s}=this,n=[],l=[],a=new Map,f=Ga(s),c=0,u=0,d=[],h=0,p=this._getTransformMap(s),{primitiveBuffer:y,primitiveBufferStride:v}=s;for(let N=0,Tt=y.length;N<Tt;N+=v){let wt=y[N],St=y[N+1],fr=s.objects[s.getObjectId(wt)],dr=s.getInstanceId(wt),hr={start:0,count:0,vertexStart:0,vertexCount:0},It=this.getBVH(fr,dr,hr);if(!It)throw new Error("BVHComputeData: BVH not found.");let re=n.find(Rt=>Rt.bvh===It);re||(re={index:n.length,bvh:It,range:hr,geometryOffset:0},c+=re.range.count,u+=re.range.vertexCount,n.push(re));let tt=s.getBVHRootIndex(St),_t=s.getBVHNodeIndex(St)/8,Qr=`${re.index}_${tt}_${_t}`,rt=a.get(Qr);if(rt===void 0){let Rt=Aa(It._roots[tt],_t);rt={data:re,root:tt,node:_t,size:Rt,base:0},a.set(Qr,rt),l.push(rt),f+=Rt*32,h=Math.max(h,_s(It._roots[tt],_t))}d.push({transformSlot:p.get(Qa(wt,tt)).slot,subtree:rt})}if(_s(s._roots[0])+h-1>Br.value)throw new Error("BVHComputeData: BVH depth overruns the compute stack depth.");let x=Math.max(p.size,2);c=Math.max(c,2),u=Math.max(u,2);let g=new Rf(r,"bvh_GeometryStruct"),b=0,S=0,w=new Uint32Array(c),R=new ArrayBuffer(u*g.getLength()*4),F=new ArrayBuffer(f);n.forEach(N=>{N.geometryOffset=S/3,N.bvh.indirect||(N.geometryOffset-=N.range.start/3),Pa(N.bvh,N.range,b,S,w),Na(N.bvh,N.range,b,R,g,this),S+=N.range.count,b+=N.range.vertexCount});let I=Ga(s)/32;l.forEach(N=>{N.base=I,Ba(N.data.bvh._roots[N.root],N.node,N.size,N.data.geometryOffset,I,F),I+=N.size}),d.forEach(N=>N.nodeOffset=N.subtree.base),Is(s,d,0,F);let C=new ArrayBuffer(i.transform.getLength()*x*4),D=Di(new Ri(new Uint32Array(F),1),oe).toReadOnly().setName("bvh_nodes"),A=new Ri(new Uint32Array(C),1),M=Di(A,i.transform).toReadOnly().setName("bvh_transforms"),B=Di(new Ri(w,1),"uint").toReadOnly().setName("bvh_index"),j=Di(new Ri(new Uint32Array(R),g.getLength()),g).toReadOnly().setName("bvh_attributes");this.storage.transforms=M,this.storage.nodes=D,this.storage.index=B,this.storage.attributes=j,this.structs.attributes=g,Fi.copy(s.matrixWorld).invert(),p.forEach(N=>{this.writeTransformData(N,Fi,N.slot,C)}),this.fns.sampleTrianglePoint=Ha(this),this._bvhCache.clear()}updateTransforms(){let{bvh:e,storage:t}=this;e.refit();let r=t.nodes.proxyNode.value;Is(e,null,0,r.array.buffer),r.needsUpdate=!0;let i=t.transforms.proxyNode.value,s=i.array.buffer;Fi.copy(e.matrixWorld).invert(),this._getTransformMap(e).forEach(n=>{this.writeTransformData(n,Fi,n.slot,s)}),i.needsUpdate=!0}writeTransformData(e,t,r,i){let{structs:s}=this,n=new Float32Array(i),l=new Uint32Array(i),{object:a,instanceId:f}=e;a.isInstancedMesh||a.isBatchedMesh?(a.getMatrixAt(f,ft),ft.premultiply(a.matrixWorld)):ft.copy(a.matrixWorld),ft.premultiply(t),ft.toArray(n,r*s.transform.getLength()),ft.invert(),ft.toArray(n,r*s.transform.getLength()+16);let c=Ff(a);a.isBatchedMesh&&(c=c&&a.getVisibleAt(f)),l[r*s.transform.getLength()+32]=c?1:0}getBVH(e,t,r){let{autogenerateBvh:i,_bvhCache:s}=this,n=null;if(e.boundsTree||e.isSkinnedMesh){let l=e.geometry;if(r.count=l.index?l.index.count:l.attributes.position.count,r.vertexCount=l.attributes.position.count,n=e.boundsTree||null,n===null&&i){let a=e.uuid;n=s.get(a)||new Ie(e),s.set(a,n)}}else if(e.isBatchedMesh){let l=e.getGeometryIdAt(t),a=e.getGeometryRangeAt(l);if(Object.assign(r,a),n=e.boundsTrees[l]||null,n===null&&i){let f=`batched_${e.geometry.uuid}_${a.start}_${a.count}`;n=s.get(f)||new Ee(e.geometry,{range:{...r}}),s.set(f,n)}}else{let l=e.geometry;if(r.count=l.index?l.index.count:l.attributes.position.count,r.vertexCount=l.attributes.position.count,n=e.geometry.boundsTree||null,n===null&&i){let a=l.uuid;n=s.get(a)||new Ee(l),s.set(a,n)}}return n}getDefaultAttributeValue(e,t){switch(e){case"position":case"color":t.set(1,1,1,1);break;default:t.set(0,0,0,0)}return t}dispose(){let{storage:e}=this;for(let t in e)e[t].value?.dispose()}_getTransformMap(e){let{primitiveBuffer:t,primitiveBufferStride:r}=e,i=new Map;for(let s=0,n=t.length;s<n;s+=r){let l=t[s],a=e.getBVHRootIndex(t[s+1]),f=Qa(l,a);if(i.has(f))continue;let c=i.size,u=e.objects[e.getObjectId(l)],d=e.getInstanceId(l);i.set(f,{object:u,instanceId:d,compositeId:l,root:a,slot:c})}return i}},$r=class{constructor(e={},t=H){let r={};return new Proxy({...e},{get(i,s){return r[s]||(r[s]=t(s,i)),r[s]},set(i,s,n){return i[s]=n,!0}})}};import{BufferGeometry as Cf,Float32BufferAttribute as Ka,OrthographicCamera as Af,Mesh as Mf}from"three";var Bf=new Af(-1,1,1,-1,0,1),Ns=class extends Cf{constructor(){super(),this.setAttribute("position",new Ka([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Ka([0,2,0,0,2,0],2))}},Pf=new Ns,ze=class{constructor(e){this._mesh=new Mf(Pf,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Bf)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};import{MeshBasicNodeMaterial as Nf,NoToneMapping as $f,StorageTexture as Xa}from"three/webgpu";import{uv as Ef,varying as Lf,texture as Ya,vec4 as zf,toneMapping as Of,uniform as Vf,wgslFn as Hf}from"three/tsl";var Ai=Hf(`
	fn sampleTexel( tex: texture_2d<f32>, coord: vec2f ) -> vec4f {

		// Manual bilinear filtering using textureLoad to support filterable float32 textures
		// on all devices
		let size = vec2f( textureDimensions( tex, 0 ) );

		// the path tracer stores its color rows top down
		let pxCoord = vec2f( coord.x, 1.0 - coord.y ) * size - 0.5;
		let px = vec2i( floor( pxCoord ) );
		let fr = fract( pxCoord );

		// get the four sibling samples
		let s00 = textureLoad( tex, clamp( px,                 vec2i( 0 ), vec2i( size ) - 1 ), 0 );
		let s10 = textureLoad( tex, clamp( px + vec2i( 1, 0 ), vec2i( 0 ), vec2i( size ) - 1 ), 0 );
		let s01 = textureLoad( tex, clamp( px + vec2i( 0, 1 ), vec2i( 0 ), vec2i( size ) - 1 ), 0 );
		let s11 = textureLoad( tex, clamp( px + vec2i( 1, 1 ), vec2i( 0 ), vec2i( size ) - 1 ), 0 );

		// interpolate on the x axis
		let y0 = mix( s00, s10, fr.x );
		let y1 = mix( s01, s11, fr.x );

		// then y
		return mix( y0, y1, fr.y );

	}
`),Mi=class extends Nf{get texture(){return this._texNode.value}set texture(e){this._texNode.value=e}get fromTexture(){return this._fromTexNode.value}set fromTexture(e){this._fromTexNode.value=e}get toneMapping(){return this._toneMapping.toneMapping}set toneMapping(e){this._toneMapping.setToneMapping(e)}get transition(){return this._transitionUniform.value}set transition(e){this._transitionUniform.value=e}get exposure(){return this._toneMapping.exposureNode.value}set exposure(e){this._toneMapping.exposureNode.value=e}constructor(e){super();let t=Ya(new Xa);this._texNode=t;let r=Ya(new Xa);this._fromTexNode=r;let i=Lf(Ef()),s=Vf(1);this._transitionUniform=s;let n=_`
			fn fade( uv: vec2f ) -> vec4f {

				if ( ${s} <= 0.0 ) {

					return ${Ai}( ${r}, uv );

				} else if ( ${s} >= 1.0 ) {

					return ${Ai}( ${t}, uv );

				} else {

					let col0 = ${Ai}( ${r}, uv );
					let col1 = ${Ai}( ${t}, uv );
					return mix( col0, col1, ${s} );

				}

			}
		`,l=Of($f,1,n(i));this._toneMapping=l,this.transparent=!0,this.colorNode=zf(l.rgb,l.a),this.setValues(e)}};import{Matrix4 as Za,StructTypeNode as kf}from"three/webgpu";import{uniform as Wt,uint as Uf,float as Ja}from"three/tsl";var $s=_`
	fn debugHeatColor( t: f32 ) -> vec3f {

		let r = clamp( 1.5 - abs( 4.0 * t - 3.0 ), 0.0, 1.0 );
		let g = clamp( 1.5 - abs( 4.0 * t - 2.0 ), 0.0, 1.0 );
		let b = clamp( 1.5 - abs( 4.0 * t - 1.0 ), 0.0, 1.0 );
		return vec3f( r, g, b );

	}
`,Bi=new kf({tlasCount:"uint",blasCount:"uint",didHit:"bool",dist:"float"},"DebugBoundsResult");function el(o){let{transforms:e,index:t,attributes:r,materials:i}=o.storage,s=Wt(new Za),n=Wt(new Za),l=Wt(1),a=Wt(1),f=Wt(0),c=Wt(64),u=Uf(0).toVar("bvh_debugBoundsLevel"),d=Ja(1).toVar("bvh_debugRayScalar"),h=Ja(0).toVar("bvh_debugMaterialSide"),p=_`
		fn debugGetBoundsOrder( ray: ${$}, splitAxis: u32, node: ${oe} ) -> bool {

			return ray.direction[ splitAxis ] >= 0.0;

		}
	`,y=_`
		fn debugIntersectsBounds( ray: ${$}, bounds: ${fe}, result: ptr<function, ${Bi}> ) -> u32 {

			let boundsMin = vec3( bounds.min[ 0 ], bounds.min[ 1 ], bounds.min[ 2 ] );
			let boundsMax = vec3( bounds.max[ 0 ], bounds.max[ 1 ], bounds.max[ 2 ] );

			let invDir = 1.0 / ray.direction;
			let tMinPlane = ( boundsMin - ray.origin ) * invDir;
			let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

			let tMinHit = min( tMinPlane, tMaxPlane );
			let tMaxHit = max( tMinPlane, tMaxPlane );

			let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
			let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

			let dist = max( t0, 0.0 );
			if ( t1 < dist ) {

				return 0u;

			} else if ( result.didHit && dist * ${d} >= result.dist ) {

				return 0u;

			}

			if ( ${u} == 1u ) {

				result.blasCount = result.blasCount + 1u;

			} else {

				result.tlasCount = result.tlasCount + 1u;

			}

			return 1u;

		}
	`,v=_`
		fn debugIntersectRange( ray: ${$}, offset: u32, count: u32, result: ptr<function, ${Bi}> ) -> bool {

			var didHit = false;
			if ( ${f} > 0.5 ) {

				for ( var ti = offset; ti < offset + count; ti = ti + 1u ) {

					let i0 = ${t}[ ti * 3u ];
					let i1 = ${t}[ ti * 3u + 1u ];
					let i2 = ${t}[ ti * 3u + 2u ];

					let a = ${r}[ i0 ].position.xyz;
					let b = ${r}[ i1 ].position.xyz;
					let c = ${r}[ i2 ].position.xyz;

					var triResult = ${ws}( ray, a, b, c );
					triResult.dist *= ${d};
					if ( triResult.didHit && ( ! result.didHit || triResult.dist < result.dist ) ) {

						// cull faces that don't match the material side
						if ( ${h} != 0.0 && triResult.side != ${h} ) {

							continue;

						}

						result.didHit = true;
						result.dist = triResult.dist;
						didHit = true;

					}

				}

			}

			return didHit;

		}
	`,T=_`
		fn debugTransformRay( ray: ptr<function, ${$}>, objectIndex: u32 ) -> void {

			let object = ${e}[ objectIndex ];
			let toLocal = object.inverseMatrixWorld;
			ray.origin = ( toLocal * vec4f( ray.origin, 1.0 ) ).xyz;
			ray.direction = ( toLocal * vec4f( ray.direction, 0.0 ) ).xyz;

			let len = length( ray.direction );
			ray.direction = ray.direction / len;
			${d} = 1.0 / len;

			${h} = ${i}[ object.materialIndex ].side;
			${u} = 1u;

		}
	`,m=_`
		fn debugResetLevel( objectIndex: u32 ) -> void {

			${d} = 1.0;
			${u} = 0u;

		}
	`,x=o.getShapecastFn({name:"debugBoundsCount",shapeStruct:$,resultStruct:Bi,boundsOrderFn:p,intersectsBoundsFn:y,intersectRangeFn:v,transformShapeFn:T,resetShapeFn:m}),g=_`
		fn debugBounds( vUv: vec2f ) -> vec4f {

			let ndc = vUv * 2.0 - vec2f( 1.0 );
			var ray = ${Si}( ndc, ${s} * ${n} );
			ray.direction = normalize( ray.direction );

			// count the boxes the ray crosses, pruning those behind the nearest hit surface
			var result: ${Bi};
			${x}( ray, &result );

			let tlas = select( 0u, result.tlasCount, ${l} > 0.5 );
			let blas = select( 0u, result.blasCount, ${a} > 0.5 );
			let count = tlas + blas;

			let t = clamp( f32( count ) / max( ${c}, 1.0 ), 0.0, 1.0 );

			return vec4f( ${$s}( t ), 1.0 );

		}
	`;return g.uniforms={cameraToModelMatrix:s,inverseProjectionMatrix:n,displayTLAS:l,displayBLAS:a,stopAtSurface:f,saturationCount:c},g}import{Matrix4 as cc,Vector2 as uc}from"three/webgpu";import{DataTexture as kl,Vector2 as Ul,StorageTexture as Xs}from"three/webgpu";var q=class{get computeNode(){return this.kernel.computeNode}get workgroupSize(){return this.kernel.workgroupSize}set needsUpdate(e){this.setWorkgroupSize(...this.workgroupSize)}constructor(e,t={}){let{workgroupSize:r=[64],context:i={}}=t;this._fn=e,this.kernel=null,this.context=i,this.setWorkgroupSize(...r)}defineUniformAccessors(e){for(let t in e){if(t in this)throw new Error(`ComputeNode: Uniform name ${t} is already defined.`);"value"in e[t]&&Object.defineProperty(this,t,{get(){return e[t].value},set(i){e[t].value=i}})}}setWorkgroupSize(e=64,t=1,r=1){let i=this._fn.context(this.context);return i.parameters=this._fn.parameters,this.kernel?.dispose(),this.kernel=i.computeKernel([e,t,r]),this}dispose(){this.kernel?.dispose(),this.kernel=null}getDispatchSize(e=1,t=1,r=1,i=[]){let[s,n,l]=this.workgroupSize;return i.length=3,i[0]=Math.ceil(e/s),i[1]=Math.ceil(t/n),i[2]=Math.ceil(r/l),i}};import{texture as Td,sampler as wd,uniform as be,globalId as Sd,textureStore as Ys}from"three/tsl";import{uint as Ni,float as Wf,wgsl as qf,wgslFn as Er}from"three/tsl";var tl=Ni(256*256),il=Wf(1/16777216),Gf=qf(`

	const SOBOL_DIRECTIONS_1 = array<u32, 32>(
		0x80000000u, 0xc0000000u, 0xa0000000u, 0xf0000000u,
		0x88000000u, 0xcc000000u, 0xaa000000u, 0xff000000u,
		0x80800000u, 0xc0c00000u, 0xa0a00000u, 0xf0f00000u,
		0x88880000u, 0xcccc0000u, 0xaaaa0000u, 0xffff0000u,
		0x80008000u, 0xc000c000u, 0xa000a000u, 0xf000f000u,
		0x88008800u, 0xcc00cc00u, 0xaa00aa00u, 0xff00ff00u,
		0x80808080u, 0xc0c0c0c0u, 0xa0a0a0a0u, 0xf0f0f0f0u,
		0x88888888u, 0xccccccccu, 0xaaaaaaaau, 0xffffffffu
	);

	const SOBOL_DIRECTIONS_2 = array<u32, 32>(
		0x80000000u, 0xc0000000u, 0x60000000u, 0x90000000u,
		0xe8000000u, 0x5c000000u, 0x8e000000u, 0xc5000000u,
		0x68800000u, 0x9cc00000u, 0xee600000u, 0x55900000u,
		0x80680000u, 0xc09c0000u, 0x60ee0000u, 0x90550000u,
		0xe8808000u, 0x5cc0c000u, 0x8e606000u, 0xc5909000u,
		0x6868e800u, 0x9c9c5c00u, 0xeeee8e00u, 0x5555c500u,
		0x8000e880u, 0xc0005cc0u, 0x60008e60u, 0x9000c590u,
		0xe8006868u, 0x5c009c9cu, 0x8e00eeeeu, 0xc5005555u
	);

	const SOBOL_DIRECTIONS_3 = array<u32, 32>(
		0x80000000u, 0xc0000000u, 0x20000000u, 0x50000000u,
		0xf8000000u, 0x74000000u, 0xa2000000u, 0x93000000u,
		0xd8800000u, 0x25400000u, 0x59e00000u, 0xe6d00000u,
		0x78080000u, 0xb40c0000u, 0x82020000u, 0xc3050000u,
		0x208f8000u, 0x51474000u, 0xfbea2000u, 0x75d93000u,
		0xa0858800u, 0x914e5400u, 0xdbe79e00u, 0x25db6d00u,
		0x58800080u, 0xe54000c0u, 0x79e00020u, 0xb6d00050u,
		0x800800f8u, 0xc00c0074u, 0x200200a2u, 0x50050093u
	);

	const SOBOL_DIRECTIONS_4 = array<u32, 32>(
		0x80000000u, 0x40000000u, 0x20000000u, 0xb0000000u,
		0xf8000000u, 0xdc000000u, 0x7a000000u, 0x9d000000u,
		0x5a800000u, 0x2fc00000u, 0xa1600000u, 0xf0b00000u,
		0xda880000u, 0x6fc40000u, 0x81620000u, 0x40bb0000u,
		0x22878000u, 0xb3c9c000u, 0xfb65a000u, 0xddb2d000u,
		0x78022800u, 0x9c0b3c00u, 0x5a0fb600u, 0x2d0ddb00u,
		0xa2878080u, 0xf3c9c040u, 0xdb65a020u, 0x6db2d0b0u,
		0x800228f8u, 0x400b3cdcu, 0x200fb67au, 0xb00ddb9du
	);

`),nl=Ni(0).toVar("sobolPixelIndex"),sl=Ni(0).toVar("sobolPathIndex"),Es=Ni(0).toVar("sobolBounceIndex"),Pi=Er(`
	fn getMaskedSobol( index: u32, directions: array<u32, 32> ) -> u32 {

		var X = 0u;
		for ( var bit = 0u; bit < 32u; bit ++ ) {

			let mask = ( index >> bit ) & 1u;
			X ^= mask * directions[ bit ];

		}
		return X;

	}
`),Qf=(o=1)=>{if(o<=0)return;let e=o>1?`vec${o}u`:"u32",t=Er(`
		fn sobolReverseBits_${e}( in: ${e} ) -> ${e} {

			var x = in;
			x = ( ( ( x & ${e}( 0xaaaaaaaau ) ) >> ${e}( 1 ) ) | ( ( x & ${e}( 0x55555555u ) ) << ${e}( 1 ) ) );
			x = ( ( ( x & ${e}( 0xccccccccu ) ) >> ${e}( 2 ) ) | ( ( x & ${e}( 0x33333333u ) ) << ${e}( 2 ) ) );
			x = ( ( ( x & ${e}( 0xf0f0f0f0u ) ) >> ${e}( 4 ) ) | ( ( x & ${e}( 0x0f0f0f0fu ) ) << ${e}( 4 ) ) );
			x = ( ( ( x & ${e}( 0xff00ff00u ) ) >> ${e}( 8 ) ) | ( ( x & ${e}( 0x00ff00ffu ) ) << ${e}( 8 ) ) );
			return ( ( x >> ${e}( 16 ) ) | ( x << ${e}( 16 ) ) );

		}
	`),r=Er(`
		fn sobolHashCombine_${e}( seed: u32, v: ${e} ) -> ${e} {

			return ${e}( seed ) ^ ( v + ${e}( ( seed << 6 ) + ( seed >> 2 ) ) );

		}
	`),i=Er(`
		fn sobolLaineKarrasPermutation_${e}( in: ${e}, seed: ${e} ) -> ${e} {

			var x = in;
			x += seed;
			x ^= x * 0x6c50b47cu;
			x ^= x * 0xb82f1e52u;
			x ^= x * 0xc7afe638u;
			x ^= x * 0x8d22f6e6u;
			return x;

		}
	`),s=_`
		fn nestedUniformScrambleBase2_${e}( x: ${e}, seed: ${e} ) -> ${e} {

			var res = ${i}( x, seed );
			res = ${t}( res );
			return res;

		}
	`;return{reverseBits:t,hashCombine:r,lkPermutation:i,scramble:s}},xe=Array.from({length:5},(o,e)=>Qf(e)),jf=_`
  	${[Gf]}
	fn generateSobolPoint( id: u32 ) -> vec4f {

		var index = id;
		if ( index >= ${tl} ) {

			index = index % ${tl};
			// return vec4( 0.0 );

		}

		// NOTE: this sobol "direction" is also available but we can't write out 5 components
		// uint x = index & 0x00ffffffu;
		let x = ${xe[1].reverseBits}( ${Pi}( index, SOBOL_DIRECTIONS_1 ) ) & 0x00ffffffu;
		let y = ${xe[1].reverseBits}( ${Pi}( index, SOBOL_DIRECTIONS_2 ) ) & 0x00ffffffu;
		let z = ${xe[1].reverseBits}( ${Pi}( index, SOBOL_DIRECTIONS_3 ) ) & 0x00ffffffu;
		let w = ${xe[1].reverseBits}( ${Pi}( index, SOBOL_DIRECTIONS_4 ) ) & 0x00ffffffu;

		return vec4( f32( x ), f32( y ), f32( z ), f32( w ) ) * ${il};

	}
`,rl=Er(`
	fn sobolHash( in: u32 ) -> u32 {

		var x = in;
		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}
`),Kf=_`
	fn sobolGetSeed( effect: u32 ) -> u32 {

		return ${rl}(
			${xe[1].hashCombine}(
				${xe[1].hashCombine}(
					${rl}( ${Es} ),
					${nl}
				),
				effect
			)
		);

	}
`,$i=(o=1,e=jf)=>{if(o<=0)return;let t=o>1?`vec${o}u`:"u32",r=o>1?`vec${o}f`:"f32",i=".r",s="1u";return o===2?(i=".rg",s="vec2( 1u, 2u )"):o===3?(i=".rgb",s="vec3( 1u, 2u, 3u )"):o===4&&(i="",s="vec4( 1u, 2u, 3u, 4u )"),_`
		fn sobol${o}( effect: u32 ) -> ${r} {

			let seed = ${Kf}( effect );
			let index = ${sl};

			let shuffle_seed = ${xe[1].hashCombine}( seed, 0u );
			let shuffled_index = ${xe[1].scramble}( ${xe[1].reverseBits}( index ), shuffle_seed );
			let sobol_pt = ${e}( shuffled_index )${i};
			var result = ${t}( sobol_pt * 16777216.0 );

			let seed2 = ${xe[o].hashCombine}( seed, ${s} );
			result = ${xe[o].scramble}( result, seed2 );

			return ${il} * ${r}( result >> ${t}( 8 ) );

		}
	`},ol=$i(1),al=$i(2),ll=$i(3),Ei=$i(4),Li=_`
	fn sobolInit( pixel: vec2u, pathIndex: u32, bounceIndex: u32 ) -> void {

		${nl} = ( pixel.x << 16 ) | pixel.y;
		${sl} = pathIndex;
		${Es} = bounceIndex;

	}
`,zi=_`
	fn sobolNextBounce() -> void {

		${Es}++;

	}
`;var Oi=0,Vi=1,cl=2,Hi=3;var ki=5,Ui=6,Wi=7,qi=50,ve=ct("random.rngInit",Li),Ls=ct("random.rngNextBounce",zi),Re=ct("random.rand1",ol),ye=ct("random.rand2",al),Gi=ct("random.rand3",ll),Pv=ct("random.rand4",Ei);import{wgslFn as Ce}from"three/tsl";import{wgsl as Yf}from"three/tsl";import{StructTypeNode as De}from"three/webgpu";var V=Yf(`

	const PI: f32 = 3.141592653589793;
	const EPSILON: f32 = 1e-5;
	const MIN_ROUGHNESS: f32 = 1e-3;
	const MIN_INCIDENT_COS: f32 = 1e-3;

`),Oe=new De({color:"vec3f",isTransmissive:"bool",direction:"vec3f",pdf:"float"},"ScatterRecord"),zs=new De({reflectance:"vec3f",transmittance:"vec3f",reflectProbability:"float"},"TransmissionFresnel"),ul=new De({color:"vec3",map:"int",metalness:"float",metalnessMap:"int",roughness:"float",roughnessMap:"int",ior:"float",transmission:"float",transmissionMap:"int",emissiveIntensity:"float",emissive:"vec3",emissiveMap:"int",normalMap:"int",normalScale:"vec2",clearcoat:"float",clearcoatMap:"int",clearcoatNormalMap:"int",clearcoatNormalScale:"vec2",clearcoatRoughness:"float",clearcoatRoughnessMap:"int",iridescenceMap:"int",iridescenceThicknessMap:"int",iridescence:"float",iridescenceIor:"float",iridescenceThicknessMinimum:"float",iridescenceThicknessMaximum:"float",diffuseRoughness:"float",dispersion:"float",specularColor:"vec3",specularColorMap:"int",specularIntensity:"float",specularIntensityMap:"int",thinWall:"int",attenuationColor:"vec3",attenuationDistance:"float",alphaMap:"int",castShadow:"int",opacity:"float",alphaTest:"float",side:"float",matte:"int",sheen:"float",sheenColor:"vec3",sheenColorMap:"int",sheenRoughness:"float",sheenRoughnessMap:"int",vertexColors:"int",flatShading:"int",transparent:"int",fogVolume:"int",anisotropy:"float",anisotropyRotation:"float",anisotropyMap:"int",mapTransform:"mat3",metalnessMapTransform:"mat3",roughnessMapTransform:"mat3",transmissionMapTransform:"mat3",emissiveMapTransform:"mat3",normalMapTransform:"mat3",clearcoatMapTransform:"mat3",clearcoatNormalMapTransform:"mat3",clearcoatRoughnessMapTransform:"mat3",sheenColorMapTransform:"mat3",sheenRoughnessMapTransform:"mat3",iridescenceMapTransform:"mat3",iridescenceThicknessMapTransform:"mat3",specularColorMapTransform:"mat3",specularIntensityMapTransform:"mat3",alphaMapTransform:"mat3",anisotropyMapTransform:"mat3"},"Material"),ee=new De({volumeParticle:"bool",faceNormal:"vec3f",frontFace:"bool",normal:"vec3f",normalBasis:"mat3x3f",normalInvBasis:"mat3x3f",eta:"f32",f0:"f32",roughness:"f32",diffuseRoughness:"f32",metalness:"f32",anisotropy:"f32",color:"vec3f",emission:"vec3f",opacity:"f32",ior:"f32",transmission:"f32",thinWall:"bool",attenuationColor:"vec3f",attenuationDistance:" f32",clearcoatNormal:"vec3f",clearcoatBasis:"mat3x3f",clearcoatInvBasis:"mat3x3f",clearcoat:"f32",clearcoatRoughness:"f32",sheen:"f32",sheenColor:"vec3f",sheenRoughness:"f32",iridescence:"f32",iridescenceIor:"f32",iridescenceThickness:"f32",specularColor:"vec3f",specularIntensity:"f32"},"SurfaceRecord"),Lv=new De({rotation:"mat3x3f",intensity:"float",blur:"float",totalSum:"float"},"EnvironmentInfo"),Os=new De({color:"vec3f",direction:"vec3f",pdf:"float"},"EnvironmentSample"),Ve=new De({position:"vec3f",lightType:"int",color:"vec3f",intensity:"float",u:"vec3f",visibleToCameraRays:"int",v:"vec3f",area:"float",radius:"float",decay:"float",distance:"float",coneCos:"float",penumbraCos:"float",iesProfile:"int"},"Light"),ae=new De({dist:"float",direction:"vec3f",pdf:"float",emission:"vec3f",lightType:"int"},"LightRecord"),fl=new De({diffuse:"float",specular:"float",transmission:"float",clearcoat:"float"},"LobeWeights"),Vs=new De({V:"vec3f",L:"vec3f",H:"vec3f",VdotH:"float"},"BxDFContext");import{wgslFn as Z}from"three/tsl";var hl=Z(`

	fn inverse(m: mat3x3f) -> mat3x3f {
		var adj: mat3x3f;
		adj[0][0] =   (m[1][1] * m[2][2] - m[2][1] * m[1][2]);
		adj[1][0] = - (m[1][0] * m[2][2] - m[2][0] * m[1][2]);
		adj[2][0] =   (m[1][0] * m[2][1] - m[2][0] * m[1][1]);
		adj[0][1] = - (m[0][1] * m[2][2] - m[2][1] * m[0][2]);
		adj[1][1] =   (m[0][0] * m[2][2] - m[2][0] * m[0][2]);
		adj[2][1] = - (m[0][0] * m[2][1] - m[2][0] * m[0][1]);
		adj[0][2] =   (m[0][1] * m[1][2] - m[1][1] * m[0][2]);
		adj[1][2] = - (m[0][0] * m[1][2] - m[1][0] * m[0][2]);
		adj[2][2] =   (m[0][0] * m[1][1] - m[1][0] * m[0][1]);

		let det = ( m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
			- m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
			+ m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]));

		return adj * ( 1.0 / det );
	}

`),pl=Z(`

	fn getBasisFromNormal( normal: vec3f ) -> mat3x3f {

		var other: vec3f;
		if ( abs( normal.x ) > 0.5 ) {

			other = vec3f( 0.0, 1.0, 0.0 );

		} else {

			other = vec3f( 1.0, 0.0, 0.0 );

		}

		let ortho = normalize( cross( normal, other ) );
		let ortho2 = normalize( cross( normal, ortho ) );
		return mat3x3f( ortho2, ortho, normal );

	}

`),le=Z(`

	fn iorToF0( ior: f32 ) -> f32 {
		return pow( ( 1 - ior ) / ( 1 + ior ), 2 );
	}

`),ml=Z(`

	fn iorToF0General( transmittedIor: f32, incidentIor: f32 ) -> f32 {

		return pow( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ), 2 );

	}

`),gl=Z(`

	fn iorToF0GeneralVec( transmittedIor: vec3f, incidentIor: vec3f ) -> vec3f {

		let v = ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor );
		return v * v;

	}

`),xl=Z(`

	fn fresnel0ToIor( f0: vec3f ) -> vec3f {

		let sqrtF0 = sqrt( f0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

`),Fe=Z(`

	fn schlickFresnel( cosine: f32, f0: f32 ) -> f32 {

		return f0 + ( 1.0 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

`),qt=Z(`

	fn schlickFresnelVec( cosine: f32, f0: vec3f, f90: vec3f ) -> vec3f {

		return f0 + ( f90 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

`),ji=Z(`

	fn totalInternalReflection( cosTheta: f32, eta: f32 ) -> bool {

		let sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		return eta * sinTheta > 1.0;

	}

`),vl=Z(`

	fn totalInternalReflectionVec( cosTheta: f32, eta: vec3f ) -> vec3<bool> {

		let sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		return eta * sinTheta > vec3f( 1.0 );

	}

`),kv=Z(`

	fn evaluateFresnel( cosine: f32, eta: f32, f0: vec3f, f90: vec3f ) -> vec3f {

		if ( totalInternalReflection( cosine, eta ) ) {

			return f90;

		}

		return f0 + ( f90 - f0 ) * pow( 1.0 - cosine, 5.0 );
	}

`,[ji]),dt=Z(`

	fn dielectricFresnel( cosThetaI: f32, eta: f32 ) -> f32 {

		// https://schuttejoe.github.io/post/disneybsdf/
		let ni = eta;
		let nt = 1.0;

		// Check for total internal reflection
		let sinThetaISq = 1.0 - cosThetaI * cosThetaI;
		let sinThetaTSq = eta * eta * sinThetaISq;
		if ( sinThetaTSq >= 1.0 ) {

			return 1.0;

		}

		let sinThetaT = sqrt( sinThetaTSq );
		let cosThetaT = sqrt( max( 0.0, 1.0 - sinThetaT * sinThetaT ) );
		let rParallel = ( ( nt * cosThetaI ) - ( ni * cosThetaT ) ) / ( ( nt * cosThetaI ) + ( ni * cosThetaT ) );
		let rPerpendicular = ( ( ni * cosThetaI ) - ( nt * cosThetaT ) ) / ( ( ni * cosThetaI ) + ( nt * cosThetaT ) );
		return ( rParallel * rParallel + rPerpendicular * rPerpendicular ) / 2.0;

	}

`),yl=Z(`

	fn disneyFresnel( wo: vec3f, wi: vec3f, wh: vec3f, f0: f32, eta: f32, metalness: f32 ) -> f32 {

		let dotHV = dot( wo, wh );
		if ( totalInternalReflection( dotHV, eta ) ) {

			return 1.0;

		}

		let dotHL = dot( wi, wh );
		let dielectricF = dielectricFresnel( abs( dotHV ), eta );
		let metallicF = schlickFresnel( dotHL, f0 );

		return mix( dielectricF, metallicF, metalness );

	}

`,[ji,dt,Fe]),Gt=Z(`

	fn isTerminatingScatter( scatterRec: ScatterRecord ) -> bool {

		return scatterRec.pdf <= 0;

	}

`,[Oe]),J=Z(`

	fn clampPathContribution( contribution: vec3f, pathDepth: u32, clampDirect: f32, clampIndirect: f32 ) -> vec3f {

		let limit = select( clampIndirect, clampDirect, pathDepth <= 1u ) * 3.0;
		if ( limit <= 0.0 ) {

			return contribution;

		}

		let strength = dot( abs( contribution ), vec3f( 1.0 ) );
		if ( strength > limit ) {

			return contribution * ( limit / strength );

		}

		return contribution;

	}

`),dl=Z(`

	fn applyWrap( v: f32, wrapMode: i32 ) -> f32 {

		var res = v;
		if ( wrapMode == 1 ) {

			// ClampToEdge
			res = clamp( res, 0.0, 1.0 );

		} else if ( wrapMode == 2 ) {

			// MirroredRepeat
			res = 1.0 - abs( 2.0 * fract( res * 0.5 ) - 1.0 );

		} else {

			// Repeat
			res = fract( res );

		}

		return res;

	}

`),Xe=Z(`

	fn offsetRayOrigin( point: vec3f, direction: vec3f, geometricNormal: vec3f ) -> vec3f {

		let normal = normalize( select( -geometricNormal, geometricNormal, dot( direction, geometricNormal ) >= 0.0 ) );
		let intScale = 256.0;
		let integerOffset = vec3i( intScale * normal );
		let pointBits = bitcast<vec3i>( point );
		let signedOffset = select( integerOffset, -integerOffset, point < vec3f( 0.0 ) );
		let offsetPoint = bitcast<vec3f>( pointBits + signedOffset );
		let origin = 1.0 / 32.0;
		let floatScale = 1.0 / 65536.0;
		return select( offsetPoint, point + floatScale * normal, abs( point ) < vec3f( origin ) );

	}

`),Qi=Z(`

	fn wrapTexelIndex( i: i32, size: i32, wrapMode: i32 ) -> i32 {

		if ( wrapMode == 0 ) {

			// Repeat wraps to the opposite edge
			return ( ( i % size ) + size ) % size;

		}

		// ClampToEdge and MirroredRepeat both fold back onto the edge texel
		return clamp( i, 0, size - 1 );

	}

`),Ki=(o,e,t="sampleTexel")=>_`

	fn ${t}( uv: vec2f, packed: i32, lod: f32 ) -> vec4f {

		let texIndex = packed & 0x7FFFFF;
		let wrapS    = ( packed >> 26 ) & 0x3;
		let wrapT    = ( packed >> 28 ) & 0x3;
		let nearest  = ( packed >> 30 ) & 0x1;

		// look up the texture's rect and page within the atlas. three wraps a
		// uniformArray in a struct ( textureInfoStruct ) with a "value" array member.
		let info   = ${o}[ u32( texIndex ) ];
		let offset = vec2f( vec2u( info.x & 0xFFFFu, info.x >> 16u ) );
		let size   = vec2f( vec2u( info.y & 0xFFFFu, info.y >> 16u ) );
		let page   = i32( info.z & 0xFFFFu );

		// wrap is applied on the logical uv first, then remapped into the tile
		let wrappedUv = vec2f(
			${dl}( uv.x, wrapS ),
			${dl}( uv.y, wrapT ),
		);

		if ( nearest == 1 ) {

			let tileTexel = clamp( vec2i( wrappedUv * size ), vec2i( 0 ), vec2i( size ) - vec2i( 1 ) );
			return textureLoad( ${e}, vec2i( offset ) + tileTexel, page, 0 );

		} else {

			// The tile's neighbors in the atlas are unrelated textures, so hardware
			// filtering cannot supply the taps that fall outside it. Filter here instead
			// and resolve each tap through the wrap mode.
			let texelPos = wrappedUv * size - vec2f( 0.5 );
			let basePos = floor( texelPos );
			let base = vec2i( basePos );
			let f = texelPos - basePos;

			let intSize = vec2i( size );
			let x0 = ${Qi}( base.x,     intSize.x, wrapS );
			let x1 = ${Qi}( base.x + 1, intSize.x, wrapS );
			let y0 = ${Qi}( base.y,     intSize.y, wrapT );
			let y1 = ${Qi}( base.y + 1, intSize.y, wrapT );

			let tile = vec2i( offset );
			let c00 = textureLoad( ${e}, tile + vec2i( x0, y0 ), page, 0 );
			let c10 = textureLoad( ${e}, tile + vec2i( x1, y0 ), page, 0 );
			let c01 = textureLoad( ${e}, tile + vec2i( x0, y1 ), page, 0 );
			let c11 = textureLoad( ${e}, tile + vec2i( x1, y1 ), page, 0 );

			return mix(
				mix( c00, c10, f.x ),
				mix( c01, c11, f.x ),
				f.y,
			);

		}

	}
`;var Zf=Ce(`

	fn sampleSphere( uv: vec2f ) -> vec3f {

		let u = ( uv.x - 0.5 ) * 2.0;
		let t = uv.y * PI * 2.0;
		let f = sqrt( 1.0 - u * u );

		return vec3f( f * cos( t ), f * sin( t ), u );

	}

`,[V]),bl=Ce(`

	fn diffuseDirection( wo: vec3f, uv: vec2f ) -> vec3f {

		var lightDirection = sampleSphere( uv );
		lightDirection.z += 1.0;
		lightDirection = normalize( lightDirection );

		return lightDirection;

	}

`,[Zf]),Hs=Ce(`

	fn getLobeWeights( wo: vec3f, wi: vec3f, woClearcoat: vec3f, wh: vec3f, clearcoatIor: f32, surf: SurfaceRecord ) -> LobeWeights {

		var weights: LobeWeights;
		var remaining = 1.0;

		let clearcoatF0 = iorToF0( clearcoatIor );
		let clearcoatFresnel = schlickFresnel( saturate( woClearcoat.z ), clearcoatF0 );
		weights.clearcoat = surf.clearcoat * clearcoatFresnel;
		remaining -= weights.clearcoat;

		// this specular lobe only handles the opaque portion of the specular
		let fEstimate = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );
		weights.specular = remaining * ( surf.metalness + ( 1.0 - surf.metalness ) * ( 1.0 - surf.transmission ) * fEstimate );
		remaining -= weights.specular;

		// the transmission lobe covers both the reflected and refracted halves of the transmissive portion
		weights.transmission = remaining * surf.transmission;
		remaining -= weights.transmission;

		weights.diffuse = remaining;

		return weights;

	}

`,[yl,Fe,le,fl,V]),Qt=Ce(`

	fn equirectDirectionToUv(direction: vec3f) -> vec2f {

		// from Spherical.setFromCartesianCoords
		var uv = vec2f( atan2( direction.z, direction.x ), acos( direction.y ) );
		uv /= vec2f( 2.0 * PI, PI );

		// apply adjustments to get values in range [0, 1] and y right side up
		uv.x += 0.5;
		uv.y = 1.0 - uv.y;
		return uv;

	}

`),Tl=Ce(`

	fn sampleHemisphere( n: vec3f, uv: vec2f ) -> vec3f {

		// https://www.rorydriscoll.com/2009/01/07/better-sampling/
		// https://graphics.pixar.com/library/OrthonormalB/paper.pdf
		let sign = select( sign( n.z ), 1.0, n.z == 0.0 );
		let a = - 1.0 / ( sign + n.z );
		let b = n.x * n.y * a;
		let b1 = vec3( 1.0 + sign * n.x * n.x * a, sign * b, - sign * n.x );
		let b2 = vec3( b, sign + n.y * n.y * a, - n.y );

		let r = sqrt( uv.x );
		let theta = 2.0 * PI * uv.y;
		let x = r * cos( theta );
		let y = r * sin( theta );
		return x * b1 + y * b2 + sqrt( 1.0 - uv.x ) * n;

	}

`,[V]),Ae=Ce(`

	fn misHeuristic( a: f32, b: f32 ) -> f32 {

		let aa = a * a;
		let bb = b * b;
		return aa / ( aa + bb );

	}

`),Lr=Ce(`

	fn luminance( color: vec3f ) -> f32 {

		return dot( color, vec3f( 0.2126, 0.7152, 0.0722 ) );

	}

`),wl=Ce(`

	fn equirectUvToDirection( uvIn: vec2f ) -> vec3f {

		// undo the adjustments applied in equirectDirectionToUv
		var uv = uvIn;
		uv.x -= 0.5;
		uv.y = 1.0 - uv.y;

		let theta = uv.x * 2.0 * PI;
		let phi = uv.y * PI;
		let sinPhi = sin( phi );

		return vec3f( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

	}

`,[V]),Qv=Ce(`

	fn equirectDirectionPdf( direction: vec3f ) -> f32 {

		let uv = equirectDirectionToUv( direction );
		let theta = uv.y * PI;
		let sinTheta = sin( theta );
		if ( sinTheta == 0.0 ) {

			return 0.0;

		}

		return 1.0 / ( 2.0 * PI * PI * sinTheta );

	}

`,[V,Qt]),Xi=Ce(`

	fn weightedAlphaBlend( prevColor: vec4f, newColor: vec4f, weight: f32 ) -> vec4f {

		let invWeight = 1.0 - weight;
		let totalAlpha = prevColor.a * invWeight + newColor.a * weight;
		var blendedColor = vec4f( 0 );
		if ( totalAlpha != 0.0 ) {

			let prevContrib = prevColor.rgb * invWeight * prevColor.a / totalAlpha;
			let resContrib = newColor.rgb * weight * newColor.a / totalAlpha;
			blendedColor = vec4f( prevContrib + resContrib, totalAlpha );

		}

		return blendedColor;

	}

`);import{wgslFn as Ye}from"three/tsl";var Yi=0,Zi=1,ks=2,Us=3,Ws=4,zr=5,Ze=1e30,Ji=1e-5,en=Ye(`

	fn isMISWeightLight( lightType: i32 ) -> bool {

		return lightType == ${zr} || lightType == ${Zi} || lightType == ${Yi};

	}

`),qs=Ye(`

	fn getSpotAttenuation( coneCosine: f32, penumbraCosine: f32, angleCosine: f32 ) -> f32 {

		return smoothstep( coneCosine, penumbraCosine, angleCosine );

	}

`),tn=Ye(`

	fn getDistanceAttenuation( lightDistance: f32, cutoffDistance: f32, decayExponent: f32 ) -> f32 {

		// based upon Frostbite 3 Moving to Physically-based Rendering
		// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		var distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), EPSILON );
		if ( cutoffDistance > 0.0 ) {

			let window = clamp( 1.0 - pow( lightDistance / cutoffDistance, 4.0 ), 0.0, 1.0 );
			distanceFalloff *= window * window;

		}

		return distanceFalloff;

	}

`,[V]),Sl=Ye(`

	fn intersectsRectangle( center: vec3f, normal: vec3f, u: vec3f, v: vec3f, rayOrigin: vec3f, rayDirection: vec3f ) -> f32 {

		let t = dot( center - rayOrigin, normal ) / dot( rayDirection, normal );
		if ( t > EPSILON ) {

			let p = rayOrigin + rayDirection * t;
			let vi = p - center;

			let a1 = dot( u, vi );
			if ( abs( a1 ) <= 0.5 ) {

				let a2 = dot( v, vi );
				if ( abs( a2 ) <= 0.5 ) {

					return t;

				}

			}

		}

		return - 1.0;

	}

`,[V]),Il=Ye(`

	fn intersectsCircle( position: vec3f, normal: vec3f, u: vec3f, v: vec3f, rayOrigin: vec3f, rayDirection: vec3f ) -> f32 {

		let t = dot( position - rayOrigin, normal ) / dot( rayDirection, normal );
		if ( t > EPSILON ) {

			let hit = rayOrigin + rayDirection * t;
			let vi = hit - position;

			let a1 = dot( u, vi );
			let a2 = dot( v, vi );
			if ( length( vec2f( a1, a2 ) ) <= 0.5 ) {

				return t;

			}

		}

		return - 1.0;

	}

`,[V]),_l=Ye(`

	fn randomAreaLightSample( light: Light, rayOrigin: vec3f, ruv: vec2f ) -> LightRecord {

		var randomPos = vec3f( 0.0 );
		if ( light.lightType == ${Yi} ) {

			randomPos = light.position + light.u * ( ruv.x - 0.5 ) + light.v * ( ruv.y - 0.5 );

		} else if ( light.lightType == ${Zi} ) {

			let r = 0.5 * sqrt( ruv.x );
			let theta = ruv.y * 2.0 * PI;
			randomPos = light.position + light.u * ( r * cos( theta ) ) + light.v * ( r * sin( theta ) );

		}

		let toLight = randomPos - rayOrigin;
		let lightDistSq = dot( toLight, toLight );
		let dist = sqrt( lightDistSq );
		let direction = toLight / dist;
		let lightNormal = normalize( cross( light.u, light.v ) );

		var lightRec: LightRecord;
		lightRec.lightType = light.lightType;
		lightRec.emission = light.color * light.intensity;
		lightRec.dist = dist;
		lightRec.direction = direction;

		// points behind or edge-on to the light receive no contribution
		let cosTheta = dot( direction, lightNormal );
		if ( cosTheta <= 0.0 ) {

			lightRec.pdf = 0.0;

		} else {

			lightRec.pdf = lightDistSq / ( light.area * cosTheta );

		}

		return lightRec;

	}

`,[Ve,ae,V]),Rl=Ye(`

	fn randomSpotLightSample( light: Light, rayOrigin: vec3f, ruv: vec2f ) -> LightRecord {

		let radius = light.radius * sqrt( ruv.x );
		let theta = ruv.y * 2.0 * PI;
		let x = radius * cos( theta );
		let y = radius * sin( theta );

		let u = light.u;
		let v = light.v;
		let normal = normalize( cross( u, v ) );

		let angle = acos( light.coneCos );
		let angleTan = tan( angle );
		let startDistance = light.radius / max( angleTan, EPSILON );

		let randomPos = light.position - normal * startDistance + u * x + v * y;
		let toLight = randomPos - rayOrigin;
		let lightDistSq = dot( toLight, toLight );
		let dist = sqrt( lightDistSq );

		let direction = toLight / max( dist, EPSILON );
		let distanceAttenuation = getDistanceAttenuation( dist, light.distance, light.decay );

		var lightRec: LightRecord;
		lightRec.lightType = light.lightType;
		lightRec.dist = dist;
		lightRec.direction = direction;
		lightRec.emission = light.color * light.intensity * distanceAttenuation;
		lightRec.pdf = 1.0;

		return lightRec;

	}

`,[Ve,ae,V,tn]),Dl=Ye(`

	fn getSpotLightNearest( light: Light, position: vec3f ) -> vec2f {

		let normal = normalize( cross( light.u, light.v ) );
		let startDistance = light.radius / max( tan( acos( light.coneCos ) ), EPSILON );
		let discCenter = light.position - normal * startDistance;

		let toPosition = position - discCenter;
		let along = dot( toPosition, - normal );
		let across = max( length( toPosition + normal * along ) - light.radius, 0.0 );
		let dist = length( vec2f( along, across ) );
		return vec2f( along / max( dist, EPSILON ), dist );

	}

`,[Ve,V]);import{wgslFn as ie,mat3 as ed}from"three/tsl";import{wgslFn as ht}from"three/tsl";var pt=ht(`

	fn ggxDirection( incidentDir: vec3f, alpha: vec2f, uv: vec2f ) -> vec3f {

		// Implementation from reference [1]
		// stretch view
		let V = normalize( vec3f( alpha * incidentDir.xy, incidentDir.z ) );

		// orthonormal basis
		var T1: vec3f;
		if ( V.z < 0.9999 ) {

			T1 = normalize( cross( V, vec3( 0.0, 0.0, 1.0 ) ) );

		} else {

			T1 = vec3( 1.0, 0.0, 0.0 );

		}

		let T2 = cross( T1, V );

		// sample point with polar coordinates (r, phi)
		let a = 1.0 / ( 1.0 + V.z );
		let r = sqrt( uv.x );
		var phi: f32;
		if ( uv.y < a ) {

			phi = uv.y / a * PI;

		} else {

			phi = PI + ( uv.y - a ) / ( 1.0 - a ) * PI;

		}

		let P1 = r * cos( phi );
		var P2 = r * sin( phi );
		if ( uv.y >= a ) {

			P2 *= V.z;

		}

		// compute normal
		var N = P1 * T1 + P2 * T2 + V * sqrt( max( 0.0, 1.0 - P1 * P1 - P2 * P2 ) );

		// unstretch
		N = normalize( vec3( alpha * N.xy, max( 0.0, N.z ) ) );

		return N;

	}

`,[V]),Jf=ht(`

	fn ggxLambda( V: vec3f, alpha: vec2f ) -> f32 {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		// abs v.z to support transmitted rays
		let NdotV = max( abs( V.z ), MIN_INCIDENT_COS );
		let cos2 = NdotV * NdotV;
		let t = ( alphaT * alphaT * V.x * V.x + alphaB * alphaB * V.y * V.y ) / cos2;
		let numerator = - 1.0 + sqrt( 1.0 + t );
		return numerator / 2.0;

	}

`,[V]),rn=ht(`

	fn ggxShadowMaskG1( V: vec3f, alpha: vec2f ) -> f32 {

		// TODO: this could be collapsed to a simpler form as an optimization
		return 1.0 / ( 1.0 + ggxLambda( V, alpha ) );

	}

`,[Jf]),Fl=ht(`

	fn ggxSmithVisibility( V: vec3f, L: vec3f, alpha: vec2f ) -> f32 {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		let NdotV = max( V.z, MIN_INCIDENT_COS );
		let NdotL = max( L.z, MIN_INCIDENT_COS );

		let TdotV = V.x;
		let TdotL = L.x;

		let BdotV = V.y;
		let BdotL = L.y;

		let GGXV = NdotL * length( vec3f( alphaT * TdotV, alphaB * BdotV, NdotV ) );
		let GGXL = NdotV * length( vec3f( alphaT * TdotL, alphaB * BdotL, NdotL ) );

		return 0.5 / ( GGXV + GGXL );

	}

`,[V]),Or=ht(`

	fn ggxDistribution( H: vec3f, alpha: vec2f ) -> f32 {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		let NdotH = H.z;
		let TdotH = H.x;
		let BdotH = H.y;

		let a2 = alphaT * alphaB;
		let v = vec3f( alphaB * TdotH, alphaT * BdotH, a2 * NdotH );
		let v2 = dot( v, v );
		let w2 = a2 / v2;

		return a2 * w2 * w2 / PI;

	}

`,[V]),mt=ht(`

	fn ggxReflectionAdjustedPDF( V: vec3f, H: vec3f, alpha: vec2f ) -> f32 {

		let NdotV = max( V.z, MIN_INCIDENT_COS );
		let D = ggxDistribution( H, alpha );
		let G1 = ggxShadowMaskG1( V, alpha );

		return D * G1 / ( 4 * NdotV );

	}
`,[Or,rn]),nn=ht(`

	fn ggxRefractionAdjustedPDF( V: vec3f, L: vec3f, H: vec3f, alpha: vec2f, eta: f32 ) -> f32 {

		let NdotV = max( V.z, MIN_INCIDENT_COS );
		let HdotV = dot( V, H );
		let HdotL = dot( L, H );
		let D = ggxDistribution( H, alpha );
		let G1 = ggxShadowMaskG1( V, alpha );

		let denom = eta * HdotV + HdotL;
		return D * G1 * abs( HdotV ) * abs( HdotL ) / ( NdotV * denom * denom );

	}
`,[Or,rn]);var td=_`

	fn ensureValidReflectionNormal( n: vec3f, ng: vec3f, i: vec3f ) -> vec3f {

		// reflected ray
		let R = 2.0 * dot( n, i ) * n - i;

		let Iz = dot( i, ng );

		// reflection rays may always be at least as shallow as the incoming ray
		let threshold = min( 0.9 * Iz, 0.01 );
		if ( dot( ng, R ) >= threshold ) {

			return n;

		}

		// Form coordinate system with Ng as the Z axis and N inside the X-Z-plane.
   		// The X axis is found by normalizing the component of N that's orthogonal to Ng.
   		// The Y axis isn't actually needed.
		let orthoN = n - dot( n, ng ) * ng;
		let orthoLen = length( orthoN );
		let X = select( n, orthoN / orthoLen, orthoLen != 0.0 );

		// Calculate N.z and N.x in the local coordinate system.
		//
		// The goal of this computation is to find a N' that is rotated towards Ng just enough
   		// to lift R' above the threshold (here called t), therefore dot(R', Ng) = t.
		//
		// See the Blender implementation for a full description of the solution.
		let Ix = dot( i, X );

		let a = Ix * Ix + Iz * Iz;
		let b = 2.0 * ( a + Iz * threshold );
		let c = ( threshold + Iz ) * ( threshold + Iz );

		// only one root is valid; the sign of Ix selects it
		var Nz2: f32;
		if ( Ix < 0.0 ) {

			Nz2 = 0.25 * ( b + sqrt( max( b * b - 4.0 * a * c, 0.0 ) ) ) / a;

		} else {

			Nz2 = 0.25 * ( b - sqrt( max( b * b - 4.0 * a * c, 0.0 ) ) ) / a;

		}

		let Nx = sqrt( max( 1.0 - Nz2, 0.0 ) );
		let Nz = sqrt( max( Nz2, 0.0 ) );

		return Nx * X + Nz * ng;

	}

`,rd=_`

	fn ensureValidViewNormal( n: vec3f, ng: vec3f, view: vec3f ) -> vec3f {

		// ensure the view is at least slightly above the surface normal hemisphere
		const MIN_VIEW_COS = 1e-6;

		// if we're positive already then early out
		let c = dot( n, view );
		if ( c > MIN_VIEW_COS ) {

			return n;

		}

		// perpendicular vector to normal and view
		var perp = n - c * view;
		let perpLen = length( perp );

		// if we reach here that means that he view is nearly the opposite direction and
		// we can't derive plan to rotate on towards the view, so just use the geometry
		// normal. This could likely only really happen with a severe normal map application.
		if ( perpLen <= 1e-6 ) {

			return ng;

		}

		perp = perp / perpLen;

		// rotate the normal to be at larger than the above threshold - pythagorean
		// theorem for generating normal with threshold*view component
		return MIN_VIEW_COS * view + sqrt( 1.0 - MIN_VIEW_COS * MIN_VIEW_COS ) * perp;

	}

`,sn=3402823466e29,Cl=(o,e,t)=>ie(`

	fn getSurfaceRecord(
		material: Material,
		vertexData: bvh_GeometryStruct,
		side: f32,
		faceNormal: vec3f,
		view: vec3f,
		blurRoughness: f32,
	) -> SurfaceRecord {

		// "faceNormal" is provided on the hit side so flip it back to the geometric side
		var normal = faceNormal * side;
		if ( material.flatShading == 0 ) {

			normal = normalize( vertexData.normal.xyz );

		}

		var baseNormal = normal;
		if ( material.normalMap != -1 ) {

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( vertexData.tangent.xyz ) > 0.0 && vertexData.tangent.w != 0.0 ) {

				// TODO: consider re-orthonormalizing against the normal here since attribute
				// interpolation could result in drift.
				let tangent = normalize( vertexData.tangent.xyz );
				let bitangent = normalize( cross( baseNormal, tangent ) * vertexData.tangent.w );
				let vTBN = mat3x3f( tangent, bitangent, baseNormal );

				let uvPrime = material.normalMapTransform * vec3( getUvFromChannel( vertexData, material.normalMap ), 1.0 );
				var texNormal = sampleTexel( uvPrime.xy, material.normalMap, 0 ).xyz;
				texNormal = texNormal * 2.0 - 1.0;
				texNormal = texNormal * vec3f( material.normalScale, 1.0 );
				normal = normalize( vTBN * texNormal );

			}

		}

		normal *= side;

		normal = ensureValidViewNormal( normal, faceNormal, view );

		normal = ensureValidReflectionNormal( normal, faceNormal, view );

		var albedo = vec4( material.color, material.opacity );
		if ( material.vertexColors == 1 ) {

			albedo *= getColor( vertexData );

		}

		if ( material.map != -1 ) {

			let uvPrime = material.mapTransform * vec3f( getUvFromChannel( vertexData, material.map ), 1 );
			albedo *= sampleTexel( uvPrime.xy, material.map, 0 );

		}

		if ( material.alphaMap != -1 ) {

			let uvPrime = material.alphaMapTransform * vec3f( getUvFromChannel( vertexData, material.alphaMap ), 1 );
			albedo.a *= sampleTexel( uvPrime.xy, material.alphaMap, 0 ).g;

		}

		var roughness = material.roughness;
		if ( material.roughnessMap != -1 ) {

			let uvPrime = material.roughnessMapTransform * vec3f( getUvFromChannel( vertexData, material.roughnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.roughnessMap, 0 );
			roughness *= texColor.g;

		}

		var metalness = material.metalness;
		if ( material.metalnessMap != -1 ) {

			let uvPrime = material.metalnessMapTransform * vec3f( getUvFromChannel( vertexData, material.metalnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.metalnessMap, 0 );
			metalness *= texColor.b;

		}

		var emission = material.emissiveIntensity * material.emissive;
		if ( material.emissiveMap != -1 ) {

			let uvPrime = material.emissiveMapTransform * vec3f( getUvFromChannel( vertexData, material.emissiveMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.emissiveMap, 0 );
			emission *= texColor.rgb;

		}

		var transmission = material.transmission;
		if ( material.transmissionMap != -1 ) {

			let uvPrime = material.transmissionMapTransform * vec3f( getUvFromChannel( vertexData, material.transmissionMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.transmissionMap, 0 );
			transmission *= texColor.r;

		}

		var clearcoat = material.clearcoat;
		if ( material.clearcoatMap != -1 ) {

			let uvPrime = material.clearcoatMapTransform * vec3f( getUvFromChannel( vertexData, material.clearcoatMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.clearcoatMap, 0 );
			clearcoat *= texColor.r;

		}

		var clearcoatRoughness = material.clearcoatRoughness;
		if ( material.clearcoatRoughnessMap != -1 ) {

			let uvPrime = material.clearcoatRoughnessMapTransform * vec3f( getUvFromChannel( vertexData, material.clearcoatRoughnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.clearcoatRoughnessMap, 0 );
			clearcoatRoughness *= texColor.g;

		}

		var clearcoatNormal = baseNormal;
		if ( material.clearcoatNormalMap != -1 ) {

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( vertexData.tangent.xyz ) > 0.0 && vertexData.tangent.w != 0.0 ) {

				// TODO: consider re-orthonormalizing against the normal here since attribute
				// interpolation could result in drift.
				let tangent = normalize( vertexData.tangent.xyz );
				let bitangent = normalize( cross( baseNormal, tangent ) * vertexData.tangent.w );
				let vTBN = mat3x3f( tangent, bitangent, baseNormal );

				let uvPrime = material.clearcoatNormalMapTransform * vec3( getUvFromChannel( vertexData, material.clearcoatNormalMap ), 1.0 );
				var texNormal = sampleTexel( uvPrime.xy, material.clearcoatNormalMap, 0 ).xyz;
				texNormal = texNormal * 2.0 - 1.0;
				texNormal = texNormal * vec3f( material.clearcoatNormalScale, 1.0 );
				clearcoatNormal = normalize( vTBN * texNormal );

			}

		}

		clearcoatNormal *= side;

		clearcoatNormal = ensureValidViewNormal( clearcoatNormal, faceNormal, view );

		clearcoatNormal = ensureValidReflectionNormal( clearcoatNormal, faceNormal, view );

		var sheenColor = material.sheenColor;
		if ( material.sheenColorMap != -1 ) {

			let uvPrime = material.sheenColorMapTransform * vec3f( getUvFromChannel( vertexData, material.sheenColorMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.sheenColorMap, 0 );
			sheenColor *= texColor.rgb;

		}

		var sheenRoughness = material.sheenRoughness;
		if ( material.sheenRoughnessMap != -1 ) {

			let uvPrime = material.sheenRoughnessMapTransform * vec3f( getUvFromChannel( vertexData, material.sheenRoughnessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.sheenRoughnessMap, 0 );
			sheenRoughness *= texColor.r;

		}

		var iridescence = material.iridescence;
		if ( material.iridescenceMap != -1 ) {

			let uvPrime = material.iridescenceMapTransform * vec3f( getUvFromChannel( vertexData, material.iridescenceMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.iridescenceMap, 0 );
			iridescence *= texColor.r;

		}

		var iridescenceThickness = material.iridescenceThicknessMaximum;
		if ( material.iridescenceThicknessMap != -1 ) {

			let uvPrime = material.iridescenceThicknessMapTransform * vec3f( getUvFromChannel( vertexData, material.iridescenceThicknessMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.iridescenceThicknessMap, 0 );

			iridescenceThickness = mix(
				material.iridescenceThicknessMinimum,
				material.iridescenceThicknessMaximum,
				texColor.g,
			);

		}

		var specularColor = material.specularColor;
		if ( material.specularColorMap != -1 ) {

			let uvPrime = material.specularColorMapTransform * vec3f( getUvFromChannel( vertexData, material.specularColorMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.specularColorMap, 0 );
			specularColor *= texColor.rgb;

		}

		var specularIntensity = material.specularIntensity;
		if ( material.specularIntensityMap != -1 ) {

			let uvPrime = material.specularIntensityMapTransform * vec3f( getUvFromChannel( vertexData, material.specularIntensityMap ), 1 );
			let texColor = sampleTexel( uvPrime.xy, material.specularIntensityMap, 0 );
			specularIntensity *= texColor.a;

		}

		// extract the anisotropy magnitude vector in tangent space
		var anisotropyDirVec = material.anisotropy * vec2f( cos( material.anisotropyRotation ), sin( material.anisotropyRotation ) );
		if ( material.anisotropyMap != -1 ) {

			let uvPrime = material.anisotropyMapTransform * vec3f( getUvFromChannel( vertexData, material.anisotropyMap ), 1.0 );
			let aniTex = sampleTexel( uvPrime.xy, material.anisotropyMap, 0 );

			// map rg encode the direction ([-1,1]), b the strength; rotate + scale by the material anisotropy.
			let mapDir = aniTex.rg * 2.0 - vec2f( 1.0 );
			let mapStr = aniTex.b;
			let mapLen = length( mapDir );
			if ( mapLen > EPSILON ) {

				anisotropyDirVec = mat2x2f(
					anisotropyDirVec.x, anisotropyDirVec.y,
					- anisotropyDirVec.y, anisotropyDirVec.x
				) * mapStr * mapDir / mapLen;

			}

		}

		// adjust the surface basis to be oriented along the anisotropic vector
		let anisotropyStrength = length( anisotropyDirVec );
		var surfaceBasis = getBasisFromNormal( normal );
		if ( anisotropyStrength > 0.0 && length( vertexData.tangent.xyz ) > 0.0 && vertexData.tangent.w != 0.0 ) {

			let anisotropyDir = anisotropyDirVec / anisotropyStrength;

			// re-orthonormalize the tangent against the shading normal so the frame stays orthonormal -
			// normal map adjustments will cause the normal and tangent to become non-orthonormal.
			let tangent = normalize( vertexData.tangent.xyz - normal * dot( normal, vertexData.tangent.xyz ) );
			let bitangent = cross( normal, tangent ) * vertexData.tangent.w;

			surfaceBasis = mat3x3f(
				tangent * anisotropyDir.x + bitangent * anisotropyDir.y,
				bitangent * anisotropyDir.x - tangent * anisotropyDir.y,
				normal
			);

		}

		var surf: SurfaceRecord;

		surf.volumeParticle = false;
		surf.faceNormal = faceNormal;
		surf.normal = normal;

		surf.metalness = metalness;
		surf.diffuseRoughness = material.diffuseRoughness;
		surf.color = albedo.rgb;
		surf.emission = emission;

		surf.opacity = select( 1.0, albedo.a, material.transparent != 0 );

		surf.ior = material.ior;
		surf.transmission = transmission;
		surf.thinWall = material.thinWall == 1;
		surf.attenuationColor = material.attenuationColor;
		surf.attenuationDistance = material.attenuationDistance;

		surf.clearcoatNormal = clearcoatNormal;
		surf.clearcoat = clearcoat;

		surf.iridescence = iridescence;
		surf.iridescenceIor = material.iridescenceIor;
		surf.iridescenceThickness = iridescenceThickness;

		surf.specularColor = specularColor;
		surf.specularIntensity = specularIntensity;

		surf.sheen = material.sheen;
		surf.sheenColor = sheenColor;

		let minRoughness = max( MIN_ROUGHNESS, blurRoughness );
		surf.roughness = clamp( roughness, minRoughness, 1.0 );
		surf.clearcoatRoughness = clamp( clearcoatRoughness, minRoughness, 1.0 );
		surf.sheenRoughness = clamp( sheenRoughness, minRoughness, 1.0 );
		surf.anisotropy = anisotropyStrength;

		// frontFace is used to determine transmissive properties and PDF. If no transmission is used
		// then we can just always assume this is a front face.
		surf.frontFace = side == 1.0 || transmission == 0.0;
		if ( material.thinWall == 1 || surf.frontFace ) {

			surf.eta = 1.0 / material.ior;

		} else {

			surf.eta = material.ior;

		}
		surf.f0 = iorToF0( surf.eta );

		// get the normal frames
		surf.normalBasis = surfaceBasis;
		surf.normalInvBasis = inverse( surf.normalBasis );

		surf.clearcoatBasis = getBasisFromNormal( surf.clearcoatNormal );
		surf.clearcoatInvBasis = inverse( surf.clearcoatBasis );

		return surf;
	}

`,[hl,le,pl,o,e,t,ee,V,td,rd]),oy=ie(`

	fn diffuseBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		// https://blog.selfshadow.com/publications/s2015-shading-course/burley/s2015_pbs_disney_bsdf_notes.pdf
		// See equation (4)

		let fl = schlickFresnel( NdotL, 0.0 );
		let fv = schlickFresnel( NdotV, 0.0 );

		let alpha = surf.roughness * surf.roughness;
		let bias = mix( 0.0, 0.5, alpha ) - 1;
		let energyFactor = mix( 1.0, 1.0 / 1.51, alpha );

		let rr = 2.0 * alpha * VdotH * VdotH;
		let retro = rr * ( fl + fv + fl * fv * ( rr + 2.0 * bias ) );
		let fresnel = ( 1.0 + bias * fl ) * ( 1.0f + bias * fv );

		// TODO: subsurface approx?

		return energyFactor * ( surf.color / PI ) * ( retro + fresnel );

	}

`,[V,Fe,ee]),ay=ie(`

	fn lambertBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		return surf.color / PI;

	}

`,[V,ee]),Gs=ie(`

	fn specularBrdf( V: vec3f, L: vec3f, H: vec3f, alpha: vec2f ) -> vec3f {

		let alphaT = alpha.x;
		let alphaB = alpha.y;

		let Vis = ggxSmithVisibility( V, L, alpha );
		let D = ggxDistribution( H, alpha );

		return vec3f( D * Vis );

	}

`,[Fl,Or]),jt=ie(`

	fn isMatchedIor( eta: f32 ) -> bool {

		return abs( eta - 1.0 ) < EPSILON;

	}

`,[V]),Qs=ie(`

	fn specularBtdf( V: vec3f, L: vec3f, H: vec3f, alpha: vec2f, eta: f32 ) -> vec3f {

		let NdotV = V.z;
		let NdotL = L.z;
		let HdotV = dot( V, H );
		let HdotL = dot( L, H );

		// Heaviside function for G term
		if ( NdotV * HdotV < 0.0 || NdotL * HdotL < 0.0 || HdotV * HdotL > 0.0 ) {

			return vec3f( 0.0 );

		}

		let G1_i = ggxShadowMaskG1( V, alpha );
		let G1_o = ggxShadowMaskG1( L, alpha );

		// separable G2 product, no height correlation
		let denom = eta * HdotV + HdotL;
		let Vis = G1_i * G1_o * abs( HdotV ) * abs( HdotL ) /
			( abs( NdotV ) * abs( NdotL ) * denom * denom );

		let F = dielectricFresnel( abs( HdotV ), eta );

		let D = ggxDistribution( H, alpha );

		return vec3f( ( 1 - F ) * D * Vis );

	}

`,[rn,Or,dt]),on=ie(`

	fn thinWallTransmissionRoughness( alpha: f32, eta: f32 ) -> f32 {

		let t = 3.4 * ( eta - 1.0 ) * ( eta - 0.5 ) * ( eta - 0.5 ) / ( eta * eta * eta );
		return saturate( alpha * sqrt( max( t, 0.0 ) ) );

	}

`),an=ie(`

	fn transmissionAttenuation( dist: f32, attColor: vec3f, attDist: f32 ) -> vec3f {

		return pow( attColor, vec3f( dist / attDist ) );

	}

`),Kt=360,Xt=830,id=ie(`

	fn dispersionIor( ior: f32, dispersion: f32, wavelength: f32 ) -> f32 {

		let nd = max( ior, 1.0 );
		let scale = ( nd - 1.0 ) * max( dispersion, 0.0 ) / 20.0;
		let lambda = clamp( wavelength, ${Kt}.0, ${Xt}.0 );
		return max( nd + scale * ( 523655.0 / ( lambda * lambda ) - 1.5168 ), 1.0 );

	}

`),ln=_`

	fn applyDispersion( surf: ptr<function, ${ee}>, dispersion: f32, wavelength: f32 ) -> void {

		surf.ior = ${id}( surf.ior, dispersion, wavelength );
		surf.eta = select( surf.ior, 1.0 / surf.ior, surf.thinWall || surf.frontFace );
		surf.f0 = ${le}( surf.eta );

	}

`,cn=ie(`

	fn dispersionColorWeight( wavelength: f32 ) -> vec3f {

		let lambda = clamp( wavelength, ${Kt}.0, ${Xt}.0 );

		let x1 = ( lambda - 442.0 ) * select( 0.0374, 0.0624, lambda < 442.0 );
		let x2 = ( lambda - 599.8 ) * select( 0.0323, 0.0264, lambda < 599.8 );
		let x3 = ( lambda - 501.1 ) * select( 0.0382, 0.0490, lambda < 501.1 );
		let x = 0.362 * exp( - 0.5 * x1 * x1 ) + 1.056 * exp( - 0.5 * x2 * x2 ) - 0.065 * exp( - 0.5 * x3 * x3 );

		let y1 = ( lambda - 568.8 ) * select( 0.0247, 0.0213, lambda < 568.8 );
		let y2 = ( lambda - 530.9 ) * select( 0.0322, 0.0613, lambda < 530.9 );
		let y = 0.821 * exp( - 0.5 * y1 * y1 ) + 0.286 * exp( - 0.5 * y2 * y2 );

		let z1 = ( lambda - 437.0 ) * select( 0.0278, 0.0845, lambda < 437.0 );
		let z2 = ( lambda - 459.0 ) * select( 0.0725, 0.0385, lambda < 459.0 );
		let z = 1.217 * exp( - 0.5 * z1 * z1 ) + 0.681 * exp( - 0.5 * z2 * z2 );

		let linearRgb = max( vec3f(
			3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
			- 0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
			0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
		), vec3f( 0.0 ) );

		return linearRgb * vec3f( 2.6699448, 4.0708066, 4.2980494 );

	}

`),Al=ie(`

	fn fresnelMix( VdotH: f32, f0Color: vec3f, ior: f32, eta: f32, weight: f32, base: vec3f, layer: vec3f ) -> vec3f {

		var f0 = iorToF0( ior ) * f0Color;
		f0 = min( f0, vec3f( 1.0 ) );

		// reflect all light on total internal reflection, matching the WebGL evaluateFresnel function
		var fr = vec3f( 1.0 );
		if ( ! totalInternalReflection( abs( VdotH ), eta ) ) {

			fr = schlickFresnelVec( abs( VdotH ), f0, vec3f( 1.0 ) );

		}

		let maxFr = max( max( fr.r, fr.g ), fr.b );

		return ( 1.0 - weight * maxFr ) * base + weight * fr * layer;

	}

`,[qt,le,ji]),nd=ed(3.2404542,-.969266,.0556434,-1.5371385,1.8760108,-.2040259,-.4985314,.041556,1.0572252),sd=_`

	fn evalSensitivity( OPD: f32, shift: vec3f ) -> vec3f {

		let phase = 2.0 * ${Math.PI} * OPD * 1.0e-9;
		const val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
		const pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
		const _var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);

		var xyz = val * sqrt(2.0 * ${Math.PI} * _var) * cos(pos * phase + shift) * exp(-phase * phase * _var);
		xyz.x += 9.7470e-14 * sqrt(2.0 * ${Math.PI} * 4.5282e+09) * cos(2.2399e+06 * phase + shift.x) * exp(-4.5282e+09 * phase * phase);
		xyz /= 1.0685e-7;

		let rgb = ${nd} * xyz;
		return rgb;

	}

`,js=ie(`

	fn iridescentFresnel(
		cosTheta1: f32, baseF0: vec3f, iridescenceIor: f32,
		outsideIor: f32, iridescenceThickness: f32,
	) -> vec3f {

		let sinTheta2Sq = pow( outsideIor / iridescenceIor, 2.0 ) * ( 1.0 - pow( cosTheta1, 2.0 ) );
		let cosTheta2Sq = 1.0 - sinTheta2Sq;

		// Handle total internal reflection
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		let cosTheta2 = sqrt( cosTheta2Sq );

		// First interface: air -> iridescent thin film
		let R0 = iorToF0General( iridescenceIor, outsideIor );
		let R12 = schlickFresnel( cosTheta1, R0 );
		let R21 = R12;
		let T121 = 1.0 - R12;
		let phi12 = select( 0.0, PI, iridescenceIor < outsideIor );
		let phi21 = PI - phi12;

		// Second interface: iridescent thin film -> base material
		let baseIor = fresnel0ToIor( clamp( baseF0, vec3( 0.0 ), vec3( 0.9999 ) ) ); // guard against 1.0
		let R1 = iorToF0GeneralVec( baseIor, vec3( iridescenceIor ) );
		var R23 = schlickFresnelVec( cosTheta2, R1, vec3( 1.0 ) );

		// Handle total internal reflection at the film -> base interface
		// NOTE: Added separately from the original implementation. Is this correct?
		R23 = select( R23, vec3( 1.0 ), totalInternalReflectionVec( cosTheta2, vec3( iridescenceIor ) / baseIor ) );
		let phi23 = select( vec3( 0.0 ), vec3( PI ), baseIor < vec3( iridescenceIor ) );

		// Phase shift
		let OPD = 2.0 * iridescenceIor * iridescenceThickness * cosTheta2;
		let phi = vec3( phi21 ) + phi23;

		// Analytical integration
		// Compound terms
		let R123 = clamp( R12 * R23, vec3( 1e-5 ), vec3( 0.9999 ) );
		let r123 = sqrt( R123 );
		let Rs = T121 * T121 * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		let C0 = R12 + Rs;
		var I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		var Cm = Rs - T121;
		for (var m = 1; m <= 2; m += 1) {

			Cm *= r123;
			let Sm = 2.0 * evalSensitivity( f32( m ) * OPD, f32( m ) * phi );
			I += Cm * Sm;

		}

		return max( I, vec3(0.0) );

	}

`,[ml,gl,Fe,xl,sd,vl]),Ml=(o=js)=>_`

	fn transmissionFresnel( cosTheta: f32, surf: ${ee} ) -> ${zs} {

		var result: ${zs};
		let cosine = saturate( abs( cosTheta ) );
		let matchedIor = ${jt}( surf.eta );
		let airIncident = surf.thinWall || surf.frontFace;
		let dielectricFresnel = ${dt}( cosine, surf.eta );

		// Keep matched media transparent unless a real thin-film layer is present. This avoids
		// introducing the non-physical Schlick F90 reflection produced by KHR_materials_specular
		// when the substrate itself has no IOR boundary.
		var reflectance = vec3f( 0.0 );
		if ( ! matchedIor ) {

			let specularF0 = min( surf.f0 * surf.specularColor, vec3f( 1.0 ) );
			let dielectricReflectance = select(
				vec3f( dielectricFresnel ),
				${qt}( cosine, specularF0, vec3f( 1.0 ) ),
				airIncident,
			);
			reflectance = surf.specularIntensity * dielectricReflectance;

		}

		reflectance = clamp( reflectance, vec3f( 0.0 ), vec3f( 1.0 ) );
		var transmittance = vec3f( 1.0 ) - reflectance;

		if ( surf.iridescence > 0.0 ) {

			// The media on either side of the film are air outside and the volume interior as
			// the base. Swap them on interior hits so film-interface TIR remains possible.
			let outsideIor = select( surf.ior, 1.0, airIncident );
			let filmBaseIor = select( 1.0, surf.ior, airIncident );
			let filmReflectance = clamp( ${o}(
				cosine,
				vec3f( ${le}( filmBaseIor ) ),
				surf.iridescenceIor,
				outsideIor,
				surf.iridescenceThickness,
			), vec3f( 0.0 ), vec3f( 1.0 ) );

			reflectance = mix( reflectance, filmReflectance, surf.iridescence );
			transmittance = mix( transmittance, vec3f( 1.0 ) - filmReflectance, surf.iridescence );

		}

		result.reflectance = reflectance;
		result.transmittance = transmittance;

		// Include the base-color tint in the transmission energy, as Cycles does when it
		// computes the glass reflection probability from its two tinted coefficients.
		let reflectEnergy = dot( reflectance, vec3f( 1.0 / 3.0 ) );
		let transmitEnergy = dot( transmittance * surf.color, vec3f( 1.0 / 3.0 ) );
		let totalEnergy = reflectEnergy + transmitEnergy;
		result.reflectProbability = select( 0.0, reflectEnergy / max( totalEnergy, EPSILON ), totalEnergy > EPSILON );

		return result;

	}

`,Bl=ie(`

	fn conductorFresnel( VdotH: f32, f0: vec3f, specular: vec3f ) -> vec3f {

		return specular * schlickFresnelVec( abs( VdotH ), f0, vec3f( 1 ) );

	}

`,[qt]),Pl=ie(`

	fn fresnelCoat( VdotNc: f32, ior: f32, base: vec3f, layer: vec3f, weight: f32 ) -> vec3f {

		let f0 = iorToF0( ior );
		let F = schlickFresnel( abs( VdotNc ), f0 );

		return mix( base, layer, weight * F );

	}

`,[le,Fe]),Nl=o=>_`

	fn albedo(
		eta: f32,
		includeFresnel: bool,
		includeRefraction: bool,
		globalId: vec3u,
		layer: u32,
	) -> void {

		// The matched-IOR limit is a unit-energy delta transmission event, so it cannot
		// be integrated with the rough BTDF below.
		if ( includeRefraction && ${jt}( eta ) ) {

			textureStore( ${o}, vec3( globalId.xy, layer ), vec4( 1.0 ) );
			return;

		}

		// sample the brdf directions in a grid pattern
		const GRID_SIZE = 64u;

		// TODO: this sampling means that energy at 0.0 & 1.0 roughness (and 0 and 90deg cos) are never
		// written to the texture due to the half texel inset, resulting in small, though possibly noticeable,
		// error in common cases.
		let dimensions = textureDimensions( ${o} ).xy;
		let uv = ( vec2f( globalId.xy ) + vec2f( 0.5 ) ) / vec2f( dimensions );

		let cosThetaO = uv.x;
		let roughness = uv.y;
		let alpha = roughness * roughness;

		let wo = vec3( sqrt( 1 - cosThetaO * cosThetaO ), 0 , cosThetaO );

		let f0 = ${le}( eta );

		var result = 0.0;
		for ( var x = 0u; x < GRID_SIZE; x++ ) {

			for ( var y = 0u; y < GRID_SIZE; y++ ) {

				// calculate the half vector to sample
				let gridPoint = vec2f( vec2u( x, y ) ) + vec2f( 0.5 );
				let sampleUv = gridPoint / f32( GRID_SIZE );
				let wh = ${pt}( wo, vec2( alpha ), sampleUv );

				var f = 1.0;
				if ( includeFresnel ) {

					// use the exact dielectric fresnel so the table agrees with the fresnel used
					// for lobe sampling
					f = ${dt}( dot( wo, wh ), eta );

				}

				// air-incident reflection is evaluated with schlick in bsdfEval - only the
				// volume-incident ( TIR ) glass reflection uses the exact fresnel
				var reflectionF = f;
				if ( eta < 1.0 ) {

					reflectionF = ${Fe}( dot( wo, wh ), f0 );

				}

				// reflection lobe - samples landing below the surface are lost
				let wi = - reflect( wo, wh );
				let reflectionPdf = ${mt}( wo, wh, vec2f( alpha ) );
				if ( wi.z > 0.0 && reflectionPdf != 0.0 ) {

					let specular = ${Gs}( wo, wi, wh, vec2f( alpha ) );
					result += reflectionF * specular.x * wi.z / reflectionPdf;

				}

				// refraction lobe - the btdf carries its own ( 1 - F ) fresnel weight, and
				// samples landing back above the surface are lost
				if ( includeRefraction ) {

					let wiRefract = refract( - wo, wh, eta );
					if ( wiRefract.z < 0.0 ) {

						let transmission = ${Qs}( wo, wiRefract, wh, vec2f( alpha ), eta );
						let pdf = ${nn}( wo, wiRefract, wh, vec2f( alpha ), eta );
						if ( pdf != 0.0 ) {

							result += transmission.x * abs( wiRefract.z ) / pdf;

						}

					}

				}

			}

		}

		result /= f32( GRID_SIZE * GRID_SIZE );

		textureStore( ${o}, vec3( globalId.xy, layer ), vec4( result ) );

	}

`;var Ks={};fu(Ks,{rand1:()=>bd,rand2:()=>yd,rand3:()=>vd,rand4:()=>dn,rngInit:()=>gd,rngNextBounce:()=>xd});import{texture as dd,vec4 as hd}from"three/tsl";import{DataTexture as od,FloatType as ad,NearestFilter as Ll,RGBAFormat as zl,RGFormat as ld,RedFormat as cd}from"three";function $l(o,e=Math.random){for(let t=o.length-1;t>0;t--){let r=~~((e()-1e-6)*t),i=o[t];o[t]=o[r],o[r]=i}}function El(o,e){o.fill(0);for(let t=0;t<e;t++)o[t]=1}var Vr=class{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){let{score:e,binaryPattern:t}=this,r=1/0,i=-1;for(let s=0,n=t.length;s<n;s++){if(t[s]!==0)continue;let l=e[s];l<r&&(r=l,i=s)}return i}findCluster(){let{score:e,binaryPattern:t}=this,r=-1/0,i=-1;for(let s=0,n=t.length;s<n;s++){if(t[s]!==1)continue;let l=e[s];l>r&&(r=l,i=s)}return i}setSigma(e){if(e===this.sigma)return;let t=~~(Math.sqrt(20*e**2)+1),r=2*t+1,i=new Float32Array(r*r),s=e*e;for(let n=-t;n<=t;n++)for(let l=-t;l<=t;l++){let a=(t+l)*r+n+t,f=n*n+l*l;i[a]=Math.E**(-f/(2*s))}this.lookupTable=i,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){let{binaryPattern:e,score:t,size:r}=this;t.fill(0);for(let i=0,s=e.length;i<s;i++)if(e[i]===0){let n=~~(i/r),l=i-n*r;this.updateScore(l,n,1),e[i]=1}else e[i]=0}updateScore(e,t,r){let{size:i,score:s,lookupTable:n}=this,l=this.radius,a=2*l+1;for(let f=-l;f<=l;f++)for(let c=-l;c<=l;c++){let u=(l+c)*a+f+l,d=n[u],h=e+f;h=h<0?i+h:h%i;let p=t+c;p=p<0?i+p:p%i;let y=p*i+h;s[y]+=r*d}}addPointIndex(e){this.binaryPattern[e]=1;let t=this.size,r=~~(e/t),i=e-r*t;this.updateScore(i,r,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;let t=this.size,r=~~(e/t),i=e-r*t;this.updateScore(i,r,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}};var un=class{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new Vr(1),this.savedSamples=new Vr(1)}generate(){let{samples:e,savedSamples:t,sigma:r,majorityPointsRatio:i,size:s}=this;e.resize(s),e.setSigma(r);let n=Math.floor(s*s*i),l=e.binaryPattern;El(l,n),$l(l,this.random);for(let u=0,d=l.length;u<d;u++)l[u]===1&&e.addPointIndex(u);for(;;){let u=e.findCluster();e.removePointIndex(u);let d=e.findVoid();if(u===d){e.addPointIndex(u);break}e.addPointIndex(d)}let a=new Uint32Array(s*s);t.copy(e);let f;for(f=e.count-1;f>=0;){let u=e.findCluster();e.removePointIndex(u),a[u]=f,f--}let c=s*s;for(f=t.count;f<c/2;){let u=t.findVoid();t.addPointIndex(u),a[u]=f,f++}for(t.invert();f<c;){let u=t.findCluster();t.removePointIndex(u),a[u]=f,f++}return{data:a,maxValue:c}}};function ud(o){return o>=3?4:o}function fd(o){switch(o){case 1:return cd;case 2:return ld;default:return zl}}var fn=class extends od{constructor(e=64,t=1){super(new Float32Array(4),1,1,zl,ad),this.minFilter=Ll,this.magFilter=Ll,this.size=e,this.channels=t,this.update()}update(){let e=this.channels,t=this.size,r=new un;r.channels=e,r.size=t;let i=ud(e),s=fd(i);(this.image.width!==t||s!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*i),this.format=s,this.dispose());let n=this.image.data;for(let l=0,a=e;l<a;l++){let f=r.generate(),c=f.data,u=f.maxValue;for(let d=0,h=c.length;d<h;d++){let p=c[d]/u;n[d*i+l]=p}}this.needsUpdate=!0}};var Ol=64,pd=new fn(Ol,1),md=dd(pd),Vl=hd(0).toVar("blueDitherSeed"),gd=_`
	fn blueDitherInitialize( pixel: vec2u, pathIndex: u32, bounceIndex: u32 ) -> void {

		let coord = vec2i( pixel % vec2u( ${Ol}u ) );
		${Vl} = textureLoad( ${md}, coord, 0 );
		${Li}( vec2u( 0 ), pathIndex, bounceIndex );

	}
`,xd=_`
	fn blueDitherNextBounce() -> void {

		${zi}();

	}
`,dn=_`
	fn blueDitherRand4( effect: u32 ) -> vec4f {

		// Get the scrambled sobol stratified sample
		let stratifiedSample = ${Ei}( effect );

		// offset it by the blue noise seed and dimension rotation
		return fract( stratifiedSample + ${Vl}.r );

	}
`,vd=_`
	fn blueDitherRand3( effect: u32 ) -> vec3f {

		return ${dn}( effect ).xyz;

	}
`,yd=_`
	fn blueDitherRand2( effect: u32 ) -> vec2f {

		return ${dn}( effect ).xy;

	}
`,bd=_`
	fn blueDitherRand1( effect: u32 ) -> f32 {

		return ${dn}( effect ).x;

	}
`;var hn=0,Yt=1,pn=2,Hl=2147483648,Zt=1073741824,Je=1073741823;var mn=class extends q{constructor(){let e={bvhData:{value:null},material:{value:null},envInfo:{value:null},lightsInfo:{value:null},prevOutputTarget:Ys(new Xs(1,1)).toReadOnly(),outputTarget:Ys(new Xs(1,1)).toWriteOnly(),sampleCountTarget:Ys(new Xs(1,1)).toReadWrite(),offset:be(new Ul),tileSize:be(new Ul),seed:be(0),maxBounces:be(5),maxTransparentBounces:be(5,"uint"),misEnabled:be(1,"uint"),maxSamples:be(0,"uint"),filterGlossy:be(1),clampDirect:be(0),clampIndirect:be(10),backgroundInfo:{value:null},transmissiveBackground:be(Yt),textures:Td(new kl),textureSampler:wd(new kl),globalId:Sd},t=H("bvhData.value.fns.raycastFirstHit.outputType",e),r=O("bvhData.value.fns.raycastFirstHit",e),i=O("bvhData.value.fns.raycastShadow",e),s=O("bvhData.value.fns.sampleTrianglePoint",e),n=O("bvhData.value.fns.getSurfaceRecord",e),l=O("bvhData.value.fns.getCameraRay",e),a=O("material.value.bsdfSample",e),f=O("material.value.bsdfEvalPdf",e),c=H("envInfo.value.totalSumNode",e),u=H("envInfo.value.intensityNode",e),d=H("envInfo.value.sampleColor",e),h=H("envInfo.value.sampleDir",e),p=H("envInfo.value.getDirPdf",e),y=H("envInfo.value.getWeight",e),v=H("backgroundInfo.value.sampleColor",e),T=H("lightsInfo.value.countNode",e),m=O("lightsInfo.value.randomLightSample",e),x=O("lightsInfo.value.intersectLightAtIndex",e),g=O("lightsInfo.value.getLightWeight",e),b=O("lightsInfo.value.getLightsWeight",e),S=O("lightsInfo.value.selectLight",e),w=O("lightsInfo.value.isLightVisibleToCamera",e),R=_`

			fn compute(

				// indices and target
				globalId: vec3u,

				// tiles
				offset: vec2u,
				tileSize: vec2u,

				// settings
				seed: u32,
				maxBounces: u32,
				maxTransparentBounces: u32,
				misEnabled: u32,
				maxSamples: u32,
				filterGlossy: f32,
				clampDirect: f32,
				clampIndirect: f32,

				transmissiveBackground: u32,

			) -> void {

				let transforms = &${H("bvhData.value.storage.transforms",e)};
				let materials = &${H("bvhData.value.storage.materials",e)};

				// make sure we don't bleed over the edge of our tile
				if ( globalId.x >= tileSize.x || globalId.y >= tileSize.y ) {

					return;

				}

				// to screen coordinates
				let indexUV = offset + globalId.xy;
				let targetDimensions = textureDimensions( ${e.outputTarget} );
				if ( indexUV.x >= targetDimensions.x || indexUV.y >= targetDimensions.y ) {

					return;

				}

				// skip the pixel once it has hit the sample limit
				let sampleCount = textureLoad( ${e.sampleCountTarget}, indexUV ).r;
				if ( maxSamples != 0u && sampleCount >= maxSamples ) {

					return;

				}

				let uv = vec2f( indexUV ) / vec2f( targetDimensions );
				${ve}( indexUV.xy, seed, 0 );

				// scene ray
				let jitteredUv = uv + ${ye}( ${Oi} ) / vec2f( targetDimensions );
				var ray: ${$};
				if ( ! ${l}( jitteredUv, vec2f( targetDimensions ), &ray ) ) {

					return;

				}

				ray.direction = normalize( ray.direction );

				var resultColor = vec4f( 0, 0, 0, 1 );
				var throughputColor = vec3f( 1.0 );
				var bsdfPdf = 0.0;
				var isFullyTransmissive = true;
				var minPdf = 1.0;
				var transparentBounce = 0u;
				// A negative value marks a sampled wavelength whose RGB reconstruction weight has not been applied yet.
				var dispersionWavelength = - mix( ${Kt}.0, ${Xt}.0, ${Re}( ${Wi} ) );

				// one-sample NEE chooses between the analytic lights and the environment
				let envActive = ${c} > 0.0 && ${u} > 0.0;
				let lightsCount = ${T};
				var envWeight = 0.0;
				if ( envActive ) {

					envWeight = ${y}();

				}

				// added last, since a camera ray miss overwrites the pixel with the background
				var lightHits = vec3f( 0.0 );
				var cameraHitLight = false;

				for ( var bounce = 0u; bounce < maxBounces; bounce ++ ) {

					var hitResult: ${t};
					let didHit = ${r}( ray, &hitResult );
					let surfaceDist = select( ${Ze}, hitResult.dist, didHit );

					// NEE's total weight at the vertex this ray left, for MIS. Camera rays have none
					let isMISWeighted = misEnabled != 0u && bounce > 0u;
					var lightTotalWeight = 0.0;
					if ( isMISWeighted ) {

						lightTotalWeight = ${b}( ray.origin ) + envWeight;

					}

					// forward hits on area lights. Camera rays only see visibleToCameraRays lights, at full weight
					for ( var li = 0u; li < lightsCount; li ++ ) {

						if ( bounce == 0u && ! ${w}( li ) ) {

							continue;

						}

						var lightRec: ${ae};
						if ( ${x}( ray.origin, ray.direction, li, &lightRec ) && lightRec.dist < surfaceDist ) {

							var misWeight = 1.0;
							if ( isMISWeighted ) {

								let selectionPdf = ${g}( li, ray.origin ) / lightTotalWeight;
								misWeight = ${Ae}( bsdfPdf, lightRec.pdf * selectionPdf );

							}

							lightHits += ${J}( lightRec.emission * throughputColor * misWeight, bounce, clampDirect, clampIndirect );
							cameraHitLight = cameraHitLight || bounce == 0u;

						}

					}

					if ( didHit ) {

						let objectInfo = transforms[ hitResult.objectIndex ];
						var materialInfo = ( *materials )[ objectInfo.materialIndex ];

						// a matte surface hit by the camera ray renders as a fully transparent
						if ( materialInfo.matte != 0 && bounce == 0u ) {

							resultColor = vec4f( 0.0 );
							break;

						}

						// apply per-object colors
						materialInfo.color *= objectInfo.color.rgb;
						materialInfo.opacity *= objectInfo.color.a;

						let view = - ray.direction;
						var vertexData = ${s}( hitResult.barycoord, hitResult.indices.xyz );
						vertexData.normal = normalize( transpose( objectInfo.inverseMatrixWorld ) * vertexData.normal );
						vertexData.tangent = vec4f( ( objectInfo.matrixWorld * vec4f( vertexData.tangent.xyz, 0.0 ) ).xyz, vertexData.tangent.w );
						vertexData.position = objectInfo.matrixWorld * vertexData.position;

						// blur glossy surfaces after low-probability bounces to suppress fireflies,
						// from the Cycles "filter glossy" approach in integrator/surface_shader.h
						// The smallest pdf seen along the path for the glossy filter is tracked below
						let blurRoughness = sqrt( clamp( 1.0 - filterGlossy * minPdf, 0.0, 1.0 ) ) * 0.5;

						var surface = ${n}( materialInfo, vertexData, hitResult.side, hitResult.normal, view, blurRoughness );

						// Stochastically pass through partially transparent surfaces by restarting
						// the ray at the hit point, advancing the rng but not the bounce count.
						if ( ${Re}( ${qi} ) > surface.opacity ) {

							// stop once the transparent bounces run out
							if ( transparentBounce >= maxTransparentBounces ) {

								break;

							}

							ray.origin = ${Xe}( vertexData.position.xyz, ray.direction, hitResult.normal );
							${Ls}();
							transparentBounce ++;
							bounce --;
							continue;

						}

						let isDispersive = materialInfo.dispersion > 0.0 && surface.ior > 1.0 && surface.transmission > 0.0 && ! surface.thinWall;
						if ( isDispersive ) {

							let wavelength = abs( dispersionWavelength );
							${ln}( &surface, materialInfo.dispersion, wavelength );
							if ( dispersionWavelength < 0.0 ) {

								dispersionWavelength = wavelength;
								throughputColor *= ${cn}( wavelength );

							}

						}

						// attenuate the light transmitted through the volume when exiting a backface
						if ( hitResult.side < 0.0 && materialInfo.transmission > 0.0 ) {

							throughputColor *= ${an}( hitResult.dist, materialInfo.attenuationColor, materialInfo.attenuationDistance );

						}

						// emission, clamped at the depth of the segment that found it, as in Cycles
						let emission = ${J}( throughputColor * surface.emission, bounce, clampDirect, clampIndirect );
						resultColor += vec4f( emission, 0.0 );

						// next event estimation: choose one light or the environment by its estimated
						// contribution
						if ( misEnabled != 0u ) {

							let ruv = ${Gi}( ${ki} );
							var selectionPdf = 0.0;
							let lightIndex = ${S}( vertexData.position.xyz, envWeight, ruv.x, &selectionPdf );
							if ( selectionPdf > 0.0 ) {

								var lightRec: ${ae};
								if ( envActive && lightIndex == lightsCount ) {

									// the environment, sampled from its CDF, as a light of kind ENVIRONMENT
									let envSample = ${h}( ruv.yz );
									lightRec.direction = envSample.direction;
									lightRec.emission = envSample.color;
									lightRec.pdf = envSample.pdf;
									lightRec.dist = ${Ze};
									lightRec.lightType = ${zr};

								} else {

									lightRec = ${m}( lightIndex, vertexData.position.xyz, ruv.yz );

								}

								if ( lightRec.pdf > 0.0 ) {

									let evalRec = ${f}( view, lightRec.direction, surface );
									if ( evalRec.pdf > 0.0 ) {

										var shadowRay: ${$};
										shadowRay.origin = ${Xe}( vertexData.position.xyz, lightRec.direction, hitResult.normal );
										shadowRay.direction = lightRec.direction;
										shadowRay.maxDist = lightRec.dist * ( 1.0 - ${Ji} );

										// opaque occlusion up to the light distance. A shadow-specific any hit
										// traversal could support tinted shadows from transmissive and partially
										// opaque objects
										var shadowHit: ${t};
										let occluded = ${i}( shadowRay, &shadowHit );
										if ( ! occluded ) {

											let lightPdf = lightRec.pdf * selectionPdf;

											// env + area lights are also bsdf-sampled, so MIS-weight them - punctual lights take full weight,
											// or when a bsdf ray could never reach the light
											let isMISWeighted = ${en}( lightRec.lightType ) && ! shadowHit.forwardBlocked;
											let misWeight = select( 1.0, ${Ae}( lightPdf, evalRec.pdf ), isMISWeighted );
											let directLight = throughputColor * lightRec.emission * evalRec.color * misWeight / lightPdf;
											let contribution = ${J}( directLight, bounce + 1u, clampDirect, clampIndirect );
											resultColor += vec4f( contribution, 0.0 );

										}

									}

								}

							}

						}

						let scatterRec = ${a}( view, surface );
						if ( ${Gt}( scatterRec ) ) {

							break;

						}

						isFullyTransmissive = isFullyTransmissive && scatterRec.isTransmissive;

						// track the smallest pdf seen along the path for the glossy filter
						minPdf = min( minPdf, scatterRec.pdf );

						// russian roulette early out:
						// Matches Cycles path_state_continuation_probability in integrator/path_state.h
						if ( bounce >= 3u ) {

							let rrThroughput = throughputColor * scatterRec.color / scatterRec.pdf;
							let rrProb = saturate( sqrt( max( max( rrThroughput.r, rrThroughput.g ), rrThroughput.b ) ) );
							if ( rrProb <= 0.0 || ${Re}( ${Ui} ) > rrProb ) {

								break;

							}

							throughputColor /= rrProb;

						}

						throughputColor *= scatterRec.color;
						throughputColor /= scatterRec.pdf;
						bsdfPdf = scatterRec.pdf;

						// exit if our throughput is 0.0
						if ( all( throughputColor == vec3f( 0.0 ) ) ) {

							break;

						}

						ray.origin = ${Xe}( vertexData.position.xyz, scatterRec.direction, hitResult.normal );
						ray.direction = scatterRec.direction;
						ray.maxDist = 0.0;

					} else {

						if ( bounce > 0u && ! isFullyTransmissive ) {

							var misWeight = 1.0;
							if ( isMISWeighted && envActive ) {

								// match the env pdf scaling used by the NEE selection so the two estimators balance
								let envPdf = ${p}( ray.direction ) * envWeight / lightTotalWeight;
								misWeight = ${Ae}( bsdfPdf, envPdf );

							}

							let environment = ${d}( ray.direction ).rgb * throughputColor * misWeight;
							let contribution = ${J}( environment, bounce, clampDirect, clampIndirect );
							resultColor += vec4f( contribution, 0.0 );

						} else {

							// hit the background
							// support multiple transparent background blending techniques
							let rng = ${ye}( ${Vi} );
							let bg = ${v}( ray.direction, rng );
							if ( bounce == 0u ) {

								// sample the background directly if this is the primary ray
								let background = ${J}( bg.a * bg.rgb, bounce, clampDirect, clampIndirect );
								resultColor = vec4f( background, bg.a );

							} else {

								// transmissive ray handling
								let env = ${d}( ray.direction );
								let avg = saturate( dot( throughputColor, vec3f( 1.0 / 3.0 ) ) );
								let transparency = ( 1.0 - bg.a ) * avg;
								var envMisWeight = 1.0;
								if ( misEnabled != 0u && ${c} > 0.0 ) {

									let envPdf = ${p}( ray.direction );
									envMisWeight = ${Ae}( bsdfPdf, envPdf );

								}

								if ( transmissiveBackground == ${hn}u ) {

									// display the env map through transmissive surfaces
									let background = ${J}( env.rgb * throughputColor * envMisWeight, bounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0,
									);

								} else if ( transmissiveBackground == ${pn}u ) {

									// fade the background by the throughput color average
									let background = ${J}( bg.a * bg.rgb * throughputColor * envMisWeight, bounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								} else {

									// fade the background by the throughput color average, mixing in env lighting
									var light = mix( env.rgb, bg.rgb, bg.a ) * envMisWeight;
									let background = ${J}( light * throughputColor, bounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								}

							}

						}

						break;

					}

					${Ls}();

				}

				// visible lights are opaque against a transparent background
				resultColor += vec4f( lightHits, 0.0 );
				if ( cameraHitLight ) {

					resultColor.a = 1.0;

				}

				let nextSampleCount = sampleCount + 1;
				// store the color rows top down to match a rasterized render target
				let colorIndex = vec2u( indexUV.x, targetDimensions.y - 1u - indexUV.y );

				let prevColor = textureLoad( ${e.prevOutputTarget}, colorIndex );
				let blendedColor = ${Xi}( prevColor, resultColor, 1.0 / f32( nextSampleCount ) );
				textureStore( ${e.sampleCountTarget}, indexUV, vec4( nextSampleCount ) );
				textureStore( ${e.outputTarget}, colorIndex, blendedColor );

			}`;super(R(e)),this.defineUniformAccessors(e)}};import{Matrix3 as Md}from"three/webgpu";import{texture as eo,sampler as to,uniform as ro,wgslFn as Bd,PI as Gl}from"three/tsl";import{DataTexture as Zs,RedFormat as Wl,LinearFilter as Jt,DataUtils as gt,HalfFloatType as et,Source as _d,RepeatWrapping as Js,RGBAFormat as Rd,FloatType as Dd,ClampToEdgeWrapping as Fd}from"three";import{DataUtils as Id}from"three";function gn(o){let e=new Uint16Array(o.length);for(let t=0,r=o.length;t<r;++t)e[t]=Id.toHalfFloat(o[t]);return e}function ql(o,e,t=0,r=o.length){let i=t,s=t+r-1;for(;i<s;){let n=i+s>>1;o[n]<e?i=n+1:s=n}return i-t}function Cd(o,e,t){return .2126*o+.7152*e+.0722*t}function Ad(o,e=et){let t=o.clone();t.source=new _d({...t.image});let{width:r,height:i,data:s}=t.image,n=s;if(t.type!==e){e===et?n=new Uint16Array(s.length):n=new Float32Array(s.length);let l;s instanceof Int8Array||s instanceof Int16Array||s instanceof Int32Array?l=2**(8*s.BYTES_PER_ELEMENT-1)-1:l=2**(8*s.BYTES_PER_ELEMENT)-1;for(let a=0,f=s.length;a<f;a++){let c=s[a];t.type===et&&(c=gt.fromHalfFloat(s[a])),t.type!==Dd&&t.type!==et&&(c/=l),e===et&&(n[a]=gt.toHalfFloat(c))}t.image.data=n,t.type=e}if(t.flipY){let l=n;n=n.slice();for(let a=0;a<i;a++)for(let f=0;f<r;f++){let c=i-a-1,u=4*(a*r+f),d=4*(c*r+f);n[d+0]=l[u+0],n[d+1]=l[u+1],n[d+2]=l[u+2],n[d+3]=l[u+3]}t.flipY=!1,t.image.data=n}return t}var xn=class{constructor(){let e=new Zs(gn(new Float32Array([0,0,0,0])),1,1);e.type=et,e.format=Rd,e.minFilter=Jt,e.magFilter=Jt,e.wrapS=Js,e.wrapT=Js,e.generateMipmaps=!1,e.needsUpdate=!0;let t=new Zs(gn(new Float32Array([0,1])),1,2);t.type=et,t.format=Wl,t.minFilter=Jt,t.magFilter=Jt,t.generateMipmaps=!1,t.needsUpdate=!0;let r=new Zs(gn(new Float32Array([0,0,1,1])),2,2);r.type=et,r.format=Wl,r.minFilter=Jt,r.magFilter=Jt,r.generateMipmaps=!1,r.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=r,this.totalSum=0}getPixelWeight(e,t,r){return Cd(e,t,r)}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){let t=Ad(e);t.wrapS=Js,t.wrapT=Fd;let{width:r,height:i,data:s}=t.image,n=new Float32Array(r*i),l=new Float32Array(r*i),a=new Float32Array(i),f=new Float32Array(i),c=0,u=0;for(let v=0;v<i;v++){let T=0;for(let m=0;m<r;m++){let x=v*r+m,g=gt.fromHalfFloat(s[4*x+0]),b=gt.fromHalfFloat(s[4*x+1]),S=gt.fromHalfFloat(s[4*x+2]),w=this.getPixelWeight(g,b,S,v,i);T+=w,c+=w,n[x]=w,l[x]=T}if(T!==0)for(let m=v*r,x=v*r+r;m<x;m++)n[m]/=T,l[m]/=T;u+=T,a[v]=T,f[v]=u}if(u!==0)for(let v=0,T=a.length;v<T;v++)a[v]/=u,f[v]/=u;let d=new Uint16Array(i),h=new Uint16Array(r*i);for(let v=0;v<i;v++){let T=(v+1)/i,m=ql(f,T);d[v]=gt.toHalfFloat((m+.5)/i)}for(let v=0;v<i;v++)for(let T=0;T<r;T++){let m=v*r+T,x=(T+1)/r,g=ql(l,x,v*r,r);h[m]=gt.toHalfFloat((g+.5)/r)}this.dispose();let{marginalWeights:p,conditionalWeights:y}=this;p.image={width:i,height:1,data:d},p.needsUpdate=!0,y.image={width:r,height:i,data:h},y.needsUpdate=!0,this.totalSum=c,this.map=t}};var Ql=Bd(`

	fn equirectLuminancePdf( luminance: f32, totalWeight: f32, resolution: vec2u ) -> f32 {

		return f32( resolution.x * resolution.y ) * luminance / ( 2.0 * PI * PI * totalWeight );

	}

`,[V]),er=class extends xn{constructor(){super(),this.mapNode=eo(this.map),this.mapSampler=to(this.mapNode),this.marginalNode=eo(this.marginalWeights),this.marginalSampler=to(this.marginalNode),this.conditionalNode=eo(this.conditionalWeights),this.conditionalSampler=to(this.conditionalNode),this.rotationNode=ro(new Md),this.intensityNode=ro(1),this.totalSumNode=ro(this.totalSum),this._initFns()}getPixelWeight(e,t,r,i,s){let n=Math.PI*(i+.5)/s;return super.getPixelWeight(e,t,r)*Math.sin(n)}updateFrom(e){super.updateFrom(e);let{mapNode:t,marginalNode:r,conditionalNode:i,totalSumNode:s}=this;t.value=this.map,r.value=this.marginalWeights,i.value=this.conditionalWeights,s.value=this.totalSum}_initFns(){let{mapNode:e,mapSampler:t,marginalNode:r,marginalSampler:i,conditionalNode:s,conditionalSampler:n,totalSumNode:l,rotationNode:a,intensityNode:f}=this;this.sampleColor=_`
			fn sampleEnv( direction: vec3f ) -> vec4f {

				let sampleDir = ${a} * direction;
				let mapUv = ${Qt}( sampleDir );
				let col = textureSampleLevel( ${e}, ${t}, mapUv, 0 );

				return vec4f( ${f} * col.rgb, col.a );

			}
		`,this.sampleDir=_`
			fn sampleEnvDir( r: vec2f ) -> ${Os} {

				var result: ${Os};

				// walk the CDF: marginal picks the row (v), conditional picks the column (u)
				let v = textureSampleLevel( ${r}, ${i}, vec2f( r.x, 0.0 ), 0 ).x;
				let u = textureSampleLevel( ${s}, ${n}, vec2f( r.y, v ), 0 ).x;
				let uv = vec2f( u, v );
				let totalSum = ${l};

				let direction = ${wl}( uv );
				let color = textureSampleLevel( ${e}, ${t}, uv, 0 ).rgb;

				result.direction = transpose( ${a} ) * direction;
				result.color = color * ${f};

				if ( totalSum != 0.0 ) {

					let lum = ${Lr}( color );
					let resolution = textureDimensions( ${e} );
					result.pdf = ${Ql}( lum, totalSum, resolution );

				} else {

					result.pdf = 0.0;

				}

				return result;

			}
		`,this.getWeight=_`
			fn getEnvWeight() -> f32 {

				let resolution = textureDimensions( ${e} );
				return ${f} * ${Gl} * ${Gl} * ${l} / ( 2.0 * f32( resolution.x * resolution.y ) );

			}
		`,this.getDirPdf=_`
			fn getEnvDirPdf( direction: vec3f ) -> f32 {

				if ( ${l} == 0.0 ) {

					return 0.0;

				}

				let rotatedDir = ${a} * direction;
				let mapUv = ${Qt}( rotatedDir );
				let color = textureSampleLevel( ${e}, ${t}, mapUv, 0 ).rgb;
				let lum = ${Lr}( color );
				let resolution = textureDimensions( ${e} );

				return ${Ql}( lum, ${l}, resolution );

			}
		`}};import{DataTexture as Pd,LinearFilter as jl,Matrix4 as Nd,RGBAFormat as $d,RepeatWrapping as Kl}from"three";import{sampler as Ed,texture as Ld,uniform as io}from"three/tsl";var tr=class{get map(){return this.mapNode.value}set map(e){this.mapNode.value=e}get blur(){return this.blurNode.value}set blur(e){this.blurNode.value=e}get rotation(){return this.rotationNode.value}get intensity(){return this.intensityNode.value}set intensity(e){this.intensityNode.value=e}constructor(){let e=new Pd(new Uint8Array([0,0,0,255]),1,1,$d);e.minFilter=jl,e.magFilter=jl,e.wrapS=Kl,e.wrapT=Kl,e.generateMipmaps=!1,e.needsUpdate=!0,this.mapNode=Ld(e),this.mapSampler=Ed(this.mapNode),this.blurNode=io(0),this.rotationNode=io(new Nd),this.intensityNode=io(1),this._initFns()}dispose(){this.map.dispose()}_initFns(){let{mapNode:e,mapSampler:t,blurNode:r,rotationNode:i,intensityNode:s}=this;this.sampleColor=_`
			fn sampleBackground( direction: vec3f, uv: vec2f ) -> vec4f {

				let rotatedDir = ( ${i} * vec4f( direction, 0.0 ) ).xyz;
				let offsetDir = ${Tl}( rotatedDir, uv ) * 0.5 * ${r};
				let sampleDir = normalize( rotatedDir + offsetDir );

				let mapUv = ${Qt}( sampleDir );
				let col = textureSampleLevel( ${e}, ${t}, mapUv, 0 );

				return vec4f( ${s} * col.rgb, col.a );

			}
		`}};import{storage as oh,uniform as ah,uniformArray as lh,texture as ch}from"three/tsl";import{StorageBufferAttribute as sc,HalfFloatType as uh}from"three/webgpu";import{MeshBasicMaterial as zd,RenderTarget as Od,NoToneMapping as Vd,QuadMesh as Hd,NoBlending as kd,Color as Ud,Vector4 as no,Matrix3 as Wd}from"three/webgpu";var qd=4096,Xl=new Ud,Yl=new Wd;function Zl(o){return`${o.source.uuid}:${o.source.version}`}function Gd(o,e,t,r){if(o[e].x+t>r)return-1;let s=t,n=0,l=e;for(;s>0;){if(l>=o.length)return-1;n=Math.max(n,o[l].y),s-=o[l].width,l++}return n}function Qd(o,e,t,r){let i=e+r,s=[],n=!1;for(let l=0;l<o.length;l++){let a=o[l],f=a.x+a.width;f<=e?s.push(a):a.x>=i?(n||(s.push({x:e,y:t,width:r}),n=!0),s.push(a)):(n||(s.push({x:e,y:t,width:r}),n=!0),f>i&&s.push({x:i,y:a.y,width:f-i}))}n||s.push({x:e,y:t,width:r}),o.length=0;for(let l=0;l<s.length;l++){let a=s[l],f=o[o.length-1];f&&f.y===a.y&&f.x+f.width===a.x?f.width+=a.width:o.push(a)}}function Jl(o,e,t,r,i){let s=1/0,n=0,l=-1;for(let a=0;a<o.length;a++){let f=Gd(o,a,e,r);f>=0&&f+t<=i&&f<s&&(s=f,n=o[a].x,l=a)}return l===-1?null:(Qd(o,n,s+t,e),{x:n,y:s})}var rr=class{get width(){return this.renderTarget.width}get height(){return this.renderTarget.height}get pageCount(){return this.renderTarget.depth}get texture(){return this.renderTarget.texture}constructor(e={}){this.renderTarget=new Od(1,1,{depthBuffer:!1,depth:1,...e}),this.texture.isArrayTexture=!0,this.textureInfo=[new no],this.hashes=[],this.placements=[],this.quadMesh=new Hd(new zd),this.quadMesh.material.blending=kd}setTextures(e,t){let r=t.map((u,d)=>d);if(r.sort((u,d)=>t[u].source.uuid<t[d].source.uuid?-1:1),t=r.map(u=>t[u]),this._hashesMatch(t)){this._buildCallerTextureInfo(r);return}let i=t.reduce((u,d)=>Math.max(u,d.width,d.height),1);i=Math.min(qd,i);let s=i,n=i,{renderTarget:l}=this,{placements:a,pageCount:f}=this._packTextures(t,s,n);l.setSize(s,n,f),this.texture.isArrayTexture=!0,this._renderTextures(e,t,a),this.placements=a;let c=new Array(t.length);for(let u=0,d=t.length;u<d;u++){let h=Zl(t[u]);c[u]=h}this.hashes=c,this._buildCallerTextureInfo(r)}_buildCallerTextureInfo(e){let t=new Array(e.length);for(let r=0,i=e.length;r<i;r++)t[e[r]]=this.placements[r];this._buildTextureInfo(t)}dispose(){this.renderTarget.dispose(),this.quadMesh.material.dispose()}_hashesMatch(e){let t=this.hashes;if(t.length!==e.length)return!1;for(let r=0,i=e.length;r<i;r++)if(t[r]!==Zl(e[r]))return!1;return!0}_packTextures(e,t,r){let i=[];for(let a=0,f=e.length;a<f;a++){let c=e[a];i.push({index:a,w:Math.min(c.width,t),h:Math.min(c.height,r)})}let s=i.sort((a,f)=>f.h-a.h),n=new Array(e.length),l=[];for(let a=0,f=s.length;a<f;a++){let c=s[a],u=null,d=-1;for(let h=0;h<l.length;h++)if(u=Jl(l[h],c.w,c.h,t,r),u){d=h;break}if(!u){let h=[{x:0,y:0,width:t}];u=Jl(h,c.w,c.h,t,r),l.push(h),d=l.length-1}n[c.index]={x:u.x,y:u.y,w:c.w,h:c.h,page:d}}return{placements:n,pageCount:Math.max(l.length,1)}}_buildTextureInfo(e){let t=this.textureInfo;t.length=0;for(let r=0,i=e.length;r<i;r++){let{x:s,y:n,w:l,h:a,page:f}=e[r],c=new no;c.x=s&65535|(n&65535)<<16,c.y=l&65535|(a&65535)<<16,c.z=f&65535,c.w=0,t.push(c)}t.length===0&&t.push(new no(0,0,0,0))}_renderTextures(e,t,r){let{quadMesh:i,renderTarget:s,width:n,height:l}=this,a=e.getRenderTarget(),f=e.toneMapping,c=e.autoClear,u=e.getScissorTest(),d=e.getClearAlpha();e.getClearColor(Xl),e.toneMapping=Vd,e.autoClear=!1,e.setScissorTest(!0),e.setClearColor(0,0);for(let h=0,p=s.depth;h<p;h++)s.viewport.set(0,0,n,l),s.scissor.set(0,0,n,l),e.setRenderTarget(s,h),e.clear();for(let h=0,p=t.length;h<p;h++){let{x:y,y:v,w:T,h:m,page:x}=r[h],g=t[h];if(s.viewport.set(y,v,T,m),s.scissor.set(y,v,T,m),e.setRenderTarget(s,x),g.isRenderTargetTexture){let b=g.matrixAutoUpdate;Yl.copy(g.matrix),g.matrix.identity(),g.matrixAutoUpdate=!1,i.material.map=g,i.render(e),g.matrixAutoUpdate=b,g.matrix.copy(Yl)}else{let b=g.clone();b.matrixAutoUpdate=!1,b.matrix.identity(),i.material.map=b,i.render(e),b.dispose()}}s.viewport.set(0,0,n,l),s.scissor.set(0,0,n,l),i.material.map=null,e.setClearColor(Xl,d),e.setScissorTest(u),e.autoClear=c,e.setRenderTarget(a),e.toneMapping=f}};import{DataTexture as jd,RGBAFormat as Kd,ClampToEdgeWrapping as tc,FloatType as Xd,Vector3 as Hr,Quaternion as Yd,Matrix4 as Zd,NearestFilter as rc}from"three";function ec(o){let e=0;if(o.byteLength!==0){let t=new Uint8Array(o);for(let r=0;r<o.byteLength;r++){let i=t[r];e=(e<<5)-e+i,e|=0}}return e}var so=6,Jd=11,eh=0,th=1,rh=2,ih=3,nh=4,Te=new Hr,ne=new Hr,ic=new Zd,ir=new Yd,nc=new Hr,Me=new Hr,sh=new Hr(0,1,0),vn=class{constructor(){let e=new jd(new Float32Array(4),1,1);e.format=Kd,e.type=Xd,e.wrapS=tc,e.wrapT=tc,e.generateMipmaps=!1,e.minFilter=rc,e.magFilter=rc,this.tex=e,this.count=0}updateFrom(e,t=[]){let r=this.tex,i=Math.max(e.length*so,1),s=Math.ceil(Math.sqrt(i));r.image.width!==s&&(r.dispose(),r.image.data=new Float32Array(s*s*4),r.image.width=s,r.image.height=s);let n=r.image.data;for(let a=0,f=e.length;a<f;a++){let c=e[a],u=a*so*4,d=0;for(let p=0;p<so*4;p++)n[u+p]=0;c.getWorldPosition(ne),n[u+d++]=ne.x,n[u+d++]=ne.y,n[u+d++]=ne.z;let h=eh;if(c.isRectAreaLight&&c.isCircular?h=th:c.isSpotLight?h=rh:c.isDirectionalLight||c.isSunLight?h=ih:c.isPointLight&&(h=nh),n[u+d++]=h,n[u+d++]=c.color.r,n[u+d++]=c.color.g,n[u+d++]=c.color.b,n[u+d++]=c.intensity,c.getWorldQuaternion(ir),c.isRectAreaLight)Te.set(c.width,0,0).applyQuaternion(ir),n[u+d++]=Te.x,n[u+d++]=Te.y,n[u+d++]=Te.z,d++,ne.set(0,c.height,0).applyQuaternion(ir),n[u+d++]=ne.x,n[u+d++]=ne.y,n[u+d++]=ne.z,n[u+d++]=Te.cross(ne).length()*(c.isCircular?Math.PI/4:1);else if(c.isSpotLight){let p=c.radius||0;nc.setFromMatrixPosition(c.matrixWorld),Me.setFromMatrixPosition(c.target.matrixWorld),ic.lookAt(nc,Me,sh),ir.setFromRotationMatrix(ic),Te.set(1,0,0).applyQuaternion(ir),n[u+d++]=Te.x,n[u+d++]=Te.y,n[u+d++]=Te.z,d++,ne.set(0,1,0).applyQuaternion(ir),n[u+d++]=ne.x,n[u+d++]=ne.y,n[u+d++]=ne.z,n[u+d++]=Math.PI*p*p,n[u+d++]=p,n[u+d++]=c.decay,n[u+d++]=c.distance,n[u+d++]=Math.cos(c.angle),n[u+d++]=Math.cos(c.angle*(1-c.penumbra)),n[u+d++]=c.iesMap?t.indexOf(c.iesMap):-1}else if(c.isPointLight){let p=Te.setFromMatrixPosition(c.matrixWorld);n[u+d++]=p.x,n[u+d++]=p.y,n[u+d++]=p.z,d++,d+=4,d+=1,n[u+d++]=c.decay,n[u+d++]=c.distance}else if(c.isDirectionalLight){let p=Te.setFromMatrixPosition(c.matrixWorld),y=ne.setFromMatrixPosition(c.target.matrixWorld);Me.subVectors(p,y).normalize(),n[u+d++]=Me.x,n[u+d++]=Me.y,n[u+d++]=Me.z}else c.isSunLight&&(Me.setFromMatrixPosition(c.matrixWorld).normalize(),n[u+d++]=Me.x,n[u+d++]=Me.y,n[u+d++]=Me.z);n[u+Jd]=c.visibleToCameraRays?1:0}this.count=e.length;let l=ec(n.buffer);return this.hash!==l?(this.hash=l,r.needsUpdate=!0,!0):!1}};var nr=class extends vn{constructor(){super(),this.countNode=ah(this.count,"uint"),this.buffer=new sc(new Float32Array(2*Ve.getLength()),Ve.getLength()),this.bufferNode=oh(this.buffer,Ve).toReadOnly().setName("lights"),this.iesAtlas=new rr({type:uh}),this.iesProfilesNode=ch(this.iesAtlas.texture),this.iesInfoNode=lh(this.iesAtlas.textureInfo,"uvec4"),this._initFns()}updateFrom(e,t){let r=Array.from(new Set(t.map(c=>c.iesMap).filter(c=>c))),i=super.updateFrom(t,r);this.iesAtlas.setTextures(e,r),this.iesProfilesNode.value=this.iesAtlas.texture;let s=Ve.getLength(),n=this.count,l=Math.max(n,2);this.buffer.array.length!==l*s&&(this.buffer.dispose(),this.buffer=new sc(new Float32Array(l*s),s),this.bufferNode.value=this.buffer);let a=this.tex.image.data;this.buffer.array.set(a.subarray(0,n*s));let f=new Int32Array(this.buffer.array.buffer);for(let c=0;c<n;c++){let u=c*s;f[u+3]=Math.round(a[u+3]),f[u+11]=Math.round(a[u+11]),f[u+21]=Math.round(a[u+21])}return this.buffer.needsUpdate=!0,this.countNode.value=this.count,i}_initFns(){let{bufferNode:e,countNode:t,iesProfilesNode:r,iesInfoNode:i}=this,s=Ki(i,r,"sampleIesTexel");this.isLightVisibleToCamera=_`
			fn isLightVisibleToCamera( index: u32 ) -> bool {

				return ${e}[ index ].visibleToCameraRays != 0;

			}
		`,this.getLightWeight=_`
			fn getLightWeight( index: u32, position: vec3f ) -> f32 {

				let light = ${e}[ index ];
				let power = ${Lr}( light.color * light.intensity );
				if ( light.lightType == ${ks} ) {

					// the most any point on the spot's disc lights the position. Ies profiles are not
					// evaluated here
					let nearest = ${Dl}( light, position );
					var attenuation = 1.0;
					if ( light.iesProfile < 0 ) {

						attenuation = ${qs}( light.coneCos, light.penumbraCos, nearest.x );

					}

					return power * attenuation * ${tn}( nearest.y, light.distance, light.decay );

				} else if ( light.lightType == ${Ws} ) {

					// the point light's world position is packed into the u slot
					let dist = length( light.u - position );
					return power * ${tn}( dist, light.distance, light.decay );

				} else if ( light.lightType == ${Us} ) {

					return power;

				} else {

					let toLight = light.position - position;
					let distSq = dot( toLight, toLight );
					if ( distSq == 0.0 ) {

						return 0.0;

					}

					// area lights only emit from their front face, and the distance is held above the size
					// of the light so positions on or near it do not dominate
					let normal = normalize( cross( light.u, light.v ) );
					let cosTheta = dot( toLight, normal ) * inverseSqrt( distSq );
					return power * light.area * max( cosTheta, 0.0 ) / max( distSq, light.area );

				}

			}
		`,this.getLightsWeight=_`
			fn getLightsWeight( position: vec3f ) -> f32 {

				var total = 0.0;
				for ( var i = 0u; i < ${t}; i ++ ) {

					total += ${this.getLightWeight}( i, position );

				}

				return total;

			}
		`,this.selectLight=_`
			fn selectLight( position: vec3f, envWeight: f32, r: f32, selectionPdf: ptr<function, f32> ) -> u32 {

				let count = ${t};
				let totalWeight = ${this.getLightsWeight}( position ) + envWeight;
				if ( totalWeight <= 0.0 ) {

					*selectionPdf = 0.0;
					return 0u;

				}

				let targetWeight = r * totalWeight;
				var accumulated = 0.0;
				var lastWeighted = 0u;
				var index = count;
				for ( var i = 0u; i < count; i ++ ) {

					let lightWeight = ${this.getLightWeight}( i, position );
					accumulated += lightWeight;
					if ( lightWeight > 0.0 ) {

						lastWeighted = i;

					}

					if ( targetWeight < accumulated ) {

						index = i;
						break;

					}

				}

				// rounding can carry the target past the last light when there is no environment
				if ( index == count && envWeight <= 0.0 ) {

					index = lastWeighted;

				}

				var weight = envWeight;
				if ( index < count ) {

					weight = ${this.getLightWeight}( index, position );

				}

				*selectionPdf = weight / totalWeight;
				return index;

			}
		`,this.randomLightSample=_`
			fn randomLightSample( lightIndex: u32, rayOrigin: vec3f, ruv: vec2f ) -> ${ae} {

				let light = ${e}[ lightIndex ];

				var result: ${ae};
				if ( light.lightType == ${ks} ) {

					result = ${Rl}( light, rayOrigin, ruv );

					let spotNormal = normalize( cross( light.u, light.v ) );
					let cosTheta = dot( result.direction, spotNormal );
					var spotAttenuation: f32;
					if ( light.iesProfile >= 0 ) {

						// half a texel of the profile's tile in the atlas
						let profileInfo = ${i}[ u32( light.iesProfile ) ];
						let texelInset = 0.5 / vec2f( vec2u( profileInfo.y & 0xFFFFu, profileInfo.y >> 16u ) );

						// tilt spans [ 0, 180 ]deg inset to the texel centers, twist covers [ 0, 359 ]deg and wraps
						let tiltAngle = mix( texelInset.x, 1.0 - texelInset.x, acos( cosTheta ) / PI );
						let twistAngle = ( atan2( dot( result.direction, light.v ), dot( result.direction, light.u ) ) + PI ) / ( 2.0 * PI ) + texelInset.y;
						let packedProfile = ( 1 << 26 ) | light.iesProfile;
						spotAttenuation = ${s}( vec2f( tiltAngle, twistAngle ), packedProfile, 0.0 ).r;

					} else {

						spotAttenuation = ${qs}( light.coneCos, light.penumbraCos, cosTheta );

					}

					result.emission *= spotAttenuation;

				} else if ( light.lightType == ${Ws} ) {

					// the point light's world position is packed into the u slot
					let lightRay = light.u - rayOrigin;
					let lightDist = length( lightRay );
					let cutoffDistance = light.distance;
					var distanceFalloff = 1.0 / max( pow( lightDist, light.decay ), 0.01 );
					if ( cutoffDistance > 0.0 ) {

						let window = clamp( 1.0 - pow( lightDist / cutoffDistance, 4.0 ), 0.0, 1.0 );
						distanceFalloff *= window * window;

					}

					result.direction = normalize( lightRay );
					result.dist = lightDist;
					result.pdf = 1.0;
					result.emission = light.color * light.intensity * distanceFalloff;
					result.lightType = light.lightType;

				} else if ( light.lightType == ${Us} ) {

					// the directional light's direction is packed into the u slot
					result.dist = ${Ze};
					result.direction = light.u;
					result.pdf = 1.0;
					result.emission = light.color * light.intensity;
					result.lightType = light.lightType;

				} else {

					result = ${_l}( light, rayOrigin, ruv );

				}

				return result;

			}
		`,this.intersectLightAtIndex=_`
			fn intersectLightAtIndex( rayOrigin: vec3f, rayDirection: vec3f, index: u32, lightRec: ptr<function, ${ae}> ) -> bool {

				let light = ${e}[ index ];

				var u = light.u;
				var v = light.v;
				let normal = normalize( cross( u, v ) );

				// only front-facing area lights can be hit
				if ( dot( normal, rayDirection ) > 0.0 ) {

					u *= 1.0 / dot( u, u );
					v *= 1.0 / dot( v, v );

					var dist = - 1.0;
					if ( light.lightType == ${Yi} ) {

						dist = ${Sl}( light.position, normal, u, v, rayOrigin, rayDirection );

					} else if ( light.lightType == ${Zi} ) {

						dist = ${Il}( light.position, normal, u, v, rayOrigin, rayDirection );

					}

					if ( dist > 0.0 ) {

						let cosTheta = dot( rayDirection, normal );
						lightRec.dist = dist;
						lightRec.pdf = ( dist * dist ) / ( light.area * cosTheta );
						lightRec.emission = light.color * light.intensity;
						lightRec.direction = rayDirection;
						lightRec.lightType = light.lightType;
						return true;

					}

				}

				return false;

			}
		`}dispose(){this.tex.dispose(),this.buffer.dispose(),this.iesAtlas.dispose()}};import{ColorManagement as oc,FloatType as ac,RGBAFormat as lc}from"three";import{RedIntegerFormat as ph,StorageTexture as oo,UnsignedIntType as mh}from"three/webgpu";import{StorageTexture as fh}from"three/webgpu";import{textureStore as dh,globalId as hh}from"three/tsl";var kr=class extends q{constructor(){let e={globalId:hh,outputTarget:dh(new fh(1,1)).toWriteOnly()},t=_`
			fn compute( globalId: vec3u ) -> void {

				textureStore( ${e.outputTarget}, globalId.xy, vec4( 0, 0, 0, 1 ) );

			}
		`;super(t(e)),this.defineUniformAccessors({target:e.outputTarget})}};var sr=class{constructor(e){this.renderer=e,this.maxBounces=15,this.frameBudget=25e4,this.maxTransparentBounces=15,this.lowResMode=!1,this.maxSamples=0,this._renderTask=null,this.outputTarget=new oo(1,1),this.outputTarget.format=lc,this.outputTarget.type=ac,this.outputTarget.colorSpace=oc.workingColorSpace,this.outputTarget.name="Output #0",this.outputTarget.generateMipmaps=!1,this.prevOutputTarget=new oo(1,1),this.prevOutputTarget.format=lc,this.prevOutputTarget.type=ac,this.prevOutputTarget.colorSpace=oc.workingColorSpace,this.prevOutputTarget.name="Output #1",this.prevOutputTarget.generateMipmaps=!1,this.sampleCountTarget=new oo(1,1),this.sampleCountTarget.format=ph,this.sampleCountTarget.type=mh,this.sampleCountTarget.name="Sample Count",this.sampleCountTarget.generateMipmaps=!1,this.sampleCountClearKernel=new kr().setWorkgroupSize(8,8,1),this.outputTargetClearKernel=new kr().setWorkgroupSize(8,8,1)}setRandom(e){}setBVHData(e){}setTextures(e){}setMaterial(e){}setFilterGlossy(e){}setClamping(e,t){}setEnvironment(e,t,r){}setLights(e){}setBackground(e,t,r,i){}rebuild(){this._renderTask=null}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t);let{width:r,height:i}=this.outputTarget;return r===e&&i===t?!1:(this.outputTarget.dispose(),this.prevOutputTarget.dispose(),this.sampleCountTarget.dispose(),this.outputTarget=this.outputTarget.clone(),this.prevOutputTarget=this.outputTarget.clone(),this.sampleCountTarget=this.sampleCountTarget.clone(),this.outputTarget.setSize(e,t),this.prevOutputTarget.setSize(e,t),this.sampleCountTarget.setSize(e,t),this.reset(),!0)}getSize(e){let{width:t,height:r}=this.outputTarget;return e.x=t,e.y=r,e}update(){let{renderer:e}=this;e.initialized&&(this._renderTask||(this._renderTask=this.createRenderTask()),this._renderTask.next())}*createRenderTask(){}async getSampleCountsAsync(){return{min:0,max:0,avg:0}}resetSeed(){}reset(){let{renderer:e,outputTargetClearKernel:t,sampleCountClearKernel:r,outputTarget:i,prevOutputTarget:s,sampleCountTarget:n}=this;if(!e.initialized)return;let{width:l,height:a}=i,f=t.getDispatchSize(l,a);t.target=i,e.compute(t.kernel,f),t.target=s,e.compute(t.kernel,f),r.target=n,e.compute(r.kernel,f),this._renderTask=null}dispose(){this.outputTarget.dispose(),this.prevOutputTarget.dispose(),this.sampleCountTarget.dispose(),this.sampleCountClearKernel.dispose(),this.outputTargetClearKernel.dispose(),this._renderTask=null}};var ao=new uc,yn=class extends sr{constructor(e){super(e),this.envInfo=new er,this._completedSamples=0,this._tileProgress=0,this.kernel=new mn().setWorkgroupSize(8,8,1),this.kernel.envInfo=this.envInfo,this.backgroundInfo=new tr,this.kernel.backgroundInfo=this.backgroundInfo,this.lightsInfo=new nr,this.kernel.lightsInfo=this.lightsInfo}resetSeed(){this.kernel.seed=0}reset(){super.reset(),this._completedSamples=0,this._tileProgress=0}async getSampleCountsAsync(){if(this.lowResMode)return{min:0,max:0,avg:0};let e=this._completedSamples,t=this._tileProgress;return{min:t===1?e+1:e,max:e+1,avg:e+t}}setBVHData(e){this.kernel.bvhData=e,this.rebuild()}rebuild(){super.rebuild(),this.kernel.needsUpdate=!0,this.reset()}setRandom(e){this.kernel.context.random=e,this.kernel.needsUpdate=!0,this.reset()}setMaterial(e){this.kernel.material=e.getData(),this.kernel.needsUpdate=!0,this.reset()}setFilterGlossy(e){this.kernel.filterGlossy=e===0?sn:1/e,this.reset()}setClamping(e,t){this.kernel.clampDirect=e,this.kernel.clampIndirect=t,this.reset()}setEnvironment(e){this.envInfo.updateFrom(e)}setLights(e){this.lightsInfo.updateFrom(this.renderer,e),this.reset()}setMultipleImportanceSampling(e){this.kernel.misEnabled=e?1:0,this.reset()}setEnvironmentParams(e,t){let{envInfo:r}=this,i=new cc().makeRotationFromEuler(t).invert();r.rotationNode.value.setFromMatrix4(i),r.intensityNode.value=e}setBackground(e){let{backgroundInfo:t}=this;t.dispose(),t.map=e}setBackgroundParams(e,t,r){let{backgroundInfo:i}=this,s=new cc().makeRotationFromEuler(t).invert();i.rotationNode.value.copy(s),i.intensity=e,i.blur=r}setTransmissiveBackground(e){this.kernel.transmissiveBackground=e,this.reset()}*createRenderTask(){let{renderer:e,kernel:t,maxBounces:r,maxTransparentBounces:i,outputTarget:s,sampleCountTarget:n,lowResMode:l}=this,a=new uc;t.outputTarget=s,t.sampleCountTarget=n,t.maxBounces=r,t.maxTransparentBounces=i;let f=0;for(;;){if(t.maxSamples=this.maxSamples,this.maxSamples!==0&&f>=this.maxSamples){yield;continue}this.getSize(ao);let c=Math.max(1,Math.ceil(ao.x*ao.y/this.frameBudget));a.x=Math.ceil(Math.sqrt(c)),a.y=Math.ceil(c/a.x);let u=this.lowResMode?1:a.x*a.y,d=0,h=t.tileSize;l?this.getSize(h):this.getSize(h).divide(a).ceil();let p=t.getDispatchSize(h.x,h.y);t.seed+=1,e.copyTextureToTexture(this.outputTarget,this.prevOutputTarget),[this.outputTarget,this.prevOutputTarget]=[this.prevOutputTarget,this.outputTarget],t.prevOutputTarget=this.prevOutputTarget,t.outputTarget=this.outputTarget;for(let y=0;y<a.x;y++)for(let v=0;v<a.y;v++)t.offset.set(y,v).multiply(h),e.compute(t.kernel,p),d=Math.min(d+1,u),this._completedSamples=f,this._tileProgress=d/u,yield;f++}}dispose(){super.dispose(),this.envInfo.dispose(),this.lightsInfo.dispose(),this.kernel.dispose()}};import{Matrix4 as Bc,StorageBufferAttribute as bt,Vector2 as Lh}from"three/webgpu";import{Vector2 as gh}from"three";import{StorageBufferAttribute as fc}from"three/webgpu";import{uniform as dc,storage as hc,globalId as xh}from"three/tsl";import{StructTypeNode as bn}from"three/webgpu";var or=class extends bn{constructor(e,t,r=[]){super(e,t),this.dependencies=r}setup(e){for(let t of this.dependencies)t.build(e);super.setup(e)}},de=new bn({throughputColor:"vec3f",currentBounce:"uint",resultColor:"vec4f",emission:"vec3f",scatterPdf:"float",scatterColor:"vec3f",minPdf:"float",origin:"vec3f",isFullyTransmissive:"uint",direction:"vec3f",side:"float",normal:"vec3f",objectIndex:"int",barycoord:"vec3f",pixelIndex:"uint",indices:"vec3u",seed:"uint",lightDirection:"vec3f",lightPdf:"float",lightEmission:"vec3f",lightDist:"float",lightBsdf:"vec3f",lightBsdfPdf:"float",rayIntersectionIndex:"int",shadowRayIntersectionIndex:"int",lightType:"int",dist:"float",alphaDepth:"uint",maxDist:"float",dispersionWavelength:"float"},"RayData"),ar=new bn({origin:"vec3f",pixelIndex:"uint",direction:"vec3f",currentBounce:"uint",seed:"uint",alphaDepth:"uint",maxDist:"float",_alignment0:"uint"},"TraceQueuedRay"),Be=new bn({barycoord:"vec3f",objectIndex:"int",position:"vec3f",dist:"float",normal:"vec3f",side:"float",indices:"vec3u",forwardBlocked:"uint"},"TraceResult"),xt=new or({length:"uint",elements:`array<${ar.name}>`},"RayQueue",[ar]);xt.getLength=()=>4;var lr=new or({length:{type:"uint",atomic:!0},elements:`array<${ar.name}>`},"RayQueue",[ar]);lr.getLength=()=>4;var vt=new or({current:{type:"uint",atomic:!0},elementCount:{type:"uint",atomic:!0},elements:"array<atomic<u32>>"},"PixelQueue");vt.getLength=()=>2;var lo=new or({current:"uint",elementCount:"uint",elements:"array<u32>"},"PixelQueue");lo.getLength=()=>2;var Tn=class extends q{constructor(){let e={rayDataStorage:hc(new fc(1,1),de),pixelQueue:hc(new fc(1,1),lo),targetDimensions:dc(new gh),frameBudget:dc(0,"uint"),globalId:xh},t=_`
			fn compute( targetDimensions: vec2u, frameBudget: u32, globalId: vec3u ) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let pixelQueue = &${e.pixelQueue};

				if ( globalId.x >= targetDimensions.x || globalId.y >= targetDimensions.y ) {

					return;

				}

				let rayCount = min( frameBudget, arrayLength( rayDataStorage ) );
				let pixelCount = targetDimensions.x * targetDimensions.y;
				if ( globalId.x == 0u && globalId.y == 0u ) {

					pixelQueue.current = 0u;
					pixelQueue.elementCount = select( 0u, pixelCount - rayCount, pixelCount >= rayCount );

				}

				let pixelHash = ( globalId.x << 16 ) | globalId.y;
				let pixelIndex = globalId.x + globalId.y * targetDimensions.x;
				if ( pixelIndex < rayCount ) {

					rayDataStorage[ pixelIndex ].pixelIndex = pixelHash;
					rayDataStorage[ pixelIndex ].resultColor = vec4f( 0.0 );
					rayDataStorage[ pixelIndex ].throughputColor = vec3f( 0.0 );
					rayDataStorage[ pixelIndex ].objectIndex = - 1;
					rayDataStorage[ pixelIndex ].alphaDepth = 0u;
					rayDataStorage[ pixelIndex ].rayIntersectionIndex = - 1;
					rayDataStorage[ pixelIndex ].shadowRayIntersectionIndex = - 1;

				} else {

					pixelQueue.elements[ pixelIndex - rayCount ] = pixelHash;

				}

			}
		`;super(t(e)),this.defineUniformAccessors(e)}};import{StorageBufferAttribute as co,StorageTexture as uo}from"three/webgpu";import{uniform as cr,storage as fo,textureStore as ho,globalId as vh}from"three/tsl";var wn=class extends q{constructor(){let e={envInfo:{value:null},backgroundInfo:{value:null},lightsInfo:{value:null},prevOutputTarget:ho(new uo(1,1)).toReadOnly(),outputTarget:ho(new uo(1,1)).toWriteOnly(),sampleCountTarget:ho(new uo(1,1)).toReadWrite(),misEnabled:cr(1,"uint"),rayCount:cr(0,"uint"),maxBounces:cr(5,"uint"),clampDirect:cr(0),clampIndirect:cr(10),transmissiveBackground:cr(Yt),rayDataStorage:fo(new co(1,1),de),rayIntersectionsStorage:fo(new co(1,1),Be),shadowRayIntersectionsStorage:fo(new co(1,1),Be),globalId:vh},t=H("envInfo.value.totalSumNode",e),r=H("envInfo.value.intensityNode",e),i=H("envInfo.value.sampleColor",e),s=H("envInfo.value.sampleDir",e),n=H("envInfo.value.getDirPdf",e),l=H("envInfo.value.getWeight",e),a=H("backgroundInfo.value.sampleColor",e),f=H("lightsInfo.value.countNode",e),c=O("lightsInfo.value.randomLightSample",e),u=O("lightsInfo.value.intersectLightAtIndex",e),d=O("lightsInfo.value.getLightWeight",e),h=O("lightsInfo.value.getLightsWeight",e),p=O("lightsInfo.value.selectLight",e),y=O("lightsInfo.value.isLightVisibleToCamera",e),v=_`

			fn compute(
				// settings
				misEnabled: u32,
				rayCount: u32,
				maxBounces: u32,
				clampDirect: f32,
				clampIndirect: f32,
				transmissiveBackground: u32,

				globalId: vec3u
			) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let rayIntersectionsStorage = &${e.rayIntersectionsStorage};
				let shadowRayIntersectionsStorage = &${e.shadowRayIntersectionsStorage};

				// bound by "rayCount" rather than the pool length. See MaterialKernel
				let index = globalId.x;
				if ( index >= rayCount ) {

					return;

				}

				// skip slots that have never spawned a ray
				let input = ( *rayDataStorage )[ index ];
				if ( input.rayIntersectionIndex < 0 ) {

					return;

				}

				let indexUV = vec2u( input.pixelIndex >> 16, input.pixelIndex & 0xFFFF );
				${ve}( indexUV, input.seed, input.currentBounce + input.alphaDepth );

				// one-sample NEE chooses between the analytic lights and the environment, matched with
				// the megakernel
				let envActive = ${t} > 0.0 && ${r} > 0.0;
				let lightsCount = ${f};
				var envWeight = 0.0;
				if ( envActive ) {

					envWeight = ${l}();

				}

				var resultColor = input.resultColor;
				var throughputColor = input.throughputColor;

				// added last, since a camera ray miss overwrites the pixel with the background
				var lightHits = vec3f( 0.0 );
				var cameraHitLight = false;

				// resolve the previous surface's NEE shadow ray (pre-scatter throughput). The index
				// is negative when no shadow ray was enqueued last frame
				if ( input.shadowRayIntersectionIndex >= 0 && input.lightPdf > 0.0 ) {

					let shadowHit = ( *shadowRayIntersectionsStorage )[ u32( input.shadowRayIntersectionIndex ) ];
					let occluded = shadowHit.objectIndex >= 0;
					if ( ! occluded ) {

						// env + area lights are also bsdf-sampled, so MIS-weight them; punctual take full weight,
						// or when a bsdf ray could never reach the light
						let isMISWeighted = ${en}( input.lightType ) && shadowHit.forwardBlocked == 0u;
						let misWeight = select( 1.0, ${Ae}( input.lightPdf, input.lightBsdfPdf ), isMISWeighted );
						let directLight = throughputColor * input.lightEmission * input.lightBsdf * misWeight / input.lightPdf;
						let contribution = ${J}( directLight, input.currentBounce, clampDirect, clampIndirect );
						resultColor += vec4f( contribution, 0.0 );

					}

				}

				// emission gathered at the previous surface (pre-scatter throughput). Found light clamps
				// at the depth of the segment that found it, as in Cycles, so one less than the current
				let emission = ${J}( throughputColor * input.emission, max( input.currentBounce, 1u ) - 1u, clampDirect, clampIndirect );
				resultColor += vec4f( emission, 0.0 );

				// reconstruct the scatter record staged by MaterialKernel
				var scatterRec: ${Oe};
				scatterRec.color = input.scatterColor;
				scatterRec.pdf = input.scatterPdf;

				// the bounce limit, russian roulette, and terminating scatter checks all ran in
				// MaterialKernel, which stages a zeroed pdf and skips the bounce trace when they fire
				var isTerminated = all( throughputColor == vec3f( 0.0 ) ) || input.currentBounce >= maxBounces || ${Gt}( scatterRec );

				if ( ! isTerminated ) {

					// apply the scatter across the traced segment
					throughputColor *= scatterRec.color / scatterRec.pdf;

					let hitResult = ( *rayIntersectionsStorage )[ u32( input.rayIntersectionIndex ) ];
					let didHit = hitResult.objectIndex >= 0;
					let surfaceDist = select( ${Ze}, hitResult.dist, didHit );

					// NEE's total weight at the vertex this segment left, for MIS. Camera segments have none
					let isMISWeighted = misEnabled != 0u && input.currentBounce > 0u;
					var lightTotalWeight = 0.0;
					if ( isMISWeighted ) {

						lightTotalWeight = ${h}( input.origin ) + envWeight;

					}

					// forward hits on area lights. Camera rays only see visibleToCameraRays lights, at full weight
					for ( var li = 0u; li < lightsCount; li ++ ) {

						if ( input.currentBounce == 0u && ! ${y}( li ) ) {

							continue;

						}

						var lightRec: ${ae};
						if ( ${u}( input.origin, input.direction, li, &lightRec ) && lightRec.dist < surfaceDist ) {

							var misWeight = 1.0;
							if ( isMISWeighted ) {

								let selectionPdf = ${d}( li, input.origin ) / lightTotalWeight;
								misWeight = ${Ae}( input.scatterPdf, lightRec.pdf * selectionPdf );

							}

							lightHits += ${J}( lightRec.emission * throughputColor * misWeight, input.currentBounce, clampDirect, clampIndirect );
							cameraHitLight = cameraHitLight || input.currentBounce == 0u;

						}

					}

					if ( didHit ) {

						// stage the hit for MaterialKernel
						rayDataStorage[ index ].barycoord = hitResult.barycoord;
						rayDataStorage[ index ].normal = hitResult.normal;
						rayDataStorage[ index ].side = hitResult.side;
						rayDataStorage[ index ].indices = hitResult.indices;
						rayDataStorage[ index ].objectIndex = hitResult.objectIndex;
						rayDataStorage[ index ].dist = hitResult.dist;

						// next event estimation: choose one light or the environment by its estimated
						// contribution. MaterialKernel evaluates the bsdf and enqueues the shadow ray.
						var lightPdf = 0.0;
						if ( misEnabled != 0u ) {

							let ruv = ${Gi}( ${ki} );
							var selectionPdf = 0.0;
							let lightIndex = ${p}( hitResult.position, envWeight, ruv.x, &selectionPdf );
							if ( selectionPdf > 0.0 ) {

								var lightRec: ${ae};
								if ( envActive && lightIndex == lightsCount ) {

									// the environment, sampled from its CDF, as a light of kind ENVIRONMENT
									let envSample = ${s}( ruv.yz );
									lightRec.direction = envSample.direction;
									lightRec.emission = envSample.color;
									lightRec.pdf = envSample.pdf;
									lightRec.dist = ${Ze};
									lightRec.lightType = ${zr};

								} else {

									lightRec = ${c}( lightIndex, hitResult.position, ruv.yz );

								}

								lightPdf = lightRec.pdf * selectionPdf;
								rayDataStorage[ index ].lightDirection = lightRec.direction;
								rayDataStorage[ index ].lightEmission = lightRec.emission;
								rayDataStorage[ index ].lightDist = lightRec.dist;
								rayDataStorage[ index ].lightType = lightRec.lightType;

							}

						}

						rayDataStorage[ index ].lightPdf = lightPdf;

					} else {

						// the segment escaped the scene: gather the environment for opaque paths, or
						// the background for camera segments and fully transmissive paths
						if ( input.currentBounce > 0u && input.isFullyTransmissive == 0u ) {

							var misWeight = 1.0;
							if ( isMISWeighted && envActive ) {

								// match the env pdf scaling used by the NEE selection so the two estimators balance
								let envPdf = ${n}( input.direction ) * envWeight / lightTotalWeight;
								misWeight = ${Ae}( input.scatterPdf, envPdf );

							}

							let environment = ${i}( input.direction ).rgb * throughputColor * misWeight;
							let contribution = ${J}( environment, input.currentBounce, clampDirect, clampIndirect );
							resultColor += vec4f( contribution, 0.0 );

						} else {

							// hit the background
							// support multiple transparent background blending techniques
							let rng = ${ye}( ${Vi} );
							let bg = ${a}( input.direction, rng );
							if ( input.currentBounce == 0u ) {

								// sample the background directly if this is the primary ray
								let background = ${J}( bg.a * bg.rgb, input.currentBounce, clampDirect, clampIndirect );
								resultColor = vec4f( background, bg.a );

							} else {

								// transmissive ray handling
								let env = ${i}( input.direction );
								let avg = saturate( dot( throughputColor, vec3f( 1.0 / 3.0 ) ) );
								let transparency = ( 1.0 - bg.a ) * avg;

								var misWeight = 1.0;
								if ( misEnabled != 0u && envActive ) {

									let envPdf = ${n}( input.direction );
									misWeight = ${Ae}( input.scatterPdf, envPdf );

								}

								if ( transmissiveBackground == ${hn}u ) {

									// display the env map through transmissive surfaces
									let background = ${J}( env.rgb * throughputColor * misWeight, input.currentBounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0,
									);

								} else if ( transmissiveBackground == ${pn}u ) {

									// fade the background by the throughput color average
									let background = ${J}( bg.a * bg.rgb * throughputColor * misWeight, input.currentBounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								} else {

									// fade the background by the throughput color average, mixing in env lighting
									var light = mix( env.rgb, bg.rgb, bg.a ) * misWeight;
									let background = ${J}( light * throughputColor, input.currentBounce, clampDirect, clampIndirect );
									resultColor = vec4f(
										resultColor.rgb + background,
										1.0 - transparency,
									);

								}

							}

						}

						isTerminated = true;

					}

				}

				// visible lights are opaque against a transparent background
				resultColor += vec4f( lightHits, 0.0 );
				if ( cameraHitLight ) {

					resultColor.a = 1.0;

				}

				// the color rows are stored top down to match a rasterized render target
				let colorIndex = vec2u( indexUV.x, textureDimensions( ${e.outputTarget} ).y - 1u - indexUV.y );
				let storedSamples = textureLoad( ${e.sampleCountTarget}, indexUV ).r & ${Je}u;

				if ( isTerminated ) {

					// blend the finished sample into the output and free the slot for a new camera ray
					let sampleCount = storedSamples + 1;
					let prevColor = textureLoad( ${e.prevOutputTarget}, colorIndex );
					let blendedColor = ${Xi}( prevColor, resultColor, 1.0 / f32( sampleCount ) );
					textureStore( ${e.sampleCountTarget}, indexUV, vec4( ${Zt}u | sampleCount ) );
					textureStore( ${e.outputTarget}, colorIndex, blendedColor );

					rayDataStorage[ index ].objectIndex = - 1;

				} else {

					// show the path so far, which the first sample overwrites
					if ( storedSamples == 0u ) {

						textureStore( ${e.outputTarget}, colorIndex, resultColor );

					}

					rayDataStorage[ index ].resultColor = resultColor;
					rayDataStorage[ index ].throughputColor = throughputColor;

				}

			}
		`;super(v(e)),this.defineUniformAccessors(e)}};import{Vector2 as yh}from"three";import{StorageBufferAttribute as Sn,StorageTexture as bh}from"three/webgpu";import{uniform as yt,storage as In,textureStore as Th,globalId as wh}from"three/tsl";var _n=class extends q{constructor(){let e={bvhData:{value:null},material:{value:null},seed:yt(0,"uint"),targetDimensions:yt(new yh),maxSamples:yt(0,"uint"),rayCount:yt(0,"uint"),filterGlossy:yt(1),maxTransparentBounces:yt(5,"uint"),maxBounces:yt(5,"uint"),sampleCountTarget:Th(new bh(1,1)).toReadWrite(),rayDataStorage:In(new Sn(1,1),de),rayQueue:In(new Sn(1,1),lr),shadowRayQueue:In(new Sn(1,1),lr),pixelQueue:In(new Sn(1,1),vt),globalId:wh},t=O("bvhData.value.fns.getCameraRay",e),r=O("bvhData.value.fns.sampleTrianglePoint",e),i=O("bvhData.value.fns.getSurfaceRecord",e),s=O("material.value.bsdfSample",e),n=O("material.value.bsdfEvalPdf",e),l=_`

			fn compute(
				seed: u32,
				targetDimensions: vec2u,
				maxSamples: u32,
				rayCount: u32,
				filterGlossy: f32,
				maxTransparentBounces: u32,
				maxBounces: u32,

				globalId: vec3u
			) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let rayQueue = &${e.rayQueue};
				let shadowRayQueue = &${e.shadowRayQueue};
				let pixelQueue = &${e.pixelQueue};

				let materials = &${H("bvhData.value.storage.materials",e)};
				let transforms = &${H("bvhData.value.storage.transforms",e)};

				// bound by "rayCount" rather than the pool length. The dispatch rounds up to the
				// workgroup size and those extra slots hold a zeroed pixel index
				let index = globalId.x;
				if ( index >= rayCount ) {

					return;

				}

				let input = ( *rayDataStorage )[ index ];
				if ( input.objectIndex < 0 ) {

					// the slot's path has terminated: recycle the pixel through the overflow queue and
					// generate a fresh camera ray
					var pixelIndex = input.pixelIndex;
					let elementCount = atomicLoad( &pixelQueue.elementCount );
					if ( elementCount > 0u ) {

						// TODO: If we've pulled off a pixel that's already finished we currently just
						// write a no-op ray, wasting a frame. It may be better to iterate over a few
						// points in the queue to see if we can find one we can use.
						let queueIndex = atomicAdd( &pixelQueue.current, 1u ) % elementCount;
						pixelIndex = atomicExchange( &pixelQueue.elements[ queueIndex ], pixelIndex );

					}

					let indexUV = vec2u( pixelIndex >> 16, pixelIndex & 0xFFFF );

					// skip the pixel if it has hit the sample limit
					let combinedField = textureLoad( ${e.sampleCountTarget}, indexUV ).r;
					let samples = ( ${Je}u & combinedField );
					let isComplete = maxSamples != 0u && samples >= maxSamples;

					if ( isComplete ) {

						rayDataStorage[ index ].pixelIndex = pixelIndex;
						rayDataStorage[ index ].rayIntersectionIndex = - 1;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					${ve}( indexUV, seed + samples, 0 );

					let uv = vec2f( indexUV ) / vec2f( targetDimensions );
					let jitteredUv = uv + ${ye}( ${Oi} ) / vec2f( targetDimensions );
					var ray: ${$};
					if ( ! ${t}( jitteredUv, vec2f( targetDimensions ), &ray ) ) {

						// the camera declined the pixel, so leave the slot dormant for this round
						// TODO: same as above - this work is a bit wasteful and leaves slots empty for
						// a frame. Is it possible to quickly skip rays outside the mask or are finished?
						rayDataStorage[ index ].pixelIndex = pixelIndex;
						rayDataStorage[ index ].rayIntersectionIndex = - 1;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					ray.direction = normalize( ray.direction );

					let rayIndex = atomicAdd( &rayQueue.length, 1u );
					rayQueue.elements[ rayIndex ].origin = ray.origin;
					rayQueue.elements[ rayIndex ].direction = ray.direction;
					rayQueue.elements[ rayIndex ].pixelIndex = pixelIndex;
					rayQueue.elements[ rayIndex ].currentBounce = 0u;
					rayQueue.elements[ rayIndex ].seed = seed + samples;
					rayQueue.elements[ rayIndex ].alphaDepth = 0u;
					rayQueue.elements[ rayIndex ].maxDist = ray.maxDist;

					rayDataStorage[ index ].origin = ray.origin;
					rayDataStorage[ index ].direction = ray.direction;
					rayDataStorage[ index ].pixelIndex = pixelIndex;
					rayDataStorage[ index ].seed = seed + samples;
					rayDataStorage[ index ].currentBounce = 0u;
					rayDataStorage[ index ].throughputColor = vec3f( 1.0 );
					rayDataStorage[ index ].resultColor = vec4f( 0.0, 0.0, 0.0, 1.0 );
					rayDataStorage[ index ].scatterColor = vec3f( 1.0 );
					rayDataStorage[ index ].scatterPdf = 1.0;
					rayDataStorage[ index ].minPdf = 1.0;
					rayDataStorage[ index ].isFullyTransmissive = 1u;
					rayDataStorage[ index ].emission = vec3f( 0.0 );
					rayDataStorage[ index ].lightPdf = 0.0;
					rayDataStorage[ index ].alphaDepth = 0u;
					rayDataStorage[ index ].maxDist = ray.maxDist;
					rayDataStorage[ index ].rayIntersectionIndex = i32( rayIndex );
					rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
					rayDataStorage[ index ].dispersionWavelength = - mix( ${Kt}.0, ${Xt}.0, ${Re}( ${Wi} ) );

					// write the active params & dispatched flag
					textureStore( ${e.sampleCountTarget}, indexUV, vec4( ${Hl}u | ${Zt}u | samples ) );

				} else {

					// evaluate the surface staged by LogicKernel
					let indexUV = vec2u( input.pixelIndex >> 16, input.pixelIndex & 0xFFFF );
					${ve}( indexUV, input.seed, input.currentBounce + input.alphaDepth );

					let objectInfo = transforms[ u32( input.objectIndex ) ];
					var materialInfo = ( *materials )[ objectInfo.materialIndex ];

					// a matte surface hit by the camera ray renders as a fully transparent
					let isMatte = materialInfo.matte != 0 && input.currentBounce == 0u;
					if ( isMatte ) {

						rayDataStorage[ index ].resultColor = vec4f( 0.0 );
						rayDataStorage[ index ].throughputColor = vec3f( 0.0 );
						rayDataStorage[ index ].emission = vec3f( 0.0 );
						rayDataStorage[ index ].lightPdf = 0.0;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					// apply per-object colors
					materialInfo.color *= objectInfo.color.rgb;
					materialInfo.opacity *= objectInfo.color.a;

					var vertexData = ${r}( input.barycoord, input.indices );
					vertexData.normal = normalize( transpose( objectInfo.inverseMatrixWorld ) * vertexData.normal );
					vertexData.tangent = vec4f( ( objectInfo.matrixWorld * vec4f( vertexData.tangent.xyz, 0.0 ) ).xyz, vertexData.tangent.w );
					vertexData.position = objectInfo.matrixWorld * vertexData.position;

					let view = - input.direction;

					// blur glossy surfaces after low-probability bounces to suppress fireflies,
					// from the Cycles "filter glossy" approach in integrator/surface_shader.h
					let blurRoughness = sqrt( clamp( 1.0 - filterGlossy * input.minPdf, 0.0, 1.0 ) ) * 0.5;

					var surface = ${i}( materialInfo, vertexData, input.side, input.normal, view, blurRoughness );

					// Stochastically pass through partially transparent surfaces by re-enqueueing
					// the ray at the hit point, advancing the alpha depth but not the bounce count.
					let passesThrough = ${Re}( ${qi} ) > surface.opacity;
					if ( passesThrough ) {

						// out of transparent bounces, so stop rather than shading a surface that
						// should be invisible. A zeroed throughput terminates in LogicKernel.
						if ( input.alphaDepth >= maxTransparentBounces ) {

							rayDataStorage[ index ].throughputColor = vec3f( 0.0 );
							rayDataStorage[ index ].emission = vec3f( 0.0 );
							rayDataStorage[ index ].lightPdf = 0.0;
							rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
							return;

						}

						let alphaIndex = atomicAdd( &rayQueue.length, 1u );
						rayQueue.elements[ alphaIndex ].origin = ${Xe}( vertexData.position.xyz, input.direction, input.normal );
						rayQueue.elements[ alphaIndex ].direction = input.direction;
						rayQueue.elements[ alphaIndex ].pixelIndex = input.pixelIndex;
						rayQueue.elements[ alphaIndex ].currentBounce = input.currentBounce;
						rayQueue.elements[ alphaIndex ].seed = input.seed;
						rayQueue.elements[ alphaIndex ].alphaDepth = input.alphaDepth + 1u;
						// the origin advanced to the hit point, so the remaining budget shrinks by the
						// distance already traced
						rayQueue.elements[ alphaIndex ].maxDist = max( input.maxDist - input.dist, 0.0 );

						// the surface is skipped, so no scatter or emission is staged for LogicKernel.
						// "pdf" is left alone so the previous scatter still weights the forward MIS,
						// and "bsdf" matches it so applying the scatter leaves the throughput as is.
						rayDataStorage[ index ].alphaDepth = input.alphaDepth + 1u;
						rayDataStorage[ index ].emission = vec3f( 0.0 );
						rayDataStorage[ index ].scatterColor = vec3f( input.scatterPdf );
						rayDataStorage[ index ].lightPdf = 0.0;
						rayDataStorage[ index ].origin = rayQueue.elements[ alphaIndex ].origin;
						rayDataStorage[ index ].rayIntersectionIndex = i32( alphaIndex );
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;
						return;

					}

					// apply the hero wavelength to dispersive surfaces, folding the spectral weight
					// into the throughput at the path's first dispersive interaction
					var throughputColor = input.throughputColor;
					let isDispersive = materialInfo.dispersion > 0.0 && surface.ior > 1.0 && surface.transmission > 0.0 && ! surface.thinWall;
					if ( isDispersive ) {

						let wavelength = abs( input.dispersionWavelength );
						${ln}( &surface, materialInfo.dispersion, wavelength );
						if ( input.dispersionWavelength < 0.0 ) {

							rayDataStorage[ index ].dispersionWavelength = wavelength;
							throughputColor *= ${cn}( wavelength );
							rayDataStorage[ index ].throughputColor = throughputColor;

						}

					}

					// attenuate the light transmitted through the volume when exiting a backface so
					// the surface's emission and NEE resolve against the attenuated throughput
					if ( input.side < 0.0 && materialInfo.transmission > 0.0 ) {

						throughputColor *= ${an}( input.dist, materialInfo.attenuationColor, materialInfo.attenuationDistance );
						rayDataStorage[ index ].throughputColor = throughputColor;

					}

					// sample the next bounce direction and stage the scatter state for LogicKernel
					var scatterRec = ${s}( view, surface );
					let newBounce = input.currentBounce + 1u;

					// decide termination now so finished paths skip the bounce trace entirely - a
					// zeroed pdf reads as a terminating scatter in LogicKernel, which still resolves
					// the surface's emission and NEE before freeing the slot
					var isTerminated = newBounce >= maxBounces || all( scatterRec.color == vec3f( 0.0 ) ) || ${Gt}( scatterRec );

					// russian roulette early out:
					// Matches Cycles path_state_continuation_probability in integrator/path_state.h
					if ( ! isTerminated && newBounce >= 3u ) {

						let rrThroughput = throughputColor * scatterRec.color / scatterRec.pdf;
						let rrProb = saturate( sqrt( max( max( rrThroughput.r, rrThroughput.g ), rrThroughput.b ) ) );
						isTerminated = rrProb <= 0.0 || ${Re}( ${Ui} ) > rrProb;
						if ( ! isTerminated ) {

							// fold the survival boost into the scatter color so LogicKernel's
							// throughput update applies it without a separate division
							scatterRec.color /= rrProb;

						}

					}

					// Write the ray storage content here since things like the emissive value is read
					// in the logic kernel on the subsequent frame.
					rayDataStorage[ index ].scatterColor = scatterRec.color;
					rayDataStorage[ index ].scatterPdf = select( scatterRec.pdf, 0.0, isTerminated );
					rayDataStorage[ index ].minPdf = min( input.minPdf, scatterRec.pdf );
					rayDataStorage[ index ].isFullyTransmissive = input.isFullyTransmissive & select( 0u, 1u, scatterRec.isTransmissive );
					rayDataStorage[ index ].emission = surface.emission;
					rayDataStorage[ index ].currentBounce = newBounce;

					// the NEE shadow ray below still resolves the surface's direct light, so only
					// the bounce segment is skipped for finished paths
					if ( ! isTerminated ) {

						let rayIndex = atomicAdd( &rayQueue.length, 1u );
						rayQueue.elements[ rayIndex ].origin = ${Xe}( vertexData.position.xyz, scatterRec.direction, input.normal );
						rayQueue.elements[ rayIndex ].direction = scatterRec.direction;
						rayQueue.elements[ rayIndex ].pixelIndex = input.pixelIndex;
						rayQueue.elements[ rayIndex ].currentBounce = newBounce;
						rayQueue.elements[ rayIndex ].seed = input.seed;
						rayQueue.elements[ rayIndex ].alphaDepth = input.alphaDepth;
						rayQueue.elements[ rayIndex ].maxDist = 0.0;
						rayDataStorage[ index ].rayIntersectionIndex = i32( rayIndex );

						rayDataStorage[ index ].origin = rayQueue.elements[ rayIndex ].origin;
						rayDataStorage[ index ].direction = scatterRec.direction;

					}

					// evaluate the bsdf toward the light LogicKernel selected and enqueue the shadow ray.
					// the light pdf will be 0 if NEE is disabled.
					var lightPdf = input.lightPdf;
					if ( lightPdf > 0.0 ) {

						let evalRec = ${n}( view, input.lightDirection, surface );
						if ( evalRec.pdf > 0.0 ) {

							rayDataStorage[ index ].lightBsdf = evalRec.color;
							rayDataStorage[ index ].lightBsdfPdf = evalRec.pdf;

							let shadowIndex = atomicAdd( &shadowRayQueue.length, 1u );
							shadowRayQueue.elements[ shadowIndex ].origin = ${Xe}( vertexData.position.xyz, input.lightDirection, input.normal );
							shadowRayQueue.elements[ shadowIndex ].direction = input.lightDirection;
							shadowRayQueue.elements[ shadowIndex ].pixelIndex = input.pixelIndex;
							shadowRayQueue.elements[ shadowIndex ].currentBounce = input.currentBounce;
							shadowRayQueue.elements[ shadowIndex ].seed = input.seed;
							shadowRayQueue.elements[ shadowIndex ].alphaDepth = input.alphaDepth;
							shadowRayQueue.elements[ shadowIndex ].maxDist = input.lightDist * ( 1.0 - ${Ji} );
							rayDataStorage[ index ].shadowRayIntersectionIndex = i32( shadowIndex );

						} else {

							lightPdf = 0.0;

						}

					}

					if ( lightPdf <= 0.0 ) {

						rayDataStorage[ index ].lightPdf = 0.0;
						rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;

					}

				}

			}
		`;super(l(e)),this.defineUniformAccessors(e)}};import{StorageBufferAttribute as pc}from"three/webgpu";import{storage as mc,globalId as Sh}from"three/tsl";var Rn=class extends q{constructor(){let e={bvhData:{value:null},rayQueue:mc(new pc(1,1),xt),rayIntersectionsStorage:mc(new pc(1,1),Be),globalId:Sh},t=H("bvhData.value.fns.raycastFirstHit.outputType",e),r=H("bvhData.value.fns.raycastFirstHit",e),i=_`

			fn compute( globalId: vec3u ) -> void {

				let rayQueue = &${e.rayQueue};
				let rayIntersectionsStorage = &${e.rayIntersectionsStorage};

				let index = globalId.x;
				if ( index >= rayQueue.length ) {

					return;

				}

				let queuedRay = ( *rayQueue ).elements[ index ];
				let indexUV = vec2u( queuedRay.pixelIndex >> 16, queuedRay.pixelIndex & 0xFFFF );
				${ve}( indexUV, queuedRay.seed, queuedRay.currentBounce + queuedRay.alphaDepth );

				let ray = Ray( queuedRay.origin, queuedRay.direction, queuedRay.maxDist );
				var hitResult: ${t};
				if ( ${r}( ray, &hitResult ) ) {

					rayIntersectionsStorage[ index ].barycoord = hitResult.barycoord;
					rayIntersectionsStorage[ index ].objectIndex = i32( hitResult.objectIndex );
					rayIntersectionsStorage[ index ].position = ray.origin + ray.direction * hitResult.dist;
					rayIntersectionsStorage[ index ].dist = hitResult.dist;
					rayIntersectionsStorage[ index ].normal = hitResult.normal.xyz;
					rayIntersectionsStorage[ index ].side = hitResult.side;
					rayIntersectionsStorage[ index ].indices = hitResult.indices.xyz;

				} else {

					rayIntersectionsStorage[ index ].objectIndex = - 1;

				}

			}
		`;super(i(e)),this.defineUniformAccessors(e)}};import{StorageBufferAttribute as gc}from"three/webgpu";import{storage as xc,globalId as Ih}from"three/tsl";var Dn=class extends q{constructor(){let e={bvhData:{value:null},shadowRayQueue:xc(new gc(1,1),xt),shadowRayIntersectionsStorage:xc(new gc(1,1),Be),globalId:Ih},t=H("bvhData.value.fns.raycastFirstHit.outputType",e),r=H("bvhData.value.fns.raycastShadow",e),i=_`

			fn compute( globalId: vec3u ) -> void {

				let shadowRayQueue = &${e.shadowRayQueue};
				let shadowRayIntersectionsStorage = &${e.shadowRayIntersectionsStorage};

				let index = globalId.x;
				if ( index >= shadowRayQueue.length ) {

					return;

				}

				let queuedRay = ( *shadowRayQueue ).elements[ index ];
				let indexUV = vec2u( queuedRay.pixelIndex >> 16, queuedRay.pixelIndex & 0xFFFF );
				${ve}( indexUV, queuedRay.seed, queuedRay.currentBounce + queuedRay.alphaDepth );

				let ray = Ray( queuedRay.origin, queuedRay.direction, queuedRay.maxDist );
				var hitResult: ${t};
				if ( ${r}( ray, &hitResult ) ) {

					shadowRayIntersectionsStorage[ index ].objectIndex = i32( hitResult.objectIndex );
					shadowRayIntersectionsStorage[ index ].dist = hitResult.dist;

				} else {

					shadowRayIntersectionsStorage[ index ].objectIndex = - 1;

				}

				shadowRayIntersectionsStorage[ index ].forwardBlocked = u32( hitResult.forwardBlocked );

			}
		`;super(i(e)),this.defineUniformAccessors(e)}};import{IndirectStorageBufferAttribute as _h,StorageBufferAttribute as Rh}from"three/webgpu";import{storage as vc}from"three/tsl";var Ur=class extends q{constructor(e=lr,t=64){let r={queue:vc(new Rh(1,1),e),outputDispatch:vc(new _h(3,1),"u32").setName("outputDispatch")},i=_`
			fn compute() -> void {

				let queue = &${r.queue};
				let outputDispatch = &${r.outputDispatch};

				let queueLength = atomicLoad( &queue.length );
				outputDispatch[ 0 ] = ( queueLength + ${t-1}u ) / ${t}u;
				outputDispatch[ 1 ] = 1u;
				outputDispatch[ 2 ] = 1u;

			}
		`;super(i(r)),this.defineUniformAccessors(r)}};import{StorageBufferAttribute as yc}from"three/webgpu";import{uniform as po,storage as bc,globalId as Dh}from"three/tsl";var Fn=class extends q{constructor(){let e={rayDataStorage:bc(new yc(1,1),de),pixelQueue:bc(new yc(1,1),vt),start:po(0,"uint"),end:po(0,"uint"),addingSlots:po(0,"uint"),globalId:Dh},t=_`
			fn compute( start: u32, end: u32, addingSlots: u32, globalId: vec3u ) -> void {

				let rayDataStorage = &${e.rayDataStorage};
				let pixelQueue = &${e.pixelQueue};

				let index = start + globalId.x;
				if ( index >= end ) {

					return;

				}

				if ( addingSlots == 0u ) {

					// slots being removed hand their pixel back before the pool is discarded
					let queueIndex = atomicAdd( &pixelQueue.elementCount, 1u );
					atomicStore( &pixelQueue.elements[ queueIndex ], rayDataStorage[ index ].pixelIndex );

				} else {

					// the pool never exceeds the pixel count, so the queue holds enough for every new slot
					let previousCount = atomicSub( &pixelQueue.elementCount, 1u );
					rayDataStorage[ index ].pixelIndex = atomicLoad( &pixelQueue.elements[ previousCount - 1u ] );
					rayDataStorage[ index ].resultColor = vec4f( 0.0 );
					rayDataStorage[ index ].throughputColor = vec3f( 0.0 );
					rayDataStorage[ index ].objectIndex = - 1;
					rayDataStorage[ index ].alphaDepth = 0u;
					rayDataStorage[ index ].rayIntersectionIndex = - 1;
					rayDataStorage[ index ].shadowRayIntersectionIndex = - 1;

				}

			}
		`;super(t(e)),this.defineUniformAccessors(e)}};import{IndirectStorageBufferAttribute as Fh}from"three/webgpu";import{storage as Ch,globalId as Ah}from"three/tsl";var Cn=class extends q{constructor(e={}){let{type:t="u32"}=e,r={globalId:Ah,outputTarget:Ch(new Fh(1,1),t)},i=_`
			fn compute( globalId: vec3u ) -> void {

				${r.outputTarget}[ globalId.x ] = 0;

			}
		`;super(i(r)),this.defineUniformAccessors({target:r.outputTarget})}};import{StorageBufferAttribute as Tc}from"three/webgpu";import{uniform as Mh,storage as wc,globalId as Bh}from"three/tsl";var An=class extends q{constructor(e){let t={source:wc(new Tc(1,1),e).toReadOnly(),target:wc(new Tc(1,1),e),count:Mh(0,"uint"),globalId:Bh},r=_`
			fn compute( count: u32, globalId: vec3u ) -> void {

				let index = globalId.x;
				if ( index >= count ) {

					return;

				}

				${t.target}[ index ] = ${t.source}[ index ];

			}
		`;super(r(t)),this.defineUniformAccessors(t)}};import{StorageBufferAttribute as Sc,StorageTexture as Ph,StructTypeNode as Nh}from"three/webgpu";import{storage as Ic,textureStore as $h,globalId as Eh}from"three/tsl";var _c=0,Rc=1,Dc=2,Fc=3,Cc=4,mo=5,Ac=4294967296,Mc=new Nh({minSamples:{type:"uint",atomic:!0},maxSamples:{type:"uint",atomic:!0},totalLo:{type:"uint",atomic:!0},totalHi:{type:"uint",atomic:!0},pixelCount:{type:"uint",atomic:!0}},"SampleCounters"),Mn=class extends q{constructor(){let e={counters:Ic(new Sc(1,1),Mc)},t=_`
			fn compute() -> void {

				atomicStore( &${e.counters}.minSamples, 0xFFFFFFFFu );
				atomicStore( &${e.counters}.maxSamples, 0u );
				atomicStore( &${e.counters}.totalLo, 0u );
				atomicStore( &${e.counters}.totalHi, 0u );
				atomicStore( &${e.counters}.pixelCount, 0u );

			}
		`;super(t(e)),this.defineUniformAccessors(e)}},Bn=class extends q{constructor(){let e={globalId:Eh,counters:Ic(new Sc(1,1),Mc),sampleCountTarget:$h(new Ph(1,1)).toReadOnly()},t=_`
			fn compute( globalId: vec3u ) -> void {

				let targetDimensions = textureDimensions( ${e.sampleCountTarget} );
				if ( globalId.x >= targetDimensions.x || globalId.y >= targetDimensions.y ) {

					return;

				}

				// pixels without a camera ray aren't part of the image, so skip rather than count zero
				let combinedField = textureLoad( ${e.sampleCountTarget}, globalId.xy ).r;
				if ( ( combinedField & ${Zt}u ) == 0u ) {

					return;

				}

				let samples = combinedField & ${Je}u;

				atomicMin( &${e.counters}.minSamples, samples );
				atomicMax( &${e.counters}.maxSamples, samples );
				atomicAdd( &${e.counters}.pixelCount, 1u );

				// the sum overflowed if it came out smaller than the value already there, so carry
				// the wrap into "totalHi"
				let previousTotal = atomicAdd( &${e.counters}.totalLo, samples );
				if ( previousTotal + samples < previousTotal ) {

					atomicAdd( &${e.counters}.totalHi, 1u );

				}

			}
		`;super(t(e)),this.defineUniformAccessors(e)}};var zh=134217728,Oh=Math.floor(zh/(de.getLength()*4)),Vh=5,Wr=class extends sr{constructor(e){super(e),this.seed=0,this.envInfo=new er,this.backgroundInfo=new tr,this.lightsInfo=new nr,this.rayCount=0,this.rayDataStorage=null,this.rayQueue=null,this.shadowRayQueue=null,this.rayIntersectionsStorage=null,this.shadowRayIntersectionsStorage=null,this.pixelQueue=null,this.sampleCountersStorage=new bt(new Uint32Array(mo),mo),this.sampleCountersStorage.name="Sample Counters",this._samplesPromise=null,this.populatePixelIndicesKernel=new Tn().setWorkgroupSize(8,8,1),this.logicKernel=new wn().setWorkgroupSize(64,1,1),this.materialKernel=new _n().setWorkgroupSize(64,1,1),this.traceRayKernel=new Rn().setWorkgroupSize(64,1,1),this.traceShadowRayKernel=new Dn().setWorkgroupSize(64,1,1),this.rayDispatchConverter=new Ur().setWorkgroupSize(1,1,1),this.shadowDispatchConverter=new Ur().setWorkgroupSize(1,1,1),this.primeSampleCountersKernel=new Mn().setWorkgroupSize(1,1,1),this.tallySampleCountsKernel=new Bn().setWorkgroupSize(8,8,1),this.resetSlotsKernel=new Fn().setWorkgroupSize(64,1,1),this.copyRayDataKernel=new An(de).setWorkgroupSize(64,1,1),this.logicKernel.envInfo=this.envInfo,this.logicKernel.backgroundInfo=this.backgroundInfo,this.logicKernel.lightsInfo=this.lightsInfo,this.zeroDispatchKernel=new Cn().setWorkgroupSize(1,1,1),this.volumeKernel=null}resetSeed(){this.seed=0}reset(){super.reset(),this._samplesPromise=null}setBVHData(e){this.materialKernel.bvhData=e,this.materialKernel.needsUpdate=!0,this.traceRayKernel.bvhData=e,this.traceRayKernel.needsUpdate=!0,this.traceShadowRayKernel.bvhData=e,this.traceShadowRayKernel.needsUpdate=!0,this.reset()}rebuild(){super.rebuild(),this.materialKernel.needsUpdate=!0,this.reset()}setRandom(e){this.logicKernel.context.random=e,this.logicKernel.needsUpdate=!0,this.materialKernel.context.random=e,this.materialKernel.needsUpdate=!0,this.traceRayKernel.context.random=e,this.traceRayKernel.needsUpdate=!0,this.traceShadowRayKernel.context.random=e,this.traceShadowRayKernel.needsUpdate=!0,this.reset()}setMaterial(e){this.materialKernel.material=e.getData(),this.materialKernel.needsUpdate=!0,this.reset()}setFilterGlossy(e){this.materialKernel.filterGlossy=e===0?sn:1/e,this.reset()}setClamping(e,t){this.logicKernel.clampDirect=e,this.logicKernel.clampIndirect=t,this.reset()}setTransmissiveBackground(e){this.logicKernel.transmissiveBackground=e,this.reset()}setEnvironment(e){this.envInfo.updateFrom(e)}setLights(e){this.lightsInfo.updateFrom(this.renderer,e),this.reset()}setEnvironmentParams(e,t){let{envInfo:r}=this,i=new Bc().makeRotationFromEuler(t).invert();r.rotationNode.value.setFromMatrix4(i),r.intensityNode.value=e}setMultipleImportanceSampling(e){this.logicKernel.misEnabled=e?1:0,this.reset()}setBackground(e){let{backgroundInfo:t}=this;t.dispose(),t.map=e}setBackgroundParams(e,t,r){let{backgroundInfo:i}=this,s=new Bc().makeRotationFromEuler(t).invert();i.rotationNode.value.copy(s),i.intensity=e,i.blur=r}dispose(){super.dispose(),this.envInfo.dispose(),this.lightsInfo.dispose(),this.rayDataStorage?.dispose(),this.rayQueue?.dispose(),this.shadowRayQueue?.dispose(),this.rayIntersectionsStorage?.dispose(),this.shadowRayIntersectionsStorage?.dispose(),this.sampleCountersStorage.dispose(),this.pixelQueue?.dispose(),this.rayDispatchConverter.outputDispatch.dispose(),this.shadowDispatchConverter.outputDispatch.dispose(),this.populatePixelIndicesKernel.dispose(),this.logicKernel.dispose(),this.materialKernel.dispose(),this.traceRayKernel.dispose(),this.traceShadowRayKernel.dispose(),this.rayDispatchConverter.dispose(),this.shadowDispatchConverter.dispose(),this.primeSampleCountersKernel.dispose(),this.tallySampleCountsKernel.dispose(),this.resetSlotsKernel.dispose(),this.copyRayDataKernel.dispose(),this.zeroDispatchKernel.dispose()}_updatePixelQueue(e,t){let r=vt.getLength()+Math.max(e*t,1);(!this.pixelQueue||this.pixelQueue.array.length<r)&&(this.pixelQueue?.dispose(),this.pixelQueue=new bt(new Float32Array(r),r),this.pixelQueue.name="Pixel Queue",this.materialKernel.pixelQueue=this.pixelQueue,this.materialKernel.needsUpdate=!0,this.populatePixelIndicesKernel.pixelQueue=this.pixelQueue,this.populatePixelIndicesKernel.needsUpdate=!0,this.resetSlotsKernel.pixelQueue=this.pixelQueue,this.resetSlotsKernel.needsUpdate=!0)}_resizePool(e){let{renderer:t,resetSlotsKernel:r,copyRayDataKernel:i}=this,s=this.rayCount;r.pixelQueue=this.pixelQueue,e<s&&(r.rayDataStorage=this.rayDataStorage,r.start=e,r.end=s,r.addingSlots=!1,t.compute(r.kernel,r.getDispatchSize(s-e,1,1)));let n=new bt(e,de.getLength());n.name="Ray Data";let l=xt.getLength()+e*ar.getLength(),a=new bt(new Float32Array(l),l);a.name="Ray Queue";let f=new bt(new Float32Array(l),l);f.name="Shadow Ray Queue";let c=new bt(e,Be.getLength());c.name="Ray Intersections";let u=new bt(e,Be.getLength());u.name="Shadow Ray Intersections";let d=Math.min(e,s);d>0&&(i.source=this.rayDataStorage,i.target=n,i.count=d,t.compute(i.kernel,i.getDispatchSize(d,1,1))),this.rayDataStorage?.dispose(),this.rayQueue?.dispose(),this.shadowRayQueue?.dispose(),this.rayIntersectionsStorage?.dispose(),this.shadowRayIntersectionsStorage?.dispose(),this.rayDataStorage=n,this.rayQueue=a,this.shadowRayQueue=f,this.rayIntersectionsStorage=c,this.shadowRayIntersectionsStorage=u,this.rayCount=e,this.logicKernel.needsUpdate=!0,this.materialKernel.needsUpdate=!0,this.traceRayKernel.needsUpdate=!0,this.traceShadowRayKernel.needsUpdate=!0,this.populatePixelIndicesKernel.needsUpdate=!0,this.resetSlotsKernel.needsUpdate=!0,e>s&&(r.rayDataStorage=n,r.start=s,r.end=e,r.addingSlots=!0,t.compute(r.kernel,r.getDispatchSize(e-s,1,1)))}_getRequestedSlotCount(e){return Math.min(Oh,e,Math.max(1,Math.floor(this.frameBudget)))}_applyBudget(e){let t=this._getRequestedSlotCount(e);t!==this.rayCount&&this._resizePool(t)}*createRenderTask(){let{renderer:e,maxTransparentBounces:t,logicKernel:r,materialKernel:i,traceRayKernel:s,traceShadowRayKernel:n,rayDispatchConverter:l,shadowDispatchConverter:a,zeroDispatchKernel:f,populatePixelIndicesKernel:c}=this,u=new Lh;this.getSize(u),this._updatePixelQueue(u.x,u.y);let d=u.x*u.y;for(this._applyBudget(d),f.target=this.rayQueue,e.compute(f.kernel,[1]),f.target=this.shadowRayQueue,e.compute(f.kernel,[1]),c.rayDataStorage=this.rayDataStorage,c.pixelQueue=this.pixelQueue,c.frameBudget=this.rayCount,c.targetDimensions.copy(u),e.compute(c.kernel,c.getDispatchSize(u.x,u.y,1)),this.seed++;;){let h=this.lowResMode?Math.min(this.maxBounces,Vh):1;for(let p=0;p<h;p++){e.copyTextureToTexture(this.outputTarget,this.prevOutputTarget),[this.outputTarget,this.prevOutputTarget]=[this.prevOutputTarget,this.outputTarget],r.prevOutputTarget=this.prevOutputTarget,r.outputTarget=this.outputTarget,r.sampleCountTarget=this.sampleCountTarget,r.rayDataStorage=this.rayDataStorage,r.rayIntersectionsStorage=this.rayIntersectionsStorage,r.shadowRayIntersectionsStorage=this.shadowRayIntersectionsStorage,r.maxBounces=this.maxBounces,r.rayCount=this.rayCount,e.compute(r.kernel,r.getDispatchSize(this.rayCount,1,1)),this._applyBudget(d);let{rayDataStorage:y,rayQueue:v,shadowRayQueue:T,rayIntersectionsStorage:m,shadowRayIntersectionsStorage:x,rayCount:g}=this;f.target=v,e.compute(f.kernel,[1]),f.target=T,e.compute(f.kernel,[1]),i.rayDataStorage=y,i.rayQueue=v,i.shadowRayQueue=T,i.pixelQueue=this.pixelQueue,i.sampleCountTarget=this.sampleCountTarget,i.seed=this.seed,i.maxSamples=this.maxSamples,i.rayCount=g,i.maxTransparentBounces=t,i.maxBounces=this.maxBounces,i.targetDimensions.copy(u),e.compute(i.kernel,i.getDispatchSize(g,1,1)),l.queue=v,e.compute(l.kernel,[1,1,1]),s.rayQueue=v,s.rayIntersectionsStorage=m,e.compute(s.kernel,l.outputDispatch),a.queue=T,e.compute(a.kernel,[1,1,1]),n.shadowRayQueue=T,n.shadowRayIntersectionsStorage=x,e.compute(n.kernel,a.outputDispatch)}yield}}getSampleCountsAsync(){if(this._samplesPromise===null){let e=this._measureSampleCounts().finally(()=>{this._samplesPromise===e&&(this._samplesPromise=null)});this._samplesPromise=e}return this._samplesPromise}async _measureSampleCounts(){let{renderer:e,sampleCountTarget:t,sampleCountersStorage:r,primeSampleCountersKernel:i,tallySampleCountsKernel:s}=this;if(!e.initialized||this.lowResMode)return{min:0,max:0,avg:0};i.counters=r,e.compute(i.kernel,[1,1,1]),s.counters=r,s.sampleCountTarget=t,e.compute(s.kernel,s.getDispatchSize(t.width,t.height));let n=await e.getArrayBufferAsync(r),l=new Uint32Array(n),a=l[Cc];if(a===0)return{min:0,max:0,avg:0};let f=l[Fc]*Ac+l[Dc];return{min:l[_c],max:l[Rc],avg:f/a}}};import{DataTexture as Hh,DataUtils as kh,EquirectangularReflectionMapping as Uh,FloatType as Wh,HalfFloatType as qh,LinearFilter as Gh,LinearMipMapLinearFilter as Qh,RGBAFormat as jh,RepeatWrapping as Nc,ShaderMaterial as Kh,WebGLRenderTarget as Xh}from"three";var Pc=`

	// TODO: possibly this should be renamed something related to material or path tracing logic

	#ifndef RAY_OFFSET
	#define RAY_OFFSET 1e-4
	#endif

	// adjust the hit point by the surface normal by a factor of some offset and the
	// maximum component-wise value of the current point to accommodate floating point
	// error as values increase.
	vec3 stepRayOrigin( vec3 rayOrigin, vec3 rayDirection, vec3 offset, float dist ) {

		vec3 point = rayOrigin + rayDirection * dist;
		vec3 absPoint = abs( point );
		float maxPoint = max( absPoint.x, max( absPoint.y, absPoint.z ) );
		return point + offset * ( maxPoint + 1.0 ) * RAY_OFFSET;

	}

	// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
	vec3 transmissionAttenuation( float dist, vec3 attColor, float attDist ) {

		vec3 ot = - log( attColor ) / attDist;
		return exp( - ot * dist );

	}

	vec3 getHalfVector( vec3 wi, vec3 wo, float eta ) {

		// get the half vector - assuming if the light incident vector is on the other side
		// of the that it's transmissive.
		vec3 h;
		if ( wi.z > 0.0 ) {

			h = normalize( wi + wo );

		} else {

			// Scale by the ior ratio to retrieve the appropriate half vector
			// From Section 2.2 on computing the transmission half vector:
			// https://blog.selfshadow.com/publications/s2015-shading-course/burley/s2015_pbs_disney_bsdf_notes.pdf
			h = normalize( wi + wo * eta );

		}

		h *= sign( h.z );
		return h;

	}

	vec3 getHalfVector( vec3 a, vec3 b ) {

		return normalize( a + b );

	}

	// The discrepancy between interpolated surface normal and geometry normal can cause issues when a ray
	// is cast that is on the top side of the geometry normal plane but below the surface normal plane. If
	// we find a ray like that we ignore it to avoid artifacts.
	// This function returns if the direction is on the same side of both planes.
	bool isDirectionValid( vec3 direction, vec3 surfaceNormal, vec3 geometryNormal ) {

		bool aboveSurfaceNormal = dot( direction, surfaceNormal ) > 0.0;
		bool aboveGeometryNormal = dot( direction, geometryNormal ) > 0.0;
		return aboveSurfaceNormal == aboveGeometryNormal;

	}

	// ray sampling x and z are swapped to align with expected background view
	vec2 equirectDirectionToUv( vec3 direction ) {

		// from Spherical.setFromCartesianCoords
		vec2 uv = vec2( atan( direction.z, direction.x ), acos( direction.y ) );
		uv /= vec2( 2.0 * PI, PI );

		// apply adjustments to get values in range [0, 1] and y right side up
		uv.x += 0.5;
		uv.y = 1.0 - uv.y;
		return uv;

	}

	vec3 equirectUvToDirection( vec2 uv ) {

		// undo above adjustments
		uv.x -= 0.5;
		uv.y = 1.0 - uv.y;

		// from Vector3.setFromSphericalCoords
		float theta = uv.x * 2.0 * PI;
		float phi = uv.y * PI;

		float sinPhi = sin( phi );

		return vec3( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

	}

	// power heuristic for multiple importance sampling
	float misHeuristic( float a, float b ) {

		float aa = a * a;
		float bb = b * b;
		return aa / ( aa + bb );

	}

	// tentFilter from Peter Shirley's 'Realistic Ray Tracing (2nd Edition)' book, pg. 60
	// erichlof/THREE.js-PathTracing-Renderer/
	float tentFilter( float x ) {

		return x < 0.5 ? sqrt( 2.0 * x ) - 1.0 : 1.0 - sqrt( 2.0 - ( 2.0 * x ) );

	}
`;var go=class extends Kh{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`
				#define ENVMAP_TYPE_CUBE_UV

				uniform samplerCube envMap;
				uniform float flipEnvMap;
				varying vec2 vUv;

				#include <common>
				#include <cube_uv_reflection_fragment>

				${Pc}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}},Pn=class{constructor(e){this._renderer=e,this._quad=new ze(new go)}generate(e,t=null,r=null){if(!e.isCubeTexture)throw new Error("CubeToEquirectMaterial: Source can only be cube textures.");let i=e.images[0],s=this._renderer,n=this._quad;t===null&&(t=4*i.height),r===null&&(r=2*i.height);let l=new Xh(t,r,{type:Wh,colorSpace:i.colorSpace}),a=i.height,f=Math.log2(a)-2,c=1/a,u=1/(3*Math.max(Math.pow(2,f),112));n.material.defines.CUBEUV_MAX_MIP=`${f}.0`,n.material.defines.CUBEUV_TEXEL_WIDTH=u,n.material.defines.CUBEUV_TEXEL_HEIGHT=c,n.material.uniforms.envMap.value=e,n.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,n.material.needsUpdate=!0;let d=s.getRenderTarget(),h=s.autoClear;s.autoClear=!0,s.setRenderTarget(l),n.render(s),s.setRenderTarget(d),s.autoClear=h;let p=new Uint16Array(t*r*4),y=new Float32Array(t*r*4);s.readRenderTargetPixels(l,0,0,t,r,y),l.dispose();for(let T=0,m=y.length;T<m;T++)p[T]=kh.toHalfFloat(y[T]);let v=new Hh(p,t,r,jh,qh);return v.minFilter=Qh,v.magFilter=Gh,v.wrapS=Nc,v.wrapT=Nc,v.mapping=Uh,v.needsUpdate=!0,v}dispose(){this._quad.dispose()}};import{BackSide as Zh,FrontSide as Jh,DoubleSide as ep,BufferAttribute as tp,BufferGeometry as rp,StorageBufferAttribute as Lc,StructTypeNode as Vc,Vector4 as ip,SkinnedMesh as np,RepeatWrapping as sp,ClampToEdgeWrapping as op,MirroredRepeatWrapping as ap,NearestFilter as lp}from"three/webgpu";import{storage as cp,float as zc,bool as Oc,texture as up,uniformArray as fp,uint as dp}from"three/tsl";function Yh(o,e){return o.uuid<e.uuid?1:o.uuid>e.uuid?-1:0}function $c(o){return`${o.source.uuid}:${o.colorSpace}`}function Ec(o){let e=[];return o.traverseVisible(t=>{(t.isRectAreaLight||t.isSpotLight||t.isPointLight||t.isDirectionalLight||t.isSunLight)&&e.push(t)}),e.sort(Yh)}var qr=new ip,Nn=new Vc({matrixWorld:"mat4x4f",inverseMatrixWorld:"mat4x4f",visible:"uint",materialIndex:"uint",visibleToShadowRays:"uint",_alignment0:"uint",color:"vec4f"},"TransformStruct"),$n=new Vc({indices:"vec4u",normal:"vec3f",didHit:"bool",barycoord:"vec3f",objectIndex:"uint",side:"float",dist:"float",forwardBlocked:"bool"},"PathTracerIntersectionResult"),En=class extends Ci{constructor(e,t={}){super(e,{attributes:{position:"vec4f",normal:"vec4f",tangent:"vec4f",color:"vec4f",uv:"vec4f"},...t}),this.structs.transform=Nn,this.structs.material=ul,this.storage.materials=null,this.materialsMap=new Map,this.materials=[],this.bvhMap=new Map,this.textureAtlas=new rr}updateUvAttributesFromScene(){let{attributes:e}=this,t=new Set(["color"]);for(let r=0;r<8;r++){let i=r===0?"uv":"uv"+r;delete e[i],t.add(i)}this.getRootObject().traverse(r=>{if(r.geometry)for(let i in r.geometry.attributes)t.has(i)&&(e[i]="vec4f")})}updateUvSampleFunction(){let{structs:e,fns:t}=this,r=[],i=null;e.attributes.membersLayout.forEach(({name:s})=>{if(/^uv/.test(s)){let n=s==="uv"?0:Number(s.replace(/^uv/,""));r.push(`
					case ${n}u: {

						return vertexData.${s}.xy;

					}
				`),i===null&&(i=`vertexData.${s}.xy`)}}),t.getUvFromChannel=_`
			fn getUvFromChannel( vertexData: ${e.attributes}, packed: i32 ) -> vec2f {

				// the uv channel is packed into bits 23-25 of the "*Map" descriptor
				let channel = u32( ( packed >> 23 ) & 0x7 );
				switch ( channel ) {

					${r.join(`
`)}
					default: {

						return ${i??"vec2f( 0.0 )"};

					}

				}

			}
		`}updateColorSampleFn(){let{structs:e,fns:t}=this;!!e.attributes.membersLayout.find(({name:i})=>i==="color")?t.getColor=_`
				fn getColor( vertexData: ${e.attributes} ) -> vec4f {

					return vertexData.color;

				}
			`:t.getColor=_`
				fn getColor( vertexData: ${e.attributes} ) -> vec4f {

					return vec4f( 1.0 );

				}
			`}useTransparencyRaycastFn(){let{textureAtlas:e,storage:t,fns:r}=this,i=e.texture,s=fp(e.textureInfo,"uvec4"),n=Ki(s,up(i));r.getSurfaceRecord=Cl(n,r.getUvFromChannel,r.getColor);let l=dp().toVar("bvh_materialIndex"),a=zc(1).toVar("bvh_rayScalar"),f=zc(1).toVar("bvh_baseOpacity"),c=Oc(!1).toVar("bvh_isShadowRay"),u=Oc(!1).toVar("bvh_skipShadowObject"),d={shapeStruct:$,resultStruct:$n,boundsOrderFn:_`
				fn getBoundsOrder( ray: ${$}, splitAxis: u32, node: ${oe} ) -> bool {

					return ray.direction[ splitAxis ] >= 0.0;

				}
			`,intersectsBoundsFn:_`
				fn rayIntersectsBounds( ray: ${$}, bounds: ${fe}, result: ptr<function, ${$n}> ) -> u32 {

					// early-out if our object is completely transparent
					if ( ${f} == 0.0 ) {

						return 0u;

					}

					let boundsMin = vec3( bounds.min[0], bounds.min[1], bounds.min[2] );
					let boundsMax = vec3( bounds.max[0], bounds.max[1], bounds.max[2] );

					let invDir = 1.0 / ray.direction;
					let tMinPlane = ( boundsMin - ray.origin ) * invDir;
					let tMaxPlane = ( boundsMax - ray.origin ) * invDir;

					let tMinHit = min( tMinPlane, tMaxPlane );
					let tMaxHit = max( tMinPlane, tMaxPlane );

					let t0 = max( max( tMinHit.x, tMinHit.y ), tMinHit.z );
					let t1 = min( min( tMaxHit.x, tMaxHit.y ), tMaxHit.z );

					let dist = max( t0, 0.0 );
					if ( t1 < dist ) {

						return 0u;

					} else if ( ray.maxDist > 0.0 && dist * ${a} >= ray.maxDist ) {

						return 0u;

					} else if ( result.didHit && dist * ${a} >= result.dist ) {

						return 0u;

					} else {

						return 1u;

					}

				}

			`,intersectRangeFn:_`
				fn intersectRange( ray: ${$}, offset: u32, count: u32, result: ptr<function, ${$n}> ) -> bool {

					var didHit = false;
					for ( var ti = offset; ti < offset + count; ti = ti + 1u ) {

						let i0 = ${t.index}[ ti * 3u ];
						let i1 = ${t.index}[ ti * 3u + 1u ];
						let i2 = ${t.index}[ ti * 3u + 2u ];

						let a = ${t.attributes}[ i0 ].position.xyz;
						let b = ${t.attributes}[ i1 ].position.xyz;
						let c = ${t.attributes}[ i2 ].position.xyz;

						var triResult = ${wi}( ray, a, b, c, 0.0 );
						triResult.dist *= ${a};
						if ( triResult.didHit && ( ray.maxDist <= 0.0 || triResult.dist < ray.maxDist ) && ( ! result.didHit || triResult.dist < result.dist ) ) {

							let material = ${t.materials}[ ${l} ];

							// TODO: if material is a transmissive volume we may need to assume double-sidedness
							// shadow rays hit both sides
							if ( ! ${c} && material.side != 0 && triResult.side != material.side ) {

								continue;

							}

							if ( material.transparent != 0 || material.alphaTest > 0.0 ) {

								var opacity = ${f};

								// add support for vertex color opacity
								if ( material.vertexColors == 1 ) {

									let barycoord = triResult.barycoord;
									let a = ${r.getColor}( ${t.attributes}[ i0 ] );
									let b = ${r.getColor}( ${t.attributes}[ i1 ] );
									let c = ${r.getColor}( ${t.attributes}[ i2 ] );
									let col = barycoord.x * a + barycoord.y * b + barycoord.z * c;

									opacity *= col.a;

								}

								// account for alpha component of albedo map
								if ( material.map != - 1 ) {

									let barycoord = triResult.barycoord;
									let a = ${r.getUvFromChannel}( ${t.attributes}[ i0 ], material.map );
									let b = ${r.getUvFromChannel}( ${t.attributes}[ i1 ], material.map );
									let c = ${r.getUvFromChannel}( ${t.attributes}[ i2 ], material.map );
									let uv = barycoord.x * a + barycoord.y * b + barycoord.z * c;
									let uvPrime = material.mapTransform * vec3f( uv, 1 );

									opacity *= ${n}( uvPrime.xy, material.map, 0 ).a;

								}

								// account for green component of alpha map
								if ( material.alphaMap != - 1 ) {

									let barycoord = triResult.barycoord;
									let a = ${r.getUvFromChannel}( ${t.attributes}[ i0 ], material.alphaMap );
									let b = ${r.getUvFromChannel}( ${t.attributes}[ i1 ], material.alphaMap );
									let c = ${r.getUvFromChannel}( ${t.attributes}[ i2 ], material.alphaMap );
									let uv = barycoord.x * a + barycoord.y * b + barycoord.z * c;
									let uvPrime = material.alphaMapTransform * vec3f( uv, 1 );

									opacity *= ${n}( uvPrime.xy, material.alphaMap, 0 ).g;

								}

								// Opacity is resolved at surface processing but skip full transparent hits here.
								if ( material.transparent != 0 && opacity <= 0.0 ) {

									continue;

								}

								if ( opacity < material.alphaTest ) {

									continue;

								}

							}

							// shadow rays pass the objects not visible to them, but a bsdf ray would hit this face
							if ( ${u} ) {

								if ( material.side == 0 || triResult.side == material.side ) {

									result.forwardBlocked = true;

								}

								continue;

							}

							result.didHit = true;
							result.dist = triResult.dist;
							result.normal = triResult.normal;
							result.side = triResult.side;
							result.barycoord = triResult.barycoord;
							result.indices = vec4u( i0, i1, i2, ti );

							didHit = true;

						}

					}

					return didHit;

				}
			`,transformShapeFn:_`
				fn transformRay( ray: ptr<function, ${$}>, objectIndex: u32 ) -> void {

					let toLocal = ${t.transforms}[ objectIndex ].inverseMatrixWorld;
					ray.origin = ( toLocal * vec4f( ray.origin, 1.0 ) ).xyz;
					ray.direction = ( toLocal * vec4f( ray.direction, 0.0 ) ).xyz;

					let len = length( ray.direction );
					ray.direction /= len;
					${a} = 1.0 / len;

					let object = ${t.transforms}[ objectIndex ];
					${l} = object.materialIndex;

					let material = ${t.materials}[ object.materialIndex ];
					if ( material.transparent == 1 ) {

						${f} = material.opacity * object.color.a;

					} else {

						${f} = 1.0;

					}

					${u} = ${c} && object.visibleToShadowRays == 0u;

				}
			`,transformResultFn:_`
				fn transformResult( hit: ptr<function, ${$n}>, objectIndex: u32 ) -> void {

					let toLocal = ${t.transforms}[ objectIndex ].inverseMatrixWorld;
					hit.normal = normalize( ( transpose( toLocal ) * vec4f( hit.normal, 0.0 ) ).xyz );
					hit.objectIndex = objectIndex;

				}
			`,resetShapeFn:_`
				fn resetRayScalar( objectIndex: u32 ) -> void {

					${a} = 1.0;
					${f} = 1.0;

				}
			`};r.raycastFirstHit=this.getShapecastFn({...d,name:"raycastFirstHit",prefixFn:_`
				fn initFirstHitCull() -> void {

					${c} = false;

				}
			`}),r.raycastShadow=this.getShapecastFn({...d,name:"raycastShadow",prefixFn:_`
				fn initShadowCull() -> void {

					${c} = true;

				}
			`})}update(){let{structs:e}=this,t=new Lc(new Uint8Array,e.material.getLength());this.storage.materials=cp(t,e.material).toReadOnly().setName("bvh_materials"),this.updateUvAttributesFromScene(),this.updateMaterialsMap(),super.update(),this.updateUvSampleFunction(),this.updateColorSampleFn(),this.updateMaterials(),this.bvhMap.clear(),this.useTransparencyRaycastFn()}updateMaterialsMap(){let{materials:e,materialsMap:t}=this;t.clear(),e.length=0,this.getRootObject().traverse(i=>{i.material&&(Array.isArray(i.material)?i.material.forEach(s=>s&&r(s)):r(i.material))}),e.sort((i,s)=>i.uuid<s.uuid?1:-1).forEach((i,s)=>{t.set(i,s)});function r(i){t.has(i)||(e.push(i),t.set(i,-1))}}updateMaterials(){this.updateMaterialsMap();let{materials:e,storage:t,structs:r,bvh:i}=this,{materialData:s,textures:n}=this.writeMaterialsBuffer(e),l=t.materials.proxyNode,a=t.transforms.proxyNode,f=s.length/r.material.getLength();l.value.count<f&&(l.value.dispose(),l.value=new Lc(s,r.material.getLength())),l.value.array.set(s),l.value.needsUpdate=!0,this._getTransformMap(i).forEach(c=>{this.writeMaterialData(c,c.slot,a.value.array.buffer)}),a.value.needsUpdate=!0,this.textures=n}writeMaterialsBuffer(e){function t(d){switch(d){case sp:return 0;case op:return 1;case ap:return 2;default:return 0}}function r(d,h){if(h in d&&d[h]){let p=d[h],y=$c(p);l.has(y)||(l.set(y,l.size),a.push(p));let v=l.get(y),T=p.channel&7,m=t(p.wrapS),x=t(p.wrapT);return(p.magFilter===lp?1:0)<<30|x<<28|m<<26|T<<23|v&8388607}else return-1}function i(d,h,p){return h in d?d[h]:p}function s(d,h,p,y){let v=d[h]&&d[h].isTexture?d[h]:null;if(v){v.matrixAutoUpdate&&v.updateMatrix();let T=v.matrix.elements;for(let m=0;m<3;m++)p[y+4*m+0]=T[3*m+0],p[y+4*m+1]=T[3*m+1],p[y+4*m+2]=T[3*m+2],p[y+4*m+3]=0}return 12}let n=0,l=new Map,a=[],f=Math.max(e.length,2),c=new Float32Array(f*this.structs.material.getLength()),u=new Int32Array(c.buffer);for(let d=0,h=e.length;d<h;d++){let p=e[d];c[n++]=p.color.r,c[n++]=p.color.g,c[n++]=p.color.b,u[n++]=r(p,"map"),c[n++]=i(p,"metalness",0),u[n++]=r(p,"metalnessMap"),c[n++]=i(p,"roughness",0),u[n++]=r(p,"roughnessMap"),c[n++]=i(p,"ior",1.5),c[n++]=i(p,"transmission",0),u[n++]=r(p,"transmissionMap"),c[n++]=i(p,"emissiveIntensity",0),"emissive"in p?(c[n++]=p.emissive.r,c[n++]=p.emissive.g,c[n++]=p.emissive.b):(c[n++]=0,c[n++]=0,c[n++]=0),u[n++]=r(p,"emissiveMap"),u[n++]=r(p,"normalMap"),n++,"normalScale"in p?(c[n++]=p.normalScale.x,c[n++]=p.normalScale.y):(c[n++]=1,c[n++]=1),c[n++]=i(p,"clearcoat",0),u[n++]=r(p,"clearcoatMap"),u[n++]=r(p,"clearcoatNormalMap"),n++,"clearcoatNormalScale"in p?(c[n++]=p.clearcoatNormalScale.x,c[n++]=p.clearcoatNormalScale.y):(c[n++]=1,c[n++]=1),c[n++]=i(p,"clearcoatRoughness",0),u[n++]=r(p,"clearcoatRoughnessMap"),u[n++]=r(p,"iridescenceMap"),u[n++]=r(p,"iridescenceThicknessMap"),c[n++]=i(p,"iridescence",0),c[n++]=i(p,"iridescenceIOR",1.3);let y=i(p,"iridescenceThicknessRange",[100,400]);c[n++]=y[0],c[n++]=y[1],c[n++]=i(p,"diffuseRoughness",0),c[n++]=i(p,"dispersion",0),"specularColor"in p?(c[n++]=p.specularColor.r,c[n++]=p.specularColor.g,c[n++]=p.specularColor.b):(c[n++]=1,c[n++]=1,c[n++]=1),u[n++]=r(p,"specularColorMap"),c[n++]=i(p,"specularIntensity",1),u[n++]=r(p,"specularIntensityMap");let v=i(p,"thickness",0)===0&&i(p,"attenuationDistance",1/0)===1/0;if(u[n++]=Number(v),n++,"attenuationColor"in p?(c[n++]=p.attenuationColor.r,c[n++]=p.attenuationColor.g,c[n++]=p.attenuationColor.b):(c[n++]=1,c[n++]=1,c[n++]=1),c[n++]=i(p,"attenuationDistance",1/0),u[n++]=r(p,"alphaMap"),u[n++]=Number(i(p,"castShadow",!0)),c[n++]=p.opacity,c[n++]=p.alphaTest,!v&&p.transmission>0)c[n++]=0;else switch(p.side){case Jh:c[n++]=1;break;case Zh:c[n++]=-1;break;case ep:c[n++]=0;break}u[n++]=Number(i(p,"matte",!1)),c[n++]=i(p,"sheen",0),n++,"sheenColor"in p?(c[n++]=p.sheenColor.r,c[n++]=p.sheenColor.g,c[n++]=p.sheenColor.b):(c[n++]=0,c[n++]=0,c[n++]=0),u[n++]=r(p,"sheenColorMap"),c[n++]=i(p,"sheenRoughness",0),u[n++]=r(p,"sheenRoughnessMap"),u[n++]=Number(p.vertexColors),u[n++]=Number(p.flatShading),u[n++]=Number(p.transparent),u[n++]=0,c[n++]=i(p,"anisotropy",0),c[n++]=i(p,"anisotropyRotation",0),u[n++]=r(p,"anisotropyMap"),n++,n++,n++,n+=s(p,"map",c,n),n+=s(p,"metalnessMap",c,n),n+=s(p,"roughnessMap",c,n),n+=s(p,"transmissionMap",c,n),n+=s(p,"emissiveMap",c,n),n+=s(p,"normalMap",c,n),n+=s(p,"clearcoatMap",c,n),n+=s(p,"clearcoatNormalMap",c,n),n+=s(p,"clearcoatRoughnessMap",c,n),n+=s(p,"sheenColorMap",c,n),n+=s(p,"sheenRoughnessMap",c,n),n+=s(p,"iridescenceMap",c,n),n+=s(p,"iridescenceThicknessMap",c,n),n+=s(p,"specularColorMap",c,n),n+=s(p,"specularIntensityMap",c,n),n+=s(p,"alphaMap",c,n),n+=s(p,"anisotropyMap",c,n)}return{materialData:u,textures:a}}writeMaterialData(e,t,r){let{materialsMap:i}=this,{object:s,instanceId:n,root:l}=e,a=s.material;if(Array.isArray(a)){let{materialIndex:d}=s.geometry.groups[l];a=a[d]}let f=new Uint32Array(r),c=i.has(a)?i.get(a):-1;c===-1&&(f[t*Nn.getLength()+32]=0),f[t*Nn.getLength()+33]=c,s.isInstancedMesh&&s.instanceColor?(s.getColorAt(n,qr),qr.w=1):s.isBatchedMesh&&s._colorsTexture?s.getColorAt(n,qr):qr.setScalar(1);let u=new Float32Array(r);qr.toArray(u,t*Nn.getLength()+36)}writeTransformData(e,t,r,i){super.writeTransformData(e,t,r,i),this.writeMaterialData(e,r,i);let s=new Uint32Array(i);s[r*this.structs.transform.getLength()+34]=e.object.visibleToShadowRays===!1?0:1}getBVH(e,t,r){let{bvhMap:i}=this,s=super.getBVH(e,t,r);if(i.has(s)){let n=i.get(s);if(Object.assign(r,n.range),s!==n.bvh&&s instanceof Ie){let l=s.mesh,a=n.bvh.mesh;a.matrixWorld.copy(l.matrixWorld).decompose(a.position,a.quaternion,a.scale),s.refit(),s.getBoundingBox(a.boundingBox),s.geometry.computeBoundingBox()}return n.bvh}else if(s.indirect){let n=new rp;n.attributes=s.geometry.attributes;let l;if(s.geometry.index)l=s.geometry.index.array.slice(r.start,r.count+r.start);else{let{start:f,count:c}=r;l=new Uint32Array(c);for(let u=0,d=r.count;u<d;u++)l[u]=f+u}n.index=new tp(l,1),r.start=0;let a;if(s instanceof Ie){let f=s.mesh,c=new np(n);c.copy(f),c.matrixWorld.copy(f.matrixWorld).decompose(c.position,c.quaternion,c.scale),a=new Ie(c,{strategy:2,targetLeafSize:5})}else a=new Ee(n,{strategy:2,targetLeafSize:5});return i.set(s,{bvh:a,range:{...r}}),a}else return s}dispose(){let{storage:e}=this;for(let t in e)e[t].value?.dispose()}};import{MeshBasicNodeMaterial as hp,DataTexture as pp,NoBlending as mp}from"three/webgpu";import{uv as gp,varying as xp,texture as vp,uniform as yp,wgslFn as bp}from"three/tsl";var Ln=class extends hp{set texture(e){this._texNode.value=e}set layer(e){this._layerUniform.value=e}constructor(){super(),this.blending=mp,this._texNode=vp(new pp),this._layerUniform=yp(0),this.colorNode=bp(`
			fn atlasDebug( tex: texture_2d_array<f32>, coord: vec2f, layer: f32 ) -> vec4f {

				// flip y so texel origin shows at the top-left
				let dims = vec2f( textureDimensions( tex, 0 ).xy );
				let texel = vec2i( vec2f( coord.x, 1.0 - coord.y ) * dims );
				return textureLoad( tex, texel, i32( layer ), 0 );

			}
		`)(this._texNode,xp(gp()),this._layerUniform)}};import{MeshBasicNodeMaterial as Tp,NoBlending as wp,StorageTexture as Sp}from"three/webgpu";import{uv as Ip,varying as _p,texture as Rp,uniform as Hc}from"three/tsl";var zn=class extends Tp{set texture(e){this._texNode.value=e}set minCount(e){this._minUniform.value=e}set maxCount(e){this._maxUniform.value=e}constructor(){super(),this.blending=wp,this._texNode=Rp(new Sp(1,1)),this._minUniform=Hc(0),this._maxUniform=Hc(1);let e=_`
			fn sampleDensity( tex: texture_2d<u32>, coord: vec2f, minCount: f32, maxCount: f32 ) -> vec4f {

				let dims = vec2f( textureDimensions( tex, 0 ) );
				let texel = vec2i( coord * dims );

				// the high bits hold the ray state flags rather than part of the count
				let samples = textureLoad( tex, texel, 0 ).r & ${Je}u;

				// stretched across the recorded range rather than from zero, otherwise a converged
				// image with counts bunched near the max reads as uniformly hot
				let range = max( maxCount - minCount, 1.0 );
				let t = clamp( ( f32( samples ) - minCount ) / range, 0.0, 1.0 );

				return vec4f( ${$s}( t ), 1.0 );

			}
		`;this.colorNode=e(this._texNode,_p(Ip()),this._minUniform,this._maxUniform)}};import{BufferAttribute as On}from"three";function kc(o,e){if(!o.index){let t=o.attributes.position.count,r=new Array(t);for(let i=0;i<t;i++)r[i]=i;o.setIndex(r)}if(!o.attributes.normal&&e&&e.includes("normal")&&o.computeVertexNormals(),!o.attributes.uv&&e&&e.includes("uv")){let t=o.attributes.position.count;o.setAttribute("uv",new On(new Float32Array(t*2),2,!1))}if(!o.attributes.uv2&&e&&e.includes("uv2")){let t=o.attributes.position.count;o.setAttribute("uv2",new On(new Float32Array(t*2),2,!1))}if(!o.attributes.tangent&&e&&e.includes("tangent"))if(o.attributes.uv&&o.attributes.normal)o.computeTangents();else{let t=o.attributes.position.count;o.setAttribute("tangent",new On(new Float32Array(t*4),4,!1))}if(!o.attributes.color&&e&&e.includes("color")){let t=o.attributes.position.count,r=new Float32Array(t*4);r.fill(1),o.setAttribute("color",new On(r,4))}}import{float as nu}from"three/tsl";var Vn=class{init(){}getBsdfNode(){return _`

			fn bsdfSample( worldWo: vec3f, surf: SurfaceRecord ) -> ScatterRecord {

				var record: ScatterRecord;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let wi = ${bl}( wo, ${ye}( ${Hi} ) );
				record.color = surf.color * max( wi.z, 0.0 );
				record.pdf = max( wi.z, 0.0 ) / PI;
				record.direction = normalize( surf.normalBasis * wi );

				return record;

			}

		`}getBsdfEvalPdfNode(){return _`

			fn bsdfEvalPdf( worldWo: vec3f, worldWi: vec3f, surf: SurfaceRecord ) -> ScatterRecord {

				var record: ScatterRecord;
				record.direction = worldWi;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let wi = normalize( surf.normalInvBasis * worldWi );
				record.color = surf.color * max( wi.z, 0.0 );
				record.pdf = max( wi.z, 0.0 ) / PI;

				return record;

			}

		`}getData(){return{bsdfSample:this.getBsdfNode(),bsdfEvalPdf:this.getBsdfEvalPdfNode()}}};import{wgslFn as he}from"three/tsl";var Dp=he(`

	fn eonDirectionalAlbedo( mu: f32, roughness: f32, A: f32 ) -> f32 {

		let muComp = 1.0 - mu;
		let gOverPi = muComp * (
			0.0571085289 + muComp * (
				0.491881867 + muComp * (
					- 0.332181442 + muComp * 0.0714429953
				)
			)
		);
		return A * ( 1.0 + roughness * gOverPi );

	}

`),Uc=he(`

	fn fonSingleScatter( NdotV: f32, NdotL: f32, VdotH: f32, roughness: f32, A: f32, rho: vec3f ) -> vec3f {

		let VdotL = 2.0 * VdotH * VdotH - 1.0;
		let s = VdotL - NdotV * NdotL;
		let sOverT = select( s, s / max( NdotV, NdotL ), s > 0.0 );

		return ( rho / PI ) * A * ( 1.0 + roughness * sOverT );

	}

`,[V]),Kw=he(`

	fn fonBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		let roughness = surf.diffuseRoughness;
		if ( roughness < 1e-5 ) {

			return surf.color / PI;

		}

		let rho = saturate( surf.color );
		let A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );

		return fonSingleScatter( NdotV, NdotL, VdotH, roughness, A, rho );

	}

`,[V,ee,Uc]),Wc=he(`

	fn eonBrdf( NdotV: f32, NdotL: f32, VdotH: f32, surf: SurfaceRecord ) -> vec3f {

		let roughness = surf.diffuseRoughness;
		if ( roughness < 1e-5 ) {

			return surf.color / PI;

		}

		let rho = saturate( surf.color );
		let A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		let singleScatter = fonSingleScatter( NdotV, NdotL, VdotH, roughness, A, rho );

		let averageDirectionalAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		let directionalAlbedoV = eonDirectionalAlbedo( NdotV, roughness, A );
		let directionalAlbedoL = eonDirectionalAlbedo( NdotL, roughness, A );

		let rhoMultiScatter = rho * rho * averageDirectionalAlbedo /
			max( vec3f( 1e-7 ), vec3f( 1.0 ) - rho * ( 1.0 - averageDirectionalAlbedo ) );
		let multiScatter = ( rhoMultiScatter / PI ) *
			max( 1e-7, 1.0 - directionalAlbedoV ) *
			max( 1e-7, 1.0 - directionalAlbedoL ) /
			max( 1e-7, 1.0 - averageDirectionalAlbedo );

		return singleScatter + multiScatter;

	}

`,[V,ee,Dp,Uc]),qc=he(`

	fn eonLtcCoeffs( mu: f32, roughness: f32 ) -> vec4f {

		let a = 1.0 + roughness * (
			0.303392 + ( - 0.518982 + 0.111709 * mu ) * mu +
			( - 0.276266 + 0.335918 * mu ) * roughness
		);
		let b = roughness * (
			- 1.16407 + 1.15859 * mu + ( 0.150815 - 0.150105 * mu ) * roughness
		) / ( mu * mu * mu - 1.43545 );
		let c = 1.0 + roughness * ( 0.20013 + ( - 0.506373 + 0.261777 * mu ) * mu );
		let d = roughness * (
			0.540852 + ( - 1.01625 + 0.475392 * mu ) * mu
		) / ( - 1.0743 + ( 0.0725628 + mu ) * mu );

		return vec4f( a, b, c, d );

	}

`),Gc=he(`

	fn eonLtcBasis( wo: vec3f ) -> mat3x3f {

		let lenSqr = dot( wo.xy, wo.xy );
		let invLen = inverseSqrt( max( lenSqr, 1e-7 ) );
		let x = select(
			vec3f( 1.0, 0.0, 0.0 ),
			vec3f( wo.x, wo.y, 0.0 ) * invLen,
			lenSqr > 0.0,
		);
		let y = vec3f( - x.y, x.x, 0.0 );

		return mat3x3f( x, y, vec3f( 0.0, 0.0, 1.0 ) );

	}

`),Fp=he(`

	fn eonCltcPdf( wo: vec3f, wi: vec3f, roughness: f32 ) -> f32 {

		let toLtc = transpose( eonLtcBasis( wo ) );
		let wiLtc = toLtc * wi;
		let coeffs = eonLtcCoeffs( saturate( wo.z ), roughness );
		let a = coeffs.x;
		let b = coeffs.y;
		let c = coeffs.z;
		let d = coeffs.w;
		let detM = c * ( a - b * d );
		let wh = vec3f(
			c * ( wiLtc.x - b * wiLtc.z ),
			( a - b * d ) * wiLtc.y,
			- c * ( d * wiLtc.x - a * wiLtc.z ),
		);
		let lenSqr = max( dot( wh, wh ), 1e-7 );
		let vz = inverseSqrt( d * d + 1.0 );
		let s = 0.5 * ( 1.0 + vz );
		let jacobian = detM * detM / ( lenSqr * lenSqr );

		return jacobian * max( wh.z, 0.0 ) / ( PI * s );

	}

`,[V,qc,Gc]),Cp=he(`

	fn eonCltcDirection( wo: vec3f, roughness: f32, uv: vec2f ) -> vec3f {

		let coeffs = eonLtcCoeffs( saturate( wo.z ), roughness );
		let a = coeffs.x;
		let b = coeffs.y;
		let c = coeffs.z;
		let d = coeffs.w;
		let radius = sqrt( uv.x );
		let phi = 2.0 * PI * uv.y;
		let y = radius * sin( phi );
		let vz = inverseSqrt( d * d + 1.0 );
		let s = 0.5 * ( 1.0 + vz );
		let x = - mix( sqrt( max( 1.0 - y * y, 0.0 ) ), radius * cos( phi ), s );
		let wh = vec3f( x, y, sqrt( max( 1.0 - x * x - y * y, 0.0 ) ) );
		let wiUnnormalized = vec3f(
			a * wh.x + b * wh.z,
			c * wh.y,
			d * wh.x + wh.z,
		);
		let wi = normalize( eonLtcBasis( wo ) * wiUnnormalized );

		return wi;

	}

`,[V,qc,Gc]),Ap=he(`

	fn eonUniformHemisphereSample( uv: vec2f ) -> vec3f {

		let sinTheta = sqrt( max( 1.0 - uv.x * uv.x, 0.0 ) );
		let phi = 2.0 * PI * uv.y;
		return vec3f( sinTheta * cos( phi ), sinTheta * sin( phi ), uv.x );

	}

`,[V]),Qc=he(`

	fn eonUniformProbability( wo: vec3f, roughness: f32 ) -> f32 {

		let mu = saturate( wo.z );
		return clamp( pow( roughness, 0.1 ), 0.0, 1.0 ) * (
			0.162925 + ( - 0.372058 + ( 0.538233 - 0.290822 * mu ) * mu ) * mu
		);

	}

`),jc=he(`

	fn eonDirection( wo: vec3f, roughness: f32, uv: vec2f ) -> vec3f {

		let uniformProbability = eonUniformProbability( wo, roughness );
		if ( uv.x <= uniformProbability && uniformProbability > 0.0 ) {

			return eonUniformHemisphereSample( vec2f( uv.x / uniformProbability, uv.y ) );

		}

		let cltcProbability = 1.0 - uniformProbability;
		let cltcUv = vec2f(
			( uv.x - uniformProbability ) / max( cltcProbability, 1e-7 ),
			uv.y,
		);
		return eonCltcDirection( wo, roughness, cltcUv );

	}

`,[Cp,Ap,Qc]),Kc=he(`

	fn eonPdf( wo: vec3f, wi: vec3f, roughness: f32 ) -> f32 {

		// The EON proposal is defined over the positive hemisphere.
		if ( wo.z <= 0.0 || wi.z <= 0.0 ) {

			return 0.0;

		}

		let uniformProbability = eonUniformProbability( wo, roughness );
		let cltcProbability = 1.0 - uniformProbability;
		let uniformPdf = 1.0 / ( 2.0 * PI );

		return uniformProbability * uniformPdf +
			cltcProbability * eonCltcPdf( wo, wi, roughness );

	}

`,[V,Fp,Qc]);var Mp=_`

	fn velvetD( cosThetaH: f32, roughness: f32 ) -> f32 {

		var alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		let invAlpha = 1.0 / alpha;
		let sqrCosThetaH = cosThetaH * cosThetaH;
		let sinThetaH = max( 1.0 - sqrCosThetaH, 0.001 );

		return ( 2.0 + invAlpha ) * pow( sinThetaH, 0.5 * invAlpha ) / ( 2.0 * PI );

	}

`,Gr=_`

	fn velvetParamsInterpolate( i: i32, oneMinusAlphaSquared: f32 ) -> f32 {

		let p0 = array<f32, 5>( 25.3245, 3.32435, 0.16801, - 1.27393, - 4.85967 );
		let p1 = array<f32, 5>( 21.5473, 3.82987, 0.19823, - 1.97760, - 4.32054 );

		return mix( p1[ i ], p0[ i ], oneMinusAlphaSquared );

	}

`,xo=_`

	fn velvetL( x: f32, alpha: f32 ) -> f32 {

		let oneMinusAlpha = 1.0 - alpha;
		let oneMinusAlphaSquared = oneMinusAlpha * oneMinusAlpha;

		let a = ${Gr}( 0, oneMinusAlphaSquared );
		let b = ${Gr}( 1, oneMinusAlphaSquared );
		let c = ${Gr}( 2, oneMinusAlphaSquared );
		let d = ${Gr}( 3, oneMinusAlphaSquared );
		let e = ${Gr}( 4, oneMinusAlphaSquared );

		return a / ( 1.0 + b * pow( abs( x ), c ) ) + d * x + e;

	}

`,Xc=_`

	fn velvetLambda( cosTheta: f32, alpha: f32 ) -> f32 {

		if ( abs( cosTheta ) < 0.5 ) {

			return exp( ${xo}( cosTheta, alpha ) );

		} else {

			return exp( 2.0 * ${xo}( 0.5, alpha ) - ${xo}( 1.0 - cosTheta, alpha ) );

		}

	}

`,Bp=_`

	fn velvetG( cosThetaO: f32, cosThetaI: f32, roughness: f32 ) -> f32 {

		var alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		return 1.0 / ( 1.0 + ${Xc}( cosThetaO, alpha ) + ${Xc}( cosThetaI, alpha ) );

	}

`,Yc=_`

	fn directionalAlbedoSheen( cosThetaIn: f32, alpha: f32 ) -> f32 {

		let cosTheta = saturate( cosThetaIn );
		let c = 1.0 - cosTheta;
		let c3 = c * c * c;

		return 0.65584461 * c3 + 1.0 / ( 4.16526551 + exp( -7.97291361 * sqrt( alpha ) + 6.33516894 ) );

	}

`,Zc=_`

	fn sheenAlbedoScaling( wo: vec3f, wi: vec3f, surf: ${ee} ) -> f32 {

		var alpha = max( surf.sheenRoughness, 0.07 );
		alpha = alpha * alpha;

		let maxSheenColor = max( max( surf.sheenColor.r, surf.sheenColor.g ), surf.sheenColor.b );

		let eWo = ${Yc}( clamp( wo.z, 0.001, 1.0 ), alpha );
		let eWi = ${Yc}( clamp( wi.z, 0.001, 1.0 ), alpha );

		return min( 1.0 - maxSheenColor * eWo, 1.0 - maxSheenColor * eWi );

	}

`,Jc=_`

	fn sheenColor( wo: vec3f, wi: vec3f, wh: vec3f, surf: ${ee} ) -> vec3f {

		let cosThetaO = clamp( wo.z, 0.001, 1.0 );
		let cosThetaI = clamp( wi.z, 0.001, 1.0 );
		let cosThetaH = wh.z;

		let D = ${Mp}( cosThetaH, surf.sheenRoughness );
		let G = ${Bp}( cosThetaO, cosThetaI, surf.sheenRoughness );

		// See equation (1) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
		var color = surf.sheenColor;
		color *= D * G / ( 4.0 * abs( cosThetaO * cosThetaI ) );

		return color;

	}

`;import{Storage3DTexture as Pp,RGBAFormat as Np,LinearFilter as eu,HalfFloatType as $p,MathUtils as tu}from"three/webgpu";import{storageTexture3D as Ep,globalId as Lp,uniform as Hn,texture3D as zp,sampler as Op}from"three/tsl";var kn=32,Un=16,Wn=class extends Pp{constructor(){super(kn,kn,31),this.type=$p,this.format=Np,this.minFilter=eu,this.magFilter=eu,this.dielectricLayerCount=10,this.transmissiveLayerCount=10,this.minIoR=1,this.maxIoR=2.5,this.sampleConductorFn=O("_sampleConductorFn",this),this.sampleDielectricFn=O("_sampleDielectricFn",this),this.sampleTransmissiveFn=O("_sampleTransmissiveFn",this)}generate(e){let{dielectricLayerCount:t,transmissiveLayerCount:r,minIoR:i,maxIoR:s}=this,n={outputTarget:Ep(this).toWriteOnly(),globalId:Lp,eta:Hn(1),layer:Hn(0,"uint"),includeFresnel:Hn(0),includeRefraction:Hn(0)},l=[kn/Un,kn/Un,1],a=new q(Nl(n.outputTarget)(n),{workgroupSize:[Un,Un,1]});n.layer.value=0,n.eta.value=1,n.includeFresnel.value=0,n.includeRefraction.value=0,e.compute(a.kernel,l);for(let y=0;y<t;y++)n.layer.value++,n.eta.value=1/tu.mapLinear(y,0,t-1,i,s),n.includeFresnel.value=1,e.compute(a.kernel,l);n.includeFresnel.value=1,n.includeRefraction.value=1;for(let y=0;y<r;y++){let v=tu.mapLinear(y,0,r-1,i,s);n.layer.value=1+t+y,n.eta.value=1/v,e.compute(a.kernel,l),n.layer.value=1+t+r+y,n.eta.value=v,e.compute(a.kernel,l)}a.dispose();let f=_`
			fn mapLinearClamped( v: f32, a0: f32, a1: f32, b0: f32, b1: f32 ) -> f32 {

				let mapped = saturate( ( v - a0 ) / ( a1 - a0 ) );
				return mix( b0, b1, mapped );

			}
		`,c=zp(this).setName("turquinTexture"),u=Op(this).setName("turquinSampler"),d=1/(1+t+2*r);this._sampleConductorFn=_`
			fn sampleConductor( cosTheta0: f32, roughness: f32 ) -> f32 {

				let layer = 0.5;
				let uvw = vec3f( cosTheta0, roughness, layer * ${d} );
				return textureSampleLevel( ${c}, ${u}, uvw, 0 ).r;

			}
		`,this._sampleDielectricFn=_`
			fn sampleDielectric( cosTheta0: f32, roughness: f32, ior: f32 ) -> f32 {

				let blockStart = 1.0;
				let layer = ${f}(
					ior,
					f32( ${i} ), f32( ${s} ),
					0.5, f32( ${t} ) - 0.5,
				) + blockStart;

				let uvw = vec3f( cosTheta0, roughness, layer * ${d} );
				return textureSampleLevel( ${c}, ${u}, uvw, 0 ).r;

			}
		`;let h=1+t,p=1+t+r;this._sampleTransmissiveFn=_`
			fn sampleTransmissive( cosTheta0: f32, roughness: f32, ior: f32, entering: bool ) -> f32 {

				let blockStart = select(
					f32( ${p} ),
					f32( ${h} ),
					entering
				);
				let layer = ${f}(
					ior,
					f32( ${i} ), f32( ${s} ),
					0.5, f32( ${r} ) - 0.5,
				) + blockStart;

				let uvw = vec3f( cosTheta0, roughness, layer * ${d} );
				return textureSampleLevel( ${c}, ${u}, uvw, 0 ).r;

			}
		`}};var ru=nu(1.5),iu=nu(1e6),qn=class extends Vn{constructor(e={}){super();let{specularBrdf:t=Gs,specularBtdf:r=Qs,diffuseBrdf:i=Wc,fresnelMix:s=Al,conductorFresnel:n=Bl,fresnelCoat:l=Pl,iridescentFresnel:a=js}=e;this.turquinTexture=new Wn,this.specularBrdf=t,this.specularBtdf=r,this.diffuseBrdf=i,this.fresnelMix=s,this.conductorFresnel=n,this.fresnelCoat=l,this.iridescentFresnel=a,this.transmissionFresnel=Ml(a)}init(e){this.turquinTexture.generate(e)}getBsdfNode(){this._bsdfEvalFunc=_`

			// The material is organized as one scoped block per lobe in cascade order - clearcoat,
			// sheen, transmission, specular, diffuse - each accumulating into a shared result and
			// guarding its own hemisphere.
			// TODO: energy only cascades downward through front faces, so the layers are always traversed
			// outside-in and cannot reflect energy back into the glass from below.
			fn bsdfEval( ctx: ${Vs}, surf: ${ee} ) -> vec3f {

				let NdotV = ctx.V.z;
				let NdotL = ctx.L.z;

				// Each lobe contributes into "result" within its own scope, evaluated in cascade.
				// "attenuation" carries the fraction of energy each layer passes through to
				// the layers beneath it. Every lobe guards its own hemisphere.
				var result = vec3f( 0.0 );
				var attenuation = vec3f( 1.0 );

				// clearcoat
				if ( NdotL > 0.0 && surf.clearcoat > 0.0 ) {

					// the clearcoat evaluates in its own frame
					let toClearcoatMat = surf.clearcoatInvBasis * surf.normalBasis;
					let Vc = normalize( toClearcoatMat * ctx.V );
					let Lc = normalize( toClearcoatMat * ctx.L );
					let Hc = normalize( toClearcoatMat * ctx.H );
					let NdotVc = Vc.z;

					let clearcoatAlpha = surf.clearcoatRoughness * surf.clearcoatRoughness;

					// reuse the same pattern for energy conservation used in the dielectric layer
					let clearcoatEnergySS = max( ${this.turquinTexture.sampleConductorFn}( NdotVc, surf.clearcoatRoughness ), 1e-5 );
					let clearcoatBoost = 1.0 + ${le}( 1.5 ) * ( 1.0 - clearcoatEnergySS ) / clearcoatEnergySS;

					let clearcoatSpecular = ${this.specularBrdf}( Vc, Lc, Hc, vec2( clearcoatAlpha ) ) * clearcoatBoost;
					let clearcoatFresnel = ${Fe}( abs( dot( Vc, Hc ) ), ${le}( 1.5 ) );

					// retrieve specular energy reflected by this layer
					let clearcoatFresnelEnergySS = ${this.turquinTexture.sampleDielectricFn}( NdotVc, surf.clearcoatRoughness, 1.5 ) * clearcoatBoost;

					result += surf.clearcoat * clearcoatFresnel * clearcoatSpecular;
					attenuation *= 1.0 - surf.clearcoat * clearcoatFresnelEnergySS;

				}

				// sheen
				if ( NdotL > 0.0 && surf.sheen > 0.0 ) {

					result += attenuation * surf.sheen * ${Jc}( ctx.V, ctx.L, ctx.H, surf );
					attenuation *= mix( 1.0, ${Zc}( ctx.V, ctx.L, surf ), surf.sheen );

				}

				// transmission
				// handles specular reflection and transmission
				if ( surf.transmission > 0.0 ) {

					let matchedIor = ${jt}( surf.eta );

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// multiscatter compensation
					var glassBoost = 0.0;
					if ( matchedIor ) {

						glassBoost = 1.0;

					} else if ( surf.thinWall ) {

						// thin wall halves are reflection-shaped so each is compensated with the conductor albedo at its own roughness.
						glassBoost = 1.0 / max( ${this.turquinTexture.sampleConductorFn}( NdotV, surf.roughness ), 1e-5 );

					} else {

						// volumetric bsdf is scaled by its total reflected + refracted energy
						glassBoost = 1.0 / max( ${this.turquinTexture.sampleTransmissiveFn}( NdotV, surf.roughness, surf.ior, surf.frontFace ), 1e-5 );

					}

					let fresnelCosine = select( ctx.VdotH, NdotV, surf.thinWall );
					let fresnel = ${this.transmissionFresnel}( fresnelCosine, surf );

					if ( NdotL < 0.0 ) {

						var refraction = vec3f( 0.0 );
						if ( surf.thinWall && ! matchedIor ) {

							// evaluate the flipped reflection, compensated at the remapped roughness
							let wiMirror = vec3f( ctx.L.xy, - ctx.L.z );
							let thinWallAlpha = vec2f( ${on}( alphaB, surf.ior ) );
							let thinWallEnergySS = max( ${this.turquinTexture.sampleConductorFn}( NdotV, sqrt( thinWallAlpha.x ) ), 1e-5 );
							refraction = fresnel.transmittance * ${this.specularBrdf}( ctx.V, wiMirror, ctx.H, thinWallAlpha ) / thinWallEnergySS;

						} else if ( ! matchedIor ) {

							// The default BTDF contains the plain dielectric Fresnel complement. Replace it
							// with the colored thin-film-aware coefficient shared by sampling and the PDF.
							let dielectricTransmittance = 1.0 - ${dt}( abs( ctx.VdotH ), surf.eta );
							if ( dielectricTransmittance > EPSILON ) {

								refraction = ${this.specularBtdf}( ctx.V, ctx.L, ctx.H, alpha, surf.eta ) *
									fresnel.transmittance / dielectricTransmittance * glassBoost;

							}

						}

						// the refracted half is not attenuated by the layers above
						result += ( 1.0 - surf.metalness ) * surf.transmission * refraction * surf.color;

					} else {

						// the raw single scatter lobe scaled by the glass compensation boost rather
						// than the opaque dielectric boost
						let specular = ${this.specularBrdf}( ctx.V, ctx.L, ctx.H, alpha );
						let dielectricSpecular = specular * glassBoost;

						let reflection = dielectricSpecular * fresnel.reflectance;

						result += attenuation * ( 1.0 - surf.metalness ) * surf.transmission * reflection;

					}

				}

				// specular
				// metallic + dielectric + iridescence
				if ( NdotL > 0.0 ) {

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// Sample the single scatter energy for specular at the given roughness
					let energySS = max( ${this.turquinTexture.sampleConductorFn}( NdotV, surf.roughness ), 1e-5 );
					let specular = ${this.specularBrdf}( ctx.V, ctx.L, ctx.H, alpha );

					// metallic with the multiscatter comp
					let metallicBoost = 1.0 + surf.color * ( 1.0 - energySS ) / energySS;
					let metallicSpecular = specular * metallicBoost;
					var metallicReflectance = ${this.conductorFresnel}( ctx.VdotH, surf.color, vec3f( 1.0 ) );

					// dielectric with the multiscatter comp
					let dielectricBoost = 1.0 + surf.f0 * ( 1.0 - energySS ) / energySS;
					let dielectricSpecular = specular * dielectricBoost;

					// KHR_materials_specular: fold the specular color and intensity into the dielectric f0.
					// Schlick is used on both hit sides, matching Cycles - the opaque specular carries no
					// TIR so the energy removed from the base always matches the energy paid back
					let dielectricF0 = min( surf.f0 * surf.specularColor, vec3f( 1.0 ) );
					let dielectricFr = ${qt}( ctx.VdotH, dielectricF0, vec3f( 1.0 ) );
					var dielectricReflectance = surf.specularIntensity * dielectricFr;

					// iridescence
					var filmFresnelMax = 0.0;
					if ( surf.iridescence > 0.0 ) {

						// the media on either side of the film - air outside and the volume interior
						// as the base on front faces, swapped on back faces so TIR can take effect
						let outsideIor = select( surf.ior, 1.0, surf.frontFace );
						let filmBaseIor = select( 1.0, surf.ior, surf.frontFace );

						let metallicFilmFresnel = ${this.iridescentFresnel}( ctx.VdotH, surf.color, surf.iridescenceIor, outsideIor, surf.iridescenceThickness );
						metallicReflectance = mix( metallicReflectance, metallicFilmFresnel, surf.iridescence );

						let dielectricFilmFresnel = ${this.iridescentFresnel}( ctx.VdotH, vec3f( ${le}( filmBaseIor ) ), surf.iridescenceIor, outsideIor, surf.iridescenceThickness );
						dielectricReflectance = mix( dielectricReflectance, dielectricFilmFresnel, surf.iridescence );
						filmFresnelMax = max( max( dielectricFilmFresnel.r, dielectricFilmFresnel.g ), dielectricFilmFresnel.b );

					}

					let metallic = metallicSpecular * metallicReflectance;
					let dielectric = dielectricSpecular * dielectricReflectance;

					// the energy the specular interface takes from the layers below
					let fresnelEnergySS = ${this.turquinTexture.sampleDielectricFn}( NdotV, surf.roughness, surf.ior ) * dielectricBoost;

					result += attenuation * mix( ( 1.0 - surf.transmission ) * dielectric, metallic, surf.metalness );
					attenuation *= ( 1.0 - surf.metalness ) * mix( 1.0 - fresnelEnergySS, 1.0 - filmFresnelMax, surf.iridescence );

				}

				// diffuse
				if ( NdotL > 0.0 ) {

					// the dielectric base mixes diffuse with transmission - the transmissive half
					// is carried by the glass lobe above
					let diffuseVdotH = sqrt( saturate( 0.5 * ( 1.0 + dot( ctx.V, ctx.L ) ) ) );
					let reflection = ${this.diffuseBrdf}( NdotV, NdotL, diffuseVdotH, surf );
					let diffuse = ( 1.0 - surf.transmission ) * reflection;

					result += attenuation * diffuse;

				}

				return result;

			}

		`;let e=this.getBsdfEvalPdfNode();return _`

			fn bsdfSample( worldWo: vec3f, surf: ${ee} ) -> ${Oe} {

				var result: ${Oe};
				result.color = vec3f( 0.0 );
				result.isTransmissive = false;
				result.direction = vec3f( 0.0 );
				result.pdf = 0.0;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let woClearcoat = normalize( surf.clearcoatInvBasis * worldWo );

				// TODO: mirror bsdfEval's layer structure - the glass layer should own both its
				// reflection and refraction halves
				// lobe selection weights and cumulative bounds in cascade order:
				// clearcoat, specular, transmission, diffuse
				let weights = ${Hs}( wo, wo, woClearcoat, vec3( 0, 0, 1 ), ${ru}, surf );
				let cdfClearcoat = weights.clearcoat;
				let cdfSpecular = cdfClearcoat + weights.specular;
				let cdfTransmission = cdfSpecular + weights.transmission;
				let cdfTotal = cdfTransmission + weights.diffuse;

				// random samples for lobes
				let lobeSample = ${Re}( ${cl} ) * cdfTotal;
				let directionUV = ${ye}( ${Hi} );

				// output
				var wi: vec3f;
				var wh: vec3f;

				// TODO: see if we can clean up these flags so they're not necessary
				var isTransmissionLobe = false;
				var isDeltaTransmission = false;
				var deltaTransmittance = vec3f( 1.0 );
				var deltaProbability = 1.0;
				var isDead = false;

				if ( lobeSample <= cdfClearcoat ) {

					// clearcoat
					let clearcoatAlpha = surf.clearcoatRoughness * surf.clearcoatRoughness;
					let whCoat = ${pt}( woClearcoat, vec2( clearcoatAlpha ), directionUV );
					let wiCoat = - normalize( reflect( woClearcoat, whCoat ) );

					wi = normalize( surf.normalInvBasis * surf.clearcoatBasis * wiCoat );
					wh = normalize( surf.normalInvBasis * surf.clearcoatBasis * whCoat );

					// reflected rays must leave above the geometry surface - flip rays that land
					// below it due to the shading normal. Rays below the shading hemisphere are
					// left as is since their loss is refunded by the energy compensation tables
					let faceNormal = normalize( surf.normalInvBasis * surf.faceNormal );
					let geomDotDir = dot( wi, faceNormal );
					if ( wi.z > 0.0 && geomDotDir < 0.0 ) {

						wi = normalize( wi - 2.0 * geomDotDir * faceNormal );

					}

				} else if ( lobeSample <= cdfSpecular ) {

					// specular
					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					wh = ${pt}( wo, alpha, directionUV );
					wi = - normalize( reflect( wo, wh ) );

					// reflected rays must leave above the geometry surface - flip rays that land
					// below it due to the shading normal. Rays below the shading hemisphere are
					// left as is since their loss is refunded by the energy compensation tables
					let faceNormal = normalize( surf.normalInvBasis * surf.faceNormal );
					let geomDotDir = dot( wi, faceNormal );
					if ( wi.z > 0.0 && geomDotDir < 0.0 ) {

						wi = normalize( wi - 2.0 * geomDotDir * faceNormal );

					}

				} else if ( lobeSample <= cdfTransmission ) {

					// transmission
					isTransmissionLobe = true;

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// sample the half vector first and select reflection or refraction by the
					// facet fresnel, matching Cycles - total internal reflection drives the
					// fresnel to 1 so TIR facets always reflect with a matching pdf
					wh = ${pt}( wo, alpha, directionUV );

					let fresnelCosine = select( dot( wo, wh ), wo.z, surf.thinWall );
					let fresnel = ${this.transmissionFresnel}( fresnelCosine, surf );

					let fresnelSample = ( lobeSample - cdfSpecular ) / ( cdfTransmission - cdfSpecular );
					let doReflect = fresnelSample < fresnel.reflectProbability;
					if ( doReflect ) {

						wi = - normalize( reflect( wo, wh ) );

					} else if ( ${jt}( surf.eta ) ) {

						// With no IOR boundary, rough transmission collapses to straight-through
						// delta transmission independent of the sampled microfacet.
						wi = - wo;
						wh = vec3f( 0.0, 0.0, 1.0 );
						isDeltaTransmission = true;
						deltaTransmittance = fresnel.transmittance;
						deltaProbability = 1.0 - fresnel.reflectProbability;

					} else if ( surf.thinWall ) {

						// model the double refraction as a single reflection flipped through the
						// surface at the remapped thin wall roughness
						let thinWallAlpha = vec2f( ${on}( alphaB, surf.ior ) );
						wh = ${pt}( wo, thinWallAlpha, directionUV );
						wi = - normalize( reflect( wo, wh ) );
						wi = vec3f( wi.xy, - wi.z );

					} else {

						wi = refract( - wo, wh, surf.eta );

					}

					// the facet choice must agree with the resulting hemisphere - reflection above,
					// transmission below. Mismatched samples are dropped since their loss is
					// refunded by the energy compensation tables
					isDead = doReflect != ( wi.z > 0.0 );

				} else if ( lobeSample <= cdfTotal ) {

					// diffuse
					// all diffuse BRDF variants share the EON sampling proposal
					wi = ${jc}( wo, surf.diffuseRoughness, directionUV );
					wh = normalize( wi + wo );

					// reflected rays must leave above the geometry surface - flip rays that land
					// below it due to the shading normal. Rays below the shading hemisphere are
					// left as is since their loss is refunded by the energy compensation tables
					let faceNormal = normalize( surf.normalInvBasis * surf.faceNormal );
					let geomDotDir = dot( wi, faceNormal );
					if ( wi.z > 0.0 && geomDotDir < 0.0 ) {

						wi = normalize( wi - 2.0 * geomDotDir * faceNormal );

					}

				}

				let worldWi = normalize( surf.normalBasis * wi );
				if ( isDeltaTransmission ) {

					// Cycles represents a singular event with a large matching BSDF and PDF. Their
					// ratio preserves throughput while forward MIS correctly gives the event full weight.
					result.color = ( 1.0 - surf.metalness ) * surf.transmission * surf.color *
						deltaTransmittance * ${iu};
					result.direction = worldWi;
					result.pdf = weights.transmission * deltaProbability * ${iu};
					result.isTransmissive = dot( worldWi, surf.faceNormal ) < 0.0;

				} else {

					// evaluate the shared eval / pdf function for the sampled direction so the sample
					// and light-sampling paths can never disagree on color or pdf
					result = ${e}( worldWo, worldWi, surf );

				}

				// mismatched glass facets and reflection lobe samples that land below the
				// hemisphere carry no energy - their loss is refunded by the compensation tables
				let invalid = isDead || ( ! isTransmissionLobe && wi.z <= 0.0 );
				result.color *= select( 1.0, 0.0, invalid );

				return result;

			}

		`}getBsdfEvalPdfNode(){if(this._bsdfEvalPdfNode)return this._bsdfEvalPdfNode;this._bsdfEvalFunc||this.getBsdfNode();let e=this._bsdfEvalFunc;return this._bsdfEvalPdfNode=_`

			fn bsdfEvalPdf( worldWo: vec3f, worldWi: vec3f, surf: ${ee} ) -> ${Oe} {

				var result: ${Oe};
				result.color = vec3f( 0.0 );
				result.isTransmissive = false;
				result.direction = worldWi;
				result.pdf = 0.0;

				let wo = normalize( surf.normalInvBasis * worldWo );
				let wi = normalize( surf.normalInvBasis * worldWi );
				let woClearcoat = normalize( surf.clearcoatInvBasis * worldWo );

				let isTransmission = wi.z < 0.0;
				if ( isTransmission && ${jt}( surf.eta ) ) {

					// Delta transmission has no finite solid-angle BSDF or PDF. It is handled
					// explicitly by bsdfSample, matching PBRT-v4's eta == 1 path.
					return result;

				}

				// reconstruct the half vector bsdfSample would have used for this direction -
				// reflections use the standard half vector while refractions use the generalized
				// form scaled by the ior ratio, oriented into the upper hemisphere
				var wh: vec3f;
				if ( ! isTransmission ) {

					wh = normalize( wo + wi );

				} else if ( surf.thinWall ) {

					// thin wall transmission is modeled as a reflection flipped through the surface
					wh = normalize( wo + vec3f( wi.xy, - wi.z ) );

				} else {

					wh = normalize( wi + wo * surf.eta );
					wh *= sign( wh.z );

				}

				let weights = ${Hs}( wo, wo, woClearcoat, vec3( 0, 0, 1 ), ${ru}, surf );

				// TODO: mirror bsdfEval's layer structure - the glass layer should own both its
				// reflection and refraction halves
				// pdf mixture - every lobe that can produce the direction contributes its share,
				// in the same cascade order and with the same terms as bsdfSample

				// clearcoat
				if ( weights.clearcoat > 0.0 ) {

					// the clearcoat lobe evaluates in its own frame
					let toClearcoatMat = surf.clearcoatInvBasis * surf.normalBasis;
					let wiClearcoat = normalize( toClearcoatMat * wi );
					if ( wiClearcoat.z > 0.0 ) {

						let whClearcoat = normalize( toClearcoatMat * wh );
						let clearcoatAlpha = surf.clearcoatRoughness * surf.clearcoatRoughness;
						result.pdf += weights.clearcoat * ${mt}( woClearcoat, whClearcoat, vec2( clearcoatAlpha ) );

					}

				}

				// specular
				if ( weights.specular > 0.0 && wi.z > 0.0 ) {

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					result.pdf += weights.specular * ${mt}( wo, wh, alpha );

				}

				// transmission
				if ( weights.transmission > 0.0 ) {

					// anisotropic roughness along tangent, bitangent
					let alphaB = surf.roughness * surf.roughness;
					let alphaT = mix( alphaB, 1.0, surf.anisotropy * surf.anisotropy );
					let alpha = vec2( alphaT, alphaB );

					// the glass lobe selects reflection or refraction by the facet fresnel so
					// each side carries the corresponding share of the transmission pdf
					let fresnelCosine = select( dot( wo, wh ), wo.z, surf.thinWall );
					let fresnel = ${this.transmissionFresnel}( fresnelCosine, surf );

					if ( wi.z > 0.0 ) {

						result.pdf += weights.transmission * fresnel.reflectProbability * ${mt}( wo, wh, alpha );

					} else if ( surf.thinWall ) {

						// the flipped reflection shares the reflection pdf at the remapped roughness
						let thinWallAlpha = vec2f( ${on}( alphaB, surf.ior ) );
						result.pdf += weights.transmission * ( 1.0 - fresnel.reflectProbability ) * ${mt}( wo, wh, thinWallAlpha );

					} else {

						result.pdf += weights.transmission * ( 1.0 - fresnel.reflectProbability ) * ${nn}( wo, wi, wh, alpha, surf.eta );

					}

				}

				// diffuse
				if ( weights.diffuse > 0.0 ) {

					result.pdf += weights.diffuse * ${Kc}( wo, wi, surf.diffuseRoughness );

				}

				//

				// construct the scatter context
				var ctx: ${Vs};
				ctx.V = wo;
				ctx.L = wi;
				ctx.H = wh;
				ctx.VdotH = saturate( dot( wo, wh ) );

				// evaluate the bsdf for the direction
				result.color = ${e}( ctx, surf ) * abs( wi.z );

				// a direction crossing below the surface enters or leaves the volume
				result.isTransmissive = isTransmission && dot( worldWi, surf.faceNormal ) < 0.0;

				return result;

			}

		`,this._bsdfEvalPdfNode}};var ur=new au,Gn=new Wp,Qn=class{constructor(e,t){this.key=t,this.renderer=e,this.texture=null,this.hash=null;let r=new Hp(new Uint8Array([255,255,255,255]),1,1);r.minFilter=su,r.magFilter=su,this.colorTex=r}dispose(){this.colorTex.dispose(),this.texture?.dispose()}setFromScene(e){let{renderer:t,key:r,colorTex:i}=this,s=e[r],n="";if(s)s.isColor?(i.image.data[0]=s.r*255,i.image.data[1]=s.g*255,i.image.data[2]=s.b*255,i.image.data[3]=255,s=i,n=i.image.data.join(),i.needsUpdate=n!==this.hash):s.isCubeTexture?(n=null,s=new Pn(t).generate(s)):(s=s.clone(),n=s.uuid+"_"+s.version);else{let l=t.getClearAlpha();t.getClearColor(Gn),i.image.data[0]=Gn.r*255,i.image.data[1]=Gn.g*255,i.image.data[2]=Gn.b*255,i.image.data[3]=l*255,s=i,n=i.image.data.join(),i.needsUpdate=n!==this.hash}if(n===null)return this.texture?.dispose(),this.texture=s,this.hash=null,!0;{let l=n!==this.hash;return l&&(this.texture?.dispose(),this.texture=s,this.hash=n),l}}},vo=class{get maxBounces(){return this._pathTracer.maxBounces}set maxBounces(e){this._pathTracer.maxBounces=e,this.reset()}get frameBudget(){return this._pathTracer.frameBudget}set frameBudget(e){this._pathTracer.frameBudget=e}get maxTransparentBounces(){return this._pathTracer.maxTransparentBounces}set maxTransparentBounces(e){this._pathTracer.maxTransparentBounces=e,this.reset()}get maxSamples(){return this._pathTracer.maxSamples}set maxSamples(e){this._pathTracer.maxSamples=e,this._denoiser?.reset()}async getSampleCountsAsync(){let e=this._pathTracer,t=this._lastSampleCounts,r=await e.getSampleCountsAsync();t.min=r.min,t.max=r.max,t.avg=r.avg;let i=this.getRenderTime()/1e3;return t.samplesPerSecond=i>0?t.avg/i:0,{...t}}get transmissiveBackground(){return this._transmissiveBackground}set transmissiveBackground(e){this._transmissiveBackground!==e&&(this._transmissiveBackground=e,this._pathTracer.setTransmissiveBackground(e))}get filterGlossyFactor(){return this._filterGlossyFactor}set filterGlossyFactor(e){this._filterGlossyFactor!==e&&(this._filterGlossyFactor=e,this._pathTracer.setFilterGlossy(e))}get multipleImportanceSampling(){return this._multipleImportanceSampling}set multipleImportanceSampling(e){this._multipleImportanceSampling!==e&&this.setMultipleImportanceSampling(e)}get clampDirect(){return this._clampDirect}set clampDirect(e){e=Math.max(0,e),this._clampDirect!==e&&(this._clampDirect=e,this._pathTracer.setClamping(e,this._clampIndirect))}get clampIndirect(){return this._clampIndirect}set clampIndirect(e){e=Math.max(0,e),this._clampIndirect!==e&&(this._clampIndirect=e,this._pathTracer.setClamping(this._clampDirect,e))}get target(){return this._pathTracer.outputTarget??null}get fadeState(){return this._fadeState}get lowResTarget(){return this._lowResTarget}get lowResMode(){return this._pathTracer.lowResMode}get textureAtlas(){return this._bvhData.textureAtlas}useMegakernel(e){let t=this._pathTracer.maxSamples;this._pathTracer.dispose(),this._pathTracer=e?new yn(this._renderer):new Wr(this._renderer),this._pathTracer.maxSamples=t,this._pathTracer.setBVHData(this._bvhData),this._pathTracer.setMaterial(this.material),this._pathTracer.setRandom(this.random),this._pathTracer.setMultipleImportanceSampling(this.multipleImportanceSampling),this._pathTracer.setTransmissiveBackground(this._transmissiveBackground),this._pathTracer.setFilterGlossy(this._filterGlossyFactor),this._pathTracer.setClamping(this._clampDirect,this._clampIndirect),this.setCamera(this.camera),this._pathTracer.setEnvironment(this._environmentCache.texture),this._pathTracer.setBackground(this._backgroundCache.texture),this.updateEnvironment(),this.updateLights()}constructor(e){this._renderer=e,this._timer=new Gp,this._environmentCache=new Qn(e,"environment"),this._backgroundCache=new Qn(e,"background"),this._resetTime=-1,this._fadeState=0,this._lastSampleCounts={min:0,max:0,avg:0,samplesPerSecond:0},this._size=new au,this._blitQuad=new ze(new Mi),this._lowResTarget=new Qp(1,1),this._lowResTarget.type=qp,this._lowResTarget.generateMipmaps=!1,this._pathTracer=new Wr(e),this._denoiser=null,this._upscaler=null,this.minSamples=1,this.renderDelay=500,this.fadeDuration=500,this.dynamicLowRes=!0,this.lowResScale=.1,this.renderScale=1,this.synchronizeRenderSize=!0,this.generateMissingAttributes=!0,this.commonAttributes=["normal","tangent"],this.stableNoise=!0,this.pause=!1,this.filterGlossyFactor=1,this._clampDirect=0,this._clampIndirect=10,this.multipleImportanceSampling=!0,this.transmissiveBackground=Yt,this.random=Ks,this.material=new qn,this._invViewProjectionMatrix=Zp(new Kp),this._cameraRayFnHandle=null,this.setMaterial(this.material),this.setRandom(this.random),this.setScene(new kp,new Up)}setMultipleImportanceSampling(e){this._multipleImportanceSampling=e,this._pathTracer.setMultipleImportanceSampling(e),this.reset()}setDenoiser(e){this._denoiser?.reset(),this._denoiser=e,e&&(e.init(this._renderer),e.setScene(this.scene,this.camera))}setUpscaler(e){this._upscaler=e,e&&e.init(this._renderer)}setScene(e,t){e.updateMatrixWorld(!0),t.updateMatrixWorld(),e.traverse(i=>{this.generateMissingAttributes&&i.geometry?.isBufferGeometry&&kc(i.geometry,this.commonAttributes),i.isSkinnedMesh?(i.boundsTree?i.boundsTree.refit():i.boundsTree=new Ie(i,{strategy:2,targetLeafSize:5,indirect:!0}),i.boundingBox===null&&(i.boundingBox=new Vp),i.boundsTree.getBoundingBox(i.boundingBox)):i.isMesh&&(i.geometry.boundsTree||(i.geometry.boundsTree=new Ee(i.geometry,{strategy:2,targetLeafSize:5})))});let r=new En(e);r.update(),r.textureAtlas.setTextures(this._renderer,r.textures),this._bvhData&&(this._bvhData.dispose(),this._bvhData.textureAtlas.dispose()),this.scene=e,this._bvhData=r,this._pathTracer.setBVHData(r),this.setCamera(t),this.updateEnvironment(),this.updateLights(),this._denoiser?.setScene(e,t)}getMaterial(){return this.material}setMaterial(e){this.material=e,this._pathTracer.setMaterial(e),this.reset()}setRandom(e){this.random=e,this._pathTracer.setRandom(e),this.reset()}setCamera(e){if(this.camera=e,e.getCameraRayFn)this._cameraRayFnHandle=e.getCameraRayFn();else{let t=this._invViewProjectionMatrix;this._cameraRayFnHandle={update:()=>(e.coordinateSystem=Xp,e.updateMatrixWorld(),(e.isOrthographicCamera||e.isPerspectiveCamera)&&e.updateProjectionMatrix(),t.value.multiplyMatrices(e.matrixWorld,e.projectionMatrixInverse),!1),fn:_`
					fn getCameraRay( uv: vec2f, resolution: vec2f, ray: ptr<function, ${$}> ) -> bool {

						let ndc = uv * 2.0 - vec2f( 1.0 );
						*ray = ${Si}( ndc, ${t} );
						return true;

					}
				`}}this._bvhData.fns.getCameraRay=this._cameraRayFnHandle.fn,this._cameraRayFnHandle.update(),this._pathTracer.rebuild(),this.reset()}updateMaterials(){let{_bvhData:e,_renderer:t}=this;e.updateMaterials(),e.textureAtlas.setTextures(t,e.textures),this.reset()}updateTransforms(){this.scene.updateMatrixWorld(!0),this._bvhData.updateTransforms(),this.reset()}updateCamera(){let{_cameraRayFnHandle:e,_pathTracer:t}=this;e.update()&&t.rebuild(),this.reset()}updateEnvironment(){let{_pathTracer:e,scene:t,_environmentCache:r,_backgroundCache:i}=this;r.setFromScene(t)&&e.setEnvironment(r.texture),i.setFromScene(t)&&e.setBackground(i.texture),e.setEnvironmentParams(t.environmentIntensity,t.environmentRotation),e.setBackgroundParams(t.backgroundIntensity,t.backgroundRotation,t.backgroundBlurriness),this.reset()}updateLights(){let{_pathTracer:e,scene:t}=this,r=Ec(t);e.setLights(r),this.reset()}setSize(e,t){(this._size.x!==e||this._size.y!==t)&&(this._size.set(e,t),this.reset())}reset(){this._pathTracer.reset(),this._denoiser?.reset(),this._resetTime=-1,this._fadeState=0,this._timer.update(),this._lastSampleCounts={min:0,max:0,avg:0,samplesPerSecond:0},this.stableNoise&&this._pathTracer.resetSeed()}renderSample(){let e=this._renderer,t=this._size,r=this._blitQuad,i=this._pathTracer,s=this._lowResTarget,n=this._timer,{renderDelay:l,dynamicLowRes:a,synchronizeRenderSize:f,renderScale:c,lowResScale:u,minSamples:d,maxSamples:h}=this;if(n.update(),!this._renderer._initialized)return;this.material.initialized||(this.material.init(e),this.material.initialized=!0);let p=1e3*n.getDelta(),y=this._resetTime===-1;y&&(this._resetTime=0,p=0),this._resetTime+=p;let v=e.getRenderTarget(),T=e.autoClear;if(f){e.getDrawingBufferSize(ur);let C=Math.floor(c*ur.x),D=Math.floor(c*ur.y);this.setSize(C,D)}let{width:m,height:x}=t,g=this._resetTime<l||y&&a&&d!==0;g&&(m=Math.ceil(u*m),x=Math.ceil(u*x)),i.getSize(ur),(ur.x!==m||ur.y!==x)&&(!g&&a&&(s.setSize(Math.ceil(u*m),Math.ceil(u*x)),e.copyTextureToTexture(i.outputTarget,s)),i.setSize(m,x)),!this.pause&&(!g||g&&a)&&(i.lowResMode=g,i.update());let S=this._denoiser,w=this._upscaler,R=!!S&&!S.complete&&!S.running&&h>0;g||((this._fadeState<1&&d>0||R)&&this.getSampleCountsAsync(),this._lastSampleCounts.min>=d&&(this._fadeState+=p/this.fadeDuration,this._fadeState=Math.min(1,this._fadeState)||1));let F=g&&a?1:this._fadeState,I=i.outputTarget;S&&!g&&(R&&this._lastSampleCounts.min>=h&&S.update(i.outputTarget),I=S.texture??I),w&&!g&&(I=w.upscale(I,this.camera),e.setRenderTarget(v)),e.autoClear=a?!0:F===1,r.material.transition=a?F:1,r.material.opacity=a?1:F,r.material.fromTexture=s,r.material.texture=I,r.render(e),e.autoClear=T,e.setRenderTarget(v)}renderDebugBounds(e={}){let{displayTLAS:t=!0,displayBLAS:r=!0,stopAtSurface:i=!1,saturationCount:s=64}=e,n=this._renderer,l=this.camera;if(!n._initialized)return;l.updateMatrixWorld(),(this._debugBoundsQuad===void 0||this._debugBoundsData!==this._bvhData)&&this._buildDebugBoundsQuad();let a=this._debugBoundsUniforms;a.cameraToModelMatrix.value.copy(l.matrixWorld),a.inverseProjectionMatrix.value.copy(l.projectionMatrixInverse),a.displayTLAS.value=t?1:0,a.displayBLAS.value=r?1:0,a.stopAtSurface.value=i?1:0,a.saturationCount.value=s;let f=n.getRenderTarget(),c=n.autoClear,u=n.toneMapping;n.setRenderTarget(null),n.autoClear=!0,n.toneMapping=ou,this._debugBoundsQuad.render(n),n.setRenderTarget(f),n.autoClear=c,n.toneMapping=u}_buildDebugBoundsQuad(){let e=this._bvhData,t=el(e),r=new jp;r.colorNode=t(Jp(Yp())),this._debugBoundsQuad===void 0?this._debugBoundsQuad=new ze(r):(this._debugBoundsQuad.material.dispose(),this._debugBoundsQuad.material=r),this._debugBoundsUniforms=t.uniforms,this._debugBoundsData=e}renderTextureAtlas(e=0){let t=this._renderer;this._atlasDebugQuad||(this._atlasDebugQuad=new ze(new Ln));let r=this._atlasDebugQuad;r.material.texture=this.textureAtlas.texture,r.material.layer=e,t.setRenderTarget(null),r.render(t)}renderSampleDensity(){let e=this._renderer;if(!e._initialized)return;this.getSampleCountsAsync(),this._sampleDensityQuad||(this._sampleDensityQuad=new ze(new zn));let t=e.toneMapping;e.toneMapping=ou;let r=this._sampleDensityQuad;r.material.texture=this._pathTracer.sampleCountTarget,r.material.minCount=this._lastSampleCounts.min,r.material.maxCount=this._lastSampleCounts.max,e.setRenderTarget(null),r.render(e),e.toneMapping=t}dispose(){this._pathTracer.dispose(),this._denoiser?.dispose(),this._upscaler?.dispose(),this._bvhData.dispose(),this._bvhData.textureAtlas.dispose(),this._environmentCache.dispose(),this._backgroundCache.dispose(),this._lowResTarget.dispose(),this._blitQuad.dispose(),this._blitQuad.material.dispose(),this._atlasDebugQuad?.dispose(),this._atlasDebugQuad?.material.dispose(),this._sampleDensityQuad?.dispose(),this._sampleDensityQuad?.material.dispose(),this._debugBoundsQuad!==void 0&&(this._debugBoundsQuad.dispose(),this._debugBoundsQuad.material.dispose())}getRenderTime(){return this._resetTime}};import{ExternalTexture as em,NearestFilter as lu,NoToneMapping as tm,RenderTarget as rm,UnsignedByteType as im}from"three/webgpu";import{diffuseColor as nm,mrt as sm,normalView as om,vec4 as am}from"three/tsl";var yo=class{get texture(){return this._texture}get complete(){return this._complete}get running(){return this._running}constructor(e={}){let{initUNetFromURL:t,auxWeightsUrl:r,colorWeightsUrl:i,useAuxiliaryBuffers:s=!0,maxTileSize:n=null,dynamicTile:l=null}=e;if(!t)throw new Error('OIDNDenoiser: "initUNetFromURL" from "oidn-web" must be provided.');this.initUNetFromURL=t,this.auxWeightsUrl=r,this.colorWeightsUrl=i,this.useAuxiliaryBuffers=s,this.maxTileSize=n,this.dynamicTile=l,this.renderer=null,this.scene=null,this.camera=null,this._texture=null,this._running=!1,this._complete=!1,this._abort=null,this._requestId=0,this._unets={aux:null,color:null},this._resultPipeline=null,this._rawTexture=null,this._auxTarget=null}init(e){this.renderer=e}setScene(e,t){this.scene=e,this.camera=t}update(e){if(this._complete||this._running)return this._texture;let t=null,r=null;if(this.useAuxiliaryBuffers){let i=this._renderAuxiliaryBuffers(e.width,e.height);t=i.textures[0],r=i.textures[1]}return this.denoise(e,t,r),this._texture}async denoise(e,t=null,r=null){if(this._complete||this._running)return;this._running=!0;let i=!!(t&&r),s=++this._requestId,n;try{n=await this._initUNet(i)}catch(d){throw this._running=!1,d}if(s!==this._requestId||!this._running)return;let{renderer:l}=this,a=l.backend;l.initTexture(e);let{width:f,height:c}=e,u={color:{data:a.get(e).texture,width:f,height:c},progress:d=>this._copyOutputToTexture(d,f,c),done:d=>{this._copyOutputToTexture(d,f,c),this._running=!1,this._complete=!0,this._abort=null}};i&&(l.initTexture(t),l.initTexture(r),u.albedo={data:a.get(t).texture,width:f,height:c},u.normal={data:a.get(r).texture,width:f,height:c}),this._abort=n.tileExecute(u)}reset(){this._abort?.(),this._abort=null,this._texture?.dispose(),this._texture=null,this._rawTexture?.destroy(),this._rawTexture=null,this._running=!1,this._complete=!1}dispose(){this.reset(),this._auxTarget?.dispose(),this._auxTarget=null;for(let e in this._unets)this._unets[e]?.then(t=>t.dispose()),this._unets[e]=null}_renderAuxiliaryBuffers(e,t){let{renderer:r,scene:i,camera:s}=this;this._auxTarget||(this._auxTarget=new rm(1,1,{count:2,type:im,minFilter:lu,magFilter:lu,samples:4}),this._auxTarget.textures[0].name="output",this._auxTarget.textures[1].name="normal");let n=this._auxTarget;n.setSize(e,t);let l=r.getRenderTarget(),a=r.getMRT(),f=r.toneMapping;return r.toneMapping=tm,r.setRenderTarget(n),r.setMRT(sm({output:nm,normal:am(om.mul(.5).add(.5),1)})),r.render(i,s),r.setMRT(a),r.setRenderTarget(l),r.toneMapping=f,n}_initUNet(e){let t=e?"aux":"color";return this._unets[t]||(this._unets[t]=(async()=>{let r=this.renderer.backend.device,i=e?this.auxWeightsUrl:this.colorWeightsUrl;if(!i)throw new Error(`OIDNDenoiser: no ${e?"auxWeightsUrl":"colorWeightsUrl"} was provided.`);let s={aux:e,hdr:!0};return this.maxTileSize!==null&&(s.maxTileSize=this.maxTileSize),this.dynamicTile!==null&&(s.dynamicTile=this.dynamicTile),this.initUNetFromURL(i,{device:r,adapterInfo:r.adapterInfo},s)})()),this._unets[t]}_copyOutputToTexture(e,t,r){let i=this.renderer.backend.device;if(!this._resultPipeline){let a=i.createShaderModule({code:`
					@group( 0 ) @binding( 0 ) var<storage, read> src : array<vec4f>;
					@group( 0 ) @binding( 1 ) var dst : texture_storage_2d<rgba16float, write>;

					@compute @workgroup_size( 8, 8 )
					fn main( @builtin( global_invocation_id ) gid : vec3u ) {

						let dims = textureDimensions( dst );
						if ( gid.x >= dims.x || gid.y >= dims.y ) {

							return;

						}

						textureStore( dst, gid.xy, src[ gid.y * dims.x + gid.x ] );

					}
				`});this._resultPipeline=i.createComputePipeline({layout:"auto",compute:{module:a,entryPoint:"main"}})}(!this._rawTexture||this._rawTexture.width!==t||this._rawTexture.height!==r)&&(this._rawTexture?.destroy(),this._rawTexture=i.createTexture({size:[t,r],format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this._texture?.dispose(),this._texture=new em(this._rawTexture),this._texture.image={width:t,height:r});let s=i.createBindGroup({layout:this._resultPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e.data}},{binding:1,resource:this._rawTexture.createView()}]}),n=i.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(this._resultPipeline),l.setBindGroup(0,s),l.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8)),l.end(),i.queue.submit([n.finish()])}};export{yo as OIDNDenoiser,vo as WebGPUPathTracer};
