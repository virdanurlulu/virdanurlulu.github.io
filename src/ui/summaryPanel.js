import { getBOMRows } from '../calc/bomCalc.js';

export function renderSummaryPanel(summaryContainer, bomContainer, items, model) {
  summaryContainer.innerHTML = items.map((item) => `
    <div class="summary-item">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    </div>
  `).join('');

  const bomRows = getBOMRows(model).slice(0, 12);
  bomContainer.innerHTML = bomRows.map((row) => `
    <div class="summary-item">
      <span>${row.tag} — ${row.family}</span>
      <strong>${row.type}</strong>
    </div>
  `).join('');
}
