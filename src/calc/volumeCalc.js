import { mm3ToM3 } from '../utils/units.js';

function cylinderVolume(radius, length) {
  return Math.PI * radius * radius * length;
}

function frustumVolume(r1, r2, length) {
  return (Math.PI * length * (r1 * r1 + r1 * r2 + r2 * r2)) / 3;
}

function headApproxVolume(type, radius) {
  if (type === 'hemispherical') return (2 / 3) * Math.PI * radius ** 3;
  if (type === 'ellipsoidal') return (2 / 3) * Math.PI * radius ** 3 * 0.5;
  if (type === 'conical') return (1 / 3) * Math.PI * radius ** 2 * radius * 0.45;
  return Math.PI * radius ** 2 * Math.max(radius * 0.06, 12);
}

export function getPipeInternalVolumeM3(pipe) {
  return mm3ToM3(cylinderVolume(pipe.innerDiameter / 2, pipe.length + pipe.outletLength + pipe.bendRadius * Math.max(pipe.elbowAngle, 0) * Math.PI / 180));
}

export function getStandardInternalVolumeM3(item) {
  const bottomR = item.shellID / 2;
  const topID = item.shellType === 'tapered' ? Math.max(item.shellTopOD - 2 * item.thickness, 10) : item.shellID;
  const topR = topID / 2;
  const shellVol = item.shellType === 'tapered'
    ? frustumVolume(bottomR, topR, item.shellLength)
    : cylinderVolume(bottomR, item.shellLength);
  return mm3ToM3(shellVol + headApproxVolume(item.topHeadType, topR) + headApproxVolume(item.bottomHeadType, bottomR));
}

export function getPigInternalVolumeM3(item) {
  const t = item.thickness;
  const majorR = Math.max(item.majorOD / 2 - t, 1);
  const minorR = Math.max(item.minorOD / 2 - t, 1);
  const major = cylinderVolume(majorR, item.majorLength);
  const reducer = frustumVolume(majorR, minorR, item.reducerLength);
  const neck = cylinderVolume(minorR, item.neckLength);
  return mm3ToM3(major + reducer + neck + headApproxVolume(item.closureType, majorR) + headApproxVolume(item.tailType, minorR));
}

export function getReboilerInternalVolumeM3(item) {
  const shellR = item.shellID / 2;
  const channelR = Math.max(item.channelOD / 2 - item.thickness, 1);
  const shell = cylinderVolume(shellR, item.shellLength);
  const channel = cylinderVolume(channelR, item.channelLength);
  return mm3ToM3(shell + channel + headApproxVolume(item.rearHeadType, shellR) + headApproxVolume(item.frontHeadType, channelR));
}
