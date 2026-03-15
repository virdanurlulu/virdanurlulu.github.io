import { STLExporter } from 'https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/exporters/STLExporter.js';

function cloneExportableModel(model) {
  const clone = model.clone(true);
  const removable = [];
  clone.traverse((child) => {
    if (child.userData?.helper || child.userData?.exportable === false) removable.push(child);
  });
  removable.forEach((child) => child.parent?.remove(child));
  return clone;
}

export function exportSTL(model, state) {
  if (!model) return;
  const exporter = new STLExporter();
  const cleanModel = cloneExportableModel(model);
  const data = exporter.parse(cleanModel, { binary: false });
  const blob = new Blob([data], { type: 'model/stl' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.meta.name || 'model'}.stl`;
  a.click();
  URL.revokeObjectURL(a.href);
}
