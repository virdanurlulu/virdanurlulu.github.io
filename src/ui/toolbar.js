export function bindToolbar({ dom, sceneMount, store, onReset, onExportJSON }) {
  dom.fitViewBtn.addEventListener('click', () => sceneMount.frameObject(sceneMount.getCurrentModel()));
  dom.resetBtn.addEventListener('click', onReset);
  dom.saveJsonBtn.addEventListener('click', () => onExportJSON(store.getState()));

  dom.exportStlBtn.addEventListener('click', async () => {
    try {
      const { exportSTL } = await import('../export/exportSTL.js');
      exportSTL(sceneMount.getCurrentModel(), store.getState());
    } catch (error) {
      console.error('STL export module failed to load', error);
      alert(`STL export gagal dimuat.\n\n${error?.message || error}`);
    }
  });

  dom.exportGlbBtn.addEventListener('click', async () => {
    try {
      const { exportGLB } = await import('../export/exportGLB.js');
      exportGLB(sceneMount.getCurrentModel(), store.getState());
    } catch (error) {
      console.error('GLB export module failed to load', error);
      alert(`GLB export gagal dimuat.\n\n${error?.message || error}`);
    }
  });

  dom.viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => sceneMount.setPresetView(btn.dataset.view));
  });
}
