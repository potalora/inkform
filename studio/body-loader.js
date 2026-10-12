import * as THREE from 'three';
import {resolveBodyModel} from './model-catalog.js';

// Face details belong to the anatomical reference. Hair and clothing are excluded
// before fetching their geometry, textures or shape grids, including old studies.
export function isMannequinAccessory(descriptor) {
  return !descriptor.hideWithClothing && !descriptor.hideWithHair &&
    !/hair|scalp|tank|shorts|garment|cloth|underwear|brief|shirt|pants/i.test(descriptor.kind || '');
}

export function geometryFrom(data) {
  const geometry = new THREE.BufferGeometry();
  const count = data.positions.length / 3;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('basePosition', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('torsoMask', new THREE.Float32BufferAttribute(
    data.anatomicalWeights ? data.anatomicalWeights.filter((_, i) => i % 5 === 4) : new Float32Array(count), 1));
  geometry.setAttribute('clothingMask', new THREE.Float32BufferAttribute(data.clothingMask || new Float32Array(count), 1));
  if (data.uvs?.length) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
  if (data.sourceUVs?.length) geometry.setAttribute('sourceUV', new THREE.Float32BufferAttribute(data.sourceUVs, 2));
  geometry.setIndex(data.indices);
  if (data.normals?.length === data.positions.length && data.normals.every(Number.isFinite))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
  else geometry.computeVertexNormals();
  return geometry;
}

// A restrained iris material on the source-fitted eyeballs. Vertex colors work
// in both interactive backends and the path tracer without new eye geometry.
export function colorSourceEyes(geometry, descriptor) {
  if (!descriptor.irisCenters?.length || !(descriptor.irisRadius > 0)) return false;
  const positions=geometry.attributes.position, colors=new Float32Array(positions.count*3);
  const sclera=new THREE.Color(descriptor.color || '#d8d3c8'), iris=new THREE.Color('#65513b');
  const rim=new THREE.Color('#302b23'), pupil=new THREE.Color('#101214'), tone=new THREE.Color();
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const center=descriptor.irisCenters.reduce((a,b)=>Math.abs(x-a[0])<Math.abs(x-b[0])?a:b);
    const radius=Math.hypot(x-center[0],y-center[1])/descriptor.irisRadius;
    tone.copy(sclera);
    if(z>center[2] && radius<1.08){
      tone.copy(radius<.42?pupil:radius>.88?rim:iris);
      if(radius>1)tone.lerp(sclera,(radius-1)/.08);
    }
    tone.toArray(colors,i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return true;
}

// Models are loaded by identity and anatomy, so opening a saved legacy study does
// not download another character's geometry, garments or shape grids.
// High maps contain additional source texels, never an upscaled standard map.
// Keep touch/small-screen devices on the bounded 2K delivery assets.
export function bodyTextureDetail(request = 'auto', compact = globalThis.matchMedia?.('(max-width: 700px), (pointer: coarse)')?.matches ?? false) {
  return request === 'high' || (request === 'auto' && !compact) ? 'high' : 'standard';
}

export function createBodyLibrary({scene, skin, loader, surface, fetcher = fetch, textureDetail = 'auto', textureAnisotropy = 4}) {
  const pending = new Map(), loaded = [], texturePool = new Map(), textureOwners = new WeakMap();
  let disposed = false;
  let latestRequestedId = null;
  const detail = bodyTextureDetail(textureDetail);
  async function loadTexture(path, color = false) {
    const key = path + '|' + color;
    let entry = texturePool.get(key);
    if (!entry) {
      entry = {key, references:0};
      entry.promise = loader.loadAsync(path).then(result => {
        result.anisotropy = Math.max(1, Math.min(16, Number(textureAnisotropy) || 1));
        if (color) result.colorSpace = THREE.SRGBColorSpace;
        textureOwners.set(result, entry);return result;
      }).catch(error => {if(texturePool.get(key) === entry) texturePool.delete(key);throw error;});
      texturePool.set(key, entry);
    }
    entry.references++;
    return entry.promise;
  }
  function releaseTexture(texture) {
    if (!texture) return;
    const entry = textureOwners.get(texture);
    if (entry && --entry.references > 0) return;
    if (entry) {texturePool.delete(entry.key);textureOwners.delete(texture);}
    texture.dispose();
  }
  async function json(path) {
    const response = await fetcher(path);
    if (!response.ok) throw Error('Body reference could not be loaded. Please retry.');
    return response.json();
  }
  async function delta(path, count) {
    const response = await fetcher(path);
    if (!response.ok) throw Error('Body proportions could not be loaded. Please retry.');
    const values = new Float32Array(await response.arrayBuffer());
    if (values.length !== count * 3 * 9 || !values.every(Number.isFinite)) throw Error('Body proportions do not match this reference.');
    return values;
  }
  function piece(data, mesh) {
    const base = mesh.geometry.attributes.position.array.slice(), groups = new Map();
    for (let i = 0; i < base.length / 3; i++) {
      const key = base.slice(i * 3, i * 3 + 3).join(',');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    }
    return {data, mesh, geometry:mesh.geometry, base, groups,
      weights:new Float32Array(data.anatomicalWeights || base.length / 3 * 5)};
  }
  function release(body) {
    for (const part of [body, ...(body.accessories || [])]) {
      scene.remove(part.mesh);part.geometry.dispose();
      if (part !== body) {releaseTexture(part.mesh.material.map);part.mesh.material.dispose();}
    }
    body.referenceMesh?.geometry.dispose();body.referenceMesh?.material.dispose();
    releaseTexture(body.texture);releaseTexture(body.normalTexture);releaseTexture(body.heightTexture);
  }
  async function load(model, anatomy) {
    if (disposed) throw Error('Studio is closed.');
    const catalog = resolveBodyModel(model), key = catalog.id + ':' + anatomy;
    latestRequestedId = key;
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      const root = catalog.basePath;
      const [data, shapes] = await Promise.all([json(catalog.bodyFiles[anatomy]), json(catalog.shapes)]);
      const spec = shapes.bodies?.[anatomy];
      if (!spec || spec.vertexCount !== data.positions?.length / 3 || spec.endpoints?.length !== 9)
        throw Error('Body proportions do not match this reference.');
      const geometry = geometryFrom(data);
      const body = {...piece(data, new THREE.Mesh(geometry, skin)), id:key, modelId:catalog.id, static:spec.static===true,
        anatomy, endpoints:spec.endpoints, anchors:new Map(), accessories:[],
        referenceMesh:new THREE.Mesh(geometryFrom(data), new THREE.MeshBasicMaterial())};
      try {
        if (!body.static) body.shapeGrid = await delta(root + spec.positions, spec.vertexCount);
        const meta = data.metadata || {};
        const texturePath = path => path.startsWith('./') || path.startsWith('/') ? path : root + path;
        const mapPath = key => detail === 'high' && meta[key + 'High'] || meta[key];
        if (meta.skinTexture) body.texture = await loadTexture(texturePath(mapPath('skinTexture')), true);
        if (meta.normalTexture) body.normalTexture = await loadTexture(texturePath(mapPath('normalTexture')));
        if (meta.heightTexture) body.heightTexture = await loadTexture(texturePath(mapPath('heightTexture')));
        const accessories = [...(data.accessories || [])];
        if (meta.eyes) accessories.push({kind:'eyes',file:meta.eyes,optionalTexture:meta.eyeTexture,color:'#d2c8b9',roughness:.3,legacy:true});
        for (const descriptor of accessories.filter(isMannequinAccessory)) {
          const accessoryData = await json(texturePath(descriptor.file));
          const material = new THREE.MeshPhysicalNodeMaterial({
            color:descriptor.color || '#252525',roughness:descriptor.roughness ?? .85,
            metalness:descriptor.metalness ?? 0,ior:1.4,specularIntensity:descriptor.specularIntensity ?? .4,
            side:descriptor.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
            transparent:!!descriptor.transparent,opacity:descriptor.opacity ?? 1,
            alphaTest:descriptor.alphaTest ?? 0,
          });
          const accessory = {...piece(accessoryData, new THREE.Mesh(geometryFrom(accessoryData), material)), descriptor};
          if(colorSourceEyes(accessory.geometry,descriptor)){material.color.set('#ffffff');material.vertexColors=true;}
          body.accessories.push(accessory);
          if (descriptor.optionalTexture) material.map = await loadTexture(texturePath(descriptor.optionalTexture), true);
          const grid = descriptor.legacy ? spec.eyes : accessoryData.metadata?.shapePositions || spec.accessories?.[descriptor.kind]?.positions;
          if (grid) accessory.shapeGrid = await delta(root + grid, accessory.base.length / 3);
          accessory.mesh.castShadow = !/eye|cornea|iris/i.test(descriptor.kind);
          accessory.mesh.receiveShadow = true;accessory.mesh.visible = false;
        }
        if (disposed) throw Error('Studio closed while the reference was loading.');
        await surface.setBody({id:key,basePositions:body.base,indices:geometry.index.array,weights:body.weights,
          metadata:meta,clothingMasks:geometry.attributes.clothingMask.array,torsoMasks:geometry.attributes.torsoMask.array});
        if (disposed) throw Error('Studio closed while the reference was loading.');
        body.mesh.castShadow=true;body.mesh.receiveShadow=true;body.mesh.visible=false;
        scene.add(body.mesh, ...body.accessories.map(a=>a.mesh));loaded.push(body);
        return body;
      } catch (error) {release(body);throw error;}
    })();
    pending.set(key, task);
    task.catch(() => {if (pending.get(key)===task) pending.delete(key);});
    return task;
  }
  // The caller owns the render/GPU fence: trim only after no submitted frame
  // or pending scene update can still reference an inactive body.
  async function trim(keepId) {
    if (disposed) return;
    if (!loaded.some(body => body.id === keepId)) throw Error('Active body must be loaded before trimming.');
    for (const body of [...loaded]) {
      if (latestRequestedId !== keepId || disposed) return;
      if (body.id === keepId || !loaded.includes(body)) continue;
      // Detach synchronously. A simultaneous request for this identity must
      // create/register a fresh body after the queued worker release.
      loaded.splice(loaded.indexOf(body), 1);pending.delete(body.id);
      try {await surface.releaseBody?.(body.id);} finally {release(body);}
    }
  }
  return {load,loaded,trim,dispose(){disposed=true;pending.clear();for(const body of loaded)release(body);loaded.length=0;}};
}
