import { modelStore } from './state/modelStore.js';
import { createSceneMount } from './core/scene.js';
import { buildPipeModel } from './geometry/pipeBuilder.js';
import { buildVesselModel } from './geometry/vesselBuilder.js';
import { getDomRefs, bindForm, renderForm } from './ui/formBindings.js';
import { renderSummaryPanel } from './ui/summaryPanel.js';
import { bindToolbar } from './ui/toolbar.js';
import { getSummary } from './calc/geometrySummary.js';
import { exportJSON } from './export/exportJSON.js';

const dom = getDomRefs();
const sceneMount = createSceneMount(document.getElementById('viewer'));

function buildActiveModel(state) {
  return state.meta.modelType === 'pipe' ? buildPipeModel(state) : buildVesselModel(state);
}

let firstRender = true;
function renderApp(state) {
  renderForm({ dom, state });
  const model = buildActiveModel(state);
  sceneMount.setModel(model);
  renderSummaryPanel(dom.summary, getSummary(state));
  if (firstRender) {
    sceneMount.frameObject(model);
    sceneMount.setPresetView('iso');
    firstRender = false;
  }
}

bindForm({ dom, store: modelStore });
bindToolbar({
  dom,
  sceneMount,
  store: modelStore,
  onReset: () => {
    firstRender = true;
    modelStore.reset();
  },
  onExportJSON: exportJSON,
});

modelStore.subscribe(renderApp);
renderApp(modelStore.getState());
