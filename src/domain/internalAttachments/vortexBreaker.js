import * as THREE from 'three';
export function createVortexBreaker({ radius, material }) {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.6, radius * 0.12, 8), material);
    plate.rotation.z = (i / 4) * Math.PI;
    group.add(plate);
  }
  group.userData.exportable = true;
  return group;
}
