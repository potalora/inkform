import {BODY_MODELS, LEGACY_MODEL_ID} from './model-catalog.js';
import {STORAGE_LIMITS as LIMITS} from './storage-limits.js';

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const BODY_RANGES = {stature: [150,205], build: [-30,40], shoulders: [-20,25], waist: [-25,35], hips: [-20,30], arms: [-25,40], legs: [-25,35], bust: [-25,35]};
const OPTIONAL_BODY_RANGES = {mass: [0,100,50], muscle: [0,100,50], armsLeft: [-20,20,0], armsRight: [-20,20,0], legsLeft: [-20,20,0], legsRight: [-20,20,0], abdomen: [-20,20,0]};
const BODY_KEYS = new Set([...Object.keys(BODY_RANGES), ...Object.keys(OPTIONAL_BODY_RANGES), 'bodyModelId','body','skin','skinColor','clothing','hair']);
const SKINS = new Set(['light','medium','tan','dark','custom', ...Array.from({length:10}, (_, i) => 'monk' + String(i + 1).padStart(2,'0'))]);
const REGIONS = new Set('leftUpperArm rightUpperArm leftForearm rightForearm chest back abdomen leftThigh rightThigh leftCalf rightCalf neck leftHand rightHand leftFoot rightFoot head custom'.split(' '));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value, low, high) => typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high;
const text = (value, limit, required = true) => typeof value === 'string' && wellFormed(value) && Array.from(value).length <= limit && (!required || Boolean(value.trim()));
const safeId = value => typeof value === 'string' && ID.test(value);
const fail = message => {const error = Error(message); error.status = 400; throw error;};
export const jsonBytes = value => new TextEncoder().encode(JSON.stringify(value)).byteLength;

function wellFormed(value) {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) return false;
    } else if (code >= 0xDC00 && code <= 0xDFFF) return false;
  }
  return true;
}

function isoTimestamp(value) {
  if (!text(value,100)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (!match) return false;
  const [,year,month,day,hour = '0',minute = '0',second = '0'] = match;
  const leap = Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0);
  const days = [31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
  return Number(year) > 0 && Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= days[Number(month) - 1]
    && Number(hour) < 24 && Number(minute) < 60 && Number(second) < 60 && Number.isFinite(Date.parse(value));
}

/** Reject values JSON would silently discard or change, including unknown extra fields. */
function finiteJson(value, seen = new Set(), depth = 0) {
  if (depth > 100) fail('Workspace JSON is nested too deeply');
  if (typeof value === 'string') {if (!wellFormed(value)) fail('Workspace strings must contain valid Unicode'); return;}
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') {if (!Number.isFinite(value)) fail('Workspace numbers must be finite'); return;}
  if (typeof value !== 'object' || seen.has(value) || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) fail('Workspace must contain valid JSON');
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (!wellFormed(key)) fail('Workspace keys must contain valid Unicode');
    finiteJson(child, seen, depth + 1);
  }
  seen.delete(value);
}

export function* assetReferences(value) {
  if (value === null || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if ((key === 'assetId' || key === 'uploadedAssetId') && child !== null) yield child;
    yield* assetReferences(child);
  }
}

