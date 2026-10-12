export const LEGACY_MODEL_ID='makehuman-v1';
export const DEFAULT_MODEL_ID=LEGACY_MODEL_ID;

export const BODY_MODELS=Object.freeze({
 'mhr-v1':Object.freeze({id:'mhr-v1',label:'MHR neutral',anatomyLabels:Object.freeze({male:'Neutral reference'}),source:'Meta MHR · Apache 2.0 · neutral geometry trial',ready:true,supportsShapeControls:false,supportsHair:false,anatomies:Object.freeze(['male']),basePath:'./models/mhr/',bodyFiles:Object.freeze({male:'./models/mhr/neutral.json'}),shapes:'./models/mhr/shapes.json',faceCount:36874}),
 'blender-studio-v1':Object.freeze({id:'blender-studio-v1',anatomyTopologyCompatible:false,label:'Blender Studio',source:'Blender Studio · CC0 · male and female base meshes',ready:true,supportsShapeControls:false,supportsHair:false,basePath:'./models/blender-studio/',bodyFiles:Object.freeze({male:'./models/blender-studio/male.json',female:'./models/blender-studio/female.json'}),shapes:'./models/blender-studio/shapes.json',faceCount:84680}),
 'drummyfish-v1':Object.freeze({id:'drummyfish-v1',legacyOnly:true,label:'Drummyfish textured',source:'Drummyfish · CC0 · lightweight textured reference',ready:true,supportsShapeControls:false,supportsSkinTone:false,supportsClothing:false,supportsHair:false,anatomies:Object.freeze(['male']),basePath:'./models/drummyfish/',bodyFiles:Object.freeze({male:'./models/drummyfish/male.json'}),shapes:'./models/drummyfish/shapes.json',faceCount:8072}),
 [LEGACY_MODEL_ID]:Object.freeze({id:LEGACY_MODEL_ID,label:'MakeHuman original',source:'MakeHuman',ready:true,supportsShapeControls:true,basePath:'./models/',bodyFiles:Object.freeze({male:'./models/human.json',female:'./models/female.json'}),shapes:'./models/shapes.json',faceCount:107024}),
 'atelier-v1':Object.freeze({id:'atelier-v1',legacyOnly:true,label:'Atelier Vitruvian',source:'Atelier',ready:true,supportsShapeControls:true,basePath:'./models/atelier/',bodyFiles:Object.freeze({male:'./models/atelier/male.json',female:'./models/atelier/female.json'}),shapes:'./models/atelier/shapes.json',faceCount:52544})
});

export const READY_BODY_MODELS=Object.freeze(Object.values(BODY_MODELS).filter(model=>model.ready));
// Retired sources remain readable in saved studies without being offered for new comparisons.
export const SELECTABLE_BODY_MODELS=Object.freeze(READY_BODY_MODELS.filter(model=>!model.legacyOnly));

// Missing identity is the original topology. Never guess for a provided identity:
// a saved face/barycentric placement only has meaning on its original topology.
export function resolveBodyModel(bodyOrId){
 const supplied=bodyOrId!==null&&typeof bodyOrId==='object'?bodyOrId.bodyModelId:bodyOrId;
 const id=supplied===undefined?LEGACY_MODEL_ID:supplied;
 if(typeof id!=='string'||!Object.hasOwn(BODY_MODELS,id))throw Error('Unsupported body model.');
 return BODY_MODELS[id];
}
