import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three/webgpu';

// Match the browser import map while executing the saved production module.
// Geometry, node materials, scene membership and disposal are actual Three APIs;
// fetch and decoded textures are the CPU-only asset boundary.
const source=(await readFile(new URL('../studio/body-loader.js',import.meta.url),'utf8'))
 .replace("from 'three'",`from '${import.meta.resolve('three/webgpu')}'`)
 .replace("from './model-catalog.js'",`from '${new URL('../studio/model-catalog.js',import.meta.url).href}'`);
const {createBodyLibrary,bodyTextureDetail,isMannequinAccessory}=await import(`data:text/javascript;base64,${Buffer.from(source+'\n//# sourceURL=body-loader-node-test.mjs').toString('base64')}`);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function meshData(metadata={},accessories=[]){return {positions:[0,0,0,1,0,0,0,1,0],indices:[0,1,2],uvs:[0,0,1,0,0,1],anatomicalWeights:Array(15).fill(0),clothingMask:[0,0,0],metadata,accessories};}
function fixture({legacy=false,accessory=true,fetchHook,textureHook,registerHook,releaseHook,textureDetail='auto'}={}){
 const root=legacy?'./models/':'./models/atelier/',model=legacy?'makehuman-v1':'atelier-v1',anatomy='male';
 const bodyPath=legacy?root+'human.json':root+'male.json';
 const metadata=legacy?{eyes:'./models/eyes.json',eyeTexture:'./models/source/eye.png',skinTexture:'./models/source/skin.png'}:{skinTexture:'skin.png',normalTexture:'normal.png',heightTexture:'height.png'};
 const descriptors=accessory&&!legacy?[{kind:'eyes',file:'eyes.json',optionalTexture:'eyes.png',doubleSided:true}]:[];
 const spec={positions:'male-shape.f32',vertexCount:3,endpoints:Array.from({length:9},()=>({landmarks:{}})),...(legacy?{eyes:'male-eyes.f32'}:{accessories:{eyes:{positions:'eyes-shape.f32'}}})};
 const assets=new Map([[bodyPath,meshData(metadata,descriptors)],[root+'shapes.json',{bodies:{male:spec}}],[root+'male-shape.f32',new Float32Array(81)],[root+'eyes.json',meshData()],[root+'eyes-shape.f32',new Float32Array(81)],['./models/eyes.json',meshData()],['./models/male-eyes.f32',new Float32Array(81)]]);
 const fetches=[],texturePaths=[],textures=[],registrations=[],scene=new THREE.Scene(),skin=new THREE.MeshSSSNodeMaterial();
 const fetcher=async path=>{fetches.push(path);await fetchHook?.(path,assets);const asset=assets.get(path);return {ok:asset!==undefined,json:async()=>structuredClone(asset),arrayBuffer:async()=>asset.slice().buffer};};
 const loader={async loadAsync(path){texturePaths.push(path);await textureHook?.(path);const texture=new THREE.Texture();textures.push(texture);return texture;}};
 const released=[];
 const surface={async setBody(body){registrations.push(body);await registerHook?.(body);},async releaseBody(id){released.push(id);await releaseHook?.(id);}};
 const library=createBodyLibrary({scene,skin,loader,surface,fetcher,textureDetail});
 return {library,scene,skin,model,anatomy,root,bodyPath,assets,fetches,texturePaths,textures,registrations,released};
}
function watch(resources){const disposed=new Map();for(const resource of resources){disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1));}return disposed;}
function bodyResources(body){return [body.geometry,body.referenceMesh.geometry,body.referenceMesh.material,body.texture,body.normalTexture,body.heightTexture,...body.accessories.flatMap(a=>[a.geometry,a.mesh.material,a.mesh.material.map])].filter(Boolean);}

