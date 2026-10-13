import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from '../studio/environment/atelier/gltf-loader.js';
import {prepareTreatmentRoom,updateTreatmentView,environmentMetrics,disposeAtelierGroup} from '../studio/gallery-environment.js';
import {cameraView} from '../studio/camera-framing.js';

const bytes=await readFile(new URL('../studio/environment/treatment-room/treatment-room.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),document=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const binary=bytes.subarray(28+jsonLength);
const names=['Room_FrontWall','Room_BackWall','Room_LeftWall','Room_RightWall','Room_Floor','Room_TreatmentBed','Room_Glass','Room_WindowGlass','Room_PlantBroadleaf','Room_PlantPalm','Room_PlantSculptural','Room_GlassFrame','Room_CeilingRear','Room_CeilingRight','Room_FloorLampLeft','Room_FloorLampRight'];

test('interactive glass avoids viewport transmission and retains physical trace parameters',()=>{
 const group=new THREE.Group(),material=new THREE.MeshPhysicalMaterial({transmission:1,roughness:.065,ior:1.45});
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.02,1.8,.8),material);glass.name='Room_Glass';glass.userData.roomGlass=true;group.add(glass);
 let disposed=0;material.addEventListener('dispose',()=>disposed++);
 prepareTreatmentRoom(group);
 assert.equal(glass.material,material);assert.equal(glass.material.transmission,0);assert.equal(glass.material.transparent,true);assert.equal(glass.material.depthWrite,false);assert.equal(glass.material.userData.traceGlass.transmission,1);assert.equal(glass.material.ior,1.45);assert.equal(disposed,0);
 assert.ok(glass.userData.occlusionBounds,'glass participates in view cutaway');
 disposeAtelierGroup(group);assert.equal(disposed,1);
});
test('interior plants cut away only when they obstruct the body and restore from another view',()=>{
 const group=new THREE.Group(),camera=new THREE.PerspectiveCamera(),target=new THREE.Vector3(0,.85,0);
 for(const name of ['Room_PlantBroadleaf','Room_PlantPalm','Room_PlantSculptural']){
  const plant=new THREE.Mesh(new THREE.BoxGeometry(.5,1.7,.5),new THREE.MeshBasicMaterial());
  plant.name=name;plant.position.set(0,.85,1);group.add(plant);
 }
 prepareTreatmentRoom(group);
 for(const plant of group.children)assert.ok(plant.userData.occlusionBounds,`${plant.name}: cache bounds once`);
 camera.position.set(0,1.08,4.4);camera.updateMatrixWorld();updateTreatmentView(group,camera,target);
 assert.ok(group.children.every(plant=>!plant.visible),'plants between the camera and body cut away');
 camera.position.set(0,1.08,-4.4);camera.updateMatrixWorld();updateTreatmentView(group,camera,target);
 assert.ok(group.children.every(plant=>plant.visible),'plants behind the body remain visible');
 disposeAtelierGroup(group);
});
test('window glass follows the left wall cutaway independently of the architectural return',()=>{
 const group=new THREE.Group(),material=new THREE.MeshPhysicalMaterial({transmission:1}),camera=new THREE.PerspectiveCamera();
 const window=new THREE.Mesh(new THREE.BoxGeometry(.01,2.7,3.4),material);window.name='Room_WindowGlass';window.userData.roomGlass=true;window.position.set(-3.05,1.47,.74);group.add(window);
 prepareTreatmentRoom(group);
 assert.equal(window.userData.occlusionBounds,undefined,'window panes do not create a room-spanning furniture bounding box');
 camera.position.set(-4,1,0);camera.updateMatrixWorld();updateTreatmentView(group,camera);
 assert.equal(window.visible,false,'window cuts away with the wall from an outside camera');
 camera.position.set(0,1,4);camera.updateMatrixWorld();updateTreatmentView(group,camera);
 assert.equal(window.visible,true,'inside views retain the real window material');
 disposeAtelierGroup(group);
});
function jpegSize(data){
 assert.equal(data.readUInt16BE(0),0xffd8);let at=2;
 while(at<data.length){assert.equal(data[at++],0xff);while(data[at]===0xff)at++;const marker=data[at++],length=data.readUInt16BE(at);if([0xc0,0xc1,0xc2].includes(marker))return {height:data.readUInt16BE(at+3),width:data.readUInt16BE(at+5)};at+=length;}
 throw Error('JPEG has no supported frame header');
}
const imageSizes=document.images.map(image=>{const view=document.bufferViews[image.bufferView];return jpegSize(binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));});

