import * as THREE from 'three';

export function markHelper(object) {
  object.traverse?.((child) => {
    child.userData.exportable = false;
    child.userData.helper = true;
  });
  object.userData.exportable = false;
  object.userData.helper = true;
  return object;
}

export function buildAnnularSection({ outerRadius, innerRadius, length, material, segments = 48 }) {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(outerRadius, outerRadius, length, segments, 1, true), material);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(innerRadius, innerRadius, length, segments, 1, true), material);
  inner.scale.x = -1;
  const cap1 = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, segments), material);
  cap1.rotation.x = -Math.PI / 2;
  cap1.position.y = length / 2;
  const cap2 = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, segments), material);
  cap2.rotation.x = Math.PI / 2;
  cap2.position.y = -length / 2;
  group.add(outer, inner, cap1, cap2);
  group.userData.exportable = true;
  return group;
}

export function createLabel(text, { scale = 220 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(15,23,42,0.92)';
  ctx.strokeStyle = 'rgba(148,163,184,0.95)';
  ctx.lineWidth = 4;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
  sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1);
  sprite.renderOrder = 999;
  return markHelper(sprite);
}
