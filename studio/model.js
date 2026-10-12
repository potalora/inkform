import {BODY_MODELS,DEFAULT_MODEL_ID,resolveBodyModel} from './model-catalog.js';
import {SHAPE_DEFAULTS} from './body-profiles.js';
export const MAX_TATTOOS = 16;
export const BODY_DEFAULTS = Object.freeze({bodyModelId:DEFAULT_MODEL_ID,body:'male',stature:175.3,build:0,shoulders:0,waist:0,hips:0,arms:8,legs:0,bust:0,mass:50,muscle:50,abdomen:0,armsLeft:0,armsRight:0,legsLeft:0,legsRight:0,skin:'monk05',clothing:false,hair:false});
export const copy = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function project(name='Untitled study',body=BODY_DEFAULTS){return {id:uid(),name,body:{...copy(body),bodyModelId:resolveBodyModel(body).id},tattoos:[],selectedIds:[],camera:null,updatedAt:new Date().toISOString()};}
export function createBodyModelCopy(source,targetId,{anatomy}={}){
 if(typeof targetId!=='string')throw Error('Unsupported body model.');
 const target=resolveBodyModel(targetId);resolveBodyModel(source.body);
 if(!target.ready)throw Error('This body model is not ready for comparison.');
 if(anatomy!==undefined&&!(target.anatomies||['male','female']).includes(anatomy))throw Error('Unsupported anatomy for this body model.');
 const anatomyLabel=anatomy===undefined?'':' '+(target.anatomyLabels?.[anatomy]||(anatomy==='female'?'Female':'Male'));
 const result=copy(source),suffix=` — ${target.label}${anatomyLabel} placement review`;
 const previousSuffixes=[' — placement review',...Object.values(BODY_MODELS).flatMap(model=>[` — ${model.label} placement review`,...(model.anatomies||['male','female']).map(anatomy=>` — ${model.label} ${model.anatomyLabels?.[anatomy]||(anatomy==='female'?'Female':'Male')} placement review`)])];
 for(;;){const previous=previousSuffixes.find(suffix=>result.name.endsWith(suffix));if(!previous)break;result.name=result.name.slice(0,-previous.length);}
 result.id=uid();result.name=result.name.slice(0,120-suffix.length)+suffix;result.body.bodyModelId=target.id;
 if(anatomy!==undefined)result.body.body=anatomy;
 if(target.anatomies&&!target.anatomies.includes(result.body.body))result.body.body=target.anatomies[0];
 if(target.supportsClothing===false)result.body.clothing=true;
 if(target.supportsShapeControls===false)Object.assign(result.body,SHAPE_DEFAULTS,{stature:BODY_DEFAULTS.stature});
 result.camera=null;for(const tattoo of result.tattoos)tattoo.placement=null;result.updatedAt=new Date().toISOString();return result;
}
export function createAtelierCopy(source){return createBodyModelCopy(source,'atelier-v1');}
export function tattoo(asset,existing=false){return {id:uid(),assetId:asset.id,name:asset.name,region:'leftUpperArm',placement:null,width:7,rotation:0,opacity:.9,flip:false,visible:true,locked:existing,existing,offsetX:0,offsetY:0};}
export function editable(p){return p.tattoos.filter(t=>p.selectedIds.includes(t.id)&&!t.locked);}
export function selection(p){return p.tattoos.filter(t=>p.selectedIds.includes(t.id));}
export function addTattoo(p,asset,existing=false){if(p.tattoos.length>=MAX_TATTOOS)throw Error(`A study can hold ${MAX_TATTOOS} tattoos. Create another study to explore more.`);const t=tattoo(asset,existing);p.tattoos.push(t);p.selectedIds=[t.id];return t;}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function transform(p,change){for(const t of editable(p)){if(change.scale)t.width=clamp(t.width*change.scale,.5,40);if(Number.isFinite(change.rotate))t.rotation=((t.rotation+change.rotate+540)%360)-180;if(Number.isFinite(change.x))t.offsetX=clamp(t.offsetX+change.x,-30,30);if(Number.isFinite(change.y))t.offsetY=clamp(t.offsetY+change.y,-30,30);if(Number.isFinite(change.opacity))t.opacity=clamp(change.opacity,.1,1);if(typeof change.flip==='boolean')t.flip=change.flip;}}
export function duplicateSelection(p){const from=editable(p);if(p.tattoos.length+from.length>MAX_TATTOOS)throw Error(`Limit: ${MAX_TATTOOS} tattoos per study.`);const newLayers=from.map(t=>({...copy(t),id:uid(),name:Array.from(t.name).slice(0,250).join('')+' copy',offsetX:clamp(t.offsetX+1,-30,30)}));p.tattoos.push(...newLayers);p.selectedIds=newLayers.map(t=>t.id);}
export function deleteSelection(p){const remove=new Set(editable(p).map(t=>t.id));p.tattoos=p.tattoos.filter(t=>!remove.has(t.id));p.selectedIds=p.selectedIds.filter(id=>!remove.has(id));}
export function sanitizeProject(p){const ids=new Set(p.tattoos.map(t=>t.id));p.selectedIds=(p.selectedIds||[]).filter(id=>ids.has(id));return p;}
export class History{constructor(limit=60){this.limit=limit;this.past=[];this.future=[];}push(p){this.past.push(copy(p));if(this.past.length>this.limit)this.past.shift();this.future=[];}undo(p){if(!this.past.length)return null;this.future.push(copy(p));return this.past.pop();}redo(p){if(!this.future.length)return null;this.past.push(copy(p));return this.future.pop();}clear(){this.past=[];this.future=[];}}