// Parse the actual geometry without browser image decoding, then restore texture
// slots from the actual material JSON using dimensioned CPU texture stand-ins.
async function loadRoom(){
 const stripped=structuredClone(document);
 for(const material of stripped.materials){delete material.emissiveTexture;delete material.normalTexture;delete material.occlusionTexture;delete material.pbrMetallicRoughness?.baseColorTexture;delete material.pbrMetallicRoughness?.metallicRoughnessTexture;}
 const encoded=Buffer.from(JSON.stringify(stripped)),length=Math.ceil(encoded.length/4)*4,payload=Buffer.alloc(12+8+length+8+binary.length,32);
 payload.writeUInt32LE(0x46546c67,0);payload.writeUInt32LE(2,4);payload.writeUInt32LE(payload.length,8);payload.writeUInt32LE(length,12);payload.writeUInt32LE(0x4e4f534a,16);encoded.copy(payload,20);payload.writeUInt32LE(binary.length,20+length);payload.writeUInt32LE(0x004e4942,24+length);binary.copy(payload,28+length);
 const {scene}=await new GLTFLoader().parseAsync(payload.buffer.slice(payload.byteOffset,payload.byteOffset+payload.byteLength),'');
 const textures=imageSizes.map(size=>new THREE.Texture({...size})),restored=new Set();
 scene.traverse(object=>{if(!object.isMesh||restored.has(object.material))return;restored.add(object.material);const material=document.materials.find(item=>item.name===object.material.name);for(const [slot,info] of [['map',material.pbrMetallicRoughness?.baseColorTexture],['emissiveMap',material.emissiveTexture]])if(info)object.material[slot]=textures[document.textures[info.index].source];});
 return scene;
}

test('embedded studio has grounded bench, captured glass, plants and indirect fixtures within budget',async()=>{
 assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.ok(bytes.length<=3000000);
 assert.equal(imageSizes.length,2);assert.deepEqual(imageSizes.map(size=>[size.width,size.height]).sort((a,b)=>a[0]-b[0]),[[1024,1024],[2048,2048]]);
 const room=prepareTreatmentRoom(await loadRoom()),metrics=environmentMetrics(room);
 assert.equal(metrics.meshes,16);assert.ok(metrics.triangles<=75000);assert.equal(metrics.textures,2);assert.ok(metrics.decodedTextureBytes<32*1024*1024);
 const actualNames=[];room.traverse(object=>{if(object.isMesh)actualNames.push(object.name);});assert.deepEqual(actualNames.sort(),[...names].sort(),'only approved architecture, original bench, plants and indirect fixtures');
 for(const name of names)assert.ok(room.getObjectByName(name)?.isMesh,name);
 const floor=new THREE.Box3().setFromObject(room.getObjectByName('Room_Floor'));assert.ok(floor.max.y<=.002&&floor.max.x>5&&floor.min.x< -5&&floor.max.z>5&&floor.min.z< -5,'continuous floor extends beneath the normal camera orbit');
 disposeAtelierGroup(room);
});

