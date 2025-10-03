document.addEventListener('DOMContentLoaded', () => {
    // English: DOM element references.
    // Bahasa Indonesia: Referensi elemen DOM.
    const btnAskGemini = document.getElementById('btnAskGemini');
    const geminiPrompt = document.getElementById('gemini-prompt');
    const geminiResponse = document.getElementById('gemini-response');
    const logTable = document.getElementById('logTable');
    const languageSwitcher = document.getElementById('language-switcher');
    const materialSelect = document.getElementById('material');
    const eqText = document.getElementById('eq-text');
    
    // New Material Form elements
    const newMaterialForm = document.getElementById('new-material-form');
    const newMaterialNameInput = document.getElementById('new_material_name');
    const newMaterialFormulaInput = document.getElementById('new_material_formula');
    const newMaterialPressureInput = document.getElementById('new_material_pressure');
    const newMaterialTempInput = document.getElementById('new_material_temp');
    const newMaterialRhoInput = document.getElementById('new_material_rho');
    const newMaterialDhInput = document.getElementById('new_material_dh');
    const newMaterialEtaInput = document.getElementById('new_material_eta');
    const newMaterialEtntInput = document.getElementById('new_material_etnt');

    const newMaterialInputs = newMaterialForm.querySelectorAll('input');
    const btnSaveNewMaterial = document.getElementById('btnSaveNewMaterial');
    const btnEditMaterial = document.getElementById('btnEditMaterial');
    const btnDeleteMaterial = document.getElementById('btnDeleteMaterial');
    const btnCancelNewMaterial = document.getElementById('btnCancelNewMaterial');
    const materialLookupSpinner = document.getElementById('material-lookup-spinner');
    const quickPanelInputs = document.getElementById('floatPanelInputs');

    const LOCAL_STORAGE_KEY = 'virdanurlulu_custom_materials';
    const REPORT_STORAGE_PREFIX = 'virdanurlulu_report_';
    let currentMaterialData = {}; // Stores all fetched data for the new material

    // English: Bilingual object for UI messages.
    // Bahasa Indonesia: Objek bilingual untuk pesan antarmuka pengguna.
    const messages = {
        en: {
            provideScenario: '<p>Please provide a brief case study scenario.</p>',
            noLogData: '<p>Cannot generate a report without data in the Simulation Log.</p>',
            apiError: (msg) => `Error: ${msg}`,
            authError: 'Authentication failed. All API keys may be invalid or have reached their quota. Please verify your API keys.',
            httpError: (status, text) => `HTTP error! status: ${status} ${text}`,
            blockedRequest: (reason) => `<p>Request was blocked due to safety settings. Reason: ${reason}. Please adjust your prompt.</p>`,
            apiResponseError: (msg) => `API returned an error: ${msg}`,
            invalidResponse: 'Invalid response structure from Gemini API.',
            serviceUnavailable: (retries) => `The AI service is still unavailable after ${retries} attempts. Please try again later.`,
            fillAllFields: 'Please fill all fields for the new material.',
            materialAdded: 'New material added successfully.',
            materialUpdated: 'Material updated successfully.',
            materialDeleted: 'Material deleted successfully.',
            dataNotFound: 'Could not find data for the specified material. Please enter manually.'
        },
        id: {
            provideScenario: '<p>Mohon berikan skenario studi kasus singkat.</p>',
            noLogData: '<p>Tidak dapat membuat laporan tanpa data di dalam Log Simulasi.</p>',
            apiError: (msg) => `Galat: ${msg}`,
            authError: 'Autentikasi gagal. Semua kunci API mungkin tidak valid atau telah mencapai kuotanya. Mohon verifikasi kunci API Anda.',
            httpError: (status, text) => `Galat HTTP! status: ${status} ${text}`,
            blockedRequest: (reason) => `<p>Permintaan diblokir karena pengaturan keamanan. Alasan: ${reason}. Mohon sesuaikan prompt Anda.</p>`,
            apiResponseError: (msg) => `API mengembalikan galat: ${msg}`,
            invalidResponse: 'Struktur respons dari API Gemini tidak valid.',
            serviceUnavailable: (retries) => `Layanan AI masih tidak tersedia setelah ${retries} percobaan. Silakan coba lagi nanti.`,
            fillAllFields: 'Mohon isi semua kolom untuk material baru.',
            materialAdded: 'Material baru berhasil ditambahkan.',
            materialUpdated: 'Material berhasil diperbarui.',
            materialDeleted: 'Material berhasil dihapus.',
            dataNotFound: 'Data untuk material yang dimaksud tidak dapat ditemukan. Mohon masukkan secara manual.'
        }
    };
    
    const uiTranslations = {
      en: {
          gemini_title: 'Process Safety Recommendation',
          gemini_report_description: 'Enter a brief case study scenario below (e.g., "LPG truck tanker crash and explosion in a populated area") and we will generate a detailed academic report based on the current simulation log data.',
          btn_generate_report: 'Process Safety Report',
          gemini_prompt_placeholder: 'Analysis of section: Chemical Material, Properties, physical material, Parameters Calculation resulted, chart Scaled Overpressure vs Scaled Distance, Estimation of Damage to Structures and Process Equipment, Estimation of Injury Consequences, chart Overpressure vs Distance, Simulation Log, and Explosion Contour Map with check Lat and Lon the location and check where the location (city and country) based on coordinate, find incident brief from the publication website Journal news, Recommendations for building a standard type explosion-proof and fire-proof control room building.',
          add_new_material: '-- Add New Material --',
          form_title_new_material: 'Add New Material',
          form_label_name: 'Material Name',
          form_label_formula: 'Chemical Formula',
          form_label_pressure: 'Pressure (kPa)',
          form_label_temp: 'Temperature (°C)',
          form_label_density: 'Density (kg/m³)',
          form_label_dh: 'ΔH_exp (kJ/kg)',
          form_label_eta: 'η_E',
          form_label_etnt: 'E_TNT (kJ/kg)',
          btn_save_material: 'Save Material',
          btn_edit_material: 'Edit',
          btn_delete_material: 'Delete',
          btn_cancel: 'Cancel'
      },
      id: {
          gemini_title: 'Rekomendasi Keselamatan Proses',
          gemini_report_description: 'Masukkan skenario studi kasus singkat di bawah ini (misalnya, "Kecelakaan dan ledakan truk tangki LPG di daerah padat penduduk") dan kami akan membuat laporan akademis terperinci berdasarkan data log simulasi saat ini.',
          btn_generate_report: 'Buat Laporan Keselamatan Proses',
          gemini_prompt_placeholder: 'Analisis bagian: Material Kimia, Properti, material fisik, Hasil Perhitungan Parameter, grafik Scaled Overpressure vs Scaled Distance, Estimasi Kerusakan Struktur dan Peralatan Proses, Estimasi Konsekuensi Cedera, grafik Overpressure vs Distance, Log Simulasi, dan Peta Kontur Ledakan dengan memeriksa Lintang dan Bujur lokasi dan memeriksa di mana lokasi (kota dan negara) berdasarkan koordinat, temukan ringkasan insiden dari situs web publikasi Jurnal berita, Rekomendasi untuk membangun gedung ruang kendali standar tahan ledakan dan tahan api.',
          add_new_material: '-- Tambah Material Baru --',
          form_title_new_material: 'Tambah Material Baru',
          form_label_name: 'Nama Material',
          form_label_formula: 'Rumus Kimia',
          form_label_pressure: 'Tekanan (kPa)',
          form_label_temp: 'Suhu (°C)',
          form_label_density: 'Massa Jenis (kg/m³)',
          form_label_dh: 'ΔH_ledak (kJ/kg)',
          form_label_eta: 'η_E',
          form_label_etnt: 'E_TNT (kJ/kg)',
          btn_save_material: 'Simpan Material',
          btn_edit_material: 'Ubah',
          btn_delete_material: 'Hapus',
          btn_cancel: 'Batal'
      }
    };
    
    function applyTranslations(lang) {
      document.querySelectorAll('[data-lang-key]').forEach(el => {
          const key = el.dataset.langKey;
          const translation = uiTranslations[lang]?.[key];
          if (translation) {
              if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                  if (el.hasAttribute('placeholder')) el.placeholder = translation;
              } else {
                  el.innerHTML = translation;
              }
          }
      });
    }

    // ... (All other JavaScript functions and event listeners from the original file)
});

