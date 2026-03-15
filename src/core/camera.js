import * as THREE from 'three';

export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200000);
  camera.position.set(6000, 4200, 6000);
  return camera;
}
