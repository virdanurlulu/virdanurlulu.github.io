import * as THREE from 'three';

export function createLeg({ width = 80, height = 500, depth = 120, material }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.y = -height / 2;
  mesh.userData.exportable = true;
  return mesh;
}
