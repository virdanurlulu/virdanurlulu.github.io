export function bindToolbar({ dom, sceneMount, store, onReset, onExportJSON, onExportBOM }) {
  dom.fitViewBtn.addEventListener('click', () => sceneMount.frameObject(sceneMount.getCurrentModel()));
  dom.resetBtn.addEventListener('click', onReset);
  dom.saveJsonBtn.addEventListener('click', () => onExportJSON(store.getState()));
  dom.exportBomBtn.addEventListener('click', () => onExportBOM(store.getState()));

  dom.exportStlBtn.addEventListener('click', async () => {
    const { exportSTL } = await import('../export/exportSTL.js');
    exportSTL(sceneMount.getCurrentModel(), store.getState());
  });

  dom.exportGlbBtn.addEventListener('click', async () => {
    const { exportGLB } = await import('../export/exportGLB.js');
    exportGLB(sceneMount.getCurrentModel(), store.getState());
  });

  dom.viewButtons.forEach((btn) => btn.addEventListener('click', () => sceneMount.setPresetView(btn.dataset.view)));
}
