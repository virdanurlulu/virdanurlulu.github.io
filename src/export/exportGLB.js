import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

function cloneExportableModel(model) {
  const clone = model.clone(true);
  const removable = [];
  clone.traverse((child) => {
    if (child.userData?.helper || child.userData?.exportable === false) removable.push(child);
  });
  removable.forEach((child) => child.parent?.remove(child));
  return clone;
}

export function exportGLB(model, state) {
  if (!model) return;
  const exporter = new GLTFExporter();
  const cleanModel = cloneExportableModel(model);
  exporter.parse(
    cleanModel,
    (result) => {
      const blob = new Blob([result], { type: 'model/gltf-binary' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${state.meta.name || 'model'}.glb`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    (error) => console.error('GLB export failed', error),
    { binary: true }
  );
}
