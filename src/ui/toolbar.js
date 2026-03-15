export function bindToolbar({ dom, sceneMount, store, onReset, onExportJSON, onExportSTL, onExportGLB }) {
  dom.fitViewBtn.addEventListener('click', () => sceneMount.frameObject(sceneMount.getCurrentModel()));
  dom.resetBtn.addEventListener('click', onReset);
  dom.saveJsonBtn.addEventListener('click', () => onExportJSON(store.getState()));
  dom.exportStlBtn.addEventListener('click', () => onExportSTL(sceneMount.getCurrentModel(), store.getState()));
  dom.exportGlbBtn.addEventListener('click', () => onExportGLB(sceneMount.getCurrentModel(), store.getState()));
  dom.viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => sceneMount.setPresetView(btn.dataset.view));
  });
}
