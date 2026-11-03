import * as THREE from 'three';

const CITY_W = 1000;
const CITY_D = 1000;
const ROAD_STEP = 100;
const MAIN_EVERY = 3;

function seeded(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createCity() {
  const group = new THREE.Group();
  const random = seeded(2026);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x34383b, roughness: 0.95 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xb7b1a4 });
  const concrete = [0xc8bba5, 0xd4c8b4, 0xb9b3a8, 0xd9d0bf].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.88 })
  );
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x6b9aa5, roughness: 0.28, metalness: 0.15 });
  const roadGeo = new THREE.BoxGeometry(1, 0.12, 1);
  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  const windowGeo = new THREE.BoxGeometry(1.15, 1.35, 0.12);
  const buildingMeshes = concrete.map(mat => new THREE.InstancedMesh(buildingGeo, mat, 1800));
  const windowMesh = new THREE.InstancedMesh(windowGeo, windowMat, 24000);
  let buildingCount = 0, windowCount = 0;
  const dummy = new THREE.Object3D();

  // City limits: x = -1000..0, z = -500..500. Main roads are 8 m; alleys are 3 m.
  const cityCenterX = -500;
  for (let i = 0; i <= 10; i++) {
    const x = -1000 + i * ROAD_STEP;
    const main = i % MAIN_EVERY === 0;
    const width = main ? 8 : 3;
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.scale.set(width, 1, CITY_D);
    road.position.set(x + 500, 0.05, 0);
    group.add(road);
  }
  for (let i = 0; i <= 10; i++) {
    const z = -500 + i * ROAD_STEP;
    const main = i % MAIN_EVERY === 0;
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.scale.set(CITY_W, 1, main ? 8 : 3);
    road.position.set(cityCenterX, 0.05, z);
    group.add(road);
  }

  // Sidewalk strips along main avenues.
  const sidewalkGeo = new THREE.BoxGeometry(1, 0.18, 1);
  for (let i = 0; i <= 10; i += MAIN_EVERY) {
    const x = -1000 + i * ROAD_STEP + 500;
    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      walk.scale.set(3.2, 1, CITY_D);
      walk.position.set(x + side * 5.6, 0.12, 0);
      group.add(walk);
    }
    const z = -500 + i * ROAD_STEP;
    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      walk.scale.set(CITY_W, 1, 3.2);
      walk.position.set(cityCenterX, 0.12, z + side * 5.6);
      group.add(walk);
    }
  }

  // Dense building parcels inside each 100 m block.
  for (let bx = 0; bx < 10; bx++) {
    for (let bz = 0; bz < 10; bz++) {
      const blockX = -1000 + bx * 100 + 50;
      const blockZ = -500 + bz * 100 + 50;
      const nearMain = bx % MAIN_EVERY === 0 || bz % MAIN_EVERY === 0;
      const floors = nearMain ? 12 : 8;
      const height = floors * 3.1;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const x = blockX - 39 + col * 19 + (random() - 0.5) * 2;
          const z = blockZ - 39 + row * 19 + (random() - 0.5) * 2;
          const w = 12 + random() * 4;
          const d = 12 + random() * 4;
          const h = height * (0.88 + random() * 0.18);
          const mesh = buildingMeshes[Math.floor(random() * buildingMeshes.length)];
          if (buildingCount < mesh.count) {
            dummy.position.set(x, h / 2, z);
            dummy.scale.set(w, h, d);
            dummy.rotation.y = (random() - 0.5) * 0.08;
            dummy.updateMatrix();
            mesh.setMatrixAt(buildingCount % mesh.count, dummy.matrix);
          }
          // Repeated windows are instanced separately and kept lightweight.
          const rows = Math.max(3, Math.floor(h / 3.1));
          const cols = Math.max(2, Math.floor(w / 3));
          for (let fy = 0; fy < rows; fy++) {
            for (let fx = 0; fx < cols; fx++) {
              if (windowCount >= windowMesh.count) break;
              dummy.position.set(x - w / 2 + (fx + 0.5) * w / cols, 1.8 + fy * 3.1, z + d / 2 + 0.08);
              dummy.scale.set(1, 1, 1);
              dummy.rotation.set(0, 0, 0);
              dummy.updateMatrix();
              windowMesh.setMatrixAt(windowCount++, dummy.matrix);
            }
          }
          buildingCount++;
        }
      }
    }
  }
  buildingMeshes.forEach(mesh => {
    mesh.count = Math.min(1800, buildingCount);
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });
  windowMesh.count = windowCount;
  windowMesh.instanceMatrix.needsUpdate = true;
  group.add(windowMesh);

  // Street trees along selected avenues.
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4930 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x47784b });
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 3, 6);
  const crownGeo = new THREE.SphereGeometry(1.7, 7, 6);
  for (let x = -950; x <= -50; x += 100) {
    for (let z = -480; z <= 480; z += 35) {
      if (Math.abs(x % 300) < 2) continue;
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x + 500 + 10, 1.5, z);
      const crown = new THREE.Mesh(crownGeo, leafMat);
      crown.position.set(x + 500 + 10, 4, z);
      group.add(trunk, crown);
    }
  }
  group.userData.cityBounds = { minX: -1000, maxX: 0, minZ: -500, maxZ: 500 };
  return group;
}
