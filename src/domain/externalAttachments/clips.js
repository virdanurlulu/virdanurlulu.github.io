import * as THREE from 'three';
export function createClip({ width = 40, height = 60, thickness = 8, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), material);
  mesh.userData.exportable = true;
  return mesh;
}
