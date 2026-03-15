import * as THREE from 'three';

export function createOpenShellSection({ radiusBottom, radiusTop, thickness, length, segments, material }) {
  const group = new THREE.Group();
  const innerBottom = Math.max(radiusBottom - thickness, 1);
  const innerTop = Math.max(radiusTop - thickness, 1);

  const outer = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, length, segments, 1, true), material);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(innerTop, innerBottom, length, segments, 1, true), material);
  inner.scale.x = -1;

  const topRing = new THREE.Mesh(new THREE.RingGeometry(innerTop, radiusTop, segments), material);
  topRing.rotation.x = -Math.PI / 2;
  topRing.position.y = length / 2;

  const bottomRing = new THREE.Mesh(new THREE.RingGeometry(innerBottom, radiusBottom, segments), material);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = -length / 2;

  group.add(outer, inner, topRing, bottomRing);
  group.userData.exportable = true;
  return group;
}
