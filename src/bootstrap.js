const viewer = document.getElementById('viewer');

function showStatus(message, type = 'error') {
  if (!viewer) return;
  viewer.innerHTML = '';
  const box = document.createElement('div');
  box.className = `runtime-status ${type}`;
  box.textContent = message;
  viewer.appendChild(box);
}

showStatus('Loading 3D engine…', 'ok');

import('./main.js')
  .then(() => {
    const status = viewer?.querySelector('.runtime-status.ok');
    if (status) status.remove();
  })
  .catch((error) => {
    console.error('Bootstrap failed', error);
    const details = error?.stack || error?.message || String(error);
    showStatus(
      '3D engine failed to load.\n\n' +
      'Possible causes:\n' +
      '1) dependency three.js/addons dari CDN gagal dimuat,\n' +
      '2) one or more JS files were not published, or\n' +
      '3) there is a runtime error in an early module.\n\n' +
      'Error details:\n' + details
    , 'error');
  });
