import * as THREE from 'three';
export function createSchoepentoeter({ radius, material }) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, radius * 1.4, 24), material);
  mesh.userData.exportable = true;
  return mesh;
}
