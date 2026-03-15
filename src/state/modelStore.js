import { DEFAULT_APP_STATE } from './defaultState.js';
import { createPresetModel } from '../app/presets.js';
import { applyNaming } from '../naming/namingService.js';

function clone(value) { return structuredClone(value); }

function normalizePath(path) {
  return path.replace(/\[(\d+)\]/g, '.$1');
}

function setByPath(target, path, value) {
  const keys = normalizePath(path).split('.');
  let ref = target;
  for (let i = 0; i < keys.length - 1; i += 1) ref = ref[keys[i]];
  ref[keys.at(-1)] = value;
}

function createStore(initialState) {
  let state = clone(initialState);
  applyNaming(state.model);
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener(state));

  return {
    getState() { return state; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setState(updater) {
      const draft = clone(state);
      state = typeof updater === 'function' ? (updater(draft) || draft) : { ...draft, ...updater };
      applyNaming(state.model);
      emit();
    },
    updatePath(path, value) {
      this.setState((draft) => { setByPath(draft, path, value); });
    },
    setEquipmentType(type) {
      this.setState((draft) => {
        draft.model = createPresetModel(type);
      });
    },
    reset() {
      state = clone(DEFAULT_APP_STATE);
      applyNaming(state.model);
      emit();
    },
  };
}

export const modelStore = createStore(DEFAULT_APP_STATE);