export function validateWorkspace(value, assetIds) {
  if (!isObject(value)) fail('Workspace must be an object');
  const projects = value.projects;
  if (!Array.isArray(projects) || projects.length > LIMITS.maxProjects) fail('projects must be a list of at most 100 projects');
  finiteJson(projects);
  const ids = new Set();
  for (const project of projects) {
    if (!isObject(project) || !safeId(project.id)) fail('Each project requires a safe string id');
    if (ids.has(project.id)) fail('Duplicate project id');
    ids.add(project.id);
    if (!text(project.name,120)) fail('Project name must contain 1 to 120 characters');
    const body = project.body;
    if (!isObject(body) || Object.keys(body).some(key => !BODY_KEYS.has(key))) fail('Invalid body settings');
    const modelId = body.bodyModelId === undefined ? LEGACY_MODEL_ID : body.bodyModelId;
    if (typeof modelId !== 'string' || !Object.hasOwn(BODY_MODELS, modelId)) fail('Unsupported body model');
    const model = BODY_MODELS[modelId];
    if ('hair' in body && typeof body.hair !== 'boolean') fail('Invalid hair setting');
    if (!(model.anatomies || ['male','female']).includes(body.body) || !SKINS.has(body.skin) || typeof body.clothing !== 'boolean') fail('Invalid body model, skin or clothing');
    if (('skinColor' in body || body.skin === 'custom') && (typeof body.skinColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.skinColor))) fail('skinColor must be an exact #RRGGBB color');
    for (const [key,[low,high]] of Object.entries(BODY_RANGES)) if (!number(body[key],low,high)) fail('Invalid body ' + key);
    for (const [key,[low,high,fallback]] of Object.entries(OPTIONAL_BODY_RANGES)) if (!number(body[key] === undefined ? fallback : body[key],low,high)) fail('Invalid body ' + key);
    const tattoos = project.tattoos;
    if (!Array.isArray(tattoos) || tattoos.length > LIMITS.maxLayers) fail('Each project permits at most 16 tattoos');
    const tattooIds = new Set();
    for (const tattoo of tattoos) {
      if (!isObject(tattoo) || !safeId(tattoo.id) || tattooIds.has(tattoo.id)) fail('Tattoo ids must be unique safe strings');
      tattooIds.add(tattoo.id);
      if (typeof tattoo.assetId !== 'string' || !assetIds.has(tattoo.assetId)) fail('Unknown tattoo asset');
      if (!text(tattoo.name,255) || !REGIONS.has(tattoo.region)) fail('Invalid tattoo name or region');
      for (const [key,low,high] of [['width',.5,40],['opacity',.1,1],['rotation',-180,180],['offsetX',-30,30],['offsetY',-30,30]]) if (!number(tattoo[key],low,high)) fail('Invalid tattoo ' + key);
      for (const key of ['flip','visible','locked','existing']) if (typeof tattoo[key] !== 'boolean') fail('Invalid tattoo ' + key);
      const anchor = tattoo.placement;
      if (anchor != null) {
        if (!isObject(anchor) || !Number.isInteger(anchor.faceIndex) || !number(anchor.faceIndex,0,model.faceCount - 1)) fail('Invalid placement face');
        const bary = anchor.barycentric;
        if (!Array.isArray(bary) || bary.length !== 3 || !bary.every(n => number(n,0,1)) || Math.abs(bary.reduce((a,b) => a + b,0) - 1) > .001) fail('Invalid placement barycentric coordinates');
      }
    }
    const selected = project.selectedIds;
    if (!Array.isArray(selected) || selected.length > LIMITS.maxLayers || !selected.every(id => typeof id === 'string' && tattooIds.has(id)) || new Set(selected).size !== selected.length) fail('Invalid selectedIds');
    const camera = project.camera;
    if (camera != null) {
      if (!isObject(camera)) fail('Invalid camera');
      for (const key of ['position','target']) if (!Array.isArray(camera[key]) || camera[key].length !== 3 || !camera[key].every(n => number(n,-20,20))) fail('Invalid camera ' + key);
      const distance = Math.hypot(...camera.position.map((n,i) => n - camera.target[i]));
      if (!number(distance,.01,10)) fail('Invalid camera distance');
    }
    if (!isoTimestamp(project.updatedAt)) fail('Project updatedAt must be an ISO timestamp');
    if ('notes' in project && !text(project.notes,5000,false)) fail('Invalid study notes');
    if (jsonBytes(project) > LIMITS.maxProjectBytes) fail('Project exceeds 2 MB');
    for (const ref of assetReferences(project)) if (typeof ref !== 'string' || !assetIds.has(ref)) fail('Unknown asset reference');
  }
  if (jsonBytes(projects) > LIMITS.maxProjectJsonBytes) fail('Workspace projects exceed 8 MiB. Export a backup and remove unused studies.');
  const activeProjectId = value.activeProjectId ?? null;
  if (activeProjectId !== null && (typeof activeProjectId !== 'string' || !ids.has(activeProjectId))) fail('activeProjectId must identify a project');
  return {projects, activeProjectId};
}

