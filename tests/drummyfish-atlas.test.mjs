import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {geometryFrom} from '../studio/body-loader.js';

const root = new URL('../studio/models/drummyfish/', import.meta.url);
const fixture = Promise.all(['male.json', 'shapes.json', 'provenance.json'].map(async name =>
  JSON.parse(await readFile(new URL(name, root), 'utf8'))));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const floatBytes = values => {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, i) => bytes.writeFloatLE(value, i * 4));
  return bytes;
};
function triangleAttributeHash(data, attribute, size) {
  const hash = createHash('sha256'), point = Buffer.alloc(size * 4);
  for (const vertex of data.indices) {
    for (let k = 0; k < size; k++) point.writeFloatLE(data[attribute][vertex * size + k], k * 4);
    hash.update(point);
  }
  return hash.digest('hex');
}

test('Drummyfish has separate finite tattoo and source-skin UV attributes', async () => {
  const [data, shapes] = await fixture, count = data.positions.length / 3;
  assert.equal(count, 15831);
  assert.equal(data.indices.length / 3, 8072);
  assert.equal(shapes.bodies.male.vertexCount, count);
  for (const attribute of ['uvs', 'sourceUVs']) {
    assert.equal(data[attribute].length, count * 2, attribute + ' count');
    assert.ok(data[attribute].every(Number.isFinite), attribute + ' finiteness');
    assert.ok(data[attribute].every(value => value > 0 && value < 1), attribute + ' unit range');
  }
  assert.notDeepEqual(data.uvs, data.sourceUVs, 'skin sampling cannot reuse the tattoo atlas');
  assert.equal(data.metadata.sourceTexture, true);
  assert.equal(data.metadata.clothingMode, 'mask');
  const geometry = geometryFrom(data);
  try {
    assert.equal(geometry.attributes.uv.count, count);
    assert.equal(geometry.attributes.sourceUV.count, count);
    assert.deepEqual(geometry.attributes.uv.array, new Float32Array(data.uvs));
    assert.deepEqual(geometry.attributes.sourceUV.array, new Float32Array(data.sourceUVs));
  } finally { geometry.dispose(); }
  // The browser module needs a WebGPU renderer to execute. Check its public
  // attribute contract here; rendered skin preservation is a separate UI check.
  const scene = await readFile(new URL('../studio/scene.js', import.meta.url), 'utf8');
  assert.match(scene, /texture\(active\.texture,\s*active\.data\.sourceUVs\s*\?\s*attribute\(['"]sourceUV['"],\s*['"]vec2['"]\)\s*:\s*uv\(\)\)/,
    'authored skin texture samples sourceUV while the tattoo atlas stays in uv');
});

test('Drummyfish supplied normals stay smooth at every coincident UV-seam vertex', async () => {
  const [data] = await fixture, count = data.positions.length / 3, coincident = new Map();
  assert.equal(data.normals.length, count * 3, 'one normal per exported vertex');
  assert.ok(data.normals.every(Number.isFinite));
  let repeated = 0;
  for (let i = 0; i < count; i++) {
    const point = data.positions.slice(i * 3, i * 3 + 3), normal = data.normals.slice(i * 3, i * 3 + 3);
    assert.ok(Math.abs(Math.hypot(...normal) - 1) < 2e-6, 'normal is unit length');
    const key = point.join(',');
    if (coincident.has(key)) {
      assert.deepEqual(normal, coincident.get(key), 'atlas seams preserve the connected surface normal');
      repeated++;
    } else coincident.set(key, normal);
  }
  assert.ok(repeated > 10000, 'test exercises the numerous real atlas seams');
});

test('Drummyfish atlas changes preserve frozen physical triangles, source UVs and source provenance', async () => {
  const [data, , provenance] = await fixture;
  // Pins predate the independent atlas. Hash face corners rather than vertex
  // arrays so duplicating vertices at a new UV seam cannot hide a surface edit.
  assert.equal(triangleAttributeHash(data, 'positions', 3), 'ce593addd9eb82fb9bbed8ddf8a4395f00476cd2599702a1bd3cf5e92da6c498');
  assert.equal(triangleAttributeHash(data, 'sourceUVs', 2), '8c279e5368b9f11e0702ace97388a064167958c40180d6afa784b2b7c724966d');
  assert.equal(sha(JSON.stringify(Object.fromEntries(Object.entries(data.metadata.regionAnchors).sort()))),
    'a6b53528b6f8b84fdc1874e4e19125a1ed80df31e2ea932d8e55d64ab9a7aedf');
  assert.equal(provenance.faceCount, 8072);
  assert.equal(provenance.vertexCount, data.positions.length / 3);
  assert.equal(provenance.assetLicense, 'CC0-1.0');
  // Runtime texture hashes are verified here; original Blender inputs are not distributed.
  for (const [name, source] of Object.entries(provenance.sourceFiles).filter(([name]) => !name.startsWith('source/'))) {
    const bytes = await readFile(new URL(name, root));
    assert.equal(sha(bytes), source.sha256, name + ' source hash');
    assert.equal(bytes.length, source.bytes, name + ' source bytes');
  }
  assert.equal(provenance.sourceFiles['source/male_3d.blend'].sha256, data.metadata.sourceSha256);
  assert.equal(provenance.sourceFiles['skin-original.png'].sha256, data.metadata.skinTextureSha256);
  assert.equal(data.metadata.skinTextureSha256, '6beeaab2942c559d3e1ace61269bcc373091accf8b82d3a08d925842aa1afc77');
  const indices = Buffer.alloc(data.indices.length * 4);
  data.indices.forEach((value, i) => indices.writeUInt32LE(value, i * 4));
  const identity = sha(Buffer.concat([floatBytes(data.positions), indices, floatBytes(data.uvs)]));
  assert.equal(identity, data.metadata.geometryIdentity);
  assert.equal(identity, provenance.geometryIdentity);
  assert.equal(sha(await readFile(new URL('male.json', root))), provenance.files['male.json'].sha256);
});

// Independent convex-polygon clipping audit. A spatial grid restricts exact
// triangle intersection to nearby UV boxes; shared edges have zero area.
const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const signedArea = polygon => polygon.reduce((sum, p, i) => {
  const q = polygon[(i + 1) % polygon.length]; return sum + p[0] * q[1] - q[0] * p[1];
}, 0) / 2;
function intersectionArea(subject, clip) {
  const winding = Math.sign(signedArea(clip));
  let polygon = subject;
  for (let edge = 0; edge < 3 && polygon.length; edge++) {
    const a = clip[edge], b = clip[(edge + 1) % 3], result = [];
    for (let i = 0; i < polygon.length; i++) {
      const from = polygon[i], to = polygon[(i + 1) % polygon.length];
      const dFrom = winding * side(a, b, from), dTo = winding * side(a, b, to);
      if (dFrom >= 0) result.push(from);
      if ((dFrom >= 0) !== (dTo >= 0)) {
        const ratio = dFrom / (dFrom - dTo);
        result.push([from[0] + ratio * (to[0] - from[0]), from[1] + ratio * (to[1] - from[1])]);
      }
    }
    polygon = result;
  }
  return polygon.length >= 3 ? Math.abs(signedArea(polygon)) : 0;
}

test('Drummyfish tattoo triangle interiors have no positive-area UV overlap', async t => {
  // Calibrate the audit against overlaps too narrow for a raster sample, and
  // ensure adjacency is not mistaken for duplicated tattoo coverage.
  const unit = [[0, 0], [1, 0], [0, 1]];
  assert.ok(intersectionArea(unit, [[0, 0], [0, 1], [1, 0]]) > .49);
  assert.ok(intersectionArea(unit, [[.999, 0], [1.999, 0], [.999, 1]]) > 1e-8);
  assert.equal(intersectionArea(unit, [[1, 0], [1, 1], [0, 1]]), 0);
  const [data] = await fixture, faceCount = data.indices.length / 3, triangles = [], boxes = [], cells = new Map(), pairs = new Set();
  const gridSize = 64, tolerance = 1e-10;
  for (let face = 0; face < faceCount; face++) {
    const triangle = [0, 1, 2].map(k => {
      const vertex = data.indices[face * 3 + k]; return data.uvs.slice(vertex * 2, vertex * 2 + 2);
    });
    assert.ok(Math.abs(signedArea(triangle)) > 1e-12, 'noncollapsed UV triangle ' + face);
    triangles.push(triangle);
    const x = triangle.map(p => p[0]), y = triangle.map(p => p[1]);
    const box = [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)]; boxes.push(box);
    for (let gx = Math.floor(box[0] * gridSize); gx <= Math.floor(box[2] * gridSize); gx++) {
      for (let gy = Math.floor(box[1] * gridSize); gy <= Math.floor(box[3] * gridSize); gy++) {
        const key = gx * gridSize + gy, occupants = cells.get(key) || [];
        for (const earlier of occupants) pairs.add(earlier * faceCount + face);
        occupants.push(face); cells.set(key, occupants);
      }
    }
  }
  assert.ok(pairs.size < 500000, 'broadphase stays bounded instead of scanning every triangle pair');
  let examined = 0;
  for (const pair of pairs) {
    const i = Math.floor(pair / faceCount), j = pair % faceCount, a = boxes[i], b = boxes[j];
    if (Math.min(a[2], b[2]) <= Math.max(a[0], b[0]) || Math.min(a[3], b[3]) <= Math.max(a[1], b[1])) continue;
    examined++;
    const overlap = intersectionArea(triangles[i], triangles[j]);
    assert.ok(overlap <= tolerance, `tattoo UV faces ${i}/${j} overlap by ${overlap}`);
  }
  t.diagnostic(`${faceCount} triangles; ${pairs.size} broadphase candidates; ${examined} exact intersections; no area overlap > ${tolerance}`);
});