document.addEventListener('DOMContentLoaded', function() {
    const fsBtn = document.getElementById('fsBtn');
    const fsBtnMobile = document.getElementById('fsBtnMobile');
    const mapCard = document.getElementById('mapCard');

    function enterFS() {
        if (mapCard.requestFullscreen) {
            mapCard.requestFullscreen();
        } else if (mapCard.webkitRequestFullscreen) { /* Safari */
            mapCard.webkitRequestFullscreen();
        } else if (mapCard.msRequestFullscreen) { /* IE11 */
            mapCard.msRequestFullscreen();
        }
        fsBtn.setAttribute('aria-pressed', 'true');
        fsBtnMobile.setAttribute('aria-pressed', 'true');
    }

    function exitFS() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        fsBtn.setAttribute('aria-pressed', 'false');
        fsBtnMobile.setAttribute('aria-pressed', 'false');
    }

    function toggleFS() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            enterFS();
        } else {
            exitFS();
        }
    }

    fsBtn.addEventListener('click', toggleFS);
    fsBtnMobile.addEventListener('click', toggleFS);

    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);

    function handleFSChange() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsBtn.setAttribute('aria-pressed', isFullscreen.toString());
        fsBtnMobile.setAttribute('aria-pressed', isFullscreen.toString());
    }
});
