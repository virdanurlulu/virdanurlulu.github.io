import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createControls } from './controls.js';

export function createSceneMount(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  const camera = createCamera(container);
  const renderer = createRenderer(container);
  const controls = createControls(camera, renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x0b1220, 1.1);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(5000, 6000, 3500);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9cc9ff, 0.4);
  fill.position.set(-4000, -2000, -2500);
  scene.add(fill);

  const grid = new THREE.GridHelper(16000, 40, 0x1f9d55, 0x334155);
  grid.position.y = -2400;
  scene.add(grid);

  const axes = new THREE.AxesHelper(1600);
  scene.add(axes);

  let currentModel = null;

  function setModel(model) {
    if (currentModel) scene.remove(currentModel);
    currentModel = model;
    scene.add(model);
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function frameObject(object = currentModel) {
    if (!object) return;
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const fov = (camera.fov * Math.PI) / 180;
    const dist = Math.abs(maxDim / Math.sin(fov / 2)) * 0.9;

    camera.position.copy(center.clone().add(new THREE.Vector3(dist * 0.95, dist * 0.65, dist * 0.95)));
    camera.near = Math.max(0.1, maxDim / 500);
    camera.far = Math.max(200000, dist * 8);
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.update();
    render();
  }

  function setPresetView(view) {
    if (!currentModel) return;
    const box = new THREE.Box3().setFromObject(currentModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const dist = Math.max(size.x, size.y, size.z, 1) * 2.1;

    if (view === 'front') camera.position.set(center.x, center.y, center.z + dist);
    else if (view === 'right') camera.position.set(center.x + dist, center.y, center.z);
    else if (view === 'top') camera.position.set(center.x, center.y + dist, center.z);
    else camera.position.set(center.x + dist * 0.9, center.y + dist * 0.6, center.z + dist * 0.9);

    controls.target.copy(center);
    controls.update();
    render();
  }

  function animate() {
    controls.update();
    render();
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    render();
  });

  return {
    setModel,
    frameObject,
    setPresetView,
    getCurrentModel: () => currentModel,
  };
}
