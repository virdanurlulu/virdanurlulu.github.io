const $ = (id) => document.getElementById(id);
const fields = ['rho','vol','dh','eta','e_tnt','dist','pa'];

// ---- Logo loader with multiple fallbacks ----
const logoCandidates = [
    'https://raw.githubusercontent.com/virdanurlulu/virdanurlulu.github.io/refs/heads/main/img/Logo_Institut_Teknologi_Bandung.webp'
];
function loadLogo(){
    const img = document.getElementById('itbLogo');
    if(!img) return;
    let i = 0;
    const fallbackData = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><circle cx="128" cy="128" r="120" fill="%230079c2"/><text x="50%" y="56%" font-family="Georgia, serif" font-size="88" text-anchor="middle" fill="white">ITB</text></svg>';
    const tryNext = ()=>{
    if(i >= logoCandidates.length){ img.onerror=null; img.src = fallbackData; return; }
    const url = logoCandidates[i++] + (logoCandidates[i-1].includes('?') ? '' : '?v=1');
    img.onerror = tryNext;
    img.src = url;
    };
    tryNext();
}

// Back to top
function goTop(){ try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0);} }

// Estimation Panels
const updateEstimationPanels = (PoCrowl, PoAlonso, PoSadovski) => {
    const getSeverity = (Po) => {
    if (Po >= 70) return 'Major';
    if (Po >= 35) return 'Serious';
    if (Po >= 14) return 'Moderate';
    if (Po >= 1.4) return 'Minor';
    return 'Unknown';
    };

    const updatePanel = (method, Po) => {
    const sevFoot = $(`sev-${method}`);
    const sevFootInjury = $(`sev-injury-${method}`);
    const effectsDamageEl = $(`effects-${method}`);
    const effectsInjuryEl = $(`injury-effects-${method}`);

    const damageEffects = {
        'crowl': [
        { threshold: 276, text: 'Dinding beton bertulang hancur' },
        { threshold: 34.5, text: 'Kerusakan total pada bangunan non-permanen' },
        { threshold: 7, text: 'Kerusakan struktural parsial pada bangunan' },
        { threshold: 1.4, text: 'Kerusakan ringan pada jendela kaca' }
        ],
        'alonso': [
        { threshold: 70, text: 'Kerusakan total pada bangunan industri' },
        { threshold: 35, text: 'Kerusakan parah pada bangunan' },
        { threshold: 21, text: 'Kerusakan besar pada pabrik kimia' },
        { threshold: 7, text: 'Kerusakan atap, dinding, dan jendela' }
        ],
        'sadovski': [
        { threshold: 70, text: 'Bangunan hancur total' },
        { threshold: 35, text: 'Dinding runtuh' },
        { threshold: 14, text: 'Kerusakan struktural ringan' },
        { threshold: 7, text: 'Pecah jendela kaca' }
        ]
    };

    const injuryEffects = {
        'crowl': [
        { threshold: 70, text: 'Kematian 50%' },
        { threshold: 34.5, text: 'Gendang telinga pecah' },
        { threshold: 28, text: 'Luka berat dan mematikan' },
        { threshold: 14, text: 'Luka-luka kecil' }
        ],
        'alonso': [
        { threshold: 70, text: 'Kematian' },
        { threshold: 35, text: 'Cedera serius/fatal' },
        { threshold: 21, text: 'Gendang telinga pecah' },
        { threshold: 7, text: 'Luka ringan' }
        ],
        'sadovski': [
        { threshold: 70, text: 'Kematian' },
        { threshold: 35, text: 'Gendang telinga pecah' },
        { threshold: 28, text: 'Luka serius/fatal' },
        { threshold: 14, text: 'Luka-luka' }
        ]
    };

    if (isNaN(Po)) {
        const elA = $(`val-Po-${method}`);
        const elB = $(`val-Po-${method}-inj`);
        if (elA) elA.textContent = '—';
        if (elB) elB.textContent = '—';
        if (sevFoot) { sevFoot.textContent = 'Unknown'; sevFoot.className = 'sevfoot Unknown'; }
        if (sevFootInjury) { sevFootInjury.textContent = 'Unknown'; sevFootInjury.className = 'sevfoot Unknown'; }
        if (effectsDamageEl) effectsDamageEl.innerHTML = '<li>Menunggu input...</li>';
        if (effectsInjuryEl) effectsInjuryEl.innerHTML = '<li>Menunggu input...</li>';
        return;
    }

    const severity = getSeverity(Po);
    const pretty = Po.toLocaleString('id-ID',{maximumFractionDigits:2});

    const elA = $(`val-Po-${method}`);
    const elB = $(`val-Po-${method}-inj`);
    if (elA) elA.textContent = pretty;
    if (elB) elB.textContent = pretty;

    sevFoot.textContent = severity;
    sevFootInjury.textContent = severity;
    sevFoot.className = `sevfoot ${severity}`;
    sevFootInjury.className = `sevfoot ${severity}`;

    // Dynamically update effect lists
    const applicableDamage = damageEffects[method].filter(e => Po >= e.threshold);
    const applicableInjury = injuryEffects[method].filter(e => Po >= e.threshold);

    if (effectsDamageEl) {
        effectsDamageEl.innerHTML = applicableDamage.length > 0
        ? applicableDamage.map(e => `<li style="color:var(--ink);">${e.text} (${e.threshold} kPa)</li>`).join('')
        : '<li style="color:var(--ink);">Tidak ada efek signifikan pada level ini.</li>';
    }
    if (effectsInjuryEl) {
        effectsInjuryEl.innerHTML = applicableInjury.length > 0
        ? applicableInjury.map(e => `<li style="color:var(--ink);">${e.text} (${e.threshold} kPa)</li>`).join('')
        : '<li style="color:var(--ink);">Tidak ada efek signifikan pada level ini.</li>';
    }
    };

    updatePanel('crowl', PoCrowl);
    updatePanel('alonso', PoAlonso);
    updatePanel('sadovski', PoSadovski);
};

