// Editable geometric starting points. These are not identity, BMI or percentile classes.
export const SHAPE_DEFAULTS = Object.freeze({mass:50,muscle:50,build:0,shoulders:0,waist:0,hips:0,arms:8,legs:0,bust:0,abdomen:0,armsLeft:0,armsRight:0,legsLeft:0,legsRight:0});
export const BODY_PROFILES = Object.freeze([
 {id:'balanced',label:'Balanced',values:{}},
 {id:'slender',label:'Slender',values:{mass:15,muscle:25,arms:0}},
 {id:'muscular',label:'More muscular',values:{mass:50,muscle:90,arms:5}},
 {id:'fuller',label:'Fuller',values:{mass:90,muscle:35,arms:0}},
 {id:'hips',label:'Fuller hips and thighs',values:{mass:70,muscle:40,waist:-5,hips:10,legs:4,arms:0}},
 {id:'shoulders',label:'Broader shoulders',values:{mass:50,muscle:65,shoulders:4,arms:8}},
].map(p=>Object.freeze({...p,values:Object.freeze({...SHAPE_DEFAULTS,...p.values})})));
export function applyBodyProfile(body,id){const p=BODY_PROFILES.find(p=>p.id===id);return p?{...body,...p.values}:body;}
export function bodyProfileId(body){return BODY_PROFILES.find(p=>Object.entries(p.values).every(([k,v])=>(body[k]??SHAPE_DEFAULTS[k])===v))?.id||'custom';}
