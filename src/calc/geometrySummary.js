import { fmtMass, fmtMm, fmtVolume } from '../utils/units.js';
import { getInternalVolumeM3 } from './volumeCalc.js';
import { getSteelMassKg } from './weightCalc.js';
import { getBOMRows } from './bomCalc.js';
import { getValidationIssues } from '../validation/assemblyRules.js';

function weldLabel(state) {
  if (!state.weld.enabled) return 'Disabled';
  const type = state.weld.type === 'single-v'
    ? 'Single-V'
    : state.weld.type === 'fillet'
      ? 'Fillet'
      : 'Double-V';
  return `${type} × ${state.weld.sizeFactor.toFixed(1)}`;
}

function equipmentLabel(type) {
  return {
    standardVessel: 'Standard Vessel',
    pigLauncher: 'Pig Launcher',
    reboiler: 'Reboiler',
  }[type] || type;
}

export function getSummary(state) {
  const mainShell = state.model.body.shellSections[0];
  const volume = getInternalVolumeM3(state.model);
  const mass = getSteelMassKg(state.model, state.material.density, state.material.corrosionAllowance);
  const bom = getBOMRows(state.model);
  const issues = getValidationIssues(state.model);
  const reinforcementPadCount = state.model.nozzles.filter((item) => item.enabled && item.reinforcementPad?.enabled).length;
  const blindFlangeCount = state.model.nozzles.filter((item) => item.enabled && item.blindFlange?.enabled).length;
  return [
    { label: 'Equipment Type', value: equipmentLabel(state.model.meta.equipmentType) },
    { label: 'Main Shell OD', value: fmtMm(mainShell.odStart) },
    { label: 'Straight Shell Length', value: fmtMm(mainShell.length) },
    { label: 'Nozzle Count', value: String(state.model.nozzles.filter((item) => item.enabled).length) },
    { label: 'Body Flange Count', value: String(state.model.body.bodyFlanges.filter((item) => item.enabled).length) },
    { label: 'Reinforcement Pad Count', value: String(reinforcementPadCount) },
    { label: 'Blind Flange Count', value: String(blindFlangeCount) },
    { label: 'Support Count', value: String(state.model.supports.length) },
    { label: 'Weld Specification', value: weldLabel(state) },
    { label: 'Internal Volume', value: fmtVolume(volume) },
    { label: 'Estimated Steel Mass', value: fmtMass(mass) },
    { label: 'BOM Line Items', value: String(bom.length) },
    { label: 'Validation Issues', value: issues.length ? String(issues.length) : '0' },
  ];
}
