import * as THREE from 'three';
export function createInternalRing({ radius, thickness, material }) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 16, 48), material);
  mesh.rotation.x = Math.PI / 2;
  mesh.userData.exportable = true;
  return mesh;
}
