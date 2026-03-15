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

export function createHead({ type, radius, thickness, segments, material, isTop = true }) {
  const group = new THREE.Group();
  const height = getHeadHeight(type, radius);
  const innerRadius = Math.max(radius - thickness, 1);
  const innerHeight = Math.max(height - thickness, 1);

  if (type === 'flat') {
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, segments), material);
    disk.position.y = isTop ? thickness / 2 : -thickness / 2;
    group.add(disk);
    return { group, height: thickness };
  }

  const outer = new THREE.Mesh(
    new THREE.LatheGeometry(createLatheHeadProfile(type, radius, height), segments),
    material
  );
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.LatheGeometry(createLatheHeadProfile(type, innerRadius, innerHeight), segments),
    material
  );
  inner.scale.x = -1;
  group.add(inner);

  const ring = new THREE.Mesh(new THREE.RingGeometry(innerRadius, radius, segments), material);
  ring.rotation.x = isTop ? -Math.PI / 2 : Math.PI / 2;
  group.add(ring);

  if (!isTop) {
    group.rotation.z = Math.PI;
  }

  return { group, height };
}

export function createClosureRing({ radius, thickness, material }) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.96, Math.max(thickness * 0.35, 8), 18, 48),
    material
  );
}
