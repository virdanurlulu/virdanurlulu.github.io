import * as THREE from 'three';
export function createWeir({ radius, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.2, radius * 0.5, 12), material);
  mesh.userData.exportable = true;
  return mesh;
}
