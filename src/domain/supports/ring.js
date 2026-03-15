import * as THREE from 'three';

export function createSupportRing({ radius, thickness, material }) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, Math.max(thickness * 0.35, 8), 16, 48), material);
  mesh.rotation.x = Math.PI / 2;
  mesh.userData.exportable = true;
  return mesh;
}
