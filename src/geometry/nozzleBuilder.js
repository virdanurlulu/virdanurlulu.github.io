import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js';
import { clamp } from '../utils/math.js';

function markHelper(object) {
  object.traverse?.((child) => {
    child.userData.exportable = false;
    child.userData.helper = true;
  });
  object.userData.exportable = false;
  object.userData.helper = true;
  return object;
}

function buildAnnularSection({ outerRadius, innerRadius, length, material, segments = 48 }) {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(outerRadius, outerRadius, length, segments, 1, true),
    material
  );
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius, length, segments, 1, true),
    material
  );
  inner.scale.x = -1;
  group.add(inner);

  const cap1 = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, segments), material);
  cap1.rotation.x = -Math.PI / 2;
  cap1.position.y = length / 2;
  group.add(cap1);

  const cap2 = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, segments), material);
  cap2.rotation.x = Math.PI / 2;
  cap2.position.y = -length / 2;
  group.add(cap2);

  return group;
}

function createBoltCircle({ radius, boltRadius, boltCount, boltLength, material }) {
  const group = new THREE.Group();
  for (let i = 0; i < boltCount; i += 1) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(boltRadius, boltRadius, boltLength, 12),
      material
    );
    bolt.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    group.add(bolt);
  }
  return group;
}

export function createNozzleLabel(text, { scale = 250 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.95)';
  ctx.lineWidth = 4;
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1);
  sprite.renderOrder = 999;
  return markHelper(sprite);
}

export function createPipeNozzle({ outerRadius, thickness, length, material, segments = 48 }) {
  const group = new THREE.Group();
  const innerRadius = Math.max(outerRadius - thickness, 1);
  group.add(buildAnnularSection({ outerRadius, innerRadius, length, material, segments }));
  return group;
}

export function createFlangedNozzle({
  outerRadius,
  thickness,
  length,
  material,
  flangeOuterRadius = outerRadius * 1.65,
  flangeThickness = Math.max(thickness * 1.8, 18),
  reinforcementOuterRadius = outerRadius * 1.28,
  reinforcementThickness = Math.max(thickness, 8),
  baseFlange = true,
  tipFlange = true,
  boltCount = 8,
  segments = 48,
  label = null,
  labelOffset = null,
}) {
  const group = new THREE.Group();
  const innerRadius = Math.max(outerRadius - thickness, 1);
  const barrel = buildAnnularSection({ outerRadius, innerRadius, length, material, segments });
  group.add(barrel);

  const reinforce = buildAnnularSection({
    outerRadius: reinforcementOuterRadius,
    innerRadius,
    length: reinforcementThickness,
    material,
    segments,
  });
  reinforce.position.y = -length / 2 + reinforcementThickness / 2;
  group.add(reinforce);

  const boltMaterial = material.clone();
  boltMaterial.color = new THREE.Color(0xe5e7eb);
  boltMaterial.metalness = 0.32;
  boltMaterial.roughness = 0.52;

  function addFlange(yPos) {
    const flange = buildAnnularSection({
      outerRadius: flangeOuterRadius,
      innerRadius,
      length: flangeThickness,
      material,
      segments,
    });
    flange.position.y = yPos;
    group.add(flange);

    const bolts = createBoltCircle({
      radius: (flangeOuterRadius + outerRadius) / 2,
      boltRadius: Math.max(outerRadius * 0.06, 5),
      boltCount,
      boltLength: flangeThickness * 1.15,
      material: boltMaterial,
    });
    bolts.position.y = yPos;
    group.add(bolts);
  }

  if (baseFlange) addFlange(-length / 2 + flangeThickness / 2);
  if (tipFlange) addFlange(length / 2 - flangeThickness / 2);

  if (label) {
    const sprite = createNozzleLabel(label, { scale: Math.max(flangeOuterRadius * 0.7, 170) });
    const [lx, ly, lz] = labelOffset || [0, length / 2 + flangeThickness * 1.9, flangeOuterRadius * 0.95];
    sprite.position.set(lx, ly, lz);
    group.add(sprite);
  }

  return group;
}

export function getOuterRadiusAtOffset({ shellType, shellOD, shellTopOD, shellLength, offset }) {
  const bottomRadius = shellOD / 2;
  const topRadius = (shellType === 'tapered' ? shellTopOD : shellOD) / 2;
  if (shellType !== 'tapered') return bottomRadius;
  const t = clamp((offset + shellLength / 2) / shellLength, 0, 1);
  return bottomRadius + (topRadius - bottomRadius) * t;
}

export function createRadialNozzle({
  nozzleDiameter,
  nozzleThickness,
  nozzleProjection,
  nozzleOffset,
  nozzleAngle,
  shellType,
  shellOD,
  shellTopOD,
  shellLength,
  material,
  flanged = false,
  label = null,
}) {
  const nozzle = flanged
    ? createFlangedNozzle({
        outerRadius: nozzleDiameter / 2,
        thickness: nozzleThickness,
        length: nozzleProjection,
        material,
        label,
      })
    : createPipeNozzle({
        outerRadius: nozzleDiameter / 2,
        thickness: nozzleThickness,
        length: nozzleProjection,
        material,
      });

  const radial = new THREE.Vector3(
    Math.cos((nozzleAngle * Math.PI) / 180),
    0,
    Math.sin((nozzleAngle * Math.PI) / 180)
  ).normalize();

  const localRadius = getOuterRadiusAtOffset({
    shellType,
    shellOD,
    shellTopOD,
    shellLength,
    offset: nozzleOffset,
  });

  nozzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radial);
  nozzle.position.copy(radial.clone().multiplyScalar(localRadius + nozzleProjection / 2));
  nozzle.position.y = clamp(nozzleOffset, -shellLength / 2 + 80, shellLength / 2 - 80);
  return nozzle;
}

export function createAxialNozzle({
  nozzleDiameter,
  nozzleThickness,
  nozzleProjection,
  material,
  direction = 1,
  flanged = false,
  label = null,
}) {
  const nozzle = flanged
    ? createFlangedNozzle({
        outerRadius: nozzleDiameter / 2,
        thickness: nozzleThickness,
        length: nozzleProjection,
        material,
        label,
      })
    : createPipeNozzle({
        outerRadius: nozzleDiameter / 2,
        thickness: nozzleThickness,
        length: nozzleProjection,
        material,
      });
  nozzle.rotation.z = direction > 0 ? 0 : Math.PI;
  return nozzle;
}
