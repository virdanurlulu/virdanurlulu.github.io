const viewer = document.getElementById('viewer');

function showStatus(message, type = 'error') {
  if (!viewer) return;
  viewer.innerHTML = '';
  const box = document.createElement('div');
  box.className = `runtime-status ${type}`;
  box.textContent = message;
  viewer.appendChild(box);
}

showStatus('Memuat engine 3D…', 'ok');

import('./main.js')
  .then(() => {
    const status = viewer?.querySelector('.runtime-status.ok');
    if (status) status.remove();
  })
  .catch((error) => {
    console.error('Bootstrap failed', error);
    const details = error?.stack || error?.message || String(error);
    showStatus(
      'Engine 3D gagal dimuat.\n\n' +
      'Kemungkinan penyebab:\n' +
      '1) dependency three.js/addons dari CDN gagal dimuat,\n' +
      '2) ada file JS yang belum ikut ter-publish, atau\n' +
      '3) ada error runtime di modul awal.\n\n' +
      'Detail error:\n' + details
    , 'error');
  });
