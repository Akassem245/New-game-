import * as THREE from 'three';

const ROAD_STEP = 100;
const CITY_W = 1000;
const CITY_D = 1000;

function seeded(seed = 2026) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createCity() {
  const group = new THREE.Group();
  const random = seeded();
  const dummy = new THREE.Object3D();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x292d30, roughness: 0.92 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xbab4a8, roughness: 0.88 });
  const brickMaterials = [0x8f3828, 0xa44832, 0x783326, 0xb05238].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.94 })
  );
  const parisMaterials = [0xe8dfce, 0xd9cfbd, 0xf0e8d9, 0xcfc4b1].map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.72 })
  );
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x648b96, roughness: 0.16, metalness: 0.28, clearcoat: 0.8,
    clearcoatRoughness: 0.12, reflectivity: 0.85
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x593a25, roughness: 0.82 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x252a2b, metalness: 0.72, roughness: 0.32 });
  const corniceMat = new THREE.MeshStandardMaterial({ color: 0xf4ead8, roughness: 0.66 });

  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  const windowGeo = new THREE.BoxGeometry(1.35, 1.65, 0.12);
  const balconySlabGeo = new THREE.BoxGeometry(3.3, 0.22, 1.05);
  const railGeo = new THREE.BoxGeometry(3.3, 0.12, 0.10);
  const railPostGeo = new THREE.BoxGeometry(0.09, 0.95, 0.09);
  const screenGeo = new THREE.BoxGeometry(1.65, 2.05, 0.13);
  const slatVGeo = new THREE.BoxGeometry(0.055, 1.95, 0.09);
  const slatHGeo = new THREE.BoxGeometry(1.55, 0.055, 0.09);
  const corniceGeo = new THREE.BoxGeometry(1, 0.24, 0.34);
  const brickBandGeo = new THREE.BoxGeometry(1, 0.12, 0.22);

  const pools = [];
  const makePool = (geometry, material, capacity) => {
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    pools.push(mesh);
    return mesh;
  };
  const brickBuildings = brickMaterials.map(m => makePool(buildingGeo, m, 1300));
  const parisBuildings = parisMaterials.map(m => makePool(buildingGeo, m, 1300));
  const windows = makePool(windowGeo, glassMat, 26000);
  const balconies = makePool(balconySlabGeo, parisMaterials[1], 13000);
  const rails = makePool(railGeo, darkMetalMat, 13000);
  const railPosts = makePool(railPostGeo, darkMetalMat, 52000);
  const screens = makePool(screenGeo, woodMat, 13000);
  const screenVertical = makePool(slatVGeo, woodMat, 65000);
  const screenHorizontal = makePool(slatHGeo, woodMat, 39000);
  const cornices = makePool(corniceGeo, corniceMat, 13000);
  const brickBands = makePool(brickBandGeo, brickMaterials[2], 26000);
  const counts = new Map(pools.map(mesh => [mesh, 0]));
  const colliders = [];

  function put(mesh, position, scale, rotationY = 0) {
    const index = counts.get(mesh);
    if (index >= mesh.instanceMatrix.count) return;
    dummy.position.set(position.x, position.y, position.z);
    dummy.scale.set(scale.x, scale.y, scale.z);
    dummy.rotation.set(0, rotationY, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    counts.set(mesh, index + 1);
  }

  // The same street plan is preserved across both halves; only the architectural finish changes.
  const roadGeo = new THREE.BoxGeometry(1, 0.14, 1);
  for (let i = 0; i <= 10; i++) {
    const x = -1000 + i * ROAD_STEP;
    const z = -500 + i * ROAD_STEP;
    const width = i % 3 === 0 ? 8 : 3;
    const vertical = new THREE.Mesh(roadGeo, roadMat);
    vertical.scale.set(width, 1, CITY_D);
    vertical.position.set(x, 0.04, 0);
    group.add(vertical);
    const horizontal = new THREE.Mesh(roadGeo, roadMat);
    horizontal.scale.set(CITY_W, 1, width);
    horizontal.position.set(-500, 0.04, z);
    group.add(horizontal);
  }

  const pavementGeo = new THREE.BoxGeometry(1, 0.18, 1);
  for (let i = 0; i <= 10; i += 3) {
    const x = -1000 + i * ROAD_STEP;
    const z = -500 + i * ROAD_STEP;
    for (const side of [-1, 1]) {
      const sx = new THREE.Mesh(pavementGeo, sidewalkMat);
      sx.scale.set(3.2, 1, CITY_D);
      sx.position.set(x + side * 5.6, 0.12, 0);
      group.add(sx);
      const sz = new THREE.Mesh(pavementGeo, sidewalkMat);
      sz.scale.set(CITY_W, 1, 3.2);
      sz.position.set(-500, 0.12, z + side * 5.6);
      group.add(sz);
    }
  }

  // 2,500 buildings, 8 floors in local streets and 12 floors on main avenues.
  // z < 0: exposed red brick. z >= 0: pale Paris-inspired stone, balconies and mashrabiya.
  for (let bx = 0; bx < 10; bx++) {
    for (let bz = 0; bz < 10; bz++) {
      const blockX = -950 + bx * 100;
      const blockZ = -450 + bz * 100;
      const nearMain = bx % 3 === 0 || bz % 3 === 0;
      const floors = nearMain ? 12 : 8;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const x = blockX - 39 + col * 19 + (random() - 0.5) * 2;
          const z = blockZ - 39 + row * 19 + (random() - 0.5) * 2;
          const w = 12 + random() * 4;
          const d = 12 + random() * 4;
          const h = floors * 3.1 * (0.9 + random() * 0.12);
          const isParis = z >= 0;
          const palette = isParis ? parisBuildings : brickBuildings;
          const matIndex = Math.floor(random() * 4);
          const building = palette[matIndex];
          const rotation = (random() - 0.5) * 0.035;
          put(building, { x, y: h / 2, z }, { x: w, y: h, z: d }, rotation);
          colliders.push({
            minX: x - w / 2 - 1.1, maxX: x + w / 2 + 1.1,
            minZ: z - d / 2 - 1.1, maxZ: z + d / 2 + 1.1
          });

          const floorCount = Math.max(4, Math.floor(h / 3.1));
          const windowColumns = Math.max(2, Math.floor(w / 3.4));
          for (let floor = 0; floor < floorCount; floor++) {
            const y = 1.8 + floor * 3.1;
            for (let colIndex = 0; colIndex < windowColumns; colIndex++) {
              const wx = x - w / 2 + (colIndex + 0.5) * w / windowColumns;
              put(windows, { x: wx, y, z: z + d / 2 + 0.09 }, { x: 1, y: 1, z: 1 }, rotation);
              if (isParis && counts.get(screens) < 12500) {
                put(screens, { x: wx, y, z: z + d / 2 + 0.23 }, { x: 1, y: 1, z: 1 }, rotation);
                for (let k = -1; k <= 1; k++) {
                  put(screenVertical, { x: wx + k * 0.48, y, z: z + d / 2 + 0.32 }, { x: 1, y: 1, z: 1 }, rotation);
                }
                for (let k = -1; k <= 1; k++) {
                  put(screenHorizontal, { x: wx, y: y + k * 0.58, z: z + d / 2 + 0.32 }, { x: 1, y: 1, z: 1 }, rotation);
                }
                put(balconies, { x: wx, y: y - 1.02, z: z + d / 2 + 0.62 }, { x: 1, y: 1, z: 1 }, rotation);
                put(rails, { x: wx, y: y - 0.55, z: z + d / 2 + 1.13 }, { x: 1, y: 1, z: 1 }, rotation);
                for (let p = -1; p <= 1; p++) {
                  put(railPosts, { x: wx + p * 1.45, y: y - 0.12, z: z + d / 2 + 1.13 }, { x: 1, y: 1, z: 1 }, rotation);
                }
                // A second, waist-high mashrabiya screen encloses the balcony edge.
                put(screens, { x: wx, y: y - 0.48, z: z + d / 2 + 1.25 }, { x: 1, y: 0.58, z: 1 }, rotation);
                for (let k = -1; k <= 1; k++) {
                  put(screenVertical, { x: wx + k * 0.48, y: y - 0.48, z: z + d / 2 + 1.34 }, { x: 1, y: 0.58, z: 1 }, rotation);
                }
                for (let k = -1; k <= 1; k++) {
                  put(screenHorizontal, { x: wx, y: y - 0.48 + k * 0.34, z: z + d / 2 + 1.34 }, { x: 1, y: 1, z: 1 }, rotation);
                }
              }
            }
          }

          if (isParis) {
            for (let level = 1; level <= floorCount; level += 2) {
              put(cornices, { x, y: level * 3.1, z: z + d / 2 + 0.18 }, { x: w + 0.7, y: 1, z: 1 }, rotation);
            }
          } else {
            for (let level = 1; level < floorCount; level++) {
              put(brickBands, { x, y: level * 3.1, z: z + d / 2 + 0.12 }, { x: w + 0.25, y: 1, z: 1 }, rotation);
            }
          }
        }
      }
    }
  }

  for (const mesh of pools) {
    mesh.count = counts.get(mesh);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }

  // Trees along selected wider avenues.
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x60432d, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x386b3d, roughness: 0.92 });
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 3, 7);
  const crownGeo = new THREE.SphereGeometry(1.65, 9, 8);
  for (let x = -950; x <= -50; x += 100) {
    for (let z = -480; z <= 480; z += 35) {
      if (Math.abs(x % 300) < 2) continue;
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x + 10, 1.5, z);
      const crown = new THREE.Mesh(crownGeo, leafMat);
      crown.position.set(x + 10, 4, z);
      trunk.castShadow = crown.castShadow = true;
      group.add(trunk, crown);
    }
  }

  group.userData.cityBounds = { minX: -1000, maxX: 0, minZ: -500, maxZ: 500 };
  group.userData.colliders = colliders;
  group.userData.architectureSplit = { brickSide: 'z < 0', parisSide: 'z >= 0' };
  return group;
}
