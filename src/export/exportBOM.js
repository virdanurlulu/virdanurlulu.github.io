import { getBOMRows } from '../calc/bomCalc.js';

export function exportBOM(state) {
  const rows = getBOMRows(state.model);
  const header = ['Tag', 'Family', 'Type', 'Description', 'Qty'];
  const csv = [header.join(','), ...rows.map((row) => [row.tag, row.family, row.type, row.description, row.qty].map((v) => `"${String(v).replaceAll('"','""')}"`).join(','))].join('
');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.model.meta.name || 'model'}-bom.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
