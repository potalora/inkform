import * as THREE from 'three';

export const OIDN_MODEL_SHA256='e586ef2ff48d7fbb7611986405220ed8fc5c13ca79bfc40be4dc742fbf959e1a';

export function createGuideCamera(camera){
 // Preserve projection winding: mirroring the projection changes raster
 // culling and faceDirection normals. Row orientation is corrected afterward.
 return camera.clone();
}

/** Adapt upstream asynchronous failure/cancellation to a bounded still request. */
export function createGuidedDenoiser(OIDNDenoiser,initUNetFromURL){
 let denoiser;
 class GuidedDenoiser extends OIDNDenoiser{
  constructor(){
   super({auxWeightsUrl:new URL('./vendor/rt_hdr_alb_nrm.tza',import.meta.url).href,maxTileSize:432,dynamicTile:false,
    initUNetFromURL:async(...args)=>{
     const unet=await initUNetFromURL(...args);
     return {dispose:()=>unet.dispose(),tileExecute:inputs=>{
      const token=denoiser._requestId,current=()=>token===denoiser._requestId;
      return unet.tileExecute({...inputs,scheduling:'animation-frame',
       progress:output=>{if(current())inputs.progress?.(output);},
       done:output=>{if(current())inputs.done?.(output);},
       error:error=>{if(current())denoiser.fail(error);}
      });
     }};
    }});
   this.error=null;
  }
  fail(error){this.error=error;this.reset();}
  async denoise(...args){try{await super.denoise(...args);}catch(error){this.fail(error);}}
  reset(){this._requestId++;super.reset();}
  dispose(){
   // Upstream chains .then(dispose) without a rejection handler. A missing
   // model must remain a recoverable raw-image result during cleanup too.
   const networks=this._unets;this._unets={};super.dispose();
   this._flippedGuides?.textures.forEach(texture=>texture.dispose());this._flippedGuides=null;
   for(const network of Object.values(networks))network?.then(unet=>unet.dispose()).catch(()=>{});
  }
  _renderAuxiliaryBuffers(width,height){
   const camera=this.camera,renderer=this.renderer;
   const previous={target:renderer.getRenderTarget(),mrt:renderer.getMRT(),toneMapping:renderer.toneMapping};
   this.camera=createGuideCamera(camera);
   try{return this._flipGuides(super._renderAuxiliaryBuffers(width,height),width,height);}finally{
    this.camera=camera;renderer.setMRT(previous.mrt);renderer.setRenderTarget(previous.target);renderer.toneMapping=previous.toneMapping;
   }
  }
  _flipGuides(target,width,height){
   const renderer=this.renderer,backend=renderer.backend,device=backend.device;
   if(!this._guideFlipPipeline){
    const module=device.createShaderModule({code:`
     @group(0) @binding(0) var albedo: texture_2d<f32>;
     @group(0) @binding(1) var normal: texture_2d<f32>;
     @group(0) @binding(2) var outAlbedo: texture_storage_2d<rgba8unorm,write>;
     @group(0) @binding(3) var outNormal: texture_storage_2d<rgba8unorm,write>;
     @compute @workgroup_size(8,8)
     fn main(@builtin(global_invocation_id) gid:vec3u){
      let dims=textureDimensions(albedo);if(gid.x>=dims.x||gid.y>=dims.y){return;}
      let src=vec2i(i32(gid.x),i32(dims.y-1u-gid.y));
      textureStore(outAlbedo,gid.xy,textureLoad(albedo,src,0));
      textureStore(outNormal,gid.xy,textureLoad(normal,src,0));
     }`});
    this._guideFlipPipeline=device.createComputePipeline({layout:'auto',compute:{module,entryPoint:'main'}});
   }
   if(!this._flippedGuides||this._flippedGuides.width!==width||this._flippedGuides.height!==height){
    this._flippedGuides?.textures.forEach(texture=>texture.dispose());
    const textures=[0,1].map(()=>{const texture=new THREE.StorageTexture(width,height);texture.type=THREE.UnsignedByteType;texture.generateMipmaps=false;texture.minFilter=THREE.NearestFilter;texture.magFilter=THREE.NearestFilter;renderer.initTexture(texture);return texture;});
    this._flippedGuides={width,height,textures};
   }
   const textures=[...target.textures,...this._flippedGuides.textures];textures.forEach(texture=>renderer.initTexture(texture));
   const bindGroup=device.createBindGroup({layout:this._guideFlipPipeline.getBindGroupLayout(0),entries:textures.map((texture,binding)=>({binding,resource:backend.get(texture).texture.createView({baseMipLevel:0,mipLevelCount:1})}))});
   const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(this._guideFlipPipeline);pass.setBindGroup(0,bindGroup);pass.dispatchWorkgroups(Math.ceil(width/8),Math.ceil(height/8));pass.end();device.queue.submit([encoder.finish()]);
   return this._flippedGuides;
  }
 }
 denoiser=new GuidedDenoiser();return denoiser;
}

export async function verifiedOIDNLoader(url,backend,options){
 const response=await fetch(url);if(!response.ok)throw Error(`Local denoiser weights unavailable (${response.status}).`);
 const weights=await response.arrayBuffer();
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',weights))].map(b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==OIDN_MODEL_SHA256)throw Error('Local denoiser weights failed integrity verification.');
 const {initUNetFromBuffer}=await import('./vendor/oidn.js');
 return initUNetFromBuffer(weights,backend,options);
}