test('body identity loads only requested paths and shares an in-flight and completed model',async()=>{
 const gate=deferred(),f=fixture({fetchHook:async path=>{if(path==='./models/atelier/male.json')await gate.promise;}});
 const first=f.library.load(f.model,f.anatomy),second=f.library.load({bodyModelId:f.model},f.anatomy);await tick();
 assert.equal(f.fetches.filter(path=>path===f.bodyPath).length,1);gate.resolve();const [a,b]=await Promise.all([first,second]);
 assert.equal(a,b);assert.equal(a.id,'atelier-v1:male');assert.equal(a.modelId,'atelier-v1');assert.equal(a.anatomy,'male');assert.equal(await f.library.load(f.model,'male'),a);
 assert.deepEqual(f.fetches.sort(),['./models/atelier/eyes-shape.f32','./models/atelier/eyes.json','./models/atelier/male-shape.f32','./models/atelier/male.json','./models/atelier/shapes.json']);
 assert.deepEqual(f.texturePaths,['./models/atelier/skin.png','./models/atelier/normal.png','./models/atelier/height.png','./models/atelier/eyes.png']);
 assert.equal(f.registrations.length,1);assert.equal(f.registrations[0].id,a.id);assert.deepEqual([...f.registrations[0].indices],[0,1,2]);
 assert.equal(f.library.loaded.length,1);assert.equal(f.scene.children.length,2);assert.equal(a.mesh.visible,false);assert.equal(a.accessories[0].mesh.visible,false);assert.equal(a.accessories[0].mesh.material.isMeshPhysicalNodeMaterial,true);f.library.dispose();
});

test('unversioned model resolves original full-path eyes and textures without doubled roots',async()=>{
 const f=fixture({legacy:true}),body=await f.library.load({},'male');
 assert.equal(body.id,'makehuman-v1:male');assert.deepEqual(f.fetches.sort(),['./models/eyes.json','./models/human.json','./models/male-eyes.f32','./models/male-shape.f32','./models/shapes.json']);
 assert.deepEqual(f.texturePaths,['./models/source/skin.png','./models/source/eye.png']);assert.equal(body.accessories[0].descriptor.kind,'eyes');assert.equal(body.accessories[0].shapeGrid.length,81);f.library.dispose();
});

test('unknown identity fails before fetching or registering geometry',async()=>{
 const f=fixture();await assert.rejects(f.library.load('unknown-v9','male'),/Unsupported body model/);assert.deepEqual(f.fetches,[]);assert.deepEqual(f.registrations,[]);assert.equal(f.scene.children.length,0);f.library.dispose();
});

test('static reference loads its real geometry without a fabricated shape grid',async()=>{
 const f=fixture({accessory:false}),spec=f.assets.get(f.root+'shapes.json').bodies.male;
 spec.static=true;delete spec.positions;
 const body=await f.library.load(f.model,f.anatomy);
 assert.equal(body.static,true);assert.equal(body.shapeGrid,undefined);
 assert.ok(f.fetches.every(path=>!path.endsWith('.f32')));
 assert.deepEqual([...body.base],f.assets.get(f.bodyPath).positions);
 assert.equal(f.registrations.length,1);f.library.dispose();
});

test('static mesh keeps authored smooth normals and independent skin UVs across tattoo atlas seams',async()=>{
 const f=fixture({accessory:false}),data=f.assets.get(f.bodyPath);
 f.assets.get(f.root+'shapes.json').bodies.male.static=true;
 data.normals=[0,.6,.8,0,.6,.8,0,.6,.8];data.sourceUVs=[.2,.3,.4,.3,.2,.7];
 const body=await f.library.load(f.model,f.anatomy);
 for(const geometry of [body.geometry,body.referenceMesh.geometry]){
  assert.deepEqual([...geometry.attributes.normal.array],[...new Float32Array(data.normals)]);
  assert.deepEqual([...geometry.attributes.sourceUV.array],[...new Float32Array(data.sourceUVs)]);
  assert.deepEqual([...geometry.attributes.uv.array],data.uvs);
 }
 f.library.dispose();
});

test('disposal releases owned geometry materials and textures once while retaining shared skin ownership',async()=>{
 const f=fixture(),body=await f.library.load(f.model,'male'),resources=watch([...bodyResources(body),f.skin]);f.library.dispose();f.library.dispose();
 for(const [resource,count] of resources)assert.equal(count,resource===f.skin?0:1,resource.type||resource.constructor.name);
 assert.deepEqual(f.library.loaded,[]);assert.deepEqual(f.scene.children,[]);
});

