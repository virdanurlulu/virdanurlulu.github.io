import * as THREE from 'three';
export function createEarthingBoss({ radius = 20, length = 30, material }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material);
  mesh.rotation.z = Math.PI / 2;
  mesh.userData.exportable = true;
  return mesh;
}
