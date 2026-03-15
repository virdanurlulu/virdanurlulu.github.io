import * as THREE from 'three';

export function getHeadHeight(type, radius) {
  if (type === 'hemispherical') return radius;
  if (type === 'ellipsoidal') return radius * 0.5;
  if (type === 'conical') return radius * 0.45;
  return Math.max(radius * 0.06, 12);
}

function createLatheHeadProfile(type, radius, height, steps = 24) {
  const points = [];
  if (type === 'flat') {
    points.push(new THREE.Vector2(0, Math.max(height, 2)));
    points.push(new THREE.Vector2(radius, 0));
    return points;
  }

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    let x;
    let y;
    if (type === 'hemispherical') {
      const theta = (Math.PI / 2) * (1 - t);
      x = radius * Math.cos(theta);
      y = radius * Math.sin(theta);
    } else if (type === 'ellipsoidal') {
      const theta = (Math.PI / 2) * (1 - t);
      x = radius * Math.cos(theta);
      y = height * Math.sin(theta);
    } else {
      x = radius * t;
      y = height * (1 - t);
    }
    points.push(new THREE.Vector2(x, y));
  }
  return points;
}

function createStraightFlange({ outerRadius, innerRadius, length, segments, material }) {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(outerRadius, outerRadius, length, segments, 1, true),
    material
  );
  outer.position.y = length / 2;
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius, length, segments, 1, true),
    material
  );
  inner.position.y = length / 2;
  inner.scale.x = -1;
  group.add(inner);

  const lip = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, segments), material);
  lip.rotation.x = -Math.PI / 2;
  lip.position.y = 0;
  group.add(lip);

  return group;
}

export function createHead({ type, radius, thickness, segments, material, isTop = true }) {
  const group = new THREE.Group();
  const dishDepth = getHeadHeight(type, radius);
  const innerRadius = Math.max(radius - thickness, 1);
  const innerDishDepth = Math.max(dishDepth - thickness, 1);
  const straightFlangeLength = type === 'flat' ? 0 : Math.max(thickness * 1.5, 18);

  // Local origin is always the shell-to-head weld plane.
  // Head geometry grows in +Y direction, then mirrored for the opposite side.
  if (type === 'flat') {
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, segments), material);
    disk.position.y = thickness / 2;
    group.add(disk);
    if (!isTop) group.rotation.z = Math.PI;
    return { group, height: thickness };
  }

  const flange = createStraightFlange({
    outerRadius: radius,
    innerRadius,
    length: straightFlangeLength,
    segments,
    material,
  });
  group.add(flange);

  const outer = new THREE.Mesh(
    new THREE.LatheGeometry(createLatheHeadProfile(type, radius, dishDepth), segments),
    material
  );
  outer.position.y = straightFlangeLength;
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.LatheGeometry(createLatheHeadProfile(type, innerRadius, innerDishDepth), segments),
    material
  );
  inner.position.y = straightFlangeLength;
  inner.scale.x = -1;
  group.add(inner);

  const tangentRing = new THREE.Mesh(new THREE.RingGeometry(innerRadius, radius, segments), material);
  tangentRing.rotation.x = -Math.PI / 2;
  tangentRing.position.y = 0;
  group.add(tangentRing);

  if (!isTop) {
    group.rotation.z = Math.PI;
  }

  return { group, height: straightFlangeLength + dishDepth };
}

export function createClosureRing({ radius, thickness, material }) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.96, Math.max(thickness * 0.35, 8), 18, 48),
    material
  );
}
