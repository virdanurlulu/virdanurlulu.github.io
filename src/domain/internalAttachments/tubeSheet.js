import * as THREE from 'three';
export function createTubeSheet({ radius, thickness, material }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 48), material);
  mesh.userData.exportable = true;
  return mesh;
}
