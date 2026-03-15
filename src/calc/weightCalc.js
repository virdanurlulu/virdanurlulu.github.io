import { mm3ToM3 } from '../utils/units.js';

function shellSteelVolume(od, id, length) {
  const ro = od / 2;
  const ri = id / 2;
  return Math.PI * (ro * ro - ri * ri) * length;
}

function frustumSteelVolume(od1, od2, id1, id2, length) {
  const outer = (Math.PI * length * ((od1/2)**2 + (od1/2)*(od2/2) + (od2/2)**2)) / 3;
  const inner = (Math.PI * length * ((id1/2)**2 + (id1/2)*(id2/2) + (id2/2)**2)) / 3;
  return outer - inner;
}

function headSteelApprox(type, od, thickness) {
  const ro = od / 2;
  const ri = Math.max(ro - thickness, 1);
  if (type === 'flat') return Math.PI * (ro * ro - ri * ri) * thickness;
  const areaFactor = type === 'hemispherical' ? 2.2 : type === 'ellipsoidal' ? 1.7 : 1.5;
  return Math.PI * ro * ro * thickness * areaFactor;
}

export function getPipeSteelMassKg(pipe, density) {
  const vol = shellSteelVolume(pipe.outerDiameter, pipe.innerDiameter, pipe.length + pipe.outletLength + pipe.bendRadius * Math.max(pipe.elbowAngle, 0) * Math.PI / 180);
  return mm3ToM3(vol) * density;
}

export function getStandardSteelMassKg(item, density, corrosionAllowance = 0) {
  const te = Math.max(item.thickness - corrosionAllowance, 1);
  const id = Math.max(item.shellOD - 2 * te, 10);
  const topOD = item.shellType === 'tapered' ? item.shellTopOD : item.shellOD;
  const topID = Math.max(topOD - 2 * te, 10);

  const shellVol = item.shellType === 'tapered'
    ? frustumSteelVolume(item.shellOD, topOD, id, topID, item.shellLength)
    : shellSteelVolume(item.shellOD, id, item.shellLength);

  const headsVol = headSteelApprox(item.topHeadType, topOD, te) + headSteelApprox(item.bottomHeadType, item.shellOD, te);
  const nozzleVol = item.nozzleEnabled
    ? shellSteelVolume(item.nozzleDiameter, Math.max(item.nozzleDiameter - 2 * item.nozzleThickness, 10), item.nozzleProjection)
    : 0;

  return mm3ToM3(shellVol + headsVol + nozzleVol) * density;
}

export function getPigSteelMassKg(item, density, corrosionAllowance = 0) {
  const te = Math.max(item.thickness - corrosionAllowance, 1);
  const majorID = Math.max(item.majorOD - 2 * te, 10);
  const minorID = Math.max(item.minorOD - 2 * te, 10);
  const major = shellSteelVolume(item.majorOD, majorID, item.majorLength);
  const reducer = frustumSteelVolume(item.majorOD, item.minorOD, majorID, minorID, item.reducerLength);
  const neck = shellSteelVolume(item.minorOD, minorID, item.neckLength);
  const heads = headSteelApprox(item.closureType, item.majorOD, te) + headSteelApprox(item.tailType, item.minorOD, te);
  const nozzles = shellSteelVolume(item.ventNozzleDiameter, Math.max(item.ventNozzleDiameter - 2 * item.nozzleThickness, 8), 180) * (item.ventEnabled ? 1 : 0)
    + shellSteelVolume(item.kickerNozzleDiameter, Math.max(item.kickerNozzleDiameter - 2 * item.nozzleThickness, 8), 180) * (item.kickerEnabled ? 1 : 0)
    + shellSteelVolume(item.minorOD * 0.72, Math.max(item.minorOD * 0.72 - 2 * item.nozzleThickness, 8), item.dischargeProjection);

  return mm3ToM3(major + reducer + neck + heads + nozzles) * density;
}

export function getReboilerSteelMassKg(item, density, corrosionAllowance = 0) {
  const te = Math.max(item.thickness - corrosionAllowance, 1);
  const id = Math.max(item.shellOD - 2 * te, 10);
  const channelID = Math.max(item.channelOD - 2 * te, 10);
  const shell = shellSteelVolume(item.shellOD, id, item.shellLength);
  const channel = shellSteelVolume(item.channelOD, channelID, item.channelLength);
  const heads = headSteelApprox(item.rearHeadType, item.shellOD, te) + headSteelApprox(item.frontHeadType, item.channelOD, te);
  const nozzles = shellSteelVolume(item.nozzleDiameter, Math.max(item.nozzleDiameter - 2 * te, 10), item.nozzleProjection * 2.6);
  return mm3ToM3(shell + channel + heads + nozzles) * density;
}
