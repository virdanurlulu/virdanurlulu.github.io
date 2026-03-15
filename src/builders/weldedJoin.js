import * as THREE from 'three';

function sanitize(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeWeldType(type = 'double-v') {
  if (type === 'single' || type === 'single-v') return 'single-v';
  if (type === 'double' || type === 'double-v') return 'double-v';
  if (type === 'fillet') return 'fillet';
  return 'double-v';
}

export function createWeldMaterial(baseMaterial = null) {
  if (baseMaterial?.isMaterial && typeof baseMaterial.clone === 'function') {
    const cloned = baseMaterial.clone();
    if ('color' in cloned) cloned.color = new THREE.Color(0xf59e0b);
    if ('metalness' in cloned) cloned.metalness = Math.min((cloned.metalness ?? 0.2) + 0.18, 1);
    if ('roughness' in cloned) cloned.roughness = 0.38;
    return cloned;
  }
  return new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.32,
    roughness: 0.38,
  });
}

export function createCircumferentialWeld({
  radius,
  beadRadius = 8,
  y = 0,
  material,
  tubularSegments = 64,
  radialSegments = 16,
  arc = Math.PI * 2,
} = {}) {
  const safeRadius = Math.max(sanitize(radius, 0), 1);
  const safeBead = Math.max(Math.min(sanitize(beadRadius, 0), safeRadius * 0.18), 1.5);

  const weld = new THREE.Mesh(
    new THREE.TorusGeometry(safeRadius, safeBead, radialSegments, tubularSegments, arc),
    material || createWeldMaterial()
  );
  weld.rotation.x = Math.PI / 2;
  weld.position.y = sanitize(y, 0);
  weld.castShadow = true;
  weld.receiveShadow = true;
  weld.userData.exportable = true;
  weld.userData.isWeld = true;
  return weld;
}

export function createDoubleCircumferentialWeld({
  radius,
  beadRadius = 8,
  gap = null,
  y = 0,
  material,
} = {}) {
  const safeBead = Math.max(sanitize(beadRadius, 0), 1.5);
  const offset = gap == null ? safeBead * 0.9 : Math.max(sanitize(gap, 0), 0.5);
  const group = new THREE.Group();

  const w1 = createCircumferentialWeld({
    radius,
    beadRadius: safeBead,
    y: y - offset / 2,
    material,
  });
  const w2 = createCircumferentialWeld({
    radius,
    beadRadius: safeBead,
    y: y + offset / 2,
    material,
  });

  group.add(w1, w2);
  group.userData.exportable = true;
  group.userData.isWeld = true;
  return group;
}

export function createFilletWeld({
  radius,
  beadRadius = 8,
  y = 0,
  material,
} = {}) {
  const safeRadius = Math.max(sanitize(radius, 0), 1);
  const safeBead = Math.max(Math.min(sanitize(beadRadius, 0), safeRadius * 0.12), 1.5);
  const group = new THREE.Group();

  const root = createCircumferentialWeld({
    radius: Math.max(safeRadius - safeBead * 0.28, 1),
    beadRadius: safeBead * 0.72,
    y: y - safeBead * 0.22,
    material,
  });

  const cap = createCircumferentialWeld({
    radius: Math.max(safeRadius + safeBead * 0.06, 1),
    beadRadius: safeBead * 0.46,
    y: y + safeBead * 0.08,
    material,
  });

  group.add(root, cap);
  group.userData.exportable = true;
  group.userData.isWeld = true;
  return group;
}

export function createShellHeadWeld({
  radius,
  thickness,
  y,
  material,
  style = 'double-v',
  sizeFactor = 1,
} = {}) {
  const safeThickness = Math.max(sanitize(thickness, 8), 1);
  const safeSizeFactor = Math.min(Math.max(sanitize(sizeFactor, 1), 0.5), 2.5);
  const beadRadius = Math.max(Math.min(safeThickness * 0.22 * safeSizeFactor, radius * 0.1), 2.5);
  const weldType = normalizeWeldType(style);

  if (weldType === 'single-v') {
    return createCircumferentialWeld({
      radius: Math.max(radius - beadRadius * 0.18, 1),
      beadRadius,
      y,
      material,
    });
  }

  if (weldType === 'fillet') {
    return createFilletWeld({
      radius: Math.max(radius - beadRadius * 0.08, 1),
      beadRadius,
      y,
      material,
    });
  }

  return createDoubleCircumferentialWeld({
    radius: Math.max(radius - beadRadius * 0.12, 1),
    beadRadius,
    gap: beadRadius * 1.05,
    y,
    material,
  });
}

export function createTransitionWeld({
  radiusA,
  radiusB,
  y,
  thickness,
  material,
  style = 'double-v',
  sizeFactor = 1,
} = {}) {
  const targetRadius = Math.max(Math.max(sanitize(radiusA, 1), sanitize(radiusB, 1)), 1);
  const safeThickness = Math.max(sanitize(thickness, 8), 1);
  const safeSizeFactor = Math.min(Math.max(sanitize(sizeFactor, 1), 0.5), 2.5);
  const beadRadius = Math.max(Math.min(safeThickness * 0.18 * safeSizeFactor, targetRadius * 0.08), 2);
  const weldType = normalizeWeldType(style);

  if (weldType === 'single-v') {
    return createCircumferentialWeld({
      radius: targetRadius - beadRadius * 0.12,
      beadRadius,
      y,
      material,
    });
  }

  if (weldType === 'fillet') {
    return createFilletWeld({
      radius: targetRadius - beadRadius * 0.08,
      beadRadius,
      y,
      material,
    });
  }

  return createDoubleCircumferentialWeld({
    radius: targetRadius - beadRadius * 0.1,
    beadRadius,
    gap: beadRadius * 0.9,
    y,
    material,
  });
}
