import * as THREE from 'three';

export function createMaterialSet(displayMode) {
  const base = new THREE.MeshStandardMaterial({
    color: 0x9cc9ff,
    metalness: 0.28,
    roughness: 0.42,
    transparent: displayMode === 'ghost',
    opacity: displayMode === 'ghost' ? 0.52 : 1,
    wireframe: displayMode === 'wireframe',
    side: THREE.DoubleSide,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    metalness: 0.18,
    roughness: 0.62,
    transparent: displayMode === 'ghost',
    opacity: displayMode === 'ghost' ? 0.45 : 1,
    wireframe: displayMode === 'wireframe',
    side: THREE.DoubleSide,
  });
  const support = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    metalness: 0.18,
    roughness: 0.72,
    transparent: displayMode === 'ghost',
    opacity: displayMode === 'ghost' ? 0.5 : 1,
    wireframe: displayMode === 'wireframe',
    side: THREE.DoubleSide,
  });
  return { base, accent, support };
}

export function createOpenShellSection({ radiusBottom, radiusTop, thickness, length, segments, material }) {
  const group = new THREE.Group();
  const innerBottom = Math.max(radiusBottom - thickness, 1);
  const innerTop = Math.max(radiusTop - thickness, 1);

  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, length, segments, 1, true),
    material
  );
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(innerTop, innerBottom, length, segments, 1, true),
    material
  );
  inner.scale.x = -1;
  group.add(inner);

  const topRing = new THREE.Mesh(new THREE.RingGeometry(innerTop, radiusTop, segments), material);
  topRing.rotation.x = -Math.PI / 2;
  topRing.position.y = length / 2;
  group.add(topRing);

  const bottomRing = new THREE.Mesh(new THREE.RingGeometry(innerBottom, radiusBottom, segments), material);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = -length / 2;
  group.add(bottomRing);

  return group;
}

export function createTubeBundle({ radius, length, material, segments = 48 }) {
  const bundle = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, segments),
    material
  );
  bundle.userData.exportable = true;
  return bundle;
}

export function orientEquipment(group, orientation) {
  group.rotation.set(0, 0, 0);
  if (orientation === 'horizontal') group.rotation.z = Math.PI / 2;
}
