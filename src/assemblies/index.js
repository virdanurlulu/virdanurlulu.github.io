import { buildStandardVesselAssembly } from './standardVesselAssembly.js';
import { buildPigLauncherAssembly } from './pigLauncherAssembly.js';
import { buildReboilerAssembly } from './reboilerAssembly.js';

export function buildEquipmentModel({ state, materials }) {
  if (state.model.meta.equipmentType === 'pigLauncher') return buildPigLauncherAssembly({ model: state.model, materials, segments: state.view.segments, weld: state.weld });
  if (state.model.meta.equipmentType === 'reboiler') return buildReboilerAssembly({ model: state.model, materials, segments: state.view.segments, weld: state.weld });
  return buildStandardVesselAssembly({ model: state.model, materials, segments: state.view.segments, weld: state.weld });
}
