import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function createSaddleCrown({ radius, width, material }) {
  const thetaLength = Math.PI * 0.74;
  const thetaStart = Math.PI + (Math.PI - thetaLength) / 2;
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, width, 48, 1, true, thetaStart, thetaLength),
    material
  );
  crown.rotation.z = Math.PI / 2;
  crown.position.y = radius * 0.1;
  return crown;
}

function createWearPlate({ radius, width, material }) {
  const wearMaterial = material.clone();
  wearMaterial.color = new THREE.Color(0x86efac);
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.985, radius * 0.985, width * 0.82, 40, 1, true, Math.PI * 1.08, Math.PI * 0.84),
    wearMaterial
  );
  plate.rotation.z = Math.PI / 2;
  plate.position.y = radius * 0.18;
  return plate;
}

function createSaddleWeb({ sign, width, height, material }) {
  const web = box(width * 0.14, height, Math.max(width * 0.72, 110), material);
  web.position.set(sign * width * 0.26, -height * 0.42, 0);
  return web;
}

function createSaddleGusset({ signX, signZ, width, height, material }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width * 0.22, 0);
  shape.lineTo(0, height * 0.36);
  shape.lineTo(0, 0);
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 12, bevelEnabled: false }),
    material
  );
  mesh.rotation.y = signZ > 0 ? 0 : Math.PI;
  mesh.position.set(signX * width * 0.14, -height * 0.98, signZ * 52);
  return mesh;
}

function createAnchorBlock({ signX, signZ, width, material }) {
  const anchor = box(width * 0.18, 16, 34, material);
  anchor.position.set(signX * width * 0.34, -8, signZ * 92);
  return anchor;
}

export function createSaddle({ radius, width, height, material }) {
  const group = new THREE.Group();
  const crown = createSaddleCrown({ radius, width, material });
  const wearPlate = createWearPlate({ radius, width, material });
  const base = box(width * 0.95, 24, Math.max(width * 0.92, 220), material);
  base.position.y = -height - 18;

  group.add(crown, wearPlate, base);
  group.add(createSaddleWeb({ sign: -1, width, height, material }));
  group.add(createSaddleWeb({ sign: 1, width, height, material }));
  group.add(createSaddleGusset({ signX: -1, signZ: 1, width, height, material }));
  group.add(createSaddleGusset({ signX: 1, signZ: 1, width, height, material }));
  group.add(createSaddleGusset({ signX: -1, signZ: -1, width, height, material }));
  group.add(createSaddleGusset({ signX: 1, signZ: -1, width, height, material }));
  group.add(createAnchorBlock({ signX: -1, signZ: 1, width, material }));
  group.add(createAnchorBlock({ signX: 1, signZ: 1, width, material }));
  group.add(createAnchorBlock({ signX: -1, signZ: -1, width, material }));
  group.add(createAnchorBlock({ signX: 1, signZ: -1, width, material }));
  return group;
}

export function createSkirt({ radius, height, thickness, material }) {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 48, 1, true),
    material
  );
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(radius - thickness, 1), Math.max(radius - thickness, 1), height, 48, 1, true),
    material
  );
  inner.scale.x = -1;
  group.add(outer, inner);

  const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(radius - thickness, 1), radius, 48), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -height / 2;
  group.add(ring);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.98, Math.max(thickness * 0.28, 10), 16, 48),
    material
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -height / 2;
  group.add(baseRing);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const gusset = box(radius * 0.26, height * 0.58, Math.max(thickness * 0.8, 14), material);
    gusset.position.set(Math.cos(angle) * radius * 0.72, -height * 0.2, Math.sin(angle) * radius * 0.72);
    gusset.lookAt(0, gusset.position.y, 0);
    group.add(gusset);
  }

  return group;
}

export function addHorizontalSaddles(group, { barrelRadius, spacing, width, height, material }) {
  const support1 = createSaddle({ radius: barrelRadius, width, height, material });
  support1.position.set(-spacing / 2, -barrelRadius - 12, 0);

  const support2 = createSaddle({ radius: barrelRadius, width, height, material });
  support2.position.set(spacing / 2, -barrelRadius - 12, 0);

  group.add(support1, support2);
}

export function addVerticalSkirt(group, { barrelRadius, skirtHeight, thickness, bottomOffset, material }) {
  const skirt = createSkirt({ radius: barrelRadius * 0.62, height: skirtHeight, thickness, material });
  skirt.position.y = bottomOffset - skirtHeight / 2;
  group.add(skirt);
}
