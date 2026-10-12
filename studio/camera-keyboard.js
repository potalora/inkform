/** Handle camera keys delivered by the focused canvas; OrbitControls owns limits and change events. */
export function handleCameraKey(event, controls) {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || controls.enabled === false) return false;
  const angle = Math.PI / 36;
  let method, amount;
  switch (event.key) {
    case 'ArrowLeft': method = 'rotateLeft'; amount = angle; break;
    case 'ArrowRight': method = 'rotateLeft'; amount = -angle; break;
    case 'ArrowUp': method = 'rotateUp'; amount = angle; break;
    case 'ArrowDown': method = 'rotateUp'; amount = -angle; break;
    case '+':
    case '=': method = 'dollyIn'; amount = .9; break;
    case '-': method = 'dollyOut'; amount = .9; break;
    default: return false;
  }
  if (method.startsWith('rotate') ? controls.enableRotate === false : controls.enableZoom === false) return false;
  event.preventDefault();
  controls[method](amount);
  return true;
}