test('bench retains original geometry with bounded structural spigots and timber stays in wall groups',async()=>{
 const source=await readFile(new URL('../studio/environment/atelier/treatment-bed.glb',import.meta.url)),sourceLength=source.readUInt32LE(12),sourceDocument=JSON.parse(source.subarray(20,20+sourceLength).toString());
 const sourceTriangles=sourceDocument.nodes.filter(node=>node.mesh!==undefined).reduce((sum,node)=>sum+sourceDocument.meshes[node.mesh].primitives.reduce((count,primitive)=>count+sourceDocument.accessors[primitive.indices??primitive.attributes.POSITION].count/3,0),0);
 const room=await loadRoom(),triangles=mesh=>(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
 const bedTriangles=triangles(room.getObjectByName('Room_TreatmentBed'));assert.ok(bedTriangles>sourceTriangles&&bedTriangles<=sourceTriangles+2000,'original bench plus four small structural spigots');
 for(const [name,budget] of [['Room_BackWall',7000],['Room_FrontWall',600],['Room_LeftWall',1400],['Room_RightWall',3000],['Room_Glass',200],['Room_WindowGlass',400]])assert.ok(triangles(room.getObjectByName(name))<=budget,`${name}: bounded architectural slab, windows and integrated perimeter timber`);
 disposeAtelierGroup(room);
});

test('bench retains every original source face after the measured 4.5 mm grounding correction',async()=>{
 const source=await readFile(new URL('../studio/environment/atelier/treatment-bed.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'');
 const placement=new THREE.Group();placement.position.set(1.6,-.0045,-1.5);placement.rotation.y=THREE.MathUtils.degToRad(-35);placement.add(scene);placement.updateMatrixWorld(true);
 const room=await loadRoom();room.updateMatrixWorld(true);
 // Blender may join onto another source subobject, changing the local basis
 // by sub-micron float error. Match geometry within 10 micrometres instead of
 // pinning a brittle rounded-coordinate hash that fails at rounding edges.
 const tolerance=1e-5,cells=new Map(),points=[];
 function vertex(point,create){
  const cell=point.toArray().map(value=>Math.floor(value/tolerance));
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
   const ids=cells.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))||[];
   for(const id of ids)if(points[id].distanceToSquared(point)<=tolerance*tolerance)return id;
  }
  assert.ok(create,`bench vertex moved from its original placement: ${point.toArray()}`);
  const id=points.length,key=cell.join(',');points.push(point.clone());
  if(!cells.has(key))cells.set(key,[]);cells.get(key).push(id);return id;
 }
 function triangles(group,create){
  const result=[],point=new THREE.Vector3();
  group.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const position=mesh.geometry.attributes.position,index=mesh.geometry.index;
   for(let at=0;at<(index?.count||position.count);at+=3){
    const corners=[];
    for(let i=0;i<3;i++)corners.push(vertex(point.fromBufferAttribute(position,index?index.getX(at+i):at+i).applyMatrix4(mesh.matrixWorld),create));
    result.push(corners.sort((a,b)=>a-b).join(','));
   }
  });
  return result.sort();
 }
 const original=triangles(placement,true),current=triangles(room.getObjectByName('Room_TreatmentBed'),true),counts=new Map();
 for(const face of current)counts.set(face,(counts.get(face)||0)+1);
 for(const face of original){assert.ok(counts.get(face)>0,'every original bench face survives the grounding translation');counts.set(face,counts.get(face)-1);}
 disposeAtelierGroup(room);disposeAtelierGroup(placement);
});

