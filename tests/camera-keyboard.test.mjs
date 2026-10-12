import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {handleCameraKey} from '../studio/camera-keyboard.js';

function fixture(t) {
  const document = {addEventListener() {}, removeEventListener() {}};
  const element = {style: {}, addEventListener() {}, removeEventListener() {}, ownerDocument: document, getRootNode: () => document};
  const camera = new PerspectiveCamera(34, 1, .01, 20);
  camera.position.set(0, 0, 3);
  const controls = new OrbitControls(camera, element);
  Object.assign(controls, {enableDamping: true, dampingFactor: .09, minDistance: .22, maxDistance: 4.5, maxPolarAngle: Math.PI * .91});
  t.after(() => controls.dispose());
  const settle = () => { for (let i = 0; i < 240; i++) controls.update(); };
  const press = (key, modifiers = {}) => {
    let prevented = false;
    const handled = handleCameraKey({key, ...modifiers, preventDefault() { prevented = true; }}, controls);
    return {handled, prevented};
  };
  return {camera, controls, settle, press};
}

test('arrow shortcuts orbit the real controls without panning or changing distance', async t => {
  for (const [key, axis, sign] of [['ArrowLeft', 'x', -1], ['ArrowRight', 'x', 1], ['ArrowUp', 'y', 1], ['ArrowDown', 'y', -1]]) {
    await t.test(key, t => {
      const {camera, controls, press, settle} = fixture(t), target = controls.target.clone();
      let changes = 0;
      controls.addEventListener('change', () => changes++);
      assert.deepEqual(press(key), {handled: true, prevented: true});
      settle();
      assert.ok(camera.position[axis] * sign > .1, 'camera moves in the requested orbit direction');
      assert.ok(Math.abs(camera.position.distanceTo(target) - 3) < 1e-10);
      assert.deepEqual(controls.target, target);
      assert.ok(changes > 0, 'public controls methods emit the existing render/camera change event');
    });
  }
});

test('plus and equals zoom in, minus zooms out with real perspective controls', t => {
  const {camera, controls, press} = fixture(t);
  for (const key of ['+', '=']) {
    const before = camera.position.distanceTo(controls.target);
    assert.deepEqual(press(key), {handled: true, prevented: true});
    assert.ok(camera.position.distanceTo(controls.target) < before);
  }
  const before = camera.position.distanceTo(controls.target);
  assert.deepEqual(press('-'), {handled: true, prevented: true});
  assert.ok(camera.position.distanceTo(controls.target) > before);
});

test('repeated shortcuts respect the current orbit and distance limits', t => {
  const {camera, controls, press, settle} = fixture(t);
  Object.assign(controls, {minPolarAngle: .4, maxPolarAngle: 2.1, minAzimuthAngle: -.3, maxAzimuthAngle: .3, minDistance: .7, maxDistance: 3.7});
  for (const [key, angle, limit] of [['ArrowLeft', 'getAzimuthalAngle', -.3], ['ArrowRight', 'getAzimuthalAngle', .3], ['ArrowUp', 'getPolarAngle', .4], ['ArrowDown', 'getPolarAngle', 2.1]]) {
    for (let i = 0; i < 180; i++) press(key);
    settle();
    assert.ok(Math.abs(controls[angle]() - limit) < 1e-10, `${key} respects configured angle limit`);
  }
  for (const [key, limit] of [['+', .7], ['-', 3.7]]) {
    for (let i = 0; i < 180; i++) press(key);
    settle();
    assert.ok(Math.abs(camera.position.distanceTo(controls.target) - limit) < 1e-10, `${key} respects configured distance limit`);
  }
});

test('browser shortcuts, composition and unrelated keys are neither handled nor prevented', t => {
  const {camera, press} = fixture(t), before = camera.position.toArray();
  for (const modifiers of [{ctrlKey: true}, {metaKey: true}, {altKey: true}, {isComposing: true}, {defaultPrevented: true}]) {
    for (const key of ['ArrowLeft', '+', '-']) assert.deepEqual(press(key, modifiers), {handled: false, prevented: false});
  }
  for (const key of ['Tab', 'Escape', 'Enter', 'a', ' ']) assert.deepEqual(press(key), {handled: false, prevented: false});
  assert.deepEqual(camera.position.toArray(), before);
});

test('disabled camera interactions retain their pointer interaction policy', t => {
  const {camera, controls, press} = fixture(t), before = camera.position.toArray();
  controls.enabled = false;
  assert.deepEqual(press('ArrowLeft'), {handled: false, prevented: false});
  assert.deepEqual(press('+'), {handled: false, prevented: false});
  controls.enabled = true; controls.enableRotate = false; controls.enableZoom = false;
  assert.deepEqual(press('ArrowUp'), {handled: false, prevented: false});
  assert.deepEqual(press('-'), {handled: false, prevented: false});
  assert.deepEqual(camera.position.toArray(), before);
});
