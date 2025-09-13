    document.addEventListener("DOMContentLoaded", () => {
      const $ = (id) => document.getElementById(id);
      const fields = ["rho", "vol", "dh", "eta", "e_tnt", "dist", "pa"];
      const inputFields = ["material", ...fields];

      const presets = {
        AN:  { rho: 1725,    dh:  2479,  e_tnt: 4500, eta: 0.35 },
        LPG: { rho: 1.9,     dh: 50000,  e_tnt: 4500, eta: 0.03 },
        H2:  { rho: 0.08375, dh: 130800, e_tnt: 4500, eta: 0.05 },
        TNT: { rho: 1600,    dh:  4184,  e_tnt: 4184, eta: 1.0 }
      };

      const eqMap = {
        AN:  [{ label: "Detonation", eq: '2 NH<sub>4</sub>NO<sub>3</sub>(s) <span class="arrow">→</span> 2 N<sub>2</sub>(g) + O<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)' }],
        LPG: [{ label: "Combustion (propane)", eq: 'C<sub>3</sub>H<sub>8</sub>(g) + 5 O<sub>2</sub>(g) <span class="arrow">→</span> 3 CO<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)' }],
        H2:  [{ label: "Combustion/explosion", eq: '2 H<sub>2</sub>(g) + O<sub>2</sub>(g) <span class="arrow">→</span> 2 H<sub>2</sub>O(g)' }],
        TNT: [{ label: "Detonation", eq: '2 C<sub>7</sub>H<sub>5</sub>N<sub>3</sub>O<sub>6</sub>(s) <span class="arrow">→</span> 3 N<sub>2</sub>(g) + 5 H<sub>2</sub>O(g) + 7 CO(g) + 7 C(s)' }]
      };

      let chartController;
      let simulationLog = [];

      function debounce(func, delay = 400) {
        let timeoutId;
        return function(...args) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
        };
      }

      function loadLogo() {
        const img = $("itbLogo"); if (!img) return;
        const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><circle cx="128" cy="128" r="120" fill="%230079c2"/><text x="50%" y="56%" font-family="Georgia, serif" font-size="88" text-anchor="middle" fill="white">ITB</text></svg>';
        img.onerror = () => { img.onerror = null; img.src = fallback; };
        img.src = "https://raw.githubusercontent.com/virdanurlulu/virdanurlulu.github.io/refs/heads/main/img/Logo_Institut_Teknologi_Bandung.webp";
      }

      function goTop() { try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); } }

      function initializeChart() {
        const chartDom = document.getElementById('chart');
        if (!chartDom) return null;
        const chart = echarts.init(chartDom);
        new ResizeObserver(() => chart.resize()).observe(chartDom);

        const css = getComputedStyle(document.documentElement);
        const BLUE    = (css.getPropertyValue('--blue-itb') || '#0079c2').trim();
        const DANGER = (css.getPropertyValue('--danger')   || '#DC2626').trim();

        const fPs = (ze) => (1616 * (1 + (ze/4.5)**2)) /
          (Math.sqrt(1 + (ze/0.048)**2) * Math.sqrt(1 + (ze/0.32)**2) * Math.sqrt(1 + (ze/1.35)**2));
        const logspace = (min, max, n=1000) =>
          Array.from({length: n}, (_, i) => 10**(Math.log10(min) + (Math.log10(max) - Math.log10(min)) * i / (n-1)));
        const refPairs = logspace(0.01, 100).map(z => [z, fPs(z)]);

        const btn = $('btnExport');
        if (btn) {
          btn.addEventListener('click', () => {
            const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#FFFFFF' });
            const a = document.createElement('a'); a.href = url; a.download = 'plot-ledakan.png'; a.click();
          });
        }

        const baseOption = {
            backgroundColor: 'transparent',
            tooltip: {
                confine: true, trigger: 'item',
                formatter: p => {
                    const v = Array.isArray(p.value) ? p.value : [];
                    const zeV = Number.isFinite(v[0]) ? v[0].toPrecision(4) : '—';
                    const psV = Number.isFinite(v[1]) ? v[1].toPrecision(4) : '—';
                    return `<b>${p.seriesName}</b><br/>ze: ${zeV}<br/>Ps: ${psV}`;
                },
                backgroundColor: '#FFFFFF', borderColor: '#cccccc', borderWidth: 1, textStyle: { color: '#212121' }
            },
            xAxis: {
                type: 'log', logBase: 10, min: 0.01, max: 100,
                axisLine: { lineStyle: { color: '#94a3b8' } },
                splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.1)', width: 2 } },
                minorSplitLine: { show: true, lineStyle: { color: 'rgba(0, 0, 0, 0.05)' } }
            },
            yAxis: {
                type: 'log', logBase: 10, min: 0.01, max: 10000,
                nameRotate: 90,
                axisLine: { lineStyle: { color: '#94a3b8' } },
                splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.1)', width: 2 } },
                minorSplitLine: { show: true, lineStyle: { color: 'rgba(0, 0, 0, 0.05)' } }
            },
            media: [
                {
                    query: { minWidth: 601 },
                    option: {
                        grid: { left: 72, right: 35, top: 80, bottom: 70 },
                        title: { text: 'Scaled Overpressure vs Scaled Distance', subtext: 'Model Referensi Kinney & Graham (1985)', left: 'center', top: 10, textStyle: { color: '#212121', fontSize: 20 }, subtextStyle: { color: '#424242' }},
                        xAxis: { name: 'Scaled Distance (ze)', nameLocation: 'middle', nameGap: 35, nameTextStyle: { color: '#212121', fontSize: 16, fontWeight: 'bold' }, axisLabel: { color: '#424242' }},
                        yAxis: { name: 'Scaled Overpressure Ratio (Ps = Po/Pa, –)', nameLocation: 'middle', nameGap: 50, nameTextStyle: { color: '#212121', fontSize: 16, fontWeight: 'bold' }, axisLabel: { color: '#424242' }}
                    }
                },
                {
                    query: { maxWidth: 600 },
                    option: {
                        grid: { left: 55, right: 20, top: 70, bottom: 60 },
                        title: { text: 'Ps vs ze', subtext: 'Kinney & Graham (1985)', left: 'center', top: 10, textStyle: { color: '#212121', fontSize: 16 }, subtextStyle: { color: '#424242', fontSize: 12 }},
                        xAxis: { name: 'ze', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#212121', fontSize: 14, fontWeight: 'bold' }, axisLabel: { color: '#424242', fontSize: 10 }},
                        yAxis: { name: 'Ps', nameLocation: 'middle', nameGap: 35, nameTextStyle: { color: '#212121', fontSize: 14, fontWeight: 'bold' }, axisLabel: { color: '#424242', fontSize: 10 }}
                    }
                }
            ]
        };
        
        chart.setOption(baseOption);

        return {
          plotResult: function(ze, ps) {
            const materialSel = $('material');
            const selectedOption = materialSel ? materialSel.options[materialSel.selectedIndex] : null;
            const compound = (selectedOption && selectedOption.value) ? selectedOption.text : 'Hasil Kalkulasi';
            const seriesData = (Number.isFinite(ze) && Number.isFinite(ps)) ? [[ze, ps]] : [];

            chart.setOption({
              series: [
                {
                  name: 'Kurva Referensi',
                  type: 'line', showSymbol: false,
                  lineStyle: { width: 2.5, color: BLUE, shadowColor: 'rgba(0, 0, 0, 0.2)', shadowBlur: 5, shadowOffsetY: 2 },
                  data: refPairs, zlevel: 1
                },
                {
                  name: `Titik: ${compound}`, type: 'scatter', symbolSize: 12,
                  itemStyle: { color: DANGER, borderColor: '#ffffff', borderWidth: 2, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 5 },
                  data: seriesData, zlevel: 2
                }
              ]
            });
          }
        };
      }

      function updateEstimationPanels(PoCrowl, PoAlonso, PoSadovski) {
        const getSeverity = (Po) => {
          if (Po >= 70) return "Major";
          if (Po >= 35) return "Serious";
          if (Po >= 14) return "Moderate";
          if (Po >= 1.4) return "Minor";
          return "Unknown";
        };
        const damageEffects = {
          crowl:   [{ threshold: 276, text: "Dinding beton hancur" }, { threshold: 34.5, text: "Kerusakan total bangunan" }, { threshold: 7, text: "Kerusakan parsial bangunan" }, { threshold: 1.4, text: "Jendela kaca pecah" }],
          alonso:  [{ threshold: 70, text: "Kerusakan total" }, { threshold: 35, text: "Kerusakan parah" }, { threshold: 21, text: "Kerusakan besar" }, { threshold: 7, text: "Kerusakan atap/dinding" }],
          sadovski:[{ threshold: 70, text: "Bangunan hancur total" }, { threshold: 35, text: "Dinding runtuh" }, { threshold: 14, text: "Kerusakan struktural ringan" }, { threshold: 7, text: "Jendela kaca pecah" }]
        };
        const injuryEffects = {
          crowl:   [{ threshold: 70, text: "Kematian 50%" }, { threshold: 34.5, text: "Gendang telinga pecah" }, { threshold: 28, text: "Luka berat/fatal" }, { threshold: 14, text: "Luka-luka kecil" }],
          alonso:  [{ threshold: 70, text: "Kematian" }, { threshold: 35, text: "Cedera serius/fatal" }, { threshold: 21, text: "Gendang telinga pecah" }, { threshold: 7, text: "Luka ringan" }],
          sadovski:[{ threshold: 70, text: "Kematian" }, { threshold: 35, text: "Gendang telinga pecah" }, { threshold: 28, text: "Luka serius/fatal" }, { threshold: 14, text: "Luka-luka" }]
        };

        ['crowl', 'alonso', 'sadovski'].forEach((method, i) => {
          const Po = [PoCrowl, PoAlonso, PoSadovski][i];
          const isPoValid = Number.isFinite(Po);
          
          const valPoEl = $(`val-Po-${method}`);
          const valPoInjEl = $(`val-Po-${method}-inj`);
          const sevEl = $(`sev-${method}`);
          const sevInjEl = $(`sev-injury-${method}`);
          const effectsEl = $(`effects-${method}`);
          const injuryEffectsEl = $(`injury-effects-${method}`);

          if (!isPoValid) {
            if (valPoEl) valPoEl.textContent = '—';
            if (valPoInjEl) valPoInjEl.textContent = '—';
            if (sevEl) { sevEl.textContent = "Unknown"; sevEl.className = "sevfoot Unknown"; }
            if (sevInjEl) { sevInjEl.textContent = "Unknown"; sevInjEl.className = "sevfoot Unknown"; }
            if (effectsEl) effectsEl.innerHTML = "<li>Menunggu input...</li>";
            if (injuryEffectsEl) injuryEffectsEl.innerHTML = "<li>Menunggu input...</li>";
            return;
          }

          const severity = getSeverity(Po);
          const prettyPo = Po.toLocaleString("id-ID", { maximumFractionDigits: 2 });
          
          if (valPoEl) valPoEl.textContent = prettyPo;
          if (valPoInjEl) valPoInjEl.textContent = prettyPo;
          if (sevEl) { sevEl.textContent = severity; sevEl.className = `sevfoot ${severity}`; }
          if (sevInjEl) { sevInjEl.textContent = severity; sevInjEl.className = `sevfoot ${severity}`; }

          const applicableDamage = damageEffects[method].filter((e) => Po >= e.threshold);
          if (effectsEl) effectsEl.innerHTML = applicableDamage.length > 0
            ? applicableDamage.map((e) => `<li>${e.text} (${e.threshold} kPa)</li>`).join("")
            : '<li>Tidak ada efek signifikan.</li>';
            
          const applicableInjury = injuryEffects[method].filter((e) => Po >= e.threshold);
          if (injuryEffectsEl) injuryEffectsEl.innerHTML = applicableInjury.length > 0
            ? applicableInjury.map((e) => `<li>${e.text} (${e.threshold} kPa)</li>`).join("")
            : '<li>Tidak ada efek signifikan.</li>';
        });
      }

      function calculateValues(isInitialLoad = false) {
        const btnSave = $('btnSaveResult');
        fields.forEach(id => $(id)?.classList.remove('input-error'));
        let hasError = false;
        const getFloat = (id) => {
          const el = $(id);
          const val = parseFloat(el.value);
          if (isNaN(val)) { el.classList.add('input-error'); hasError = true; }
          return val;
        };
        const [rho, vol, dh, eta, e_tnt, dist, pa] = fields.map(getFloat);

        if (!(eta >= 0 && eta <= 1)) { $('eta').classList.add('input-error'); hasError = true; }
        if (!(e_tnt > 0)) { $('e_tnt').classList.add('input-error'); hasError = true; }

        const resetAll = (msgText) => {
          ["W_mass", "E_total", "W_tnt", "Ze", "Ps", "Po_crowl", "Po_alonso", "Po_sadovski"].forEach(id => $(id).value = "");
          const msg = $("msg"); if (msg) { msg.classList.add("bad"); msg.textContent = msgText; msg.style.display = "block"; }
          updateEstimationPanels(NaN, NaN, NaN);
          if (chartController) chartController.plotResult(NaN, NaN);
          if (btnSave) btnSave.disabled = true;
        };

        if (hasError) return resetAll("Harap isi properti dengan rentang yang benar.");

        const W_mass = rho * vol;
        const E_total = W_mass * dh * eta;
        const W_tnt = E_total / e_tnt;
        const Ze = dist > 0 && W_tnt > 0 ? dist / Math.cbrt(W_tnt) : NaN;

        if (!Number.isFinite(Ze) || Ze <= 0) return resetAll("Hasil kalkulasi tidak valid (Ze tidak positif).");

        $("W_mass").value = W_mass.toFixed(2);
        $("E_total").value = E_total.toFixed(2);
        $("W_tnt").value = W_tnt.toFixed(2);
        $("Ze").value = Ze.toFixed(4);

        const PoPa_crowl = (1616 * (1 + (Ze/4.5)**2)) /
          (Math.sqrt(1 + (Ze/0.048)**2) * Math.sqrt(1 + (Ze/0.32)**2) * Math.sqrt(1 + (Ze/1.35)**2));
        $("Ps").value = PoPa_crowl.toFixed(4);
        if (chartController) chartController.plotResult(Ze, PoPa_crowl);

        const Po_crowl = PoPa_crowl * pa;
        const Po_alonso = ((z) =>
          (z >= 1 && z < 10) ? 1.13e6 * z**-2.01 :
          (z >= 10 && z <= 200) ? 1.83e5 * z**-1.16 : NaN)(Ze) / 1000;
        const Po_sadovski = ((w, d) => (d > 0 && w > 0) ? (r => 0.085*r + 0.3*r**2 + 0.8*r**3)(Math.cbrt(w)/d) : NaN)(W_tnt, dist) * 1000;

        $("Po_crowl").value = Po_crowl.toFixed(2);
        $("Po_alonso").value = isNaN(Po_alonso) ? "" : Po_alonso.toFixed(2);
        $("Po_sadovski").value = isNaN(Po_sadovski) ? "" : Po_sadovski.toFixed(2);

        updateEstimationPanels(Po_crowl, Po_alonso, Po_sadovski);

        if (isNaN(Po_alonso)) {
          const el = $('effects-alonso');
          if (el) el.innerHTML = '<li>Di luar domain valid Alonso (1 ≤ ze ≤ 200).</li>';
        }

        const msg = $("msg");
        msg.classList.remove("bad");
        msg.textContent = "Perhitungan berhasil.";
        msg.style.display = "block";
        if (btnSave) btnSave.disabled = false;

        if (!isInitialLoad) {
          saveStateToURL();
        }
      }

      function compute(isInitialLoad = false) {
        if ($("pa").value === "" || isNaN(parseFloat($("pa").value))) $("pa").value = "101.325";
        calculateValues(isInitialLoad);
      }

      function renderEquation(material) {
        const box = $("eq-text"); if (!box) return;
        if (!material || !eqMap[material]) { box.innerHTML = "Pilih material."; return; }
        box.innerHTML = eqMap[material].map(item => `<div class="rxn"><small>${item.label}</small><div class="rxn-eq">${item.eq}</div></div>`).join("");
      }

      function saveStateToURL() {
        const params = new URLSearchParams();
        inputFields.forEach(id => {
          const el = $(id);
          if (el && el.value !== undefined && el.value !== "") params.set(id, el.value);
        });
        const q = params.toString();
        const url = q ? `${window.location.pathname}?${q}` : window.location.pathname;
        window.history.replaceState({}, '', url);
      }

      function loadStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        let hasParams = params.has('material');

        if (hasParams) {
          params.forEach((val, key) => {
            const el = $(key); 
            if (el) { el.value = val; }
          });
          const materialEl = $('material');
          if (materialEl.value) {
            renderEquation(materialEl.value);
          }
          compute(true);
        } else {
          $('material').value = 'AN';
          $('vol').value = '10';
          $('dist').value = '100';
          $('material').dispatchEvent(new Event('init-load'));
        }
      }
      
      function renderLogTable() {
        const logTbody = $('logTbody');
        if (!logTbody) return;

        logTbody.innerHTML = ''; 

        if (simulationLog.length === 0) {
            logTbody.innerHTML = `<tr class="log-placeholder"><td colspan="11">Belum ada data simulasi yang disimpan.</td></tr>`;
            return;
        }

        simulationLog.forEach((log, index) => {
            const row = document.createElement('tr');
            if (log.isNew) {
              row.classList.add('new-row-animation');
              delete log.isNew; // Hapus properti setelah animasi
            }
            row.innerHTML = `
                <td data-label="Node">${index + 1}</td>
                <td data-label="Material">${log.material}</td>
                <td data-label="Volume">${log.vol}</td>
                <td data-label="Distance">${log.dist}</td>
                <td data-label="W TNT">${log.w_tnt}</td>
                <td data-label="ze">${log.ze}</td>
                <td data-label="Ps">${log.ps}</td>
                <td data-label="Po Crowl">${log.po_crowl}</td>
                <td data-label="Po Alonso">${log.po_alonso}</td>
                <td data-label="Po Sadovski">${log.po_sadovski}</td>
                <td class="col-action">
                    <button class="btn-delete" data-index="${index}" title="Hapus baris ini">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            logTbody.appendChild(row);
        });
      }

      // --- Log Persistence Functions ---
      function saveLogToLocalStorage() {
        localStorage.setItem('explosionSimLog', JSON.stringify(simulationLog));
      }

      function loadLogFromLocalStorage() {
        const savedLog = localStorage.getItem('explosionSimLog');
        if (savedLog) {
          simulationLog = JSON.parse(savedLog);
        }
      }

      // --- INIT ---
      chartController = initializeChart();
      const debouncedCompute = debounce(() => compute(false), 400);
      
      inputFields.forEach(id => {
        const el = $(id);
        if (el && el.tagName === 'INPUT') {
          el.addEventListener("input", debouncedCompute);
        }
      });
      
      const materialSel = $("material");
      materialSel.addEventListener("change", () => {
        const p = presets[materialSel.value];
        if (p) Object.keys(p).forEach(key => $(key).value = p[key]);
        renderEquation(materialSel.value);
        const msg = $("msg");
        if (materialSel.value) { 
            msg.classList.remove("bad"); 
            msg.textContent = "Nilai contoh diisikan."; 
            msg.style.display = "block"; 
        }
        compute(false);
      });

      materialSel.addEventListener("init-load", () => {
        const p = presets[materialSel.value];
        if (p) Object.keys(p).forEach(key => $(key).value = p[key]);
        renderEquation(materialSel.value);
        compute(true);
      });

      const btnSave = $('btnSaveResult');
      btnSave.addEventListener('click', () => {
        if (btnSave.disabled) return;
        
        const selectedOption = materialSel.options[materialSel.selectedIndex];
        const newLogEntry = {
            material: selectedOption ? selectedOption.text : 'N/A',
            vol: $('vol').value,
            dist: $('dist').value,
            w_tnt: $('W_tnt').value,
            ze: $('Ze').value,
            ps: $('Ps').value,
            po_crowl: $('Po_crowl').value || 'N/A',
            po_alonso: $('Po_alonso').value || 'N/A',
            po_sadovski: $('Po_sadovski').value || 'N/A',
            isNew: true // Flag untuk animasi
        };

        simulationLog.unshift(newLogEntry);

        if (simulationLog.length > 10) {
            simulationLog.pop(); 
        }

        renderLogTable();
        saveLogToLocalStorage();
      });
      
      const logTbody = $('logTbody');
      logTbody.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.btn-delete');
        if (deleteButton) {
            const indexToDelete = parseInt(deleteButton.dataset.index, 10);
            if (!isNaN(indexToDelete)) {
                simulationLog.splice(indexToDelete, 1);
                renderLogTable();
                saveLogToLocalStorage();
            }
        }
      });
      
      loadLogFromLocalStorage();
      loadStateFromURL();
      loadLogo();
      $("toTop")?.addEventListener("click", goTop);
      renderLogTable();
    });
