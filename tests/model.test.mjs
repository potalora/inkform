import test from 'node:test';
import assert from 'node:assert/strict';
import {project,addTattoo,transform,duplicateSelection,deleteSelection,History,MAX_TATTOOS} from '../studio/model.js';
import {validateWorkspace} from '../studio/workspace-validation.js';
const asset={id:'art',name:'Flower'};
test('group transform preserves relative spacing and locked existing tattoos',()=>{const p=project();const a=addTattoo(p,asset),b=addTattoo(p,asset),locked=addTattoo(p,asset,true);a.offsetX=2;b.offsetX=5;p.selectedIds=[a.id,b.id,locked.id];transform(p,{x:3,scale:2,rotate:30});assert.equal(a.offsetX,5);assert.equal(b.offsetX,8);assert.equal(a.width,14);assert.equal(locked.width,7);assert.equal(locked.offsetX,0);});
test('duplicate is independent, delete leaves locked tattoos',()=>{const p=project();const a=addTattoo(p,asset),b=addTattoo(p,asset,true);p.selectedIds=[a.id,b.id];duplicateSelection(p);assert.equal(p.tattoos.length,3);p.tattoos[2].width=12;assert.equal(a.width,7);p.selectedIds=p.tattoos.map(t=>t.id);deleteSelection(p);assert.deepEqual(p.tattoos.map(t=>t.id),[b.id]);});
test('history snapshots isolate mutable body and tattoo state; divergent edit clears redo',()=>{const p=project();addTattoo(p,asset);const h=new History();h.push(p);transform(p,{x:3});p.body.waist=20;const prev=h.undo(p);assert.equal(prev.tattoos[0].offsetX,0);assert.equal(prev.body.waist,0);const redo=h.redo(prev);assert.equal(redo.tattoos[0].offsetX,3);h.undo(redo);h.push(prev);assert.equal(h.redo(prev),null);});
test('capacity and transform bounds are enforced before mutating',()=>{const p=project();for(let i=0;i<MAX_TATTOOS;i++)addTattoo(p,asset);const before=JSON.stringify(p);assert.throws(()=>duplicateSelection(p));assert.equal(JSON.stringify(p),before);assert.throws(()=>addTattoo(p,asset));transform(p,{scale:100,x:200,opacity:5});assert.equal(p.tattoos.at(-1).width,40);assert.equal(p.tattoos.at(-1).offsetX,30);assert.equal(p.tattoos.at(-1).opacity,1);});

test('duplicates near the horizontal boundary remain valid for persistence', () => {
  for (const offsetX of [29.5, 30]) {
    const p = project(), source = addTattoo(p, asset);
    source.offsetX = offsetX;
    duplicateSelection(p);
    assert.doesNotThrow(() => validateWorkspace({projects: [p], activeProjectId: p.id}, new Set([asset.id])));
    assert.equal(p.tattoos[1].offsetX, 30);
    assert.equal(source.offsetX, offsetX);
  }
});

test('duplicates of maximum length names retain a copy suffix and valid Unicode within persistence limits', () => {
  for (const name of ['x'.repeat(255), '🌷'.repeat(255)]) {
    const p = project(), source = addTattoo(p, {...asset, name});
    duplicateSelection(p);
    assert.doesNotThrow(() => validateWorkspace({projects: [p], activeProjectId: p.id}, new Set([asset.id])));
    assert.equal(Array.from(p.tattoos[1].name).length, 255);
    assert.ok(p.tattoos[1].name.endsWith(' copy'));
    assert.equal(source.name, name);
  }
});
