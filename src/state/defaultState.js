import { createPresetModel } from '../app/presets.js';

export const DEFAULT_APP_STATE = {
  view: { displayMode: 'solid', segments: 72 },
  material: { density: 7850, corrosionAllowance: 0 },
  weld: { enabled: true, type: 'double-v', sizeFactor: 1 },
  model: createPresetModel('standardVessel'),
};
