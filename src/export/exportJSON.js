export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.meta.name || 'model'}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