test('disposed library rejects cached and uncached loads without fetching or returning released geometry',async()=>{
 const f=fixture();await f.library.load(f.model,'male');f.library.dispose();const count=f.fetches.length;
 await assert.rejects(f.library.load(f.model,'male'),/closed|disposed/i);await assert.rejects(f.library.load('makehuman-v1','female'),/closed|disposed/i);assert.equal(f.fetches.length,count);assert.deepEqual(f.library.loaded,[]);
});

test('partial failure releases geometry and textures and permits an explicit retry',async()=>{
 let failed=false,textures;const f=fixture({textureHook:async path=>{if(path.endsWith('/eyes.png')&&!failed){failed=true;textures=watch(f.textures);throw Error('Image decode failed');}}});
 const geometries=new Map(),original=THREE.BufferGeometry.prototype.computeVertexNormals;
 THREE.BufferGeometry.prototype.computeVertexNormals=function(...args){geometries.set(this,0);this.addEventListener('dispose',()=>geometries.set(this,geometries.get(this)+1));return original.apply(this,args);};
 try{
  f.skin.addEventListener('dispose',()=>assert.fail('Shared skin must survive failed loading'));
  await assert.rejects(f.library.load(f.model,'male'),/Image decode failed/);
  assert.equal(textures.size,3);for(const count of textures.values())assert.equal(count,1);assert.equal(geometries.size,3);for(const count of geometries.values())assert.equal(count,1);
  assert.equal(f.scene.children.length,0);assert.equal(f.library.loaded.length,0);assert.equal(f.registrations.length,0);
  const body=await f.library.load(f.model,'male');assert.equal(body.id,'atelier-v1:male');assert.equal(f.fetches.filter(path=>path===f.bodyPath).length,2);assert.equal(f.registrations.length,1);f.library.dispose();
 }finally{THREE.BufferGeometry.prototype.computeVertexNormals=original;}
});

test('malformed shape metadata fails before allocating mesh geometry and remains retryable',async()=>{
 const f=fixture(),shapes=f.assets.get(f.root+'shapes.json'),original=structuredClone(shapes);shapes.bodies.male.vertexCount=4;
 await assert.rejects(f.library.load(f.model,'male'),/proportions do not match/);assert.equal(f.texturePaths.length,0);assert.equal(f.registrations.length,0);assert.equal(f.fetches.length,2);
 f.assets.set(f.root+'shapes.json',original);await f.library.load(f.model,'male');assert.equal(f.registrations.length,1);f.library.dispose();
});

test('malformed and non-finite shape grids reject without registering and recover when replaced',async()=>{
 for(const bad of [new Float32Array(80),Float32Array.from({length:81},(_,i)=>i===3?NaN:0)]){
  const f=fixture({accessory:false});f.assets.set(f.root+'male-shape.f32',bad);
  await assert.rejects(f.library.load(f.model,'male'),/proportions do not match/);assert.equal(f.scene.children.length,0);assert.equal(f.registrations.length,0);
  f.assets.set(f.root+'male-shape.f32',new Float32Array(81));await f.library.load(f.model,'male');assert.equal(f.registrations.length,1);f.library.dispose();
 }
});

test('closing during worker registration releases in-flight resources without publishing body',async()=>{
 const entered=deferred(),gate=deferred(),f=fixture({registerHook:async()=>{entered.resolve();await gate.promise;}}),loading=f.library.load(f.model,'male');await entered.promise;
 const resources=watch(f.textures);f.library.dispose();gate.resolve();await assert.rejects(loading,/closed/i);
 assert.equal(f.scene.children.length,0);assert.equal(f.library.loaded.length,0);for(const count of resources.values())assert.equal(count,1);
});

test('texture delivery uses source high detail on desktop and bounded standard maps on compact devices',async()=>{
 assert.equal(bodyTextureDetail('auto',true),'standard');assert.equal(bodyTextureDetail('auto',false),'high');
 assert.equal(bodyTextureDetail('standard',false),'standard');assert.equal(bodyTextureDetail('high',true),'high');
 for(const detail of ['standard','high']){
  const f=fixture({accessory:false,textureDetail:detail});f.assets.get(f.bodyPath).metadata.skinTextureHigh='skin-4k.jpg';
  const body=await f.library.load(f.model,'male');
  assert.equal(f.texturePaths[0],f.root+(detail==='high'?'skin-4k.jpg':'skin.png'));
  assert.equal(body.texture.anisotropy,4);assert.equal(body.texture.colorSpace,THREE.SRGBColorSpace);
  assert.equal(body.heightTexture.colorSpace,THREE.NoColorSpace);f.library.dispose();
 }
});