test('room provenance matches current runtime assets, authoring source and reused CC0 bench',async()=>{
 const base=new URL('../studio/environment/treatment-room/',import.meta.url),provenance=JSON.parse(await readFile(new URL('provenance.json',base),'utf8'));
 assert.equal(provenance.license,'CC0-1.0');assert.equal(provenance.geometry.meshes,16);assert.equal(provenance.bake.device,'CPU');assert.deepEqual(provenance.externalAssets,[]);
 for(const record of [...provenance.runtimeFiles,provenance.authoringScript,...provenance.sources, ...provenance.sources.map(source=>source.authoringSource)]){
  const data=await readFile(new URL(record.file,base));assert.equal(record.bytes,data.length,record.file);assert.equal(record.sha256,createHash('sha256').update(data).digest('hex'),record.file);
 }
 const room=await loadRoom();assert.equal(provenance.geometry.triangles,environmentMetrics(room).triangles);
 const dimensions=new THREE.Box3().setFromObject(room,true).getSize(new THREE.Vector3()).toArray();dimensions.forEach((value,i)=>assert.ok(Math.abs(value-provenance.geometry.dimensionsMetres[i])<.00001,'runtime vertex bounds match provenance'));
 disposeAtelierGroup(room);
});

test('concrete walls expose continuous full-height pours rather than a modular panel grid',async()=>{
 const room=await loadRoom();room.updateMatrixWorld(true);
 for(const [name,axis,plane] of [['Room_BackWall','z',-2.983],['Room_RightWall','x',2.984],['Room_FrontWall','z',2.80]]){
  const wall=room.getObjectByName(name),position=wall.geometry.attributes.position,index=wall.geometry.index,areas=[];
  const vertices=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],triangle=new THREE.Triangle();
  for(let i=0;i<(index?.count||position.count);i+=3){
   vertices.forEach((v,j)=>v.fromBufferAttribute(position,index?index.getX(i+j):i+j).applyMatrix4(wall.matrixWorld));
   if(vertices.every(v=>Math.abs(v[axis]-plane)<.001))areas.push(triangle.set(...vertices).getArea());
  }
  // Each uninterrupted visible wall face has two large triangles. Applied
  // 1.5 m panels cannot satisfy this even with a large backing slab behind them.
  assert.equal(areas.filter(area=>area>7).length,2,`${name}: continuous inner concrete face`);
 }
 disposeAtelierGroup(room);
});
test('left wall contains two real tall window apertures with glazing and a solid mullion',async()=>{
 const room=await loadRoom();room.updateMatrixWorld(true);
 const wall=room.getObjectByName('Room_LeftWall'),glass=room.getObjectByName('Room_WindowGlass');
 // Rays cross the authored left facade from the room interior. An opaque
 // backing wall or painted-on bright rectangles cannot satisfy these checks.
 for(const z of [-.07,1.65])for(const y of [.35,1.4,2.55]){
  const ray=new THREE.Raycaster(new THREE.Vector3(0,y,z),new THREE.Vector3(-1,0,0),0,4);
  assert.equal(ray.intersectObject(wall).length,0,`open aperture at ${y},${z}`);
  assert.ok(ray.intersectObject(glass).length>0,`glazing at ${y},${z}`);
 }
 assert.ok(new THREE.Raycaster(new THREE.Vector3(0,1.4,.83),new THREE.Vector3(-1,0,0),0,4).intersectObject(wall).length>0,'mineral mullion separates the openings');
 disposeAtelierGroup(room);
});

