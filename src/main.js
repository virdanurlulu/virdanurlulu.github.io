import { modelStore } from './state/modelStore.js';
import { createSceneMount } from './core/scene.js';
import { createMaterialSet } from './core/materials.js';
import { buildEquipmentModel } from './assemblies/index.js';
import { getDomRefs, bindForm, renderForm } from './ui/formBindings.js';
import { renderSummaryPanel } from './ui/summaryPanel.js';
import { bindToolbar } from './ui/toolbar.js';
import { getSummary } from './calc/geometrySummary.js';
import { exportJSON } from './export/exportJSON.js';
import { exportBOM } from './export/exportBOM.js';

const dom = getDomRefs();
const sceneMount = createSceneMount(document.getElementById('viewer'));
let firstRender = true;

function renderApp(state) {
  renderForm({ dom, state });
  const materials = createMaterialSet(state.view.displayMode);
  const model = buildEquipmentModel({ state, materials });
  sceneMount.setModel(model);
  renderSummaryPanel(dom.summary, dom.bomPreview, getSummary(state), state.model);
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
  onReset: () => { firstRender = true; modelStore.reset(); },
  onExportJSON: exportJSON,
  onExportBOM: exportBOM,
});

modelStore.subscribe(renderApp);
renderApp(modelStore.getState());
