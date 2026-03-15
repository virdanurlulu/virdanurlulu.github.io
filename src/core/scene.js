import * as THREE from 'three';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createControls } from './controls.js';

function computeRenderableBounds(root) {
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  let found = false;

  root.traverse((child) => {
    if (!child.visible) return;
    if (child.userData?.helper) return;
    const isRenderable = child.isMesh || child.isLine || child.isPoints || child.isSprite;
    if (!isRenderable) return;
    tmp.setFromObject(child);
    if (!Number.isFinite(tmp.min.x) || !Number.isFinite(tmp.max.x)) return;
    if (tmp.isEmpty()) return;
    box.union(tmp);
    found = true;
  });

  if (!found) {
    box.setFromObject(root);
  }
  return box;
}

function applyCameraToBounds({ camera, controls, render, box, view = 'iso' }) {
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z, 1);
  const fov = (camera.fov * Math.PI) / 180;
  const fitHeightDistance = maxDim / (2 * Math.tan(fov / 2));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const dist = Math.max(fitHeightDistance, fitWidthDistance) * 1.55;

  if (view === 'front') camera.position.set(center.x, center.y, center.z + dist);
  else if (view === 'right') camera.position.set(center.x + dist, center.y, center.z);
  else if (view === 'top') camera.position.set(center.x, center.y + dist, center.z);
  else camera.position.set(center.x + dist * 0.95, center.y + dist * 0.62, center.z + dist * 0.95);

  camera.near = Math.max(0.1, maxDim / 1000);
  camera.far = Math.max(50000, dist * 12);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
  render();
}

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
  let currentView = 'iso';

  function render() {
    renderer.render(scene, camera);
  }

  function setModel(model) {
    if (currentModel) scene.remove(currentModel);
    currentModel = model;
    scene.add(model);
    render();
  }

  function frameObject(object = currentModel, view = currentView) {
    if (!object) return;
    const box = computeRenderableBounds(object);
    applyCameraToBounds({ camera, controls, render, box, view });
  }

  function setPresetView(view = 'iso') {
    currentView = view;
    frameObject(currentModel, view);
  }

  function animate() {
    controls.update();
    render();
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    frameObject(currentModel, currentView);
  });

  return {
    setModel,
    frameObject,
    setPresetView,
    getCurrentModel: () => currentModel,
  };
}
