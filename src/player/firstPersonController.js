import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as THREE from 'three';

export function createPlayer(camera, renderer, scene, city) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  const keys = { forward:false, backward:false, left:false, right:false, sprint:false, jump:false };
  const player = new THREE.Group();
  player.position.set(-500, 1.7, 0);
  scene.add(player);
  camera.position.set(0, 0, 0);
  camera.rotation.order = 'YXZ';
  player.add(camera);
  const colliders = city?.userData?.colliders || [];
  let lookPointer = null;
  let lastLookX = 0, lastLookY = 0;
  let joyPointer = null;
  let joyX = 0, joyY = 0;
  let jumpVelocity = 0;
  let grounded = true;

  const keyMap = {
    KeyW:'forward', ArrowUp:'forward', KeyS:'backward', ArrowDown:'backward',
    KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right',
    ShiftLeft:'sprint', Space:'jump'
  };
  const onDown = e => {
    if (!keyMap[e.code]) return;
    keys[keyMap[e.code]] = true;
    if (e.code === 'Space' && grounded) { jumpVelocity = 5.2; grounded = false; }
  };
  const onUp = e => { if (keyMap[e.code]) keys[keyMap[e.code]] = false; };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  renderer.domElement.addEventListener('click', () => {
    if (matchMedia('(pointer:fine)').matches) controls.lock();
  });

  // PUBG-inspired exploration controls: left analog joystick, right look zone, sprint and jump.
  const mobile = document.createElement('div');
  mobile.id = 'mobile-controls';
  mobile.innerHTML = `
    <div class="joy-base"><div class="joy-knob"></div></div>
    <button class="mobile-action sprint-action">RUN</button>
    <button class="mobile-action jump-action">JUMP</button>
    <div class="look-hint">حرّك الكاميرا بالسحب</div>`;
  const style = document.createElement('style');
  style.textContent = `
    #mobile-controls{display:none;position:fixed;inset:0;z-index:8;pointer-events:none;touch-action:none;font-family:Arial,sans-serif;user-select:none}
    .joy-base{position:absolute;left:34px;bottom:48px;width:142px;height:142px;border-radius:50%;background:#15243255;border:2px solid #ffffff99;box-shadow:0 4px 18px #0005;pointer-events:auto;touch-action:none}
    .joy-knob{position:absolute;left:39px;top:39px;width:64px;height:64px;border-radius:50%;background:#dce7edb8;border:2px solid #fff;box-shadow:0 3px 10px #0006;transform:translate(0,0)}
    .mobile-action{position:absolute;right:28px;border:1px solid #ffffffbb;border-radius:50%;background:#152432aa;color:white;font-weight:bold;pointer-events:auto;touch-action:none;box-shadow:0 4px 14px #0005}
    .sprint-action{bottom:58px;width:72px;height:72px;font-size:12px}
    .jump-action{bottom:145px;right:42px;width:58px;height:58px;font-size:10px}
    .look-hint{position:absolute;right:24px;bottom:18px;color:#ffffffa8;font-size:11px;pointer-events:none}
    @media (pointer:coarse){#mobile-controls{display:block}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(mobile);

  const joyBase = mobile.querySelector('.joy-base');
  const joyKnob = mobile.querySelector('.joy-knob');
  const sprintButton = mobile.querySelector('.sprint-action');
  const jumpButton = mobile.querySelector('.jump-action');
  const resetJoystick = () => {
    joyX = 0; joyY = 0; joyPointer = null;
    joyKnob.style.transform = 'translate(0px,0px)';
  };
  joyBase.addEventListener('pointerdown', e => {
    e.preventDefault();
    joyPointer = e.pointerId;
    joyBase.setPointerCapture(e.pointerId);
    moveJoystick(e);
  });
  function moveJoystick(e) {
    if (e.pointerId !== joyPointer) return;
    const rect = joyBase.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const radius = 48;
    const length = Math.hypot(dx, dy);
    if (length > radius) { dx = dx / length * radius; dy = dy / length * radius; }
    joyX = dx / radius;
    joyY = -dy / radius;
    joyKnob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  joyBase.addEventListener('pointermove', moveJoystick);
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => joyBase.addEventListener(type, resetJoystick));

  const setSprint = value => { keys.sprint = value; };
  sprintButton.addEventListener('pointerdown', e => { e.preventDefault(); setSprint(true); sprintButton.setPointerCapture(e.pointerId); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => sprintButton.addEventListener(type, () => setSprint(false)));
  jumpButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (grounded) { jumpVelocity = 5.2; grounded = false; }
  });

  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || e.clientX < innerWidth * 0.43) return;
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
    camera.rotation.y -= dx * 0.0032;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - dy * 0.0025, -1.25, 1.25);
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
    const keyboardActive = controls.isLocked;
    const moveForward = THREE.MathUtils.clamp(Number(keys.forward)-Number(keys.backward)+joyY,-1,1);
    const moveSide = THREE.MathUtils.clamp(Number(keys.right)-Number(keys.left)+joyX,-1,1);
    if (keyboardActive || Math.abs(moveForward)+Math.abs(moveSide)>0.04) {
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, worldUp).normalize();
      const length = Math.hypot(moveForward, moveSide);
      const norm = length > 1 ? 1/length : 1;
      const speed = keys.sprint ? 13.5 : 5.2;
      const distance = speed * delta;
      candidate.copy(player.position).addScaledVector(forward, moveForward * norm * distance);
      if (!blocked(candidate.x, player.position.z)) player.position.x = candidate.x;
      candidate.copy(player.position).addScaledVector(right, moveSide * norm * distance);
      if (!blocked(player.position.x, candidate.z)) player.position.z = candidate.z;
    }
    if (!grounded) {
      jumpVelocity -= 12 * delta;
      player.position.y += jumpVelocity * delta;
      if (player.position.y <= 1.7) { player.position.y = 1.7; jumpVelocity = 0; grounded = true; }
    }
    player.position.x = THREE.MathUtils.clamp(player.position.x, -998, -2);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -498, 498);
  }
  return { controls, update, player };
}
