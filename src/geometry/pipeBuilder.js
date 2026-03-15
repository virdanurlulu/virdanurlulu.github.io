import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js';
import { createMaterialSet, orientEquipment } from './shellBuilder.js';
import { degToRad, clamp } from '../utils/math.js';

function buildPipePath({ length, bendRadius, elbowAngle, outletLength }) {
  const alpha = degToRad(clamp(elbowAngle, 0, 180));
  const points = [];
  points.push(new THREE.Vector3(-length, 0, 0));
  points.push(new THREE.Vector3(0, 0, 0));

  const arcSteps = Math.max(8, Math.round(20 * Math.max(alpha, 0.1) / (Math.PI / 2)));
  for (let i = 1; i <= arcSteps; i += 1) {
    const t = -Math.PI / 2 + (alpha * i) / arcSteps;
    const x = bendRadius * Math.cos(t);
    const y = bendRadius + bendRadius * Math.sin(t);
    points.push(new THREE.Vector3(x, y, 0));
  }

  const end = points.at(-1);
  const tEnd = -Math.PI / 2 + alpha;
  const tangent = new THREE.Vector3(-Math.sin(tEnd), Math.cos(tEnd), 0).normalize();
  points.push(end.clone().add(tangent.multiplyScalar(outletLength)));
  return new THREE.CatmullRomCurve3(points);
}

export function buildPipeModel(state) {
  const { pipe, view } = state;
  const mats = createMaterialSet(view.displayMode);
  const group = new THREE.Group();
  group.name = 'PipeModel';

  const path = buildPipePath(pipe);
  const outerRadius = pipe.outerDiameter / 2;
  const innerRadius = Math.max(pipe.innerDiameter / 2, 1);
  const tubularSegments = Math.max(56, view.segments);

  const outer = new THREE.Mesh(
    new THREE.TubeGeometry(path, tubularSegments, outerRadius, 48, false),
    mats.base
  );
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.TubeGeometry(path, tubularSegments, innerRadius, 48, false),
    mats.base
  );
  inner.scale.x = -1;
  group.add(inner);

  orientEquipment(group, pipe.orientation);
  return group;
}