test('bake conversion preserves authored unlit radiance and floor color without live shading or extra shadows',async()=>{
 const room=await loadRoom(),old=new Set(),disposed=new Map();room.traverse(object=>{if(object.isMesh)old.add(object.material);});
 for(const material of old)material.addEventListener('dispose',()=>disposed.set(material,(disposed.get(material)||0)+1));
 const roomMap=room.getObjectByName('Room_BackWall').material.map,floorMap=room.getObjectByName('Room_Floor').material.map;
 assert.ok(roomMap,'actual exporter stores room bake in base-color slot');
 for(const node of document.nodes.filter(item=>item.mesh!==undefined&&item.name!=='Room_Floor'&&!item.extras?.roomGlass))for(const primitive of document.meshes[node.mesh].primitives)assert.ok(document.materials[primitive.material].extensions?.KHR_materials_unlit,`${node.name}: authored bake is unlit`);
 prepareTreatmentRoom(room);
 room.traverse(object=>{if(!object.isMesh)return;if(object.userData.roomGlass){assert.ok(object.material.isMeshPhysicalMaterial);assert.equal(object.material.transmission,0);assert.equal(object.material.userData.traceGlass.transmission,1);return;}assert.ok(object.material.isMeshBasicMaterial);assert.equal(object.material.toneMapped,false);assert.equal(object.castShadow,false);assert.equal(object.receiveShadow,false);assert.equal(object.material.map.colorSpace,THREE.SRGBColorSpace);});
 assert.equal(room.getObjectByName('Room_BackWall').material.map,roomMap);assert.equal(room.getObjectByName('Room_BackWall').material.color.getHexString(),'ffffff');assert.equal(room.getObjectByName('Room_Floor').material.map,floorMap);
 assert.equal(disposed.size,old.size-1);assert.ok([...disposed.values()].every(count=>count===1));disposeAtelierGroup(room);
});

function checkClear(room,position,target,label){
 const camera=new THREE.PerspectiveCamera();camera.position.fromArray(position);camera.lookAt(...target);camera.updateMatrixWorld();const before=camera.matrixWorld.toArray();
 updateTreatmentView(room,camera,new THREE.Vector3(...target));room.updateMatrixWorld(true);
 const visible=[];room.traverse(object=>{if(object.isMesh&&object.visible&&object.name!=='Room_Floor')visible.push(object);});
 for(const point of [[0,.08,0],[0,.85,0],[0,1.70,0],[-.28,1.1,0],[.28,1.1,0]]){
  const origin=new THREE.Vector3(...position),direction=new THREE.Vector3(...point).sub(origin),distance=direction.length(),hits=new THREE.Raycaster(origin,direction.normalize(),.01,distance-.02).intersectObjects(visible,false);
  assert.equal(hits.length,0,`${label}: ${point} blocked by ${hits.map(hit=>hit.object.name).join(',')}`);
 }
 assert.deepEqual(camera.matrixWorld.toArray(),before,'view cutaway never moves camera');assert.equal(room.getObjectByName('Room_Floor').visible,true);
}

test('full standing orbit and named inspection cameras keep head, torso, feet and shoulders unobstructed',async()=>{
 const room=prepareTreatmentRoom(await loadRoom());
 for(let degrees=0;degrees<360;degrees+=15){const angle=THREE.MathUtils.degToRad(degrees);checkClear(room,[Math.sin(angle)*4.4,1.08,Math.cos(angle)*4.4],[0,.85,0],`orbit ${degrees}`);}
 for(const name of ['body','front','side','back']){const view=cameraView(name);checkClear(room,view.position,view.target,name);}
 // Detail cutaways must clear the selected region itself; the whole body can
 // naturally extend behind the close camera and is not the detail contract.
 for(const [position,target] of [[[0,1.15,.62],[0,1.1,0]],[[.9,1.3,0],[.28,1.265,0]],[[0,1.15,-.62],[0,1.1,0]]]){
  const camera=new THREE.PerspectiveCamera();camera.position.fromArray(position);camera.updateMatrixWorld();updateTreatmentView(room,camera,new THREE.Vector3(...target));
  const direction=new THREE.Vector3(...target).sub(camera.position),distance=direction.length(),visible=[];room.traverse(object=>{if(object.isMesh&&object.visible)visible.push(object);});assert.equal(new THREE.Raycaster(camera.position,direction.normalize(),.01,distance-.01).intersectObjects(visible,false).length,0);
 }
 disposeAtelierGroup(room);
});

test('room resources shared across meshes dispose exactly once, including both baked texture maps',async()=>{
 const room=prepareTreatmentRoom(await loadRoom()),resources=new Set(),counts=new Map();room.traverse(object=>{if(!object.isMesh)return;resources.add(object.geometry);resources.add(object.material);if(object.material.map)resources.add(object.material.map);});
 for(const resource of resources)resource.addEventListener('dispose',()=>counts.set(resource,(counts.get(resource)||0)+1));disposeAtelierGroup(room);assert.equal(counts.size,resources.size);assert.ok([...counts.values()].every(count=>count===1));
});

