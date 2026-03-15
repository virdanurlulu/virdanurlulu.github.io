import * as THREE from 'three';
export function createTrays({ radius, material }) {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 10, 32), material);
    tray.position.y = i * 180;
    group.add(tray);
  }
  group.userData.exportable = true;
  return group;
}
