import * as THREE from 'three';
export function createWearPlate({ radius, length, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.8, length, 10), material);
  mesh.userData.exportable = true;
  return mesh;
}
