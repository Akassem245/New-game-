import * as THREE from 'three';
import { createCity } from './world/cityGenerator.js';
import { createGreenArea } from './world/greenArea.js';
import { createPlayer } from './player/firstPersonController.js';
import { createTraffic } from './vehicles/traffic.js';
import { createCrowd } from './pedestrians/crowdSystem.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9c5d8);
scene.fog = new THREE.Fog(0xa9c5d8, 450, 1900);
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.style.cssText = 'margin:0;overflow:hidden;font-family:Arial,sans-serif;background:#111';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe7f3ff,0x68604e,2.0));
const sun = new THREE.DirectionalLight(0xffe2b4,2.1);
sun.position.set(-350,650,-250);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-900; sun.shadow.camera.right=900;
sun.shadow.camera.top=900; sun.shadow.camera.bottom=-900;
scene.add(sun);

const base = new THREE.Mesh(new THREE.PlaneGeometry(2000,1000),new THREE.MeshStandardMaterial({color:0x8d897c,roughness:1}));
base.rotation.x=-Math.PI/2;
base.position.set(0,-0.12,0);
scene.add(base);

const city = createCity(); scene.add(city);
const park = createGreenArea(); scene.add(park);
const traffic = createTraffic(); scene.add(traffic.group);
const crowd = createCrowd(1800); scene.add(crowd.group);
const player = createPlayer(camera,renderer,scene,city);

const panel = document.createElement('div');
panel.innerHTML = '<strong>NEW GAME · DENSE CITY</strong><br><span>WASD / الأسهم: حركة · الفأرة: نظر · Shift: جري · الهاتف: أزرار + سحب</span><br><span>City: 1 km² · Green park: 1 km² · 8 / 12 floors</span>';
panel.style.cssText = 'position:fixed;top:16px;left:16px;padding:12px 15px;color:#fff;background:#101820d9;border:1px solid #ffffff33;border-radius:9px;line-height:1.6;font-size:13px;pointer-events:none;box-shadow:0 5px 22px #0005';
document.body.appendChild(panel);\nif (matchMedia('(pointer:coarse)').matches) panel.style.maxWidth = '210px';
const start = document.createElement('div');
start.textContent = 'انقر داخل المشهد لبدء التجول';
start.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);padding:14px 20px;color:white;background:#14212ddd;border-radius:10px;font-size:17px;pointer-events:none';
document.body.appendChild(start);
player.controls.addEventListener('lock',()=>start.style.display='none');
player.controls.addEventListener('unlock',()=>start.style.display='block');

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(),0.04);
  player.update(delta);
  traffic.update(delta);
  crowd.update(clock.elapsedTime);
  renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
