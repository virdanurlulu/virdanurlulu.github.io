import * as THREE from 'three';

export function createBlindFlange({ od, thickness, material, segments = 48 }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(od / 2, od / 2, thickness, segments), material);
  mesh.userData.exportable = true;
  return mesh;
}
