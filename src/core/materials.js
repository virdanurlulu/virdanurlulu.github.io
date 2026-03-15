import * as THREE from 'three';

export function createMaterialSet(displayMode) {
  const common = {
    transparent: displayMode === 'ghost',
    opacity: displayMode === 'ghost' ? 0.52 : 1,
    wireframe: displayMode === 'wireframe',
    side: THREE.DoubleSide,
  };
  return {
    base: new THREE.MeshStandardMaterial({ color: 0x9cc9ff, metalness: 0.28, roughness: 0.42, ...common }),
    accent: new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.18, roughness: 0.62, ...common }),
    support: new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.18, roughness: 0.72, ...common }),
    internals: new THREE.MeshStandardMaterial({ color: 0xfb7185, metalness: 0.15, roughness: 0.75, ...common }),
    attachment: new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.22, roughness: 0.58, ...common }),
  };
}