test('switching anatomies shares common decoded maps and disposes them once',async()=>{
 const gate=deferred(),f=fixture({accessory:false,textureHook:async path=>{if(path.endsWith('/skin.png'))await gate.promise;}});
 f.assets.get(f.root+'shapes.json').bodies.female=structuredClone(f.assets.get(f.root+'shapes.json').bodies.male);
 f.assets.set(f.root+'female.json',structuredClone(f.assets.get(f.bodyPath)));
 const tasks=[f.library.load(f.model,'male'),f.library.load(f.model,'female')];await tick();gate.resolve();
 const [male,female]=await Promise.all(tasks);
 assert.equal(male.texture,female.texture);assert.equal(male.normalTexture,female.normalTexture);assert.equal(male.heightTexture,female.heightTexture);
 assert.equal(f.texturePaths.length,3);const watched=watch(f.textures);f.library.dispose();
 for(const count of watched.values())assert.equal(count,1);
});

test('failed anatomy loading cannot dispose skin maps owned by an already loaded body',async()=>{
 const f=fixture({accessory:false,textureHook:async path=>{if(path.endsWith('/eyes.png'))throw Error('Eye unavailable');}});
 const male=await f.library.load(f.model,'male'),watched=watch(f.textures);
 f.assets.get(f.root+'shapes.json').bodies.female=structuredClone(f.assets.get(f.root+'shapes.json').bodies.male);
 const female=structuredClone(f.assets.get(f.bodyPath));female.accessories=[{kind:'eyes',file:'eyes.json',optionalTexture:'eyes.png'}];f.assets.set(f.root+'female.json',female);
 await assert.rejects(f.library.load(f.model,'female'),/Eye unavailable/);
 assert.equal(f.library.loaded.length,1);assert.equal(f.library.loaded[0],male);
 for(const count of watched.values())assert.equal(count,0);f.library.dispose();
 for(const count of watched.values())assert.equal(count,1);
});

function addFemale(f){f.assets.get(f.root+'shapes.json').bodies.female=structuredClone(f.assets.get(f.root+'shapes.json').bodies.male);f.assets.set(f.root+'female.json',structuredClone(f.assets.get(f.bodyPath)));}
test('trim retains only active anatomy, releases worker geometry and can reload evicted study identity',async()=>{
 const f=fixture({accessory:false});addFemale(f);const male=await f.library.load(f.model,'male'),female=await f.library.load(f.model,'female');
 const oldGeometry=watch([male.geometry,male.referenceMesh.geometry]),maps=watch(f.textures);
 await f.library.trim(female.id);assert.deepEqual(f.library.loaded,[female]);assert.deepEqual(f.released,[male.id]);assert.equal(f.scene.children.length,1);
 for(const count of oldGeometry.values())assert.equal(count,1);for(const count of maps.values())assert.equal(count,0);
 const restored=await f.library.load(f.model,'male');assert.notEqual(restored,male);assert.deepEqual([...restored.geometry.index.array],[...male.geometry.index.array]);
 assert.equal(restored.texture,female.texture);assert.equal(f.registrations.length,3);await f.library.trim(restored.id);assert.deepEqual(f.library.loaded,[restored]);
 f.library.dispose();for(const count of maps.values())assert.equal(count,1);
});

test('trim cannot dispose a cached body after a newer body request begins',async()=>{
 const f=fixture({accessory:false});addFemale(f);const male=await f.library.load(f.model,'male'),female=await f.library.load(f.model,'female');
 await f.library.load(f.model,'male');await f.library.trim(female.id);assert.equal(f.library.loaded.length,2);assert.deepEqual(f.released,[]);
 await assert.rejects(f.library.trim('unknown'),/must be loaded/);assert.equal(f.library.loaded.length,2);f.library.dispose();
});

