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

      function syncDropdownsContent() {
          const quickPanelSelect = quickPanelInputs.querySelector('select');
          if (quickPanelSelect) {
              const lastVal = materialSelect.value;
              quickPanelSelect.innerHTML = materialSelect.innerHTML;
              quickPanelSelect.value = lastVal;
          }
      }

      function loadCustomMaterials() {
        const storedMaterials = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        if (window.materials) {
            Object.assign(window.materials, storedMaterials);
        }
        
        const addNewOption = materialSelect.querySelector('option[value="add_new"]');
        for (const key in storedMaterials) {
            const optionExists = materialSelect.querySelector(`option[value="${key}"]`);
            if (!optionExists) {
                const newOption = document.createElement('option');
                newOption.value = key;
                newOption.textContent = storedMaterials[key].name;
                materialSelect.insertBefore(newOption, addNewOption);
            }
        }
        syncDropdownsContent();
      }

      function updateDensityIfNeeded() {
        const pressure_kPa_val = newMaterialPressureInput.value.trim();
        const temp_C_val = newMaterialTempInput.value.trim();
        const pressure_kPa = parseFloat(pressure_kPa_val);
        const temp_C = parseFloat(temp_C_val);
        const molarMass = currentMaterialData.molarMass;
        const defaultDensity = currentMaterialData.density;

        if (molarMass && pressure_kPa_val !== '' && temp_C_val !== '' && !isNaN(pressure_kPa) && !isNaN(temp_C)) {
            const P_Pa = pressure_kPa * 1000;
            const T_K = temp_C + 273.15;
            const M_kg_mol = molarMass / 1000;
            const R = 8.314;
            const Z = 1;

            if (T_K > 0) {
              const gasDensity = (P_Pa * M_kg_mol) / (Z * R * T_K);
              newMaterialRhoInput.value = gasDensity.toFixed(4);
            }
        } else if (defaultDensity) {
            newMaterialRhoInput.value = defaultDensity;
        }
      }
      
      materialSelect.addEventListener('change', () => {
        const selectedValue = materialSelect.value;
        const storedMaterials = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const isCustom = storedMaterials[selectedValue];
        
        const rhoInput = document.getElementById('rho');
        const dhInput = document.getElementById('dh');
        const etaInput = document.getElementById('eta');
        const etntInput = document.getElementById('e_tnt');

        currentMaterialData = {}; 

        if (selectedValue === 'add_new') {
            newMaterialForm.style.display = 'block';
            newMaterialInputs.forEach(input => {
                input.value = '';
                input.readOnly = false;
            });
            eqText.innerHTML = '';
            btnSaveNewMaterial.style.display = 'inline-block';
            btnCancelNewMaterial.style.display = 'inline-block';
            btnEditMaterial.style.display = 'none';
            btnDeleteMaterial.style.display = 'none';
            newMaterialNameInput.focus();
        } else if (isCustom) {
            const data = storedMaterials[selectedValue];
            currentMaterialData = data; 
            newMaterialForm.style.display = 'block';
            newMaterialNameInput.value = data.name;
            newMaterialFormulaInput.value = data.reaction_formula;
            newMaterialPressureInput.value = data.pressure || '';
            newMaterialTempInput.value = data.temperature || '';
            newMaterialRhoInput.value = data.rho;
            newMaterialDhInput.value = data.dh;
            newMaterialEtaInput.value = data.eta;
            newMaterialEtntInput.value = data.etnt || '';
            eqText.innerHTML = data.reaction ? data.reaction.replace('⟶', '&longrightarrow;') : `${data.reaction_formula} + O₂ &longrightarrow; CO₂ + H₂O`;
            
            rhoInput.value = data.rho;
            dhInput.value = data.dh;
            etaInput.value = data.eta;
            etntInput.value = data.etnt || 4520; 

            newMaterialInputs.forEach(input => input.readOnly = true);

            btnSaveNewMaterial.style.display = 'none';
            btnCancelNewMaterial.style.display = 'inline-block';
            btnEditMaterial.style.display = 'inline-block';
            btnDeleteMaterial.style.display = 'inline-block';
        } else {
            newMaterialForm.style.display = 'none';
             if (window.materials && window.materials[selectedValue]) {
                const materialProps = window.materials[selectedValue];
                rhoInput.value = materialProps.rho;
                dhInput.value = materialProps.dh;
                etaInput.value = materialProps.eta;
                etntInput.value = materialProps.e_tnt || 4520;

                const formula = materialProps.reaction_formula;
                if (formula && formula.includes('⟶')) {
                    eqText.innerHTML = formula;
                } else if (formula) {
                    eqText.innerHTML = `${formula} + O₂ &longrightarrow; CO₂ + H₂O`;
                } else {
                    eqText.innerHTML = '';
                }
            }
        }
         localStorage.setItem('virdanurlulu_last_selected_material', selectedValue);
         syncDropdownsContent();
         loadSavedReport();
      });
      
      btnCancelNewMaterial.addEventListener('click', () => {
        newMaterialForm.style.display = 'none';
        materialSelect.value = localStorage.getItem('virdanurlulu_last_selected_material') || 'LPG'; 
        newMaterialForm.querySelectorAll('input').forEach(input => input.value = '');
        materialSelect.dispatchEvent(new Event('change'));
      });

      btnEditMaterial.addEventListener('click', () => {
          newMaterialInputs.forEach(input => input.readOnly = false);
          document.getElementById('new_material_name').readOnly = true; 
          btnSaveNewMaterial.style.display = 'inline-block';
          btnEditMaterial.style.display = 'none';
      });

      btnDeleteMaterial.addEventListener('click', () => {
          const selectedValue = materialSelect.value;
          const uiLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
          const msgDiv = document.getElementById('msg');
          
          if (!selectedValue) return;

          if (window.materials) delete window.materials[selectedValue];
          
          const storedMaterials = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
          delete storedMaterials[selectedValue];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedMaterials));
          
          materialSelect.querySelector(`option[value="${selectedValue}"]`)?.remove();
          
          materialSelect.value = 'LPG'; 
          materialSelect.dispatchEvent(new Event('change'));
          syncDropdownsContent();
          
          msgDiv.textContent = messages[uiLang].materialDeleted;
          setTimeout(() => { msgDiv.textContent = '' }, 3000);
      });
      
      btnSaveNewMaterial.addEventListener('click', () => {
        const name = newMaterialNameInput.value.trim();
        const formula = newMaterialFormulaInput.value.trim();
        const pressure = newMaterialPressureInput.value;
        const temp = newMaterialTempInput.value;
        const rho = newMaterialRhoInput.value;
        const dh = newMaterialDhInput.value;
        const eta = newMaterialEtaInput.value;
        const etnt = newMaterialEtntInput.value;
        const reaction = eqText.innerHTML.replace('&longrightarrow;', '⟶');

        const uiLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
        const msgDiv = document.getElementById('msg');

        if (!name || !formula || !rho || !dh || !eta || !etnt) {
            msgDiv.textContent = messages[uiLang].fillAllFields;
            setTimeout(() => { msgDiv.textContent = '' }, 3000);
            return;
        }

        const originalKey = materialSelect.value;
        const storedMaterials = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const isEditing = storedMaterials[originalKey] !== undefined && originalKey !== 'add_new';

        const newMaterialKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        
        const newMaterialData = {
            name: name,
            rho: parseFloat(rho),
            dh: parseFloat(dh),
            eta: parseFloat(eta),
            etnt: parseFloat(etnt),
            reaction_formula: formula,
            pressure: parseFloat(pressure),
            temperature: parseFloat(temp),
            molarMass: currentMaterialData.molarMass,
            density: currentMaterialData.density, 
            reaction: reaction
        };

        if (window.materials) {
            window.materials[newMaterialKey] = newMaterialData;
        }

        storedMaterials[newMaterialKey] = newMaterialData;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedMaterials));

        if (!isEditing) {
            const newOption = document.createElement('option');
            newOption.value = newMaterialKey;
            newOption.textContent = name;
            materialSelect.insertBefore(newOption, materialSelect.querySelector('option[value="add_new"]'));
        }
        
        syncDropdownsContent();
        materialSelect.value = newMaterialKey;
        materialSelect.dispatchEvent(new Event('change'));
        
        document.getElementById('rho').value = rho;
        document.getElementById('dh').value = dh;
        document.getElementById('eta').value = eta;
        document.getElementById('e_tnt').value = etnt;


        msgDiv.textContent = isEditing ? messages[uiLang].materialUpdated : messages[uiLang].materialAdded;
        setTimeout(() => { msgDiv.textContent = '' }, 3000);
      });

      newMaterialNameInput.addEventListener('blur', async () => {
        const materialName = newMaterialNameInput.value.trim();
        const uiLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
        if (!materialName || newMaterialNameInput.readOnly) return;

        materialLookupSpinner.style.display = 'inline-block';
        try {
            const data = await fetchMaterialDataFromAI(materialName);
            if (data && data.formula) {
                currentMaterialData = data; 
                
                newMaterialFormulaInput.value = data.formula || '';
                newMaterialRhoInput.value = data.density || '';
                newMaterialDhInput.value = data.heatOfCombustion || '';
                newMaterialEtaInput.value = data.explosionEfficiency || '0.04'; 
                newMaterialEtntInput.value = data.etnt || '4520';
                
                if (data.reaction) {
                    eqText.innerHTML = data.reaction.replace('⟶', '&longrightarrow;');
                } else if(data.formula) {
                    eqText.innerHTML = `${data.formula} + O₂ &longrightarrow; CO₂ + H₂O`;
                }
                
                updateDensityIfNeeded();

            } else {
                 const msgDiv = document.getElementById('msg');
                 msgDiv.textContent = messages[uiLang].dataNotFound;
                 setTimeout(() => { msgDiv.textContent = '' }, 3000);
            }
        } catch (error) {
            console.error("Error fetching material data:", error);
            const msgDiv = document.getElementById('msg');
            msgDiv.textContent = messages[uiLang].apiError(error.message);
            setTimeout(() => { msgDiv.textContent = '' }, 3000);
        } finally {
            materialLookupSpinner.style.display = 'none';
        }
      });
      
      newMaterialPressureInput.addEventListener('input', updateDensityIfNeeded);
      newMaterialTempInput.addEventListener('input', updateDensityIfNeeded);

      async function fetchMaterialDataFromAI(materialName) {
        const systemPrompt = `You are a chemical engineering assistant. Your task is to retrieve specific physical properties for a given chemical from the NIST Chemistry WebBook or other reliable sources. Respond ONLY with a JSON object with the keys "formula", "density", "heatOfCombustion", "explosionEfficiency", "molarMass", "reaction", and "etnt".
        - For 'formula', provide the chemical formula.
        - For 'density', provide the liquid density in kg/m³ for substances that are gases at STP but are typically stored as liquids under pressure (e.g., propane, LPG). For other substances, provide the gas density at standard conditions.
        - For 'heatOfCombustion', find the heat of combustion (ΔHc) in kJ/kg. If given in kJ/mol, convert it. Use this as a proxy for heat of explosion.
        - For 'explosionEfficiency', provide a typical literature value for a vapor cloud explosion if available, otherwise default to 0.04.
        - For 'molarMass', provide the molar mass in g/mol.
        - For 'reaction', provide the balanced chemical equation for complete combustion with O₂, using '⟶' as the reaction arrow.
        - For 'etnt', provide the standard energy of explosion for TNT, which is 4520 kJ/kg.`;
        const userQuery = `Find the following properties for ${materialName}: chemical formula, density (kg/m³), heat of combustion (kJ/kg), molar mass (g/mol), and its balanced complete combustion reaction. Also provide the standard energy of explosion for TNT.`;
        
        return await callGeminiApi(userQuery, systemPrompt, true).then(text => JSON.parse(text)).catch(e => { console.error("AI data fetch failed:", e); return null;});
      }


      if (btnAskGemini) {
        btnAskGemini.addEventListener('click', handleGenerateReport);
      }

      if (languageSwitcher) {
        languageSwitcher.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-btn');
            if (!btn) return;
            const selectedLang = btn.dataset.lang;
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateReportLanguage();
            applyTranslations(selectedLang); 
        });
      }

      function updateReportLanguage() {
        const activeLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
        const reportEN = geminiResponse.querySelector('#report-en');
        const reportID = geminiResponse.querySelector('#report-id');

        if(reportEN && reportID) {
            if (activeLang === 'id') {
                reportEN.style.display = 'none';
                reportID.style.display = 'block';
            } else {
                reportEN.style.display = 'block';
                reportID.style.display = 'none';
            }
        }
      }

      function getLogDataAsText() {
        const headers = Array.from(logTable.querySelectorAll('thead tr:first-child th'))
          .map(th => th.textContent.trim())
          .slice(0, -1);
        const units = Array.from(logTable.querySelectorAll('thead tr.unit-row th'))
          .map(th => th.textContent.trim());
        
        const combinedHeaders = headers.map((h, i) => units[i] ? `${h} ${units[i]}`.trim() : h);

        const rows = Array.from(logTable.querySelectorAll('tbody tr'));
        if (rows.length === 0) {
          return "No simulation log data available.";
        }

        const recentRows = rows.slice(-1); 

        const data = recentRows.map(row => {
          return Array.from(row.querySelectorAll('td'))
            .map(td => td.textContent.trim())
            .slice(0, -1) 
            .join(' | ');
        });

        return `Headers: ${combinedHeaders.join(' | ')}\nData (last ${recentRows.length} entry):\n${data.join('\n')}`;
      }

      async function handleGenerateReport() {
        const uiLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
        const userScenario = geminiPrompt.value.trim();
        
        if (!userScenario) {
          geminiResponse.innerHTML = messages[uiLang].provideScenario;
          return;
        }

        const logData = getLogDataAsText();
        if (logData === "No simulation log data available.") {
            geminiResponse.innerHTML = messages[uiLang].noLogData;
            return;
        }
        
        geminiResponse.textContent = '';
        geminiResponse.classList.add('loading');
        btnAskGemini.disabled = true;

        const systemPrompt = `You are an AI assistant and expert in chemical process safety, with deep knowledge of incidents like Beirut, Tianjin, Buncefield, and standards from CCPS, AIChE, and Lees' Loss Prevention. You are generating an academic case study from the perspective of a Master's candidate in Chemical Engineering at ITB.
        **Mandatory Directives**:
        - The entire output must be a single HTML block.
        - Create two root divs: \`<div id="report-en" lang="en">...\` and \`<div id="report-id" lang="id">...\`.
        - Fully translate the report into academic English and formal Indonesian (EYD) inside the respective divs.
        - Use this HTML styling: Title: \`<h4 style='font-size: 16px; font-weight: bold; text-align: center; color: #00529b;'>...\` | Subtitle: \`<h5 style='font-size: 14px; font-weight: bold; text-align: center; color: #00529b;'>...\` | Section Headers: \`<p><strong style='font-size: 14px;'># No. Title</strong></p>\` | Body: \`<p style='font-size: 12px; line-height: 1.2;'>...\`.
        - Add 5-10 academic citations like \`<span style='color: #003366; font-weight: bold;'>[#]</span>\`, referencing the bibliography at https://virdanurlulu.github.io/html/bibliography_sim_modeling_explosion.html.
        - Maintain a formal, academic, and analytical tone, connecting simulation results to real-world incidents and best practices.
        **Report Structure**:
        1.  **Chronological Account**: Detail the user-provided scenario.
        2.  **Causal Analysis**: Conduct a concise root cause analysis, referencing similar past incidents.
        3.  **Simulation Data Analysis**: Interpret the simulation log data (chemical properties, overpressure calculations, charts, damage/injury estimates, contour map), explaining the significance of the results.
        4.  **Risk Mitigation Strategies**: Propose mitigation measures based on industry standards (e.g., CCPS RBPS, facility siting guidelines).
        5.  **Formal Recommendations**: Formulate specific short-term and long-term recommendations, drawing lessons from established safety literature.`;
        
        const fullPrompt = `**Simulation Log Data:**\n${logData}\n\n**User's Case Study Scenario:**\n${userScenario}`;

        try {
          const generatedHtml = await callGeminiApi(fullPrompt, systemPrompt);
          let html = (generatedHtml || '').trim();
          
          if (/^```/.test(html)) {
            const m = html.match(/^```([a-zA-Z0-9_-]+)?\n/);
            html = m ? html.slice(m[0].length) : html.replace(/^```/, '');
            html = html.replace(/\n?```$/, '');
          }
          if (html.includes('&lt;') && html.includes('&gt;') && !html.includes('<div')) {
            const ta = document.createElement('textarea');
            ta.innerHTML = html; html = ta.value;
          }
          
          geminiResponse.innerHTML = html;
          const selectedMaterial = materialSelect.value;
          if (selectedMaterial) {
              const reportKey = `${REPORT_STORAGE_PREFIX}${selectedMaterial}`;
              localStorage.setItem(reportKey, html);
          }
          updateReportLanguage();
        } catch (error) {
          console.error('Gemini API call failed:', error);
          geminiResponse.textContent = messages[uiLang].apiError(error.message);
        } finally {
          geminiResponse.classList.remove('loading');
          btnAskGemini.disabled = false;
        }
      }

      // API Key Management
      const apiKeys = [
        "AIzaSyDG5smBPe4YS0DfPzdF32bMk1aTUM_fVt8",
        "AIzaSyBOol9JlsJIhmPmcaE8VqlKlXPHxEJ6Bic",
        "AIzaSyCVfb2YVOx2mmRAlbnDIqCf29a7yZMK5J0",
        "AIzaSyCB_s_Wvn9a63osNm5vwyqYtmOOH9Rw1tk"
      ];
      let currentApiKeyIndex = 0;


      async function callGeminiApi(prompt, systemInstruction, isJson = false) {
        const model = 'gemini-2.5-flash-preview-05-20';
        const uiLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
        };
        
        if (isJson) {
            payload.generationConfig = { responseMimeType: "application/json" };
        }

        const maxAttempts = apiKeys.length;
        let lastError = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const apiKey = apiKeys[currentApiKeyIndex];
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                        return result.candidates[0].content.parts[0].text; // Success
                    } else {
                        const blockReason = result.promptFeedback?.blockReason;
                        if (blockReason) return messages[uiLang].blockedRequest(blockReason);
                        if (result.error) throw new Error(messages[uiLang].apiResponseError(result.error.message));
                        throw new Error(messages[uiLang].invalidResponse);
                    }
                }

                if (response.status === 401 || response.status === 429) {
                    console.warn(`API key index ${currentApiKeyIndex} failed with status ${response.status}. Switching to next key.`);
                    lastError = new Error(messages[uiLang].authError); // Store the last relevant error
                    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                    continue; // Try the next key
                } else {
                    // For other server errors, we can treat them as potentially transient but still switch key
                    lastError = new Error(messages[uiLang].httpError(response.status, response.statusText));
                    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                }

            } catch (error) {
                console.warn(`Fetch failed for API key index ${currentApiKeyIndex}:`, error.message);
                lastError = error; // Store the network error
                currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
            }
        }
        
        // If the loop completes without a successful return, all keys have failed.
        throw lastError || new Error(`All API keys failed after ${maxAttempts} attempts.`);
      }
      
      function loadSavedReport() {
        const selectedMaterial = materialSelect.value;
        if (!selectedMaterial || selectedMaterial === 'add_new') {
            geminiResponse.innerHTML = '';
            return;
        }
        const reportKey = `${REPORT_STORAGE_PREFIX}${selectedMaterial}`;
        const savedReport = localStorage.getItem(reportKey);
        if (savedReport) {
            geminiResponse.innerHTML = savedReport;
            updateReportLanguage(); 
        } else {
            geminiResponse.innerHTML = '';
        }
      }

      function loadLastSelectedMaterial() {
        const lastSelected = localStorage.getItem('virdanurlulu_last_selected_material');
        if (lastSelected && materialSelect.querySelector(`option[value="${lastSelected}"]`)) {
            materialSelect.value = lastSelected;
        } else if (materialSelect.options.length > 0) {
            materialSelect.value = materialSelect.options[0].value;
        }
        materialSelect.dispatchEvent(new Event('change'));
      }

      function selectFirstLogRow() {
        const logTbody = document.getElementById('logTbody');
        setTimeout(() => {
            const firstRow = logTbody.querySelector('tr:first-child');
            if (firstRow) {
                firstRow.click();
            }
        }, 500); 
      }
      
      quickPanelInputs.addEventListener('change', (e) => {
          if (e.target && e.target.tagName === 'SELECT') {
              const newValue = e.target.value;
              if (materialSelect.value !== newValue) {
                  materialSelect.value = newValue;
                  materialSelect.dispatchEvent(new Event('change'));
              }
          }
      });

      loadCustomMaterials();
      loadLastSelectedMaterial();
      selectFirstLogRow();
      const initialLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';
      applyTranslations(initialLang);
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
