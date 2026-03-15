import * as THREE from 'three';

export function createLiftingLug({ size = 120, material }) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.2, size * 0.18), material);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.24, size * 0.05, 12, 24), material);
  ring.position.y = size * 0.24;
  group.add(body, ring);
  group.userData.exportable = true;
  return group;
}
