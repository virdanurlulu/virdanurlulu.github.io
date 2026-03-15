import * as THREE from 'three';

export function createSupportLug({ width = 80, height = 140, thickness = 20, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), material);
  mesh.userData.exportable = true;
  return mesh;
}
