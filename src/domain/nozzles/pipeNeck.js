import { buildAnnularSection } from './common.js';

export function createPipeNeck({ od, thickness, length, material, segments = 48 }) {
  return buildAnnularSection({ outerRadius: od / 2, innerRadius: Math.max(od / 2 - thickness, 1), length, material, segments });
}
