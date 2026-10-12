import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkspace, validateAsset, validateBackup, validateStorageTotals, preflightRaster} from '../studio/workspace-validation.js';
import {STORAGE_LIMITS} from '../studio/storage-limits.js';
import {project, addTattoo} from '../studio/model.js';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const image = overrides => ({id: 'image', name: 'Design', width: 1, height: 1, createdAt: '2026-10-11T12:00:00Z', dataUrl: PNG, ...overrides});
const browser = {decodeImage: async () => ({width: 1, height: 1})};
const workspace = () => {const p = project(); return {projects: [p], activeProjectId: p.id};};

test('documented limits are exact and legacy project models remain accepted', () => {
  assert.deepEqual(STORAGE_LIMITS, {maxProjects: 100, maxLayers: 16, maxAssets: 500, maxImageBytes: 20 * 1024 ** 2, maxDecodedPixels: 16_777_216, maxArtworkBytes: 96 * 1024 ** 2, maxProjectJsonBytes: 8 * 1024 ** 2, maxProjectBytes: 2 * 1024 ** 2, maxRestoreBytes: 160 * 1024 ** 2});
  const value = workspace(); delete value.projects[0].body.bodyModelId;
  assert.deepEqual(validateWorkspace(value, new Set()).projects, value.projects);
});

test('workspace validates model contracts, references, placements, and finite JSON before persistence', () => {
  for (const mutate of [
    v => {v.projects[0].body.bodyModelId = 'unknown';},
    v => {v.projects[0].body.extra = 1;},
    v => {v.activeProjectId = 'missing';},
    v => {v.projects[0].updatedAt = 'not a date';},
    v => {v.projects[0].extra = NaN;},
    v => {v.projects[0].extra = {uploadedAssetId: 'missing'};},
    v => {v.projects.push(structuredClone(v.projects[0]));},
    v => {v.projects[0].camera = {position: [0,0,0], target: [0,0,0]};},
  ]) {const value = workspace(); mutate(value); assert.throws(() => validateWorkspace(value, new Set()));}
  const value = workspace(); const layer = addTattoo(value.projects[0], {id: 'image', name: 'Design'});
  layer.placement = {faceIndex: 107024, barycentric: [1,0,0]};
  assert.throws(() => validateWorkspace(value, new Set(['image'])), /placement face/);
  layer.placement.faceIndex = 0;
  assert.doesNotThrow(() => validateWorkspace(value, new Set(['image'])));
  layer.placement.barycentric = [1,1,0];
  assert.throws(() => validateWorkspace(value, new Set(['image'])), /barycentric/);
});

test('project, layer, per-project and aggregate JSON limits reject without truncation', () => {
  let value = workspace(); value.projects = Array.from({length: 101}, (_, i) => ({...project(), id: 'p' + i}));
  assert.throws(() => validateWorkspace(value, new Set()), /100/);
  value = workspace(); for (let i = 0; i < 16; i++) addTattoo(value.projects[0], {id: 'image', name: 'Design'});
  value.projects[0].tattoos.push({...value.projects[0].tattoos[0], id: 'extra'});
  assert.throws(() => validateWorkspace(value, new Set(['image'])), /16/);
  value = workspace(); value.projects[0].extra = 'a'.repeat(2 * 1024 ** 2);
  assert.throws(() => validateWorkspace(value, new Set()), /2 MB/);
  value = workspace(); value.projects = Array.from({length: 9}, () => ({...project(), extra: 'a'.repeat(1024 ** 2)})); value.activeProjectId = null;
  assert.throws(() => validateWorkspace(value, new Set()), /8 MiB/);
});

