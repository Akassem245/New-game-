import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as THREE from 'three';

export function createPlayer(camera, renderer, scene) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const keys = { forward:false, backward:false, left:false, right:false, sprint:false };
  const player = new THREE.Group();
  player.position.set(-500, 1.7, 0);
  scene.add(player);
  camera.position.set(0, 0, 0);
  player.add(camera);
  controls.getObject = () => player;

  const keyMap = {
    KeyW:'forward', ArrowUp:'forward', KeyS:'backward', ArrowDown:'backward',
    KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right', ShiftLeft:'sprint'
  };
  const onDown = e => { if (keyMap[e.code]) keys[keyMap[e.code]] = true; };
  const onUp = e => { if (keyMap[e.code]) keys[keyMap[e.code]] = false; };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  renderer.domElement.addEventListener('click', () => controls.lock());

  function update(delta) {
    if (!controls.isLocked) return;
    const speed = keys.sprint ? 22 : 10;
    direction.set(Number(keys.right)-Number(keys.left), 0, Number(keys.backward)-Number(keys.forward));
    if (direction.lengthSq()) direction.normalize();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).negate();
    player.position.addScaledVector(forward, -direction.z * speed * delta);
    player.position.addScaledVector(right, direction.x * speed * delta);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -998, 998);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -498, 498);
    player.position.y = 1.7;
  }
  return { controls, update, player };
}
