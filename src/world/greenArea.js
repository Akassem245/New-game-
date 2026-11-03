import * as THREE from 'three';

export function createGreenArea() {
  const group = new THREE.Group();
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshStandardMaterial({ color: 0x477b3e, roughness: 1 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(500, -0.04, 0);
  group.add(grass);

  const pathMat = new THREE.MeshStandardMaterial({ color: 0xc7b99a });
  for (let z of [-250, 0, 250]) {
    const path = new THREE.Mesh(new THREE.PlaneGeometry(1000, 5), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(500, 0.015, z);
    group.add(path);
  }
  for (let x of [250, 500, 750]) {
    const path = new THREE.Mesh(new THREE.PlaneGeometry(5, 1000), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(x, 0.02, 0);
    group.add(path);
  }

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x68452d });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x285d36 });
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 4, 7);
  const crownGeo = new THREE.SphereGeometry(2.6, 8, 7);
  for (let x = 35; x < 970; x += 32) {
    for (let z = -470; z < 480; z += 32) {
      if (Math.abs(x % 250) < 8 || Math.abs(z % 250) < 8) continue;
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 2, z);
      const crown = new THREE.Mesh(crownGeo, leafMat);
      crown.position.set(x, 5, z);
      group.add(trunk, crown);
    }
  }
  return group;
}