test('assets use trusted bytes and real decoder dimensions, never imported URLs', async () => {
  const result = await validateAsset(image({url: 'https://example.invalid/private.png'}), {keepId: true, browser});
  assert.equal(result.blob.type, 'image/png'); assert.equal(result.blob.size, 68); assert.equal(result.url, undefined);
  assert.equal(result.id, 'image'); assert.equal(result.mime, 'image/png');
  await assert.rejects(validateAsset(image(), {keepId: true, browser: {decodeImage: async () => {throw Error('corrupt');}}}), /decode|valid image/i);
  await assert.rejects(validateAsset(image(), {keepId: true, browser: {decodeImage: async () => ({width: 2, height: 1})}}), /dimensions/);
});

test('bad base64, MIME signatures, claimed dimensions, oversized headers and encoded data fail before decode', async () => {
  let decodes = 0; const options = {keepId: true, browser: {decodeImage: async () => {decodes++; return {width: 1,height: 1};}}};
  for (const value of [image({dataUrl: PNG.replace('png', 'jpeg')}), image({dataUrl: 'data:image/png;base64,!!!!'}), image({dataUrl: 'data:image/png;base64,a==='}), image({width: 2}), image({width: true}), image({legacyWhite: 'yes'}), image({dataUrl: 'data:image/png;base64,' + 'A'.repeat(28 * 1024 ** 2)})]) await assert.rejects(validateAsset(value, options));
  const bytes = Uint8Array.from(atob(PNG.split(',')[1]), c => c.charCodeAt(0)); const view = new DataView(bytes.buffer); view.setUint32(16, 4097); view.setUint32(20,4096);
  await assert.rejects(validateAsset(image({width: 4097, height: 4096, dataUrl: 'data:image/png;base64,' + btoa(String.fromCharCode(...bytes))}), options), /pixels/);
  assert.equal(decodes, 0);
});

test('version 3 backups reject duplicate assets, missing references and excessive assets before commit', async () => {
  const value = {...workspace(), version: 3, assets: [image()]}; addTattoo(value.projects[0], {id: 'image', name:'Design'});
  const result = await validateBackup(value, {browser}); assert.equal(result.assets.length, 1);
  await assert.rejects(validateBackup({...value,version:2}, {browser}), /version 3/);
  await assert.rejects(validateBackup({...value,assets:[image(),image()]}, {browser}), /Duplicate asset/);
  await assert.rejects(validateBackup({...value,assets:[]}, {browser}), /Unknown tattoo asset/);
  await assert.rejects(validateBackup({...value,assets:Array(501).fill(image())}, {browser}), /500/);
});

test('invalid calendar dates are rejected instead of normalized by the JavaScript date parser', () => {
  for (const timestamp of ['2026-02-30T12:00:00Z','2026-04-31T12:00:00Z','2026-01-01T24:00:00Z']) {
    const value = workspace(); value.projects[0].updatedAt = timestamp;
    assert.throws(() => validateWorkspace(value,new Set()), /ISO timestamp/);
  }
  const value = workspace();value.projects[0].updatedAt='2024-02-29T23:59:59.123+05:30';assert.doesNotThrow(()=>validateWorkspace(value,new Set()));
});

test('optional image flags remain strict booleans when explicitly provided',async()=>{
 await assert.rejects(validateAsset(image({legacyWhite:null}),{keepId:true,browser}),/boolean/);
});

test('a valid 20 MiB encoded image reaches the decoder without base64 parser stack overflow',async()=>{
 const png=Buffer.from(PNG.split(',')[1],'base64');
 const padding=Buffer.alloc(STORAGE_LIMITS.maxImageBytes-png.length);padding.writeUInt32BE(padding.length-12,0);padding.write('inKf',4);
 // CRC independently calculated with Python's zlib.crc32 for this fixed chunk.
 padding.writeUInt32BE(0x985e9658,padding.length-4);
 const bytes=Buffer.concat([png.subarray(0,png.length-12),padding,png.subarray(-12)]);
 const result=await validateAsset(image({dataUrl:'data:image/png;base64,'+bytes.toString('base64')}),{keepId:true,browser});
 assert.equal(result.blob.size,STORAGE_LIMITS.maxImageBytes);
});