export function validateStorageTotals(assets) {
  if (assets.length > LIMITS.maxAssets) fail('Workspace permits at most 500 assets. Export a backup and remove unused artwork.');
  if (assets.reduce((sum, asset) => sum + asset.blob.size, 0) > LIMITS.maxArtworkBytes) fail('Workspace artwork exceeds 96 MiB. Export a backup and remove unused artwork.');
}

const CRC_TABLE = Uint32Array.from({length:256}, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value & 1) ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function pngCrc(bytes, start, end) {
  let crc = 0xFFFFFFFF;
  for (let i = start; i < end; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Read only raster container headers before decoding, so extreme dimensions never
// reach the browser decoder. The native decoder still verifies the whole image.
function imageHeader(bytes, mime) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (at,n) => String.fromCharCode(...bytes.subarray(at,at + n));
  if (mime === 'image/png') {
    if (bytes.length < 33 || ascii(0,8) !== '\x89PNG\r\n\x1a\n' || view.getUint32(8) !== 13 || ascii(12,4) !== 'IHDR') fail('Invalid PNG image signature or header');
    let hasImageData = false, ended = false;
    for (let at = 8; at + 12 <= bytes.length;) {
      const size = view.getUint32(at), type = ascii(at + 4,4);
      if (size > bytes.length - at - 12) fail('Truncated PNG image');
      if (type === 'acTL') fail('Animated images are not supported; export a still image.');
      if (!/^[A-Za-z]{4}$/.test(type) || (type === 'IHDR' && at !== 8)) fail('Invalid PNG chunk header');
      if (pngCrc(bytes,at + 4,at + 8 + size) !== view.getUint32(at + 8 + size)) fail('Invalid PNG chunk CRC');
      if (type === 'IDAT' && size > 0) hasImageData = true;
      at += size + 12;
      if (type === 'IEND') {
        if (size !== 0 || at !== bytes.length) fail('Invalid PNG terminating IEND chunk');
        ended = true;
        break;
      }
    }
    if (!ended || !hasImageData) fail('PNG requires image data and a terminating IEND chunk');
    return [view.getUint32(16),view.getUint32(20)];
  }
  if (mime === 'image/jpeg') {
    if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) fail('Invalid JPEG image signature');
    if (bytes.at(-2) !== 255 || bytes.at(-1) !== 217) fail('Truncated JPEG image: missing end marker');
    let dimensions;
    for (let at = 2; at < bytes.length;) {
      if (bytes[at++] !== 255) fail('Invalid JPEG image header');
      while (bytes[at] === 255) at++;
      const marker = bytes[at++];
      if (marker === 0xDA || marker === 0xD9) break;
      if (marker === 1 || (marker >= 0xD0 && marker <= 0xD7)) continue;
      if (at + 2 > bytes.length) break;
      const size = view.getUint16(at);
      if (size < 2 || size > bytes.length - at) fail('Truncated JPEG image');
      if ([0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF].includes(marker)) {
        if (size < 8) fail('Invalid JPEG dimensions');
        const frame = [view.getUint16(at + 5),view.getUint16(at + 3)];
        if (frame[0] * frame[1] > LIMITS.maxDecodedPixels) fail('Image exceeds 16,777,216 decoded pixels');
        if (dimensions && (dimensions[0] !== frame[0] || dimensions[1] !== frame[1])) fail('JPEG frame dimensions do not match');
        dimensions = frame;
      }
      at += size;
    }
    if (!dimensions) fail('JPEG dimensions could not be read');
    return dimensions;
  }
  if (bytes.length < 20 || ascii(0,4) !== 'RIFF' || ascii(8,4) !== 'WEBP' || view.getUint32(4,true) + 8 > bytes.length) fail('Invalid WebP image signature or truncated image');
  let dimensions, frameDimensions;
  for (let at = 12; at + 8 <= bytes.length;) {
    const type = ascii(at,4), size = view.getUint32(at + 4,true), start = at + 8;
    if (size > bytes.length - start) fail('Truncated WebP image');
    if (type === 'ANIM' || type === 'ANMF' || (type === 'VP8X' && size >= 10 && (bytes[start] & 2))) fail('Animated images are not supported; export a still image.');
    if (type === 'VP8X' && size >= 10) {
      const uint24 = n => bytes[n] + (bytes[n + 1] << 8) + (bytes[n + 2] << 16);
      dimensions = [uint24(start + 4) + 1,uint24(start + 7) + 1];
    } else if (type === 'VP8 ' && size >= 10 && ascii(start + 3,3) === '\x9d\x01\x2a') frameDimensions = [view.getUint16(start + 6,true) & 0x3FFF,view.getUint16(start + 8,true) & 0x3FFF];
    else if (type === 'VP8L' && size >= 5 && bytes[start] === 0x2F) {
      const packed = view.getUint32(start + 1,true);
      frameDimensions = [(packed & 0x3FFF) + 1,((packed >>> 14) & 0x3FFF) + 1];
    }
    // VP8X advertises canvas size separately from the embedded raster. Check
    // both before decode; a tiny canvas must not conceal an excessive frame.
    for (const shape of [dimensions,frameDimensions]) if (shape && shape[0] * shape[1] > LIMITS.maxDecodedPixels) fail('Image exceeds 16,777,216 decoded pixels');
    if (dimensions && frameDimensions && (dimensions[0] !== frameDimensions[0] || dimensions[1] !== frameDimensions[1])) fail('WebP canvas and image dimensions do not match');
    at = start + size + (size % 2);
  }
  if (!frameDimensions) fail('WebP dimensions could not be read');
  return dimensions || frameDimensions;
}

