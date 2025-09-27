  window.addEventListener('load', () => {
    // Periksa apakah pustaka Leaflet (objek 'L') telah berhasil dimuat.
    if (typeof L === 'undefined') {
        console.error("Pustaka Leaflet tidak dimuat. Peta tidak dapat diinisialisasi.");
        const mapContainer = document.getElementById('map');
        const mapCard = document.getElementById('mapCard');
        if (mapContainer) {
            mapContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--danger); font-weight: bold;">Kesalahan: Gagal memuat pustaka peta. Harap periksa koneksi internet Anda dan coba muat ulang halaman.</p>';
        }
        // Sembunyikan kontrol yang tidak relevan jika peta gagal dimuat
        const controls = document.getElementById('mapControls');
        if (controls) controls.style.display = 'none';
        if (mapCard) mapCard.style.backgroundColor = 'var(--bg)';
        return; // Hentikan eksekusi skrip peta
    }

    // ======= BUILT-IN DEFAULTS =======
    const BUILTIN_DEFAULTS = {
      lat: 33.901404, lon: 35.519039,
      csv: '', // Dihapus: Data sekarang akan selalu berasal dari simulationLog
      np: 90, iv: 250, os: 0.3, of: 0.2, sw: 0.3, pal: 'bright',
      showLabel: true,
      poModel: 'crowl'
    };
    const LS_KEY  = 'explosionContour:v1';
    const RG_KEY  = 'explosionContour:revgeo:v2';

    // ======= Parser & CSV =======
    // Functions parseNumberLoose, extractNumbers, and parseData have been moved to a global script block
    
    let notifTimer = null;
    function showNotification(message, isError = false){
        const el = document.getElementById('notification');
        el.textContent = message;
        el.className = 'notification'; // reset
        if (isError) el.classList.add('error');
        el.classList.add('show');
        if (notifTimer) clearTimeout(notifTimer);
        notifTimer = setTimeout(() => {
            el.classList.remove('show');
        }, 4000); 
    }

    // ======= QS read-only =======
    function b64urlToStr(b64u){
      try{
        const b64 = b64u.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice(b64u.length%4);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
      }catch{ return ''; }
    }
    function readFromQS(){
      const sp = new URLSearchParams(location.search);
      if (!sp || [...sp].length===0) return {};
      const obj = {};
      if (sp.has('lat')) obj.lat = parseNumberLoose(sp.get('lat'));
      if (sp.has('lon')) obj.lon = parseNumberLoose(sp.get('lon'));
      if (sp.has('np'))  obj.np  = Math.max(16, Math.min(360, parseInt(sp.get('np'),10) || 0));
      if (sp.has('iv'))  obj.iv  = Math.max(0, parseInt(sp.get('iv'),10) || 0);
      if (sp.has('os'))  obj.os  = Math.max(0, Math.min(1, parseNumberLoose(sp.get('os'))));
      if (sp.has('of'))  obj.of  = Math.max(0, Math.min(1, parseNumberLoose(sp.get('of'))));
      if (sp.has('sw'))  obj.sw  = Math.max(0, parseNumberLoose(sp.get('sw')));
      if (sp.has('pal')) {
        const v = sp.get('pal').toLowerCase();
        if (['bright','cerah','default'].includes(v)) obj.pal = 'bright';
        else if (['bluegreen','biru-hijau','biru','hijau','bg'].includes(v)) obj.pal = 'bluegreen';
        else if (['heat','panas'].includes(v)) obj.pal = 'heat';
      }
      if (sp.has('label')) {
        const v = sp.get('label').toLowerCase();
        obj.showLabel = !(v==='0' || v==='false' || v==='no' || v==='off');
      }
      if (sp.has('csvb64')) { const s = b64urlToStr(sp.get('csvb64')||''); if (s) obj.csv = s; }
      else if (sp.has('csv')) { let v = sp.get('csv')||''; obj.csv = v.replace(/\|/g,'\n').replace(/;/g,'\n'); }
      return Object.fromEntries(Object.entries(obj).filter(([,v])=>v!==undefined && v!==null && v!==''));
    }

    // ======= localStorage =======
    function loadSaved(){
      try { const o = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); return (o && typeof o==='object') ? o : {}; }
      catch{ return {}; }
    }
    function savePartial(patch){
      settings = { ...settings, ...patch };
      try { 
        localStorage.setItem(LS_KEY, JSON.stringify(settings)); 
      } catch (e) {
        console.warn("Could not save map settings to local storage:", e);
      }
    }

    // ======= Compose settings (QS ➜ LS ➜ Built-in) =======
    let settings = { ...BUILTIN_DEFAULTS, ...loadSaved(), ...readFromQS() };

    // ======= Geodesic helpers =======
    const R_EARTH = 6371008.8; // m
    function destPoint(latDeg, lonDeg, distanceM, bearingDeg){
      const φ1 = latDeg * Math.PI/180, λ1 = lonDeg * Math.PI/180;
      const θ = bearingDeg * Math.PI/180, δ = distanceM / R_EARTH;
      const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
      const sinδ = Math.sin(δ), cosδ = Math.cos(δ);
      const sinφ2 = sinφ1*cosδ + cosφ1*sinδ*Math.cos(θ);
      const φ2 = Math.asin(sinφ2);
      const y = Math.sin(θ)*sinδ*cosφ1, x = cosδ - sinφ1*sinφ2;
      let λ2 = λ1 + Math.atan2(y, x);
      λ2 = ((λ2 + 3*Math.PI) % (2*Math.PI)) - Math.PI;
      return [φ2 * 180/Math.PI, λ2 * 180/Math.PI];
    }
    function circleCoordsGeodesic(lat0, lon0, Rm, n=90){
      const coords = [];
      for(let i=0;i<=n;i++){
        const bearing = 360 * i / n;
        const [lat, lon] = destPoint(lat0, lon0, Rm, bearing);
        coords.push([lat, lon]);
      }
      return coords;
    }

    // ======= Map init =======
    const map = L.map('map', {
      center:[settings.lat, settings.lon],
      zoom: 14,
      zoomControl: false
    });
    const canvasRenderer = L.canvas({ padding: 0.3 });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
      maxZoom:19, attribution:'Tiles © Esri'
    });

    satelliteLayer.on('tileerror', function(event) {
        console.error('Tile load error:', event);
        showNotification('Failed to load map data. Check your internet connection.', true);
        satelliteLayer.off('tileerror');
    });
    satelliteLayer.addTo(map);

    L.control.scale({imperial:false, position: 'bottomright'}).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const creditHTML =
      `<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> · ` +
      `<span title="Author">Credit by <a href="https://id.linkedin.com/in/virdanurlulu" target="_blank" rel="nofollow noopener">Virda Nur Lu'lu</a></span>`;
    map.attributionControl.setPrefix(creditHTML);

    // ======= Palettes =======
    const palettes = {
      bright: ["#FF0000","#FFA500","#FFFF00","#00FF00","#00FFFF","#0000FF","#FF00FF","#800080","#FFC0CB","#A52A2A"],
      bluegreen: ["#203a8f","#2d6cdf","#3fb6ff","#27c3a4","#15a371","#0f7a54","#0b533b","#083b2c"],
      heat: ["#4b0d0d","#7a1f0e","#ad3510","#e65a0d","#ff8c00","#ffb200","#ffd000","#ffe680"]
    };

    // ======= Reverse Geocoding (Latin/EN, cache, fallback) =======
    function esc(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'gt;','"':'&quot;',"'":'&#39;' }[m])); }
    function isRTL(str){ return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str); }
    function rgKey(lat, lon){ return `${lat.toFixed(5)},${lon.toFixed(5)}`; }
    function rgLoadCache(){ try{ return JSON.parse(localStorage.getItem(RG_KEY)||'{}'); }catch{ return {}; } }
    function rgSaveCache(obj){ try{ localStorage.setItem(RG_KEY, JSON.stringify(obj)); }catch{} }

    let isProgrammaticMove = false; // Flag to prevent moveend recursion

    async function fetchNominatimEN(lat, lon){
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&namedetails=1&accept-language=en`;
      const r = await fetch(url, {headers:{'Accept':'application/json', 'User-Agent': 'ExplosionSim/1.0'}});
      if (!r.ok) throw new Error(`Nominatim request failed with status ${r.status}`);
      const j = await r.json();
      const a = j.address || {};
      const city = a.city || a.town;
      const country = a.country || '';
      const joined = [city, country].filter(Boolean).join(', ');
      return joined;
    }

    async function reverseGeocode(lat, lon){
      const key = rgKey(lat, lon);
      const cache = rgLoadCache();
      const TTL = 30*24*3600*1000; // 30 days
      if (cache[key] && (Date.now()-cache[key].ts) < TTL) return cache[key].name;

      let geocodeError = false;
      try{
        let name = await fetchNominatimEN(lat, lon);
        if (name && !isRTL(name)) {
          cache[key] = {name, ts: Date.now()}; rgSaveCache(cache);
          return name;
        }
      } catch(e) {
          console.error("Nominatim fetch failed:", e);
          geocodeError = true;
      }

      try{
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`);
        if (r.ok){
          const j = await r.json();
          if (j.results && j.results.length){
            const g = j.results[0];
            const name = [g.name, g.country].filter(Boolean).join(', ');
            if (name){
              cache[key] = {name, ts: Date.now()}; rgSaveCache(cache);
              return name;
            }
          }
        } else {
            throw new Error(`Open-Meteo request failed with status ${r.status}`);
        }
      } catch(e) {
          console.error("Open-Meteo fetch failed:", e);
          geocodeError = true;
      }

      if (geocodeError) {
          showNotification('Failed to get location name. Check your internet connection.', true);
      }
      return '';
    }

    let centerMarker = null;
    let placeName = '';
    let mapTitleEl = null;

    // ======= Heading updater =======
    function setHeading(name){
      const label = (name && name.trim()) ? name.trim() : `${settings.lat.toFixed(5)}, ${settings.lon.toFixed(5)}`;
      const txt = `Explosion Contour - ${label}`;
      document.title = txt;
      if (mapTitleEl) mapTitleEl.textContent = txt;
    }

    function _attachTooltipCloseHandler(tooltip) {
      if (!tooltip || !tooltip._container) return;
      const closeBtn = tooltip._container.querySelector('.placelabel-close');
      if (closeBtn) {
        L.DomEvent.on(closeBtn, 'click', (event) => {
          L.DomEvent.stop(event);
          if (centerMarker) centerMarker.closeTooltip();
        });
      }
    }

    function ensureCenterMarker(lat, lon, name){
      if (!centerMarker){
        centerMarker = L.circleMarker([lat, lon], {
          renderer: canvasRenderer, radius: 5,
          color:'#111', weight:1, fillColor:'#fff', fillOpacity:1
        }).addTo(map);

        centerMarker.on('tooltipopen', function (e) {
          _attachTooltipCloseHandler(e.tooltip);
        });
      } else {
        centerMarker.setLatLng([lat, lon]);
      }

      if (!settings.showLabel){
        if (centerMarker.getTooltip()) centerMarker.unbindTooltip();
        return;
      }

      const locationName = name ? esc(name) : `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      const labelContent = `<span class="placelabel-content">📍 ${locationName}</span><button class="placelabel-close" title="Close">×</button>`;
      
      const t = centerMarker.getTooltip();
      if (t) {
          t.setContent(labelContent);
          if (centerMarker.isTooltipOpen()) {
              _attachTooltipCloseHandler(t);
          }
      } else {
          centerMarker.bindTooltip(labelContent, {permanent:true, direction:'right', offset:[8,0], className:'placelabel'});
      }
      
      if (!centerMarker.isTooltipOpen()) {
          centerMarker.openTooltip();
      }
    }

    async function refreshPlaceName(lat, lon){
      placeName = await reverseGeocode(lat, lon);
      ensureCenterMarker(lat, lon, placeName);
      setHeading(placeName);
      if (!document.getElementById('legend').hidden) refreshLegend();
    }

    // ======= Animation =======
    const RESPECT_REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rings = parseData(settings.csv);
    let tempLayers = [], finalLayer = null, idx = 0, playing = false, finished = false, timer = null;

    function clearLayers(){
      if (timer) { clearTimeout(timer); timer=null; }
      tempLayers.forEach(l=>map.removeLayer(l)); tempLayers=[];
      if (finalLayer){ map.removeLayer(finalLayer); finalLayer=null; }
      const toRemove = [];
      map.eachLayer(l=>{ if(l instanceof L.Polygon || l instanceof L.GeoJSON){ toRemove.push(l); } });
      toRemove.forEach(l=>map.removeLayer(l));
      document.getElementById('legend').hidden = true;
    }

    function refreshLegend(){
      const leg = document.getElementById('legend');
      leg.innerHTML = `<b>Explosion Contour</b>
        <div>Rings: ${rings.map(x=>x.r).join(', ')} m</div>`;
      leg.hidden = false;
    }
    
    function drawStep(){
      if (!playing) return;
      const ivUsed = RESPECT_REDUCED_MOTION ? 0 : Math.max(0, settings.iv|0);
      if (idx < rings.length){
        const d = rings[idx];
        const coords = circleCoordsGeodesic(settings.lat, settings.lon, d.r, settings.np);
        const pal = (palettes[settings.pal] || palettes.bright);
        const layer = L.polygon(coords, {
          renderer: canvasRenderer, color:"#000000", weight:settings.sw,
          fillColor: pal[idx % pal.length], fillOpacity: settings.os
        }).bindPopup(`<b>r = ${d.r} m</b>${d.Po!=null?`<br>Po: <code>${d.Po}</code>`:''}`).addTo(map);
        tempLayers.push(layer);
        if (idx===0){ try{ map.setView([settings.lat, settings.lon], 14); }catch(e){} }
        idx++;
        timer = setTimeout(drawStep, ivUsed);
      } else {
        tempLayers.forEach(l=>map.removeLayer(l)); tempLayers=[];
        const pal = (palettes[settings.pal] || palettes.bright);
        const reversed = rings.slice().reverse();
        finalLayer = L.featureGroup(
          reversed.map((d, irev)=>{
            const coords = circleCoordsGeodesic(settings.lat, settings.lon, d.r, settings.np);
            return L.polygon(coords, {
              renderer: canvasRenderer, color:"#000000", weight:settings.sw,
              fillColor: pal[(rings.length-1-irev) % pal.length], fillOpacity: settings.of
            }).bindPopup(`<b>r = ${d.r} m</b>${d.Po!=null?`<br>Po: <code>${d.Po}</code>`:''}`);
          })
        ).addTo(map);
        try{ map.fitBounds(finalLayer.getBounds(), {padding:[20,20]}); }catch(e){}
        refreshLegend();
        playing = false; finished = true; 
      }
    }

    function drawInitialState(){
      clearLayers();
      finished = true;
      playing = false;
      rings = parseData(settings.csv);
      
      const pal = (palettes[settings.pal] || palettes.bright);
      const reversed = rings.slice().reverse();
      finalLayer = L.featureGroup(
        reversed.map((d, irev)=>{
          const coords = circleCoordsGeodesic(settings.lat, settings.lon, d.r, settings.np);
          return L.polygon(coords, {
            renderer: canvasRenderer, color:"#000000", weight:settings.sw,
            fillColor: pal[(rings.length-1-irev) % pal.length], fillOpacity: settings.of
          }).bindPopup(`<b>r = ${d.r} m</b>${d.Po!=null?`<br>Po: <code>${d.Po}</code>`:''}`);
          })
        ).addTo(map);
      try{ 
          if (finalLayer && finalLayer.getLayers().length > 0) {
              isProgrammaticMove = true;
              map.fitBounds(finalLayer.getBounds(), {padding:[20,20]}); 
          } else {
              isProgrammaticMove = true;
              map.setView([settings.lat, settings.lon], 14);
          }
      } catch(e){}
      
      if (rings.length > 0) {
          refreshLegend();
      } else {
          document.getElementById('legend').hidden = true;
          ensureCenterMarker(settings.lat, settings.lon, placeName);
      }
    }

    function play(){ if (finished){ replay(); return; } if (playing) return; playing = true; drawStep(); }
    function pause(){ playing = false; if (timer) { clearTimeout(timer); timer=null; } }
    function replay(){ pause(); clearLayers(); idx = 0; finished = false; rings = parseData(settings.csv); play(); }

    // ======= Fullscreen (desktop & mobile) =======
    const fsBtn = document.getElementById('fsBtn'),
          fsBtnMobile = document.getElementById('fsBtnMobile'),
          mapCard = document.getElementById('mapCard');

    function setFSLabel(on){
      const txt = on ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
      [fsBtn, fsBtnMobile].forEach(b=>{
        if(!b) return;
        b.textContent = txt;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function enterFS(){
      mapCard.classList.add('fullscreen'); document.body.classList.add('fs-lock');
      if (mapCard.requestFullscreen) { mapCard.requestFullscreen().catch(()=>{}); }
      else if (mapCard.webkitRequestFullscreen) { mapCard.webkitRequestFullscreen(); }
      setFSLabel(true);
      setTimeout(()=>map.invalidateSize(), 180);
    }
    function exitFS(){
      mapCard.classList.remove('fullscreen'); document.body.classList.remove('fs-lock');
      if (document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen().catch(()=>{}); }
      else if (document.webkitFullscreenElement && document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
      setFSLabel(false);
      setTimeout(()=>map.invalidateSize(), 180);
    }
    function toggleFS(){ mapCard.classList.contains('fullscreen') ? exitFS() : enterFS(); }

    fsBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); toggleFS(); });
    fsBtnMobile?.addEventListener('click', (e)=>{ e.stopPropagation(); toggleFS(); });

    document.addEventListener('fullscreenchange', ()=>{
      const active = !!document.fullscreenElement || mapCard.classList.contains('fullscreen');
      if (!document.fullscreenElement) { mapCard.classList.remove('fullscreen'); document.body.classList.remove('fs-lock'); }
      setFSLabel(active);
    });

    document.addEventListener('keydown', (e)=>{
      if (document.activeElement.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFS(); }
      if (e.key === 'Escape' && mapCard.classList.contains('fullscreen')) { exitFS(); }
    });

    window.addEventListener('resize', ()=>{
      if (mapCard.classList.contains('fullscreen')) {
        clearTimeout(window.__fsRaf);
        window.__fsRaf = setTimeout(()=>map.invalidateSize(), 120);
      }
    });
    
    // ======= Map Controls Logic =======
    const mapLatInput = document.getElementById('mapLat');
    const mapLonInput = document.getElementById('mapLon');
    const poModelSelect = document.getElementById('poModelSelect');

    function updateCoordInputs() {
        if (mapLatInput) mapLatInput.value = settings.lat.toFixed(6);
        if (mapLonInput) mapLonInput.value = settings.lon.toFixed(6);
    }

    const debouncedUpdateMapFromInput = debounce(() => {
        const latStr = mapLatInput.value.trim();
        const lonStr = mapLonInput.value.trim();

        if (latStr === '' && lonStr === '') {
            settings.lat = BUILTIN_DEFAULTS.lat;
            settings.lon = BUILTIN_DEFAULTS.lon;
            savePartial({ lat: settings.lat, lon: settings.lon });
            updateCoordInputs();
            isProgrammaticMove = true;
            map.setView([settings.lat, settings.lon]);
            refreshPlaceName(settings.lat, settings.lon).then(() => {
                drawInitialState();
            });
            showNotification('Coordinates reset to default.', false);
            return;
        }
        
        const lat = parseFloat(mapLatInput.value);
        const lon = parseFloat(mapLonInput.value);

        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            // Cek jika koordinat benar-benar berubah untuk menghindari pembaruan yang tidak perlu
            if (Math.abs(settings.lat - lat) > 1e-7 || Math.abs(settings.lon - lon) > 1e-7) {
                settings.lat = lat;
                settings.lon = lon;
                savePartial({ lat: lat, lon: lon });

                // Atur tampilan peta ke koordinat baru
                isProgrammaticMove = true; 
                map.setView([lat, lon]);

                // Muat ulang nama tempat dan gambar ulang semuanya di lokasi baru
                refreshPlaceName(lat, lon).then(() => {
                    drawInitialState();
                });
            }
        } else {
            showNotification('Invalid coordinate values.', true);
        }
    }, 750);
    
    // Fungsionalitas 'moveend' dihapus agar titik ledakan tidak berubah saat peta digeser.
    // Pembaruan lokasi ledakan sekarang hanya ditangani oleh input Lat/Lon.

    if (mapLatInput) mapLatInput.addEventListener('input', debouncedUpdateMapFromInput);
    if (mapLonInput) mapLonInput.addEventListener('input', debouncedUpdateMapFromInput);
    if (poModelSelect) {
        poModelSelect.addEventListener('change', () => {
            settings.poModel = poModelSelect.value;
            savePartial({ poModel: poModelSelect.value });
            updateMapFromLog();
            updatePsVsZeChart(); // Update chart with new Po model selection
        });
    }

    // ======= Start =======
    (function init(){
      mapTitleEl = document.getElementById('mapTitle');
      setHeading(null); 
      refreshPlaceName(settings.lat, settings.lon);
      setFSLabel(false);
      updateCoordInputs();
      if (poModelSelect) poModelSelect.value = settings.poModel;
      // Memanggil updateMapFromLog() di sini untuk memastikan peta melakukan sinkronisasi dengan
      // data log yang sudah dimuat saat halaman pertama kali dibuka.
      updateMapFromLog(); 
    })();

    // Listen for custom events from the other script for CSV import
    window.addEventListener('map:updateCoords', (e) => {
        const { lat, lon } = e.detail;
        settings.lat = lat;
        settings.lon = lon;
        savePartial({ lat, lon });
        updateCoordInputs();
        isProgrammaticMove = true;
        map.setView([lat, lon]);
        refreshPlaceName(lat, lon).then(() => {
            drawInitialState();
        });
    });

    window.addEventListener('map:updatePoModel', (e) => {
        const { model } = e.detail;
        settings.poModel = model;
        if(poModelSelect) poModelSelect.value = model;
        savePartial({ poModel: model });
        updateMapFromLog(); // Redraw map with new model selection
    });


    // ======= INTEGRATION: Sync Map with Simulation Log =======
    /**
     * Reads data from the simulationLog array and updates the contour map.
     * This version reads directly from the globally accessible `simulationLog` array
     * for improved robustness, avoiding fragile DOM parsing.
     */
    async function updateMapFromLog() {
      if (typeof simulationLog === 'undefined' || !Array.isArray(simulationLog)) {
        console.error("simulationLog array not found or not an array.");
        return;
      }

      // Secara otomatis menyinkronkan kontrol peta dengan entri pertama dalam log simulasi.
      if (simulationLog.length > 0) {
          const firstLog = simulationLog[0];
          const lat = parseFloat(firstLog.lat);
          const lon = parseFloat(firstLog.lon);
          const poModel = firstLog.poModel;
          let settingsChanged = false;

          // Menyinkronkan koordinat
          if (!isNaN(lat) && !isNaN(lon)) {
              if (settings.lat !== lat || settings.lon !== lon) {
                  settings.lat = lat;
                  settings.lon = lon;
                  settingsChanged = true;
              }
              updateCoordInputs(); // Fungsi ini memperbarui bidang input
          }

          // Menyinkronkan Po Model
          const poModelSelect = document.getElementById('poModelSelect');
          if (poModel && poModelSelect && settings.poModel !== poModel) {
              settings.poModel = poModel;
              poModelSelect.value = poModel; // Memperbarui UI dropdown
              settingsChanged = true;
          }
          
          if (settingsChanged) {
              savePartial({ lat: settings.lat, lon: settings.lon, poModel: settings.poModel });
          }
      }

      // Pastikan nama lokasi diperbarui SEBELUM menggambar ulang peta
      await refreshPlaceName(settings.lat, settings.lon);

      const poModelSelect = document.getElementById('poModelSelect');
      const selectedModel = poModelSelect ? poModelSelect.value : (settings.poModel || 'crowl');
      const modelKeyMap = {
          crowl: 'po_crowl',
          alonso: 'po_alonso',
          sadovski: 'po_sadovski'
      };
      const pressureKey = modelKeyMap[selectedModel] || 'po_crowl';

      const csvLines = simulationLog.map(logEntry => {
          const distance = parseFloat(logEntry.dist);
          if (!isNaN(distance) && distance > 0) {
              const pressure = logEntry[pressureKey] ? parseFloat(logEntry[pressureKey]) : NaN;
              // Format CSV line: "distance, pressure". Pressure is optional.
              return isNaN(pressure) ? `${distance}` : `${distance}, ${pressure}`;
          }
          return null; // Return null for invalid entries
      }).filter(Boolean); // Filter out null values

      const newCsv = csvLines.join('\n');
      
      // Only redraw if the data has changed or if the map hasn't been drawn yet.
      if (newCsv !== settings.csv || (newCsv && !finalLayer)) {
          settings.csv = newCsv;
          
          if (csvLines.length === 0) {
              rings = []; // Clear ring data
              clearLayers(); // Remove all layers from the map
              ensureCenterMarker(settings.lat, settings.lon, placeName); // Redraw the center marker
          } else {
              drawInitialState();
          }
      }
    }

    // A MutationObserver on the log table is a reliable way to trigger a map update
    // whenever the log data changes (add, delete, import, sort).
    const logTbodyObserver = document.getElementById('logTbody');
    if (logTbodyObserver) {
        const observer = new MutationObserver(() => {
            // Gunakan debounce untuk menunda eksekusi agar tidak berjalan berkali-kali
            clearTimeout(window.logUpdateTimeout);
            window.logUpdateTimeout = setTimeout(updateMapFromLog, 250);
        });
        observer.observe(logTbodyObserver, { childList: true });
    }
    
    // Observer sudah menangani pembaruan awal saat log pertama kali dirender.

    // ======= DYNAMIC LAYOUT: Move Simulation Log based on screen size =======
    const leftPanel = document.querySelector('.left');
    const rightPanel = document.querySelector('.right');
    const logSection = document.querySelector('section[aria-labelledby="log-head"]');
    const overpressureChartSection = document.querySelector('section[aria-labelledby="overpressure-chart-head"]');

    function adjustLogPosition() {
        if (!leftPanel || !rightPanel || !logSection || !overpressureChartSection) {
            return;
        }

        if (window.innerWidth <= 1024) {
            // Mobile/Tablet view: Move log to the left panel if it's not already there.
            if (!leftPanel.contains(logSection)) {
                overpressureChartSection.insertAdjacentElement('afterend', logSection);
            }
        } else {
            // Desktop view: Move log back to the right panel if it's not already there.
            if (!rightPanel.contains(logSection)) {
                rightPanel.appendChild(logSection);
            }
        }
    }

    // Initial check on page load
    adjustLogPosition();

    // PERBAIKAN: Gunakan fungsi debounce dan tambahkan listener untuk 'orientationchange' 
    // untuk memastikan tata letak selalu diperbarui dengan andal di perangkat seluler.
    const debouncedAdjustLogPosition = debounce(adjustLogPosition, 150);
    window.addEventListener('resize', debouncedAdjustLogPosition);
    window.addEventListener('orientationchange', debouncedAdjustLogPosition);

  });
