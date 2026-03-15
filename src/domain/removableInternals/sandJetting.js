import * as THREE from 'three';
export function createSandJetting({ radius, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.8, 40, radius * 0.25), material);
  mesh.userData.exportable = true;
  return mesh;
}