const calculateValues = () => {
    const rho = parseFloat($("rho").value);
    const vol = parseFloat($("vol").value);
    const dh = parseFloat($("dh").value);
    const eta = parseFloat($("eta").value);
    const e_tnt = parseFloat($("e_tnt").value);
    const dist = parseFloat($("dist").value);
    const pa = parseFloat($("pa").value);

    const resetAll = (msgText, bad=true) => {
    ["W_mass","E_total","W_tnt","Ze","Ps","Po_crowl","Po_alonso","Po_sadovski"].forEach(id=> $(id).value = "");
    const msg = $("msg");
    msg.classList.toggle('bad', !!bad);
    msg.textContent = msgText;
    msg.style.display = 'block';
    updateEstimationPanels(NaN, NaN, NaN);
    };

    const isAnyInputFilled = fields.some(id => $(id).value !== "");
    if (!isAnyInputFilled) {
        $("msg").style.display = 'none';
        updateEstimationPanels(NaN, NaN, NaN);
        return;
    }

    if (isNaN(rho) || isNaN(vol) || isNaN(dh) || isNaN(eta) || isNaN(e_tnt) || isNaN(dist) || isNaN(pa)) {
    return resetAll('Harap isi semua properti yang dibutuhkan.');
    }

    const clamp01 = (x)=> isNaN(x) ? NaN : Math.max(0, Math.min(1, x));
    const _eta = clamp01(eta);

    const W_mass = rho * vol;
    const E_total = W_mass * dh * _eta;

    if (!(e_tnt > 0) || !(E_total > 0)) {
    return resetAll('Periksa kembali ΔH, η, dan E_TNT (harus > 0).');
    }

    const W_tnt = E_total / e_tnt;
    if (!(W_tnt > 0)) {
    return resetAll('W_TNT tidak valid. Sesuaikan parameter.');
    }

    const Ze = dist > 0 ? (dist / Math.cbrt(W_tnt)) : NaN;
    if (!Number.isFinite(Ze) || Ze <= 0) {
    return resetAll('Jarak harus > 0 dan W_TNT masuk akal untuk menghitung Ze.');
    }

    $("W_mass").value = W_mass.toFixed(2);
    $("E_total").value = E_total.toFixed(2);
    $("W_tnt").value = W_tnt.toFixed(2);
    $("Ze").value = Ze.toFixed(4);

    // Crowl method
    const computeOverpressureCrowl = (Ze) => {
    const numerator = 1616 * (1 + Math.pow(Ze / 4.5, 2));
    const term1_den = Math.sqrt(1 + Math.pow(Ze / 0.048, 2));
    const term2_den = Math.sqrt(1 + Math.pow(Ze / 0.32, 2));
    const term3_den = Math.sqrt(1 + Math.pow(Ze / 1.35, 2));
    const denominator = term1_den * term2_den * term3_den;
    return numerator / denominator;
    }
    
    // Alonso method
    const computeOverpressureAlonso = (Ze) => {
    if (Ze >= 1 && Ze < 10) return 1.13 * Math.pow(10, 6) * Math.pow(Ze, -2.01);
    if (Ze >= 10 && Ze <= 200) return 1.83 * Math.pow(10, 5) * Math.pow(Ze, -1.16);
    return NaN;
    }
    
    // Sadovski method
    const computeOverpressureSadovski = (W_tnt, dist) => {
    if (dist > 0 && W_tnt > 0) {
        const ratioTerm = Math.cbrt(W_tnt) / dist;
        return 0.085 * ratioTerm + 0.3 * Math.pow(ratioTerm, 2) + 0.8 * Math.pow(ratioTerm, 3);
    }
    return NaN;
    }

    const PoPa_crowl = computeOverpressureCrowl(Ze);
    const Po_crowl = PoPa_crowl * pa; 
    
    // Rumus Alonso menghasilkan Pa, konversi ke kPa (/1000)
    const Po_alonso = computeOverpressureAlonso(Ze) / 1000;
    
    // Rumus Sadovski menghasilkan MPa, konversi ke kPa (*1000)
    const Po_sadovski = computeOverpressureSadovski(W_tnt, dist) * 1000; 

    $("Ps").value = PoPa_crowl.toFixed(4);
    $("Po_crowl").value = Po_crowl.toFixed(2);
    $("Po_alonso").value = isNaN(Po_alonso) ? '' : Po_alonso.toFixed(2);
    $("Po_sadovski").value = isNaN(Po_sadovski) ? '' : Po_sadovski.toFixed(2);

    updateEstimationPanels(Po_crowl, Po_alonso, Po_sadovski);
    
    const msg = $("msg");
    msg.classList.remove('bad');
    msg.textContent = "Perhitungan berhasil diselesaikan.";
    msg.style.display = 'block';
};

