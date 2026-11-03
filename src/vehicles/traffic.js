import * as THREE from 'three';

export function createTraffic() {
  const group = new THREE.Group();
  const vehicles = [];
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9b52e, roughness: 0.72 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x277c9a, roughness: 0.72 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x243c48, metalness: 0.2, roughness: 0.25 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x17191a });
  function addVehicle(type, x, z, speed, direction, colorMat) {
    const vehicle = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(type === 'bus' ? 4.2 : 1.8, type === 'bus' ? 2.1 : 1.5, type === 'bus' ? 8 : 3.1), colorMat);
    body.position.y = type === 'bus' ? 1.45 : 1.05;
    vehicle.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(type === 'bus' ? 3.7 : 1.55, type === 'bus' ? 1.2 : 0.8, type === 'bus' ? 3.4 : 1.6), glassMat);
    cabin.position.set(0, type === 'bus' ? 2.75 : 1.9, -0.7);
    vehicle.add(cabin);
    const wheelGeo = new THREE.CylinderGeometry(0.42,0.42,0.25,8);
    for (const side of [-1,1]) for (const end of [-1,1]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI/2;
      wheel.position.set(side*(type==='bus'?2.05:0.92),0.48,end*(type==='bus'?2.7:1.05));
      vehicle.add(wheel);
    }
    vehicle.position.set(x,0,z);
    if (direction < 0) vehicle.rotation.y = Math.PI;
    group.add(vehicle);
    vehicles.push({ vehicle, speed, direction, type });
  }
  for (let laneZ of [-500, -200, 100, 400]) {
    for (let i=0;i<5;i++) {
      const x = -950 + i*210;
      addVehicle(i%2===0?'bus':'tuk', x, laneZ + 2.2, 7+Math.random()*5, 1, i%2===0?bodyMat:blueMat);
    }
  }
  return {
    group,
    update(delta) {
      for (const item of vehicles) {
        item.vehicle.position.x += item.speed * delta * item.direction;
        if (item.vehicle.position.x > 8) item.vehicle.position.x = -1008;
      }
    }
  };
}