test('artwork aggregate budget accepts exactly 96 MiB and rejects one additional encoded byte',()=>{
 assert.doesNotThrow(()=>validateStorageTotals([{blob:{size:STORAGE_LIMITS.maxArtworkBytes}}]));
 assert.throws(()=>validateStorageTotals([{blob:{size:STORAGE_LIMITS.maxArtworkBytes}},{blob:{size:1}}]),/96 MiB/);
 assert.doesNotThrow(()=>validateStorageTotals(Array.from({length:500},()=>({blob:{size:1}}))));
 assert.throws(()=>validateStorageTotals(Array.from({length:501},()=>({blob:{size:1}}))),/500/);
});

test('animated PNG and WebP are rejected before the native image decoder',async()=>{
 let decoded=false;const injected={decodeImage:async()=>{decoded=true;return {width:1,height:1};}};
 const png=Buffer.from(PNG.split(',')[1],'base64');const animation=Buffer.alloc(20);animation.writeUInt32BE(8,0);animation.write('acTL',4);animation.writeUInt32BE(2,8);
 const apng=Buffer.concat([png.subarray(0,33),animation,png.subarray(33)]);
 await assert.rejects(validateAsset(image({dataUrl:'data:image/png;base64,'+apng.toString('base64')}),{keepId:true,browser:injected}),/Animated/);
 const webp=Buffer.alloc(30);webp.write('RIFF',0);webp.writeUInt32LE(22,4);webp.write('WEBPVP8X',8);webp.writeUInt32LE(10,16);webp[20]=2;
 await assert.rejects(validateAsset(image({dataUrl:'data:image/webp;base64,'+webp.toString('base64')}),{keepId:true,browser:injected}),/Animated/);assert.equal(decoded,false);
});

test('JPEG and WebP headers enforce their actual dimensions before decoding',async()=>{
 // Minimal dimension headers intentionally use an injected decoder: native
 // browser integration tests are responsible for validating complete codecs.
 const jpeg=Buffer.from([255,216,255,192,0,8,8,0,2,0,3,1,255,217]);
 let calls=0;const injected={decodeImage:async()=>{calls++;return {width:3,height:2};}};
 const result=await validateAsset(image({width:3,height:2,dataUrl:'data:image/jpeg;base64,'+jpeg.toString('base64')}),{keepId:true,browser:injected});assert.equal(result.mime,'image/jpeg');assert.equal(calls,1);
 await assert.rejects(validateAsset(image({dataUrl:'data:image/jpeg;base64,'+jpeg.toString('base64')}),{keepId:true,browser:injected}),/dimensions/);
 const webp=Buffer.alloc(26);webp.write('RIFF',0);webp.writeUInt32LE(18,4);webp.write('WEBPVP8L',8);webp.writeUInt32LE(5,16);webp[20]=0x2f;webp.writeUInt32LE(2+(1<<14),21);
 const webpResult=await validateAsset(image({width:3,height:2,dataUrl:'data:image/webp;base64,'+webp.toString('base64')}),{keepId:true,browser:injected});assert.equal(webpResult.mime,'image/webp');assert.equal(calls,2);
});

test('WebP extended canvas cannot conceal an oversized raster frame from decode preflight',async()=>{
 const webp=Buffer.alloc(44);webp.write('RIFF',0);webp.writeUInt32LE(36,4);webp.write('WEBPVP8X',8);webp.writeUInt32LE(10,16); // canvas 1x1
 webp.write('VP8L',30);webp.writeUInt32LE(5,34);webp[38]=0x2f;webp.writeUInt32LE(4096+(4095<<14),39); // frame4097x4096
 let decoded=false;
 await assert.rejects(validateAsset(image({dataUrl:'data:image/webp;base64,'+webp.toString('base64')}),{keepId:true,browser:{decodeImage:async()=>{decoded=true;return {width:1,height:1};}}}),/pixels|dimensions/);
 assert.equal(decoded,false);
});