function compute() {
    if ($('pa').value === '' || isNaN(parseFloat($('pa').value))) {
        $('pa').value = '101.325';
    }
    calculateValues();
}

const presets = {
    AN:  { rho: 1725, dh: 2479,  e_tnt: 4500, eta: 0.35  },
    LPG: { rho: 37,   dh: 50000, e_tnt: 4500, eta: 0.03 },
    H2:  { rho: 0.08375, dh: 130800,e_tnt: 4500, eta: 0.05 },
    TNT: { rho: 1600, dh: 4184,  e_tnt: 4184, eta: 1.0   }
};

const eqMap = {
    AN: [
    {label:'Thermal decomposition (sub‑detonation)', eq:'NH<sub>4</sub>NO<sub>3</sub>(s) <span class="arrow">→</span> N<sub>2</sub>O(g) + 2 H<sub>2</sub>O(g)'},
    {label:'Detonation (oxygen‑balanced approx.)', eq:'2 NH<sub>4</sub>NO<sub>3</sub>(s) <span class="arrow">→</span> 2 N<sub>2</sub>(g) + O<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)'}
    ],
    LPG: [ {label:'Combustion proxy (propane)', eq:'C<sub>3</sub>H<sub>8</sub>(g) + 5 O<sub>2</sub>(g) <span class="arrow">→</span> 3 CO<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)'} ],
    H2: [ {label:'Combustion/explosion', eq:'2 H<sub>2</sub>(g) + O<sub>2</sub>(g) <span class="arrow">→</span> 2 H<sub>2</sub>O(g)'} ],
    TNT: [ {label:'Detonation (oxygen‑deficient, typical overall)', eq:'2 C<sub>7</sub>H<sub>5</sub>N<sub>3</sub>O<sub>6</sub>(s) <span class="arrow">→</span> 3 N<sub>2</sub>(g) + 5 H<sub>2</sub>O(g) + 7 CO(g) + 7 C(s)'} ]
};

function renderEquation(material){
    const box = $('eq-text');
    if (!box) return;
    if (!material || !eqMap[material]){ box.innerHTML = 'Pilih material untuk menampilkan persamaan reaksi representatif.'; return; }
    const html = eqMap[material].map(item=>`<div class="rxn"><small>${item.label}</small><div class="rxn-eq">${item.eq}</div></div>`).join('');
    box.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    loadLogo();

    $('toTop')?.addEventListener('click', goTop);

    fields.forEach(id=> $(id)?.addEventListener('input', compute));

    const materialSel = $("material");
    if (materialSel){
    materialSel.addEventListener('change', (e)=>{
        const p = presets[e.target.value];
        if (p){
        $("rho").value = p.rho;  $("dh").value = p.dh; $("e_tnt").value = p.e_tnt; $("eta").value = p.eta;
        compute();
        }
        renderEquation(e.target.value);
        const msg = $("msg");
        msg.classList.remove('bad');
        msg.textContent = 'Nilai contoh diisikan untuk pratinjau. Ganti dengan nilai dari literatur Anda.';
        msg.style.display = 'block';
    });
    }

    compute(); // Initial compute
});