test('reloading during an awaited trim creates a fresh body and survives old resource disposal',async()=>{
 const gate=deferred(),entered=deferred(),f=fixture({accessory:false,releaseHook:async()=>{entered.resolve();await gate.promise;}});addFemale(f);
 const male=await f.library.load(f.model,'male'),female=await f.library.load(f.model,'female'),old=watch([male.geometry]),trim=f.library.trim(female.id);
 await entered.promise;const fresh=await f.library.load(f.model,'male'),resources=watch([fresh.geometry,fresh.texture]);gate.resolve();await trim;
 assert.notEqual(fresh,male);assert.equal(old.get(male.geometry),1);for(const count of resources.values())assert.equal(count,0);
 assert.ok(f.library.loaded.includes(fresh));f.library.dispose();for(const count of resources.values())assert.equal(count,1);
});


test('mannequin accessory policy keeps facial context and excludes hair and garments',()=>{
 for(const kind of ['eyes','iris','cornea','brows','eyebrows','lashes'])assert.equal(isMannequinAccessory({kind}),true,kind);
 for(const kind of ['hair','scalp','tank','shorts','underwear','shirt','pants'])assert.equal(isMannequinAccessory({kind}),false,kind);
 assert.equal(isMannequinAccessory({kind:'custom',hideWithClothing:true}),false);
 assert.equal(isMannequinAccessory({kind:'custom',hideWithHair:true}),false);
});

test('actual supported references load clean anatomy without hair or garment assets and preserve source data',async()=>{
 const {BODY_MODELS}=await import('../studio/model-catalog.js');
 for(const catalog of Object.values(BODY_MODELS))for(const anatomy of Object.keys(catalog.bodyFiles)){
  const fetches=[],texturePaths=[],sourceData=new Map(),sourceSnapshots=new Map(),scene=new THREE.Scene();
  const fetcher=async path=>{
   fetches.push(path);const bytes=await readFile(new URL('../studio/'+path.replace(/^\.\//,''),import.meta.url));
   return {ok:true,json:async()=>{const data=JSON.parse(bytes);sourceData.set(path,data);sourceSnapshots.set(path,JSON.stringify(data));return data;},arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  const library=createBodyLibrary({scene,skin:new THREE.MeshSSSNodeMaterial(),surface:{async setBody(){}},fetcher,loader:{async loadAsync(path){texturePaths.push(path);return new THREE.Texture();}}});
  try{
   const body=await library.load(catalog.id,anatomy),data=sourceData.get(catalog.bodyFiles[anatomy]);
   const excluded=(data.accessories||[]).filter(descriptor=>!isMannequinAccessory(descriptor));
   const allowed=(data.accessories||[]).filter(isMannequinAccessory).map(d=>d.kind);
   if(data.metadata?.eyes)allowed.push('eyes');
   assert.deepEqual(body.accessories.map(a=>a.descriptor.kind),allowed,body.id);
   const resolve=path=>path.startsWith('./')||path.startsWith('/')?path:catalog.basePath+path;
   for(const descriptor of excluded){
    assert.ok(!fetches.includes(resolve(descriptor.file)),descriptor.file);
    if(descriptor.optionalTexture)assert.ok(!texturePaths.includes(resolve(descriptor.optionalTexture)),descriptor.optionalTexture);
    const spec=sourceData.get(catalog.shapes).bodies[anatomy].accessories?.[descriptor.kind];
    if(spec?.positions)assert.ok(!fetches.includes(catalog.basePath+spec.positions),spec.positions);
   }
   assert.deepEqual([...body.geometry.index.array],data.indices,body.id+' topology');
   assert.deepEqual([...body.geometry.attributes.clothingMask.array],[...new Float32Array(data.clothingMask||data.positions.length/3)],body.id+' authored coverage data');
   assert.deepEqual([...body.base],[...new Float32Array(data.positions)],body.id+' base surface');
   for(const [path,original] of sourceSnapshots)assert.equal(JSON.stringify(sourceData.get(path)),original,path+' remains unchanged');
   assert.equal(scene.children.length,1+allowed.length);
  }finally{library.dispose();}
 }
});
