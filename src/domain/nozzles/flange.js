import * as THREE from 'three';
import { buildAnnularSection } from './common.js';
import { createStudBoltRing } from '../body/studBolt.js';

export function createFlange({ od, neckOD, thickness, material, boltCount = 8, boltCircleDiameter = null, boltDiameter = null, includeBolts = true }) {
  const outerRadius = od / 2;
  const innerRadius = Math.max(neckOD / 2 - 0.5, 1);
  const group = buildAnnularSection({ outerRadius, innerRadius, length: thickness, material });
  if (includeBolts) {
    const boltMat = material.clone();
    boltMat.color = new THREE.Color(0xe5e7eb);
    group.add(createStudBoltRing({
      radius: (boltCircleDiameter || ((outerRadius + innerRadius) * 2)) / 2,
      boltRadius: Math.max((boltDiameter || neckOD * 0.06) / 2, 4),
      boltCount,
      boltLength: thickness * 1.1,
      material: boltMat,
    }));
  }
  return group;
}
