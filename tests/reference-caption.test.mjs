import {test} from 'node:test';
import assert from 'node:assert/strict';
let caption;try{caption=await import('../studio/reference-caption.js');}catch{}
const lines=(study,width=160)=>{assert.equal(typeof caption?.referenceLines,'function','referenceLines export exists');return caption.referenceLines(study,[{id:'leftUpperArm',label:'Left upper arm'}],text=>[...text].length,width);};
test('reference contains every visible tattoo and artist notes with identity and location',()=>{const tattoos=Array.from({length:16},(_,i)=>({name:`Design ${i+1}`,width:7,region:'leftUpperArm',existing:i===0,visible:true}));tattoos.push({name:'Hidden baseline',visible:false});const result=lines({name:'Arm options',tattoos,notes:'Ask about breathing room.'}).join('\n');assert.match(result,/Design 16 ≈ 7.0 cm/);assert.match(result,/Design 1 ≈ 7.0 cm · Existing · Left upper arm/);assert.match(result,/Design 2 ≈ 7.0 cm · Idea/);assert.match(result,/Ask about breathing room/);assert.ok(!result.includes('Hidden baseline'));});
test('caption wraps long names and unbroken words without dropping information',()=>{const name='A'.repeat(120),result=lines({name:'Study',tattoos:[{name,width:12,region:'custom',visible:true}],notes:'First question\nSecond question'},28);assert.ok(result.every(line=>line.length<=28));assert.ok(result.join('').includes(name));assert.match(result.join(' '),/Custom surface/);assert.ok(result.includes('First question'));assert.ok(result.includes('Second question'));});
test('long notes are explicitly excerpted and output stays bounded',()=>{const result=lines({name:'Study',tattoos:[],notes:'Question '.repeat(1000)});assert.match(result.join('\n'),/Notes excerpt/);assert.match(result.join('\n'),/Full notes remain in your study/);assert.ok(result.join('\n').length<1800);});
test('reference crop scales normalized clear space to actual capture pixels including DPR',()=>{
 const region={x:.25,y:.1,width:.7,height:.8};
 assert.deepEqual(caption.referenceCrop(1000,600,region),{x:250,y:60,width:700,height:480});
 assert.deepEqual(caption.referenceCrop(2000,1200,region),{x:500,y:120,width:1400,height:960});
 assert.deepEqual(region,{x:.25,y:.1,width:.7,height:.8},'export must not rewrite the capture region');
});
test('reference crop intersects bounds and preserves fractional edge pixels',()=>{
 assert.deepEqual(caption.referenceCrop(100,80,{x:-.2,y:.75,width:1.4,height:.5}),{x:0,y:60,width:100,height:20});
 assert.deepEqual(caption.referenceCrop(101,81,{x:.1,y:.1,width:.3,height:.3}),{x:10,y:8,width:31,height:25});
});
test('missing or unusable reference regions retain the full capture',()=>{
 for(const region of [undefined,null,{}, {x:0,y:0,width:0,height:1},{x:0,y:0,width:-1,height:1},{x:NaN,y:0,width:1,height:1},{x:0,y:0,width:1,height:Infinity},{x:2,y:0,width:.5,height:1},{x:-2,y:0,width:.5,height:1}]){
  assert.deepEqual(caption.referenceCrop(1200,800,region),{x:0,y:0,width:1200,height:800});
 }
});
