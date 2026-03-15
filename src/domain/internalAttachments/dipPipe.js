import * as THREE from 'three';
export function createDipPipe({ radius, length, material }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material);
  mesh.userData.exportable = true;
  return mesh;
}