test('later JPEG frame headers cannot conceal excessive dimensions before native decoding',async()=>{
 const jpeg=Buffer.from([255,216,255,192,0,8,8,0,1,0,1,1,255,192,0,8,8,16,0,16,1,1,255,217]);
 let decoded=false;
 await assert.rejects(validateAsset(image({dataUrl:'data:image/jpeg;base64,'+jpeg.toString('base64')}),{keepId:true,browser:{decodeImage:async()=>{decoded=true;return {width:1,height:1};}}}),/pixels|dimensions/);
 assert.equal(decoded,false);
});

test('new project and artwork strings reject lone Unicode surrogates while preserving emoji',async()=>{
 for(const broken of ['\ud800','\udc00','a\ud800b']){
  const value=workspace();value.projects[0].extra=broken;assert.throws(()=>validateWorkspace(value,new Set()));
  await assert.rejects(validateAsset(image({name:broken}),{keepId:true,browser}));
  await assert.rejects(validateAsset(image({createdAt:broken}),{keepId:true,browser}));
 }
 const value=workspace();value.projects[0].notes='Tattoo 🌷';assert.doesNotThrow(()=>validateWorkspace(value,new Set()));
 const invalidKey=workspace();invalidKey.projects[0]['\ud800']='invalid';assert.throws(()=>validateWorkspace(invalidKey,new Set()));
});

test('upload preflight bounds original raster bytes and dimensions before any native decoding',async()=>{
 const bytes=Buffer.from(PNG.split(',')[1],'base64');
 assert.deepEqual(await preflightRaster(new Blob([bytes],{type:'image/png'})),{mime:'image/png',width:1,height:1});
 assert.deepEqual(await preflightRaster(new Blob([bytes])),{mime:'image/png',width:1,height:1});
 await assert.rejects(preflightRaster(new Blob([bytes],{type:'image/jpeg'})),/MIME|type|format/);
 let read=false;await assert.rejects(preflightRaster({size:STORAGE_LIMITS.maxImageBytes+1,arrayBuffer:async()=>{read=true;return bytes.buffer;}}),/20 MiB/);assert.equal(read,false);
 const oversized=Buffer.from(bytes);oversized.writeUInt32BE(4097,16);oversized.writeUInt32BE(4096,20);oversized.writeUInt32BE(0xb76887a2,29);
 await assert.rejects(preflightRaster(new Blob([oversized],{type:'image/png'})),/pixels/);
 await assert.rejects(preflightRaster(new Blob(['<svg/>'],{type:'image/svg+xml'})),/PNG|JPEG|WebP|signature/);
});

test('PNG corruption, missing image data and missing or trailing terminators fail before permissive browser decode',async()=>{
 const png=Buffer.from(PNG.split(',')[1],'base64');const corrupt=Buffer.from(png);corrupt[52]^=1;
 const invalid=[corrupt,png.subarray(0,png.length-12),Buffer.concat([png,Buffer.from([0])]),Buffer.concat([png.subarray(0,33),png.subarray(-12)])];
 let decoded=false;
 for(const bytes of invalid)await assert.rejects(validateAsset(image({dataUrl:'data:image/png;base64,'+bytes.toString('base64')}),{keepId:true,browser:{decodeImage:async()=>{decoded=true;return {width:1,height:1};}}}),/PNG|CRC|terminat|image data/);
 assert.equal(decoded,false);
});

test('truncated JPEG without an end marker fails before permissive browser decode',async()=>{
 const jpeg=Buffer.from([255,216,255,192,0,8,8,0,1,0,1,1]);let decoded=false;
 await assert.rejects(validateAsset(image({dataUrl:'data:image/jpeg;base64,'+jpeg.toString('base64')}),{keepId:true,browser:{decodeImage:async()=>{decoded=true;return {width:1,height:1};}}}),/JPEG|truncat|end/);assert.equal(decoded,false);
});
