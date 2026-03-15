import { getBOMRows } from '../calc/bomCalc.js';

function escapeCsvValue(value) {
  return `"${String(value ?? '').split('"').join('""')}"`;
}

export function exportBOM(state) {
  const rows = getBOMRows(state.model);
  const header = ['Tag', 'Family', 'Type', 'Description', 'Qty'];

  const lines = [
    header.map(escapeCsvValue).join(','),
    ...rows.map((row) =>
      [
        row.tag,
        row.family,
        row.type,
        row.description,
        row.qty,
      ].map(escapeCsvValue).join(',')
    ),
  ];

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.model.meta.name || 'model'}-bom.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
