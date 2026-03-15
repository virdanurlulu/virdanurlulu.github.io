import * as THREE from 'three';
export function createInletDistributor({ radius, material }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 30, 24), material);
  mesh.userData.exportable = true;
  return mesh;
}
