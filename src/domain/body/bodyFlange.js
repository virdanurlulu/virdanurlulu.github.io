import { createOpenShellSection } from './shell.js';

export function createBodyFlange({ od, thickness, width, material, segments = 48 }) {
  return createOpenShellSection({
    radiusBottom: od / 2,
    radiusTop: od / 2,
    thickness,
    length: width,
    segments,
    material,
  });
}
