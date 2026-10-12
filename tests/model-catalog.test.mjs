import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../studio/model.js';
import {readFile} from 'node:fs/promises';
import {READY_BODY_MODELS} from '../studio/model-catalog.js';

test('new projects use MakeHuman while explicit unversioned bodies retain their original geometry',()=>{
 const fresh=model.project('New study');assert.equal(fresh.body.bodyModelId,'makehuman-v1');assert.equal(fresh.body.hair,false);assert.equal(fresh.body.clothing,false);
 const legacy={...model.BODY_DEFAULTS,body:'female',skin:'custom',skinColor:'#aBc123'};delete legacy.bodyModelId;delete legacy.hair;
 const original=structuredClone(legacy),p=model.project('Original',legacy);
 assert.equal(p.body.bodyModelId,'makehuman-v1');delete p.body.bodyModelId;assert.deepEqual(p.body,original);assert.deepEqual(legacy,original);
});

test('explicit supported model identity survives project creation and unsupported identity fails',()=>{
 for(const {id:bodyModelId} of READY_BODY_MODELS)assert.equal(model.project('Explicit',{...model.BODY_DEFAULTS,bodyModelId}).body.bodyModelId,bodyModelId);
 for(const bodyModelId of ['future-v9','',null,{}])assert.throws(()=>model.project('Unsupported',{...model.BODY_DEFAULTS,bodyModelId}),/Unsupported body model/);
});

test('explicit hidden hair remains off when creating or copying a study',()=>{
 const source=model.project('Hair hidden',{...model.BODY_DEFAULTS,bodyModelId:'makehuman-v1',hair:false});assert.equal(source.body.hair,false);assert.equal(model.createAtelierCopy(source).body.hair,false);
});

test('catalog resolution distinguishes original and Atelier asset paths without guessing unknown models',async()=>{
 const {resolveBodyModel}=await import('../studio/model-catalog.js');
 assert.equal(resolveBodyModel({}).bodyFiles.male,'./models/human.json');
 assert.equal(resolveBodyModel('makehuman-v1').bodyFiles.female,'./models/female.json');
 assert.equal(resolveBodyModel('atelier-v1').bodyFiles.male,'./models/atelier/male.json');
 assert.equal(resolveBodyModel({bodyModelId:'atelier-v1'}).shapes,'./models/atelier/shapes.json');
 for(const value of ['__proto__','future-v9',null,{bodyModelId:''}])assert.throws(()=>resolveBodyModel(value),/Unsupported body model/);
});

test('Atelier copy preserves study details but invalidates geometry-dependent placements and camera',()=>{
 const source=model.project('Original',{...model.BODY_DEFAULTS,bodyModelId:'makehuman-v1'});
 source.notes='Keep these notes';source.camera={position:[0,1,3],target:[0,1,0]};
 const a=model.addTattoo(source,{id:'art',name:'Existing'},true),b=model.addTattoo(source,{id:'color',name:'Idea'});
 Object.assign(a,{placement:{faceIndex:106000,barycentric:[.2,.3,.5]},region:'custom',width:12.4,rotation:45,offsetX:2,offsetY:-3});
 Object.assign(b,{placement:{faceIndex:50,barycentric:[1,0,0]},region:'back',flip:true,visible:false});source.selectedIds=[a.id,b.id];
 const original=structuredClone(source),p=model.createAtelierCopy(source);
 assert.notEqual(p.id,source.id);assert.equal(p.body.bodyModelId,'atelier-v1');assert.equal(p.camera,null);assert.match(p.name,/placement review/i);assert.equal(p.notes,source.notes);
 assert.deepEqual(p.tattoos,original.tattoos.map(t=>({...t,placement:null})));assert.deepEqual(p.selectedIds,original.selectedIds);assert.deepEqual(source,original);
 p.tattoos[0].width=20;p.body.waist=3;assert.equal(source.tattoos[0].width,12.4);assert.equal(source.body.waist,0);
});

test('Atelier copy keeps long study names within persistence bounds',()=>{
 const source=model.project('x'.repeat(120));const p=model.createAtelierCopy(source);assert.ok(p.name.length<=120);assert.match(p.name,/placement review/i);
});

