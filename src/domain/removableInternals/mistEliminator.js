import * as THREE from 'three';
export function createMistEliminator({ radius, material }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 60, 24), material);
  mesh.userData.exportable = true;
  return mesh;
}
