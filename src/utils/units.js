import { round } from './math.js';

export const mmToM = (mm) => mm / 1000;
export const mm2ToM2 = (mm2) => mm2 / 1_000_000;
export const mm3ToM3 = (mm3) => mm3 / 1_000_000_000;

export function fmtMm(mm) {
  return `${round(mm, 1)} mm`;
}
export function fmtM(m) {
  return `${round(m, 3)} m`;
}
export function fmtArea(areaM2) {
  return `${round(areaM2, 3)} m²`;
}
export function fmtVolume(volumeM3) {
  return `${round(volumeM3, 4)} m³`;
}
export function fmtMass(kg) {
  return `${round(kg, 1)} kg`;
}
