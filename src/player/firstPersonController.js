import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as THREE from 'three';

export function createPlayer(camera, renderer, scene, city) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  const keys = { forward:false, backward:false, left:false, right:false, sprint:false };
  const player = new THREE.Group();
  player.position.set(-500, 1.7, 0);
  scene.add(player);
  camera.position.set(0, 0, 0);
  camera.rotation.order = 'YXZ';
  player.add(camera);
  const colliders = city?.userData?.colliders || [];
  let touchActive = false;
  let lookPointer = null;
  let lastLookX = 0, lastLookY = 0;

  const keyMap = {
    KeyW:'forward', ArrowUp:'forward', KeyS:'backward', ArrowDown:'backward',
    KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right', ShiftLeft:'sprint'
  };
  const onDown = e => { if (keyMap[e.code]) keys[keyMap[e.code]] = true; };
  const onUp = e => { if (keyMap[e.code]) keys[keyMap[e.code]] = false; };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  renderer.domElement.addEventListener('click', () => {
    if (matchMedia('(pointer:fine)').matches) controls.lock();
  });

  // Touch controls: directional pad on the left, drag-to-look on the right.
  const mobile = document.createElement('div');
  mobile.id = 'mobile-controls';
  mobile.innerHTML = `
    <div class="move-pad">
      <button data-key="forward" aria-label="Forward">▲</button>
      <div><button data-key="left" aria-label="Left">◀</button><button data-key="backward" aria-label="Backward">▼</button><button data-key="right" aria-label="Right">▶</button></div>
      <button data-key="sprint" class="run" aria-label="Run">RUN</button>
    </div>
    <div class="look-hint">اسحب هنا لتحريك الكاميرا</div>`;
  const style = document.createElement('style');
  style.textContent = `
    #mobile-controls{display:none;position:fixed;inset:0;z-index:5;pointer-events:none;touch-action:none;font-family:Arial,sans-serif}
    .move-pad{position:absolute;left:18px;bottom:22px;display:flex;flex-direction:column;align-items:center;gap:7px;pointer-events:auto}
    .move-pad>div{display:flex;gap:7px}
    .move-pad button{width:48px;height:48px;border:1px solid #ffffff80;border-radius:13px;background:#152432b8;color:white;font-size:20px;touch-action:none}
    .move-pad button.run{width:76px;height:38px;font-size:12px;font-weight:bold}
    .look-hint{position:absolute;right:16px;bottom:24px;color:#ffffff9c;font-size:11px;pointer-events:none}
    @media (pointer:coarse){#mobile-controls{display:block}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(mobile);
  mobile.querySelectorAll('[data-key]').forEach(button => {
    const key = button.dataset.key;
    const start = e => { e.preventDefault(); touchActive = true; keys[key] = true; button.setPointerCapture?.(e.pointerId); };
    const end = e => { e.preventDefault(); keys[key] = false; };
    button.addEventListener('pointerdown', start);
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => button.addEventListener(type, end));
  });
  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || e.clientX < innerWidth * 0.42) return;
    touchActive = true;
    lookPointer = e.pointerId;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    renderer.domElement.setPointerCapture?.(e.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (e.pointerId !== lookPointer) return;
    const dx = e.clientX - lastLookX;
    const dy = e.clientY - lastLookY;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    camera.rotation.y -= dx * 0.004;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - dy * 0.003, -1.35, 1.35);
  });
  const endLook = e => { if (e.pointerId === lookPointer) lookPointer = null; };
  renderer.domElement.addEventListener('pointerup', endLook);
  renderer.domElement.addEventListener('pointercancel', endLook);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0,1,0);
  const candidate = new THREE.Vector3();
  function blocked(x, z) {
    for (const b of colliders) {
      if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
    }
    return false;
  }

  function update(delta) {
    if (!controls.isLocked && !touchActive && !lookPointer) return;
    const speed = keys.sprint ? 19 : 8;
    const forwardAmount = Number(keys.forward) - Number(keys.backward);
    const sideAmount = Number(keys.right) - Number(keys.left);
    if (!forwardAmount && !sideAmount) return;
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, worldUp).negate().normalize();
    const distance = speed * delta;
    candidate.copy(player.position).addScaledVector(forward, forwardAmount * distance);
    if (!blocked(candidate.x, player.position.z)) player.position.x = candidate.x;
    candidate.copy(player.position).addScaledVector(right, sideAmount * distance);
    if (!blocked(player.position.x, candidate.z)) player.position.z = candidate.z;
    player.position.x = THREE.MathUtils.clamp(player.position.x, -998, 998);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -498, 498);
    player.position.y = 1.7;
  }
  return { controls, update, player };
}
