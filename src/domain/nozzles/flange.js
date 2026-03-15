import * as THREE from 'three';
import { buildAnnularSection } from './common.js';
import { createStudBoltRing } from '../body/studBolt.js';

export function createFlange({ od, neckOD, thickness, material, boltCount = 8 }) {
  const outerRadius = od / 2;
  const innerRadius = neckOD / 2 - 0.5;
  const group = buildAnnularSection({ outerRadius, innerRadius, length: thickness, material });
  const boltMat = material.clone();
  boltMat.color = new THREE.Color(0xe5e7eb);
  group.add(createStudBoltRing({ radius: (outerRadius + innerRadius) / 2, boltRadius: Math.max(neckOD * 0.03, 4), boltCount, boltLength: thickness * 1.1, material: boltMat }));
  return group;
}