test('five model comparisons keep one recognized suffix and preserve the base study name',()=>{
 const base='Original — a dash I chose',original=model.project(base),before=structuredClone(original);
 let current=original;
 for(const targetId of ['mhr-v1','blender-studio-v1','drummyfish-v1','makehuman-v1','atelier-v1']){
  const prior=structuredClone(current),target=READY_BODY_MODELS.find(entry=>entry.id===targetId),result=model.createBodyModelCopy(current,targetId);
  assert.equal(result.name,base+' — '+target.label+' placement review');assert.deepEqual(current,prior);assert.ok(result.name.length<=120);current=result;
 }
 assert.deepEqual(original,before);
});

test('Blender anatomy review copies clear every placement and name the anatomy without changing the source',()=>{
 const source=model.project('Original — chosen name',{...model.BODY_DEFAULTS,bodyModelId:'blender-studio-v1',body:'male'}),a=model.addTattoo(source,{id:'art',name:'Locked custom'},true),b=model.addTattoo(source,{id:'art',name:'Idea'});
 a.region='custom';a.placement={faceIndex:21347,barycentric:[.1,.2,.7]};b.placement={faceIndex:50000,barycentric:[.3,.3,.4]};source.selectedIds=[a.id,b.id];source.camera={position:[1,1,3],target:[0,1,0]};const before=structuredClone(source);
 const female=model.createBodyModelCopy(source,'blender-studio-v1',{anatomy:'female'});assert.equal(female.body.body,'female');assert.equal(female.name,'Original — chosen name — Blender Studio Female placement review');assert.equal(female.camera,null);assert.deepEqual(female.tattoos,before.tattoos.map(t=>({...t,placement:null})));assert.deepEqual(female.selectedIds,before.selectedIds);assert.deepEqual(source,before);
 const prior=structuredClone(female),male=model.createBodyModelCopy(female,'blender-studio-v1',{anatomy:'male'});assert.equal(male.body.body,'male');assert.equal(male.name,'Original — chosen name — Blender Studio Male placement review');assert.deepEqual(female,prior);
 for(const anatomy of ['unknown',null,{},''])assert.throws(()=>model.createBodyModelCopy(source,'blender-studio-v1',{anatomy}),/Unsupported anatomy/);assert.deepEqual(source,before);
});

test('comparison naming removes repeated recognized and legacy suffixes while keeping user dash names',()=>{
 const source=model.project('Original — user note — placement review — MHR neutral placement review — Atelier Vitruvian placement review'),before=structuredClone(source);
 assert.equal(model.createBodyModelCopy(source,'makehuman-v1').name,'Original — user note — MakeHuman original placement review');assert.deepEqual(source,before);
 const arbitrary=model.project('Original — unknown model placement review');assert.equal(model.createAtelierCopy(arbitrary).name,'Original — unknown model placement review — Atelier Vitruvian placement review');
 const long=model.project('x'.repeat(120));const result=model.createAtelierCopy(long);assert.equal(result.name.length,120);assert.equal(model.createBodyModelCopy(result,'makehuman-v1').name.length,120);
});

test('generic comparison copies work in either source direction without reusing geometry anchors',()=>{
 assert.equal(typeof model.createBodyModelCopy,'function');
 for(const [from,to] of [['makehuman-v1','atelier-v1'],['atelier-v1','makehuman-v1']]){
  const source=model.project('Comparison',{...model.BODY_DEFAULTS,bodyModelId:from,body:'female',skin:'custom',skinColor:'#aBc123',hair:false});
  const tattoo=model.addTattoo(source,{id:'art',name:'Ink'},true);tattoo.placement={faceIndex:50000,barycentric:[.2,.3,.5]};source.camera={position:[1,1,3],target:[0,1,0]};source.notes='Notes';
  const before=structuredClone(source),result=model.createBodyModelCopy(source,to);
  assert.equal(result.body.bodyModelId,to);assert.deepEqual(result.body,{...before.body,bodyModelId:to});assert.equal(result.camera,null);
  assert.deepEqual(result.tattoos,before.tattoos.map(t=>({...t,placement:null})));assert.deepEqual(result.selectedIds,before.selectedIds);assert.equal(result.notes,before.notes);assert.deepEqual(source,before);
  assert.match(result.name,/placement review/i);assert.ok(result.name.includes(to==='atelier-v1'?'Atelier':'MakeHuman'));
 }
});

test('comparison copy rejects unsupported target identity before changing the source',()=>{
 assert.equal(typeof model.createBodyModelCopy,'function');const source=model.project('Original'),before=structuredClone(source);
 for(const target of ['future-v9','__proto__','',null,undefined,{}])assert.throws(()=>model.createBodyModelCopy(source,target),/Unsupported body model/);
 assert.deepEqual(source,before);
});