/** Inspect original upload dimensions before downscaling or native decoding. */
export async function preflightRaster(blob) {
  if (!blob || !Number.isFinite(blob.size) || blob.size < 1) fail('Image data required');
  if (blob.size > LIMITS.maxImageBytes) fail('Image exceeds 20 MiB');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const ascii = (at,n) => String.fromCharCode(...bytes.subarray(at,at + n));
  let mime;
  if (ascii(0,8) === '\x89PNG\r\n\x1a\n') mime = 'image/png';
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) mime = 'image/jpeg';
  else if (ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP') mime = 'image/webp';
  else fail('Only PNG, JPEG and WebP raster image signatures are accepted');
  if (blob.type && blob.type !== mime) fail('Image MIME type does not match its raster format');
  const [width,height] = imageHeader(bytes,mime);
  if (![width,height].every(n => Number.isInteger(n) && number(n,1,32768))) fail('Image dimensions must be integers from 1 to 32768');
  if (width * height > LIMITS.maxDecodedPixels) fail('Image exceeds 16,777,216 decoded pixels');
  return {mime,width,height};
}

async function decodeImage(blob, browser) {
  if (browser.decodeImage) return browser.decodeImage(blob);
  const bitmapDecoder = browser.createImageBitmap?.bind(browser) || globalThis.createImageBitmap?.bind(globalThis);
  if (bitmapDecoder) {
    const bitmap = await bitmapDecoder(blob, {imageOrientation:'none'});
    try {return {width:bitmap.width,height:bitmap.height};} finally {bitmap.close();}
  }
  const Image = browser.Image || globalThis.Image, URL = browser.URL || globalThis.URL;
  if (!Image || !URL?.createObjectURL) fail('Image decoding is unavailable in this browser');
  const url = URL.createObjectURL(blob);
  try {const image = new Image(); image.src = url; await image.decode(); return {width:image.naturalWidth || image.width,height:image.naturalHeight || image.height};}
  finally {URL.revokeObjectURL(url);}
}

