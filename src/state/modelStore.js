import { clamp } from '../utils/math.js';

const DEFAULT_STATE = {
  meta: {
    name: 'Model-001',
    modelType: 'vessel',
  },
  view: {
    displayMode: 'solid',
    segments: 72,
  },
  material: {
    density: 7850,
    corrosionAllowance: 0,
  },
  pipe: {
    orientation: 'horizontal',
    outerDiameter: 500,
    innerDiameter: 476,
    thickness: 12,
    length: 1800,
    elbowAngle: 90,
    bendRadius: 600,
    outletLength: 1200,
  },
  vessel: {
    equipmentType: 'standard',
    standard: {
      orientation: 'horizontal',
      shellType: 'cylindrical',
      shellOD: 2200,
      shellID: 2168,
      thickness: 16,
      shellTopOD: 1600,
      shellLength: 6500,
      topHeadType: 'ellipsoidal',
      bottomHeadType: 'ellipsoidal',
      nozzleEnabled: true,
      nozzleDiameter: 300,
      nozzleThickness: 10,
      nozzleProjection: 420,
      nozzleOffset: 0,
      nozzleAngle: 0,
      supportType: 'auto',
      saddleSpacing: 3400,
      saddleWidth: 320,
      saddleHeight: 680,
    },
    pigLauncher: {
      orientation: 'horizontal',
      majorOD: 1200,
      minorOD: 700,
      thickness: 18,
      majorLength: 2800,
      reducerLength: 900,
      neckLength: 1400,
      closureType: 'flat',
      tailType: 'ellipsoidal',
      dischargeProjection: 450,
      saddleSpacing: 2200,
      saddleWidth: 260,
      saddleHeight: 460,
      ventEnabled: true,
      ventNozzleDiameter: 100,
      kickerEnabled: true,
      kickerNozzleDiameter: 80,
      nozzleThickness: 10,
    },
    reboiler: {
      orientation: 'horizontal',
      shellOD: 1800,
      shellID: 1768,
      thickness: 16,
      shellLength: 5200,
      channelOD: 1100,
      channelLength: 650,
      rearHeadType: 'ellipsoidal',
      frontHeadType: 'flat',
      tubeBundleOD: 1200,
      nozzleDiameter: 250,
      nozzleProjection: 350,
      saddleSpacing: 3000,
      saddleWidth: 300,
      saddleHeight: 540,
    },
  },
};

function clone(value) {
  return structuredClone(value);
}

function setByPath(target, path, value) {
  const keys = path.split('.');
  let ref = target;
  for (let i = 0; i < keys.length - 1; i += 1) ref = ref[keys[i]];
  ref[keys.at(-1)] = value;
}

function createStore(initialState) {
  let state = clone(initialState);
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState() {
      return state;
    },
    setState(updater) {
      const draft = clone(state);
      state = typeof updater === 'function' ? (updater(draft) || draft) : { ...draft, ...updater };
      emit();
    },
    updatePath(path, value) {
      const draft = clone(state);
      setByPath(draft, path, value);
      state = draft;
      emit();
    },
    syncPipeDimension(changedKey, rawValue) {
      const value = Number(rawValue);
      this.setState((draft) => {
        const pipe = draft.pipe;
        if (changedKey === 'outerDiameter') {
          pipe.outerDiameter = Math.max(30, value);
          pipe.thickness = Math.min(pipe.thickness, pipe.outerDiameter / 2 - 1);
          pipe.innerDiameter = Math.max(pipe.outerDiameter - 2 * pipe.thickness, 5);
        } else if (changedKey === 'innerDiameter') {
          pipe.innerDiameter = clamp(value, 5, pipe.outerDiameter - 2);
          pipe.thickness = Math.max((pipe.outerDiameter - pipe.innerDiameter) / 2, 1);
        } else if (changedKey === 'thickness') {
          pipe.thickness = clamp(value, 1, pipe.outerDiameter / 2 - 1);
          pipe.innerDiameter = Math.max(pipe.outerDiameter - 2 * pipe.thickness, 5);
        }
      });
    },
    syncStandardDimension(changedKey, rawValue) {
      const value = Number(rawValue);
      this.setState((draft) => {
        const item = draft.vessel.standard;
        if (changedKey === 'shellOD') {
          item.shellOD = Math.max(100, value);
          item.thickness = Math.min(item.thickness, item.shellOD / 2 - 1);
          item.shellID = Math.max(item.shellOD - 2 * item.thickness, 10);
          item.shellTopOD = Math.min(item.shellTopOD, item.shellOD);
        } else if (changedKey === 'shellID') {
          item.shellID = clamp(value, 10, item.shellOD - 2);
          item.thickness = Math.max((item.shellOD - item.shellID) / 2, 1);
        } else if (changedKey === 'thickness') {
          item.thickness = clamp(value, 1, item.shellOD / 2 - 1);
          item.shellID = Math.max(item.shellOD - 2 * item.thickness, 10);
        }
      });
    },
    syncReboilerDimension(changedKey, rawValue) {
      const value = Number(rawValue);
      this.setState((draft) => {
        const item = draft.vessel.reboiler;
        if (changedKey === 'shellOD') {
          item.shellOD = Math.max(150, value);
          item.thickness = Math.min(item.thickness, item.shellOD / 2 - 1);
          item.shellID = Math.max(item.shellOD - 2 * item.thickness, 10);
          item.tubeBundleOD = Math.min(item.tubeBundleOD, item.shellID * 0.94);
        } else if (changedKey === 'shellID') {
          item.shellID = clamp(value, 50, item.shellOD - 2);
          item.thickness = Math.max((item.shellOD - item.shellID) / 2, 1);
          item.tubeBundleOD = Math.min(item.tubeBundleOD, item.shellID * 0.94);
        } else if (changedKey === 'thickness') {
          item.thickness = clamp(value, 1, item.shellOD / 2 - 1);
          item.shellID = Math.max(item.shellOD - 2 * item.thickness, 10);
          item.tubeBundleOD = Math.min(item.tubeBundleOD, item.shellID * 0.94);
        }
      });
    },
    syncPigDimension(changedKey, rawValue) {
      const value = Number(rawValue);
      this.setState((draft) => {
        const item = draft.vessel.pigLauncher;
        if (changedKey === 'majorOD') {
          item.majorOD = Math.max(200, value);
          item.minorOD = Math.min(item.minorOD, item.majorOD - 100);
          item.thickness = Math.min(item.thickness, item.minorOD / 2 - 1, item.majorOD / 2 - 1);
        } else if (changedKey === 'minorOD') {
          item.minorOD = clamp(value, 100, item.majorOD - 100);
          item.thickness = Math.min(item.thickness, item.minorOD / 2 - 1);
        } else if (changedKey === 'thickness') {
          item.thickness = clamp(value, 1, Math.min(item.majorOD, item.minorOD) / 2 - 1);
        }
      });
    },
    reset() {
      state = clone(initialState);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const modelStore = createStore(DEFAULT_STATE);
