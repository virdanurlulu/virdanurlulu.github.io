export function renderSummaryPanel(container, items) {
  container.innerHTML = items.map((item) => `
    <div class="summary-item">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    </div>
  `).join('');
}