test('comparison catalog exposes distinct ready body sources only',async()=>{
 const {READY_BODY_MODELS}=await import('../studio/model-catalog.js');assert.ok(Array.isArray(READY_BODY_MODELS));assert.ok(READY_BODY_MODELS.length>=2);
 for(const id of ['makehuman-v1','atelier-v1'])assert.ok(READY_BODY_MODELS.some(m=>m.id===id));assert.equal(new Set(READY_BODY_MODELS.map(m=>m.label)).size,READY_BODY_MODELS.length);
 for(const entry of READY_BODY_MODELS){assert.equal(entry.ready,true);assert.ok(entry.source);assert.ok(entry.faceCount>0);for(const anatomy of entry.anatomies||['male','female'])assert.ok(entry.bodyFiles[anatomy]);}
});

test('fixed reference comparison resets unsupported proportions and uses the supplied anatomy',async()=>{
 const catalogURL=new URL('../studio/model-catalog.js',import.meta.url).href,profilesURL=new URL('../studio/body-profiles.js',import.meta.url).href;
 const fixtureCatalog=`import {resolveBodyModel as resolve,BODY_MODELS as known} from '${catalogURL}';export const BODY_MODELS=known;export const DEFAULT_MODEL_ID='atelier-v1';export function resolveBodyModel(id){return id==='test-fixed'?{id:'test-fixed',label:'Fixed source',ready:true,supportsShapeControls:false,supportsClothing:false,anatomies:['male']}:resolve(id);}`;
 const fixtureURL=`data:text/javascript;base64,${Buffer.from(fixtureCatalog).toString('base64')}`;
 const sourceCode=(await readFile(new URL('../studio/model.js',import.meta.url),'utf8')).replace("'./model-catalog.js'",`'${fixtureURL}'`).replace("'./body-profiles.js'",`'${profilesURL}'`);
 const fixedModel=await import(`data:text/javascript;base64,${Buffer.from(sourceCode).toString('base64')}`);
 const source=model.project('Female custom shape',{...model.BODY_DEFAULTS,body:'female',stature:190,mass:90,muscle:85,waist:-10,hips:12,armsLeft:8,build:4,skin:'custom',skinColor:'#aBc123',clothing:false,hair:false}),before=structuredClone(source);
 const result=fixedModel.createBodyModelCopy(source,'test-fixed');assert.equal(result.body.body,'male');assert.equal(result.body.bodyModelId,'test-fixed');assert.equal(result.body.stature,175.3);assert.equal(result.body.mass,50);assert.equal(result.body.muscle,50);assert.equal(result.body.waist,0);assert.equal(result.body.hips,0);assert.equal(result.body.armsLeft,0);assert.equal(result.body.build,0);
 assert.equal(result.body.skin,'custom');assert.equal(result.body.skinColor,'#aBc123');assert.equal(result.body.clothing,true,'source-baked underwear stays present in the comparison copy');assert.equal(result.body.hair,false);assert.deepEqual(source,before);
});


test('clean mannequin selection preserves readable legacy identity and saved flags',async()=>{
 const {SELECTABLE_BODY_MODELS,resolveBodyModel}=await import('../studio/model-catalog.js');
 assert.deepEqual(SELECTABLE_BODY_MODELS.map(m=>m.id),['mhr-v1','blender-studio-v1','makehuman-v1']);
 for(const bodyModelId of ['drummyfish-v1','atelier-v1']){
  assert.equal(resolveBodyModel(bodyModelId).legacyOnly,true);
  const old=model.project('Saved clothed study',{...model.BODY_DEFAULTS,bodyModelId,hair:true,clothing:true});
  const ink=model.addTattoo(old,{id:'old-art',name:'Existing ink'},true);ink.region='custom';ink.placement={faceIndex:42,barycentric:[.2,.3,.5]};
  const before=structuredClone(old),comparison=model.createBodyModelCopy(old,'makehuman-v1');
  assert.deepEqual(old,before);assert.equal(old.body.bodyModelId,bodyModelId);assert.equal(comparison.body.bodyModelId,'makehuman-v1');assert.equal(comparison.body.hair,true);assert.equal(comparison.body.clothing,true);
  assert.equal(comparison.tattoos[0].locked,true);assert.equal(comparison.tattoos[0].assetId,'old-art');assert.equal(comparison.tattoos[0].placement,null);
 }
});
