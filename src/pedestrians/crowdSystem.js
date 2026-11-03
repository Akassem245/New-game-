import * as THREE from 'three';

export function createCrowd(count = 1800) {
  const group = new THREE.Group();
  const geometry = new THREE.CapsuleGeometry(0.28, 0.8, 3, 5);
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x293d52 }),
    new THREE.MeshStandardMaterial({ color: 0x8d4d36 }),
    new THREE.MeshStandardMaterial({ color: 0xd0b18a }),
    new THREE.MeshStandardMaterial({ color: 0x626b55 })
  ];
  const agents = [];
  const dummy = new THREE.Object3D();
  const random = (min,max) => min + Math.random()*(max-min);
  for (let m=0;m<materials.length;m++) {
    const amount = Math.floor(count/materials.length);
    const mesh = new THREE.InstancedMesh(geometry, materials[m], amount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i=0;i<amount;i++) {
      const x = random(-990,-10);
      const z = random(-490,490);
      dummy.position.set(x,0.85,z);
      dummy.scale.set(1,1,1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      agents.push({mesh,index:i, x,z, phase:random(0,Math.PI*2), speed:random(0.35,1.1), angle:random(0,Math.PI*2)});
    }
    group.add(mesh);
  }
  return {
    group,
    update(time) {
      for (const a of agents) {
        const x = a.x + Math.sin(time*a.speed+a.phase)*1.4;
        const z = a.z + Math.cos(time*a.speed*0.7+a.phase)*1.4;
        dummy.position.set(x,0.85+Math.abs(Math.sin(time*5+a.phase))*0.05,z);
        dummy.rotation.set(0,a.angle+Math.sin(time+a.phase)*0.2,0);
        dummy.scale.set(1,1,1);
        dummy.updateMatrix();
        a.mesh.setMatrixAt(a.index,dummy.matrix);
      }
      for (const m of group.children) m.instanceMatrix.needsUpdate = true;
    }
  };
}
