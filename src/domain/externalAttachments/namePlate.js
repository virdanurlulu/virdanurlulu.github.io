import * as THREE from 'three';
export function createNamePlate({ width = 180, height = 80, thickness = 8, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), material);
  mesh.userData.exportable = true;
  return mesh;
}
