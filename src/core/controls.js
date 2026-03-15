import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/controls/OrbitControls.js';

export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.minDistance = 200;
  controls.maxDistance = 100000;
  return controls;
}
