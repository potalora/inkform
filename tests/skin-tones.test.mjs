import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SKIN_TONES, LEGACY_SKIN_COLORS, skinColor, SKIN_ATTRIBUTION, SKIN_SOURCE, SKIN_LICENSE} from '../studio/skin-tones.js';
test('official ten reference colors and labels are exact and immutable',()=>{
 const expected=['#f6ede4','#f3e7db','#f7ead0','#eadaba','#d7bd96','#a07e56','#825c43','#604134','#3a312a','#292420'];
 assert.deepEqual(SKIN_TONES.map(t=>t.color),expected);
 SKIN_TONES.forEach((t,i)=>{assert.equal(t.id,`monk${String(i+1).padStart(2,'0')}`);assert.equal(t.label,`Monk ${String(i+1).padStart(2,'0')}`);assert.equal(skinColor({skin:t.id}),t.color);assert.ok(Object.isFrozen(t));});
 assert.ok(Object.isFrozen(SKIN_TONES)); assert.match(SKIN_ATTRIBUTION,/Monk, Ellis/);assert.equal(SKIN_SOURCE,'https://skintone.google/get-started');assert.equal(SKIN_LICENSE,'https://creativecommons.org/licenses/by/4.0/');
});
test('legacy colors are preserved and invalid choices fall back safely',()=>{
 for(const [skin,color] of Object.entries(LEGACY_SKIN_COLORS))assert.equal(skinColor({skin}),color);
 for(const body of [null,undefined,[],123,'dark',{skin:'unknown'},{skin:'__proto__'},{skin:[]},{skin:'custom'},{skin:'custom',skinColor:'#abc'},{skin:'custom',skinColor:'red'},{skin:'custom',skinColor:'#1234567'}])assert.equal(skinColor(body),LEGACY_SKIN_COLORS.medium);
});
test('custom color stays exact and choice is independent of anatomy across JSON snapshots',()=>{
 for(const choice of [...SKIN_TONES.map(t=>({skin:t.id})),{skin:'custom',skinColor:'#aBc123'},...Object.keys(LEGACY_SKIN_COLORS).map(skin=>({skin}))]){
  const before=structuredClone(choice),expected=skinColor(choice);
  for(const body of ['male','female'])for(const mass of [0,50,100])assert.equal(skinColor(JSON.parse(JSON.stringify({...choice,body,mass,muscle:100,armsLeft:-20}))),expected);
  assert.deepEqual(choice,before);
 }
 assert.equal(skinColor({skin:'custom',skinColor:'#aBc123'}),'#aBc123');
});
