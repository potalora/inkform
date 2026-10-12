import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../studio/models/',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const geometryDigest=values=>{const bytes=Buffer.alloc(values.length*8);values.forEach((v,i)=>bytes.writeDoubleLE(v,i*8));return digest(bytes);};
const atlasDimensions=async name=>{
 const bytes=await readFile(new URL(name,root));
 if(bytes.readUInt32BE(0)===0x89504e47)return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
 assert.equal(bytes.readUInt16BE(0),0xffd8,'JPEG header');
 for(let offset=2;offset<bytes.length;){
  assert.equal(bytes[offset++],0xff);let marker=bytes[offset++];while(marker===0xff)marker=bytes[offset++];
  const length=bytes.readUInt16BE(offset);
  if([0xc0,0xc1,0xc2].includes(marker))return [bytes.readUInt16BE(offset+5),bytes.readUInt16BE(offset+3)];
  offset+=length;
 }
 throw Error('No JPEG dimensions');
};

test('all six released body geometries retain their pre-detail face ordering and attributes',async()=>{
 const manifest=await read('body-detail-provenance.json');assert.equal(Object.keys(manifest.bodies).length,6);
 for(const [name,entry] of Object.entries(manifest.bodies)){
  const body=await read(name);assert.equal(body.indices.length/3,entry.faceCount);
  assert.equal(entry.faceIndexAndBarycentricCompatible,true);
  for(const [key,hash] of Object.entries(entry.retainedGeometrySHA256))assert.equal(geometryDigest(body[key]),hash,name+' '+key);
 }
});

test('Blender normals recover pinned source multires detail on the identical released atlas',async()=>{
 const provenance=await read('blender-studio/provenance.json'),bake=provenance.normalDetailBake;
 assert.equal(bake.sourceBlendSHA256,provenance.sourceBlendSHA256);assert.equal(bake.device,'CPU');
 for(const anatomy of ['male','female']){
  const body=await read('blender-studio/'+anatomy+'.json'),spec=bake.bodies[anatomy];
  assert.equal(spec.bakeUVMatchesReleasedAtlas,true);assert.equal(spec.sourceLevel,1);assert.equal(spec.sculptLevel,3);
  assert.equal(body.metadata.normalScale,.75);
  for(const [key,hash] of Object.entries(spec.retainedGeometrySHA256))assert.equal(geometryDigest(body[key]),hash);
  for(const [key,size] of [['normalTexture',2048],['normalTextureHigh',4096]]){
   const name=body.metadata[key],entry=provenance.files[name],bytes=await readFile(new URL('blender-studio/'+name,root));
   assert.deepEqual(await atlasDimensions('blender-studio/'+name),[size,size]);assert.equal(bytes.length,entry.bytes);assert.equal(digest(bytes),entry.sha256);
  }
 }
});

test('Atelier high delivery adds real source resolution while retaining a 2K height map and bounded payload',async()=>{
 const provenance=await read('atelier/provenance.json');assert.equal(provenance.textureDetailUpgrade.faceIndexAndBarycentricCompatible,true);
 assert.deepEqual(await atlasDimensions('atelier/skin-clean-4k.jpg'),[4096,4096]);
 assert.deepEqual(await atlasDimensions('atelier/skin-clean.png'),[2048,2048]);assert.deepEqual(await atlasDimensions('atelier/skin-height.png'),[2048,2048]);
 for(const anatomy of ['male','female']){
  const body=await read('atelier/'+anatomy+'.json');assert.equal(body.metadata.skinTextureHigh,'./models/atelier/skin-clean-4k.jpg');assert.equal(body.metadata.heightTextureHigh,undefined);
 }
 const bytes=await readFile(new URL('atelier/skin-clean-4k.jpg',root));assert.ok(bytes.length<2_000_000);assert.equal(digest(bytes),provenance.files['skin-clean-4k.jpg'].sha256);
});

test('MakeHuman source detail remains anatomy appropriate and existing skin tone textures are retained',async()=>{
 const male=await read('human.json'),female=await read('female.json');assert.equal(male.metadata.normalScale,.32);
 assert.equal(female.metadata.normalTexture,undefined);assert.equal(female.metadata.normalTextureHigh,undefined);
 assert.equal(male.metadata.skinTexture,'./models/source/young_lightskinned_male_diffuse.png');assert.equal(female.metadata.skinTexture,'./models/source/young_lightskinned_female_diffuse.png');
});

test('Blender smooth shading stays continuous across duplicate UV island vertices',async()=>{
 for(const anatomy of ['male','female']){
  const body=await read('blender-studio/'+anatomy+'.json'),groups=new Map();let duplicates=0;
  for(let vertex=0;vertex<body.positions.length/3;vertex++){
   const key=body.positions.slice(vertex*3,vertex*3+3).join(','),normal=body.normals.slice(vertex*3,vertex*3+3);
   assert.ok(Math.abs(Math.hypot(...normal)-1)<2e-7);
   if(groups.has(key)){assert.deepEqual(normal,groups.get(key));duplicates++;}else groups.set(key,normal);
  }
  assert.ok(duplicates>20_000,'test includes real atlas seam duplicates');
 }
});
