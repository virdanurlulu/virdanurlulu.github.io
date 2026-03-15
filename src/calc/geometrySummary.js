import { fmtArea, fmtMass, fmtMm, fmtVolume } from '../utils/units.js';
import { getPipeInternalVolumeM3, getPigInternalVolumeM3, getReboilerInternalVolumeM3, getStandardInternalVolumeM3 } from './volumeCalc.js';
import { getPipeSteelMassKg, getPigSteelMassKg, getReboilerSteelMassKg, getStandardSteelMassKg } from './weightCalc.js';

function surfaceAreaCyl(radius, length) {
  return 2 * Math.PI * radius * length / 1_000_000;
}

export function getSummary(state) {
  if (state.meta.modelType === 'pipe') {
    const vol = getPipeInternalVolumeM3(state.pipe);
    const mass = getPipeSteelMassKg(state.pipe, state.material.density);
    return [
      { label: 'Builder', value: 'Pipe Builder' },
      { label: 'OD / ID', value: `${fmtMm(state.pipe.outerDiameter)} / ${fmtMm(state.pipe.innerDiameter)}` },
      { label: 'Thickness', value: fmtMm(state.pipe.thickness) },
      { label: 'Internal volume', value: fmtVolume(vol) },
      { label: 'Estimated steel mass', value: fmtMass(mass) },
    ];
  }

  const type = state.vessel.equipmentType;
  if (type === 'pigLauncher') {
    const item = state.vessel.pigLauncher;
    const vol = getPigInternalVolumeM3(item);
    const mass = getPigSteelMassKg(item, state.material.density, state.material.corrosionAllowance);
    return [
      { label: 'Equipment', value: 'Pig Launcher' },
      { label: 'Major / Minor OD', value: `${fmtMm(item.majorOD)} / ${fmtMm(item.minorOD)}` },
      { label: 'Major barrel length', value: fmtMm(item.majorLength) },
      { label: 'Reducer + neck', value: `${fmtMm(item.reducerLength)} + ${fmtMm(item.neckLength)}` },
      { label: 'Internal volume', value: fmtVolume(vol) },
      { label: 'Estimated steel mass', value: fmtMass(mass) },
    ];
  }

  if (type === 'reboiler') {
    const item = state.vessel.reboiler;
    const vol = getReboilerInternalVolumeM3(item);
    const mass = getReboilerSteelMassKg(item, state.material.density, state.material.corrosionAllowance);
    const area = surfaceAreaCyl(item.shellOD / 2, item.shellLength);
    return [
      { label: 'Equipment', value: 'Reboiler' },
      { label: 'Shell OD / ID', value: `${fmtMm(item.shellOD)} / ${fmtMm(item.shellID)}` },
      { label: 'Shell / channel length', value: `${fmtMm(item.shellLength)} / ${fmtMm(item.channelLength)}` },
      { label: 'Tube bundle OD', value: fmtMm(item.tubeBundleOD) },
      { label: 'Approx. shell area', value: fmtArea(area) },
      { label: 'Internal volume', value: fmtVolume(vol) },
      { label: 'Estimated steel mass', value: fmtMass(mass) },
    ];
  }

  const item = state.vessel.standard;
  const vol = getStandardInternalVolumeM3(item);
  const mass = getStandardSteelMassKg(item, state.material.density, state.material.corrosionAllowance);
  const area = surfaceAreaCyl(item.shellOD / 2, item.shellLength);
  return [
    { label: 'Equipment', value: 'Standard Vessel' },
    { label: 'Shell OD / ID', value: `${fmtMm(item.shellOD)} / ${fmtMm(item.shellID)}` },
    { label: 'Thickness', value: fmtMm(item.thickness) },
    { label: 'Shell length', value: fmtMm(item.shellLength) },
    { label: 'Approx. shell area', value: fmtArea(area) },
    { label: 'Internal volume', value: fmtVolume(vol) },
    { label: 'Estimated steel mass', value: fmtMass(mass) },
  ];
}
