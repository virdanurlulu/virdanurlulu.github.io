import * as THREE from 'three';

export function createGasket({ outerRadius, innerRadius, thickness, material, segments = 48 }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(outerRadius, outerRadius, thickness, segments), material);
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(innerRadius, innerRadius, thickness * 1.05, segments), material);
  bore.scale.x = -1;
  const ring = new THREE.Group();
  ring.add(mesh, bore);
  ring.userData.exportable = true;
  return ring;
}