test('bench rubber feet meet the pour and four structural spigots bridge the authored trestle gaps',async()=>{
 const room=await loadRoom();room.updateMatrixWorld(true);
 const bed=room.getObjectByName('Room_TreatmentBed'),floor=new THREE.Box3().setFromObject(room.getObjectByName('Room_Floor'));
 assert.ok(Math.abs(new THREE.Box3().setFromObject(bed,true).min.y-floor.max.y)<1e-5,'rubber feet contact floor');
 // The join anchor inherits the tilted head section: measure actual vertices,
 // not the transformed local bounding box, for floor contact.
 const placement=new THREE.Matrix4().compose(new THREE.Vector3(1.6,-.0045,-1.5),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(-35)),new THREE.Vector3(1,1,1));
 const material=bed.material;material.side=THREE.DoubleSide;
 for(const x of [-.235,.235])for(const z of [-.57,.57]){
  // Cast horizontally through the previously empty 30 mm vertical interval.
  const local=new THREE.Vector3(x-.08,.115,z),start=local.applyMatrix4(placement);
  const direction=new THREE.Vector3(1,0,0).transformDirection(placement);
  assert.ok(new THREE.Raycaster(start,direction,0,.16).intersectObject(bed).length>=2,`structural bridge at ${x},${z}`);
 }
 disposeAtelierGroup(room);
});

test('glazing reaches its floor channel, rear wall connection and supported head channel',async()=>{
 const room=await loadRoom();room.updateMatrixWorld(true);
 const glass=new THREE.Box3().setFromObject(room.getObjectByName('Room_Glass')),frame=room.getObjectByName('Room_GlassFrame');
 assert.ok(frame?.isMesh,'physical floor, rear and head channels');
 assert.ok(glass.min.y<.03&&glass.max.y>2.97,'pane captured in bottom and head channels');
 assert.ok(glass.min.z< -2.965,'rear pane edge enters timber connection');
 const bound=new THREE.Box3().setFromObject(frame);assert.ok(bound.min.y<=-.0025+1e-5&&bound.max.y>=3,'frame contacts pour and wall head');
 disposeAtelierGroup(room);
});

test('perimeter ceiling details and floor uplights clear overhead inspection and remain independently bounded',async()=>{
 const room=prepareTreatmentRoom(await loadRoom()),camera=new THREE.PerspectiveCamera();
 for(const name of ['Room_CeilingRear','Room_CeilingRight','Room_FloorLampLeft','Room_FloorLampRight'])assert.ok(room.getObjectByName(name)?.isMesh,`${name}: authored fixture geometry`);
 camera.position.set(0,4.4,0);camera.updateMatrixWorld();updateTreatmentView(room,camera);
 for(const name of ['Room_CeilingRear','Room_CeilingRight'])assert.equal(room.getObjectByName(name).visible,false,`${name}: overhead cutaway`);
 for(const name of ['Room_FloorLampLeft','Room_FloorLampRight']){
  const fixture=room.getObjectByName(name);assert.ok(fixture.userData.occlusionBounds,'cache individual bounds');
  assert.ok(Math.abs(new THREE.Box3().setFromObject(fixture).min.y+.0025)<1e-5,'lamp base meets floor');
 }
 for(const height of [2.2,3.5,4.4])for(let degrees=0;degrees<360;degrees+=15){const angle=THREE.MathUtils.degToRad(degrees);checkClear(room,[Math.sin(angle)*3.5,height,Math.cos(angle)*3.5],[0,.85,0],`elevated ${height}/${degrees}`);}
 disposeAtelierGroup(room);
});
