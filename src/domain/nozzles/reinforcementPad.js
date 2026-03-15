import { buildAnnularSection } from './common.js';

export function createReinforcementPad({ od, neckOD, thickness, material }) {
  return buildAnnularSection({ outerRadius: od / 2, innerRadius: neckOD / 2, length: thickness, material, segments: 48 });
}
