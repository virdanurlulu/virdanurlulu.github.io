import * as THREE from 'three';

function box(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.exportable = true;
  return mesh;
}

function createExtrudedMesh(shape, depth, material) {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 32,
  });
  geom.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.exportable = true;
  return mesh;
}

function createCrownBandShape({ radius, thickness, arcAngle }) {
  const outer = Math.max(radius, 10);
  const inner = Math.max(radius - thickness, 1);
  const shape = new THREE.Shape();
  const start = -arcAngle / 2;
  const end = arcAngle / 2;

  const outerPts = [];
  const innerPts = [];
  const steps = 40;

  for (let i = 0; i <= steps; i += 1) {
    const t = start + (end - start) * (i / steps);
    const x = outer * Math.sin(t);
    const y = -radius + outer * Math.cos(t);
    outerPts.push(new THREE.Vector2(x, y));
  }

  for (let i = steps; i >= 0; i -= 1) {
    const t = start + (end - start) * (i / steps);
    const x = inner * Math.sin(t);
    const y = -radius + inner * Math.cos(t);
    innerPts.push(new THREE.Vector2(x, y));
  }

  const pts = [...outerPts, ...innerPts];
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) shape.lineTo(pts[i].x, pts[i].y);
  shape.closePath();
  return shape;
}

function createSaddleCrown({ radius, width, material }) {
  const crownThickness = Math.max(radius * 0.02, 10);
  const arcAngle = Math.PI * 0.72;
  const crown = createExtrudedMesh(
    createCrownBandShape({ radius: radius * 1.005, thickness: crownThickness, arcAngle }),
    width,
    material
  );
  crown.rotation.y = Math.PI / 2;
  return crown;
}

function createWearPlate({ radius, width, material }) {
  const wearMaterial = material.clone();
  wearMaterial.color = new THREE.Color(0x86efac);
  const thickness = Math.max(radius * 0.008, 4);
  const arcAngle = Math.PI * 0.54;
  const plate = createExtrudedMesh(
    createCrownBandShape({ radius: radius * 1.002, thickness, arcAngle }),
    width * 0.88,
    wearMaterial
  );
  plate.rotation.y = Math.PI / 2;
  plate.position.y = -thickness * 0.35;
  return plate;
}

function createSideFrame({ width, height, depth, material, sign }) {
  const plateThickness = Math.max(width * 0.045, 12);
  const shoulderY = -height * 0.34;
  const peakY = -height * 0.08;
  const shoulderZ = depth * 0.27;
  const footZ = depth * 0.48;

  const shape = new THREE.Shape();
  shape.moveTo(-footZ, -height);
  shape.lineTo(-footZ, shoulderY);
  shape.quadraticCurveTo(0, peakY, footZ, shoulderY);
  shape.lineTo(footZ, -height);
  shape.lineTo(-footZ, -height);

  const frame = createExtrudedMesh(shape, plateThickness, material);
  frame.rotation.y = Math.PI / 2;
  frame.position.x = sign * (width / 2 - plateThickness / 2);
  return frame;
}

function createWebPlate({ x, height, depth, material }) {
  const webThickness = Math.max(depth * 0.04, 10);
  const shape = new THREE.Shape();
  shape.moveTo(-depth * 0.20, -height);
  shape.lineTo(-depth * 0.08, -height * 0.42);
  shape.lineTo(depth * 0.08, -height * 0.42);
  shape.lineTo(depth * 0.20, -height);
  shape.lineTo(-depth * 0.20, -height);

  const web = createExtrudedMesh(shape, webThickness, material);
  web.rotation.y = Math.PI / 2;
  web.position.x = x;
  return web;
}

function createBasePlate({ width, depth, material }) {
  const baseThickness = Math.max(depth * 0.05, 18);
  const base = box(width * 1.08, baseThickness, depth * 1.02, material);
  base.position.y = -baseThickness / 2;
  return base;
}

function createAnchorLug({ signX, signZ, width, depth, material }) {
  const lug = box(
    Math.max(width * 0.12, 20),
    Math.max(depth * 0.08, 14),
    Math.max(depth * 0.12, 24),
    material
  );
  lug.position.set(signX * width * 0.34, -lug.geometry.parameters.height / 2, signZ * depth * 0.42);
  return lug;
}

export function createSaddle({ radius, width, height, material }) {
  const group = new THREE.Group();
  const baseDepth = Math.max(radius * 0.82, 260);
  const supportHeight = Math.max(height, radius * 0.58);

  const crown = createSaddleCrown({ radius, width, material });
  const wearPlate = createWearPlate({ radius, width, material });
  const base = createBasePlate({ width, depth: baseDepth, material });

  group.add(crown, wearPlate, base);
  group.add(createSideFrame({ width, height: supportHeight, depth: baseDepth, material, sign: -1 }));
  group.add(createSideFrame({ width, height: supportHeight, depth: baseDepth, material, sign: 1 }));

  const stiffenerXs = [-0.22, 0, 0.22].map((factor) => factor * width);
  stiffenerXs.forEach((x) => group.add(createWebPlate({ x, height: supportHeight, depth: baseDepth, material })));

  group.add(createAnchorLug({ signX: -1, signZ: 1, width, depth: baseDepth, material }));
  group.add(createAnchorLug({ signX: 1, signZ: 1, width, depth: baseDepth, material }));
  group.add(createAnchorLug({ signX: -1, signZ: -1, width, depth: baseDepth, material }));
  group.add(createAnchorLug({ signX: 1, signZ: -1, width, depth: baseDepth, material }));

  group.userData.exportable = true;
  return group;
}

export function createSkirt({ radius, height, thickness, material }) {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 48, 1, true),
    material
  );
  outer.castShadow = true;
  outer.receiveShadow = true;
  outer.userData.exportable = true;

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(radius - thickness, 1), Math.max(radius - thickness, 1), height, 48, 1, true),
    material
  );
  inner.scale.x = -1;
  inner.castShadow = true;
  inner.receiveShadow = true;
  inner.userData.exportable = true;
  group.add(outer, inner);

  const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(radius - thickness, 1), radius, 48), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -height / 2;
  ring.userData.exportable = true;
  group.add(ring);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.98, Math.max(thickness * 0.28, 10), 16, 48),
    material
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -height / 2;
  baseRing.userData.exportable = true;
  group.add(baseRing);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const gusset = box(radius * 0.26, height * 0.58, Math.max(thickness * 0.8, 14), material);
    gusset.position.set(Math.cos(angle) * radius * 0.72, -height * 0.2, Math.sin(angle) * radius * 0.72);
    gusset.lookAt(0, gusset.position.y, 0);
    group.add(gusset);
  }

  group.userData.exportable = true;
  return group;
}

export function addHorizontalSaddles(group, { barrelRadius, spacing, width, height, material }) {
  const support1 = createSaddle({ radius: barrelRadius, width, height, material });
  support1.position.set(-spacing / 2, -barrelRadius, 0);

  const support2 = createSaddle({ radius: barrelRadius, width, height, material });
  support2.position.set(spacing / 2, -barrelRadius, 0);

  group.add(support1, support2);
}

export function addVerticalSkirt(group, { barrelRadius, skirtHeight, thickness, bottomOffset, material }) {
  const skirt = createSkirt({ radius: barrelRadius * 0.62, height: skirtHeight, thickness, material });
  skirt.position.y = bottomOffset - skirtHeight / 2;
  group.add(skirt);
}
