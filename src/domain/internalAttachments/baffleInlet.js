import * as THREE from 'three';
export function createBaffleInlet({ radius, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.4, radius * 0.14, radius * 0.7), material);
  mesh.userData.exportable = true;
  return mesh;
}
