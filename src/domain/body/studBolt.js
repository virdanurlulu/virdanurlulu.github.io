import * as THREE from 'three';

export function createStudBoltRing({ radius, boltRadius, boltCount, boltLength, material }) {
  const group = new THREE.Group();
  for (let i = 0; i < boltCount; i += 1) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(boltRadius, boltRadius, boltLength, 12), material);
    bolt.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    group.add(bolt);
  }
  group.userData.exportable = true;
  return group;
}
