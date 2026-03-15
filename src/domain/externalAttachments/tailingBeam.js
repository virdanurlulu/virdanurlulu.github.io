import * as THREE from 'three';
export function createTailingBeam({ length = 260, material }) {
  const beam = new THREE.Mesh(new THREE.BoxGeometry(length, 40, 40), material);
  beam.userData.exportable = true;
  return beam;
}