export async function validateAsset(value, {keepId = false, browser = {}} = {}) {
  if (!isObject(value)) fail('Asset must be an object');
  if (!text(value.name,255)) fail('Asset name required (255 characters maximum)');
  if (![value.width,value.height].every(n => Number.isInteger(n) && number(n,1,32768))) fail('Image dimensions must be integers from 1 to 32768');
  if (value.width * value.height > LIMITS.maxDecodedPixels) fail('Image exceeds 16,777,216 decoded pixels');
  const legacyWhite = value.legacyWhite === undefined ? false : value.legacyWhite;
  if (typeof legacyWhite !== 'boolean') fail('legacyWhite must be boolean');
  const id = keepId ? value.id : (browser.crypto || globalThis.crypto).randomUUID();
  if (!safeId(id)) fail('Invalid asset id');
  if (keepId && value.createdAt != null && !text(value.createdAt,100,false)) fail('Invalid createdAt');
  if (typeof value.dataUrl !== 'string') fail('Image dataUrl required');
  if (value.dataUrl.length > Math.ceil(LIMITS.maxImageBytes / 3) * 4 + 1024) fail('Image exceeds 20 MiB');
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value.dataUrl);
  if (!match) fail('Only base64 PNG, JPEG and WebP images are accepted');
  const base64 = match[2].replace(/[\r\n]/g,'');
  // Avoid repeating grouped base64 quartets: regex engines can exhaust their
  // stack on an otherwise valid image near the documented 20 MiB limit.
  if (base64.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) fail('Invalid base64 image');
  const size = base64.length / 4 * 3 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (size > LIMITS.maxImageBytes) fail('Image exceeds 20 MiB');
  let bytes;
  try {bytes = Uint8Array.from((browser.atob || globalThis.atob)(base64), c => c.charCodeAt(0));} catch {fail('Invalid base64 image');}
  const mime = match[1], [width,height] = imageHeader(bytes,mime);
  if (width * height > LIMITS.maxDecodedPixels) fail('Image exceeds 16,777,216 decoded pixels');
  if (width !== value.width || height !== value.height) fail('Image dimensions do not match image metadata');
  const Blob = browser.Blob || globalThis.Blob, blob = new Blob([bytes], {type:mime});
  let decoded;
  try {decoded = await decodeImage(blob,browser);} catch {fail('Could not decode a valid image. Export a still PNG, JPEG or WebP and retry.');}
  if (decoded.width !== width || decoded.height !== height) fail('Decoded image dimensions do not match image metadata');
  return {id,name:value.name,mime,width,height,createdAt:(keepId && value.createdAt) || new Date().toISOString(),legacyWhite,blob};
}

export async function validateBackup(value, {browser = {}} = {}) {
  if (!isObject(value) || value.version !== 3 || !Array.isArray(value.assets)) fail('Invalid version 3 backup');
  if (value.assets.length > LIMITS.maxAssets) fail('Workspace permits at most 500 assets');
  const ids = new Set();
  for (const asset of value.assets) {
    if (!isObject(asset) || !safeId(asset.id)) fail('Invalid asset id');
    if (ids.has(asset.id)) fail('Duplicate asset ids');
    ids.add(asset.id);
  }
  const workspace = validateWorkspace(value,ids);
  const assets = [];
  for (const asset of value.assets) {
    assets.push(await validateAsset(asset,{keepId:true,browser}));
    validateStorageTotals(assets);
  }
  return {...workspace,assets};
}
