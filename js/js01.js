    let simulationLog = []; // Make simulationLog globally accessible for better module interaction
    let updatePsVsZeChart = () => {}; // Define a placeholder function in a shared scope

    // Global utility functions
    function debounce(func, delay = 250) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
      };
    }

    function parseNumberLoose(s){
      if (s==null) return NaN;
      s = String(s).trim().replace(/\s+/g,'').replace(/\u00A0/g,'');
      if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g,'').replace(',', '.');
      else if (/^\d+,\d+$/.test(s)) s = s.replace(',', '.');
      else s = s.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, '');
      return Number(s);
    }

    function extractNumbers(line){
      const toks = String(line).match(/-?\d+(?:[.,]\d+)?/g) || [];
      return toks.map(parseNumberLoose).filter(n=>Number.isFinite(n));
    }
    
    function parseData(text){
      const out = [];
      const rows = (text||'').split(/[\r\n]+/).map(r=>r.trim()).filter(Boolean);
      for (const r of rows){
        const nums = extractNumbers(r);
        if (!nums.length) continue;
        const rVal = nums[0];
        const poVal = nums.length>1 ? nums[1] : null;
        if (rVal > 0) out.push({ r: rVal, Po: (poVal!=null && Number.isFinite(poVal)) ? poVal : null });
      }
      out.sort((a,b)=>a.r-b.r);
      return out;
    }

      document.addEventListener("DOMContentLoaded", () => {
      const $ = (id) => document.getElementById(id);
      const fields = ["rho", "vol", "dh", "eta", "e_tnt", "dist", "pa"];
      const inputFields = ["material", ...fields];

      let isPageLoaded = false; // Flag to prevent premature execution

      const presets = {
        AN:  { rho: 1725,    dh:  2479,  e_tnt: 4500, eta: 0.35 },
        LPG: { rho: 1.9,     dh: 50000,  e_tnt: 4500, eta: 0.03 },
        H2:  { rho: 0.08375, dh: 130800, e_tnt: 4500, eta: 0.05 }
      };

      const eqMap = {
        AN:  [{ labelKey: "eq_label_detonation", eq: '2 NH<sub>4</sub>NO<sub>3</sub>(s) <span class="arrow">→</span> 2 N<sub>2</sub>(g) + O<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)' }],
        LPG: [{ labelKey: "eq_label_combustion_propane", eq: 'C<sub>3</sub>H<sub>8</sub>(g) + 5 O<sub>2</sub>(g) <span class="arrow">→</span> 3 CO<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)' }],
        H2:  [{ labelKey: "eq_label_combustion_explosion", eq: '2 H<sub>2</sub>(g) + O<sub>2</sub>(g) <span class="arrow">→</span> 2 H<sub>2</sub>O(g)' }]
      };
     
      const materialAbbreviationMap = {
        'Ammonium Nitrate (AN)': 'AN',
        'Propane (LPG)': 'LPG',
        'Hydrogen (H₂)': 'H₂',
        'Amonium Nitrat (AN)': 'AN',
        'Propana (LPG)': 'LPG',
        'Hidrogen (H₂)': 'H₂'
      };
     
      const citations = {
        1: "Wang et al., 2023",
        2: "Clancey, 1972; Crowl & Louvar, 2011",
        3: "Clancey, 1972; CCPS, 2000"
      };

      /*
      ================================================================================
      | START: BILINGUAL TRANSLATION SCRIPT                                          |
      ================================================================================
      */
      const translations = {
        en: {
          // Page Titles
          page_title: "Simulation & Modeling of Explosion Effects (TNT Equivalence)",
          app_title: "Simulation and Modeling of Explosion Effects Based on TNT Equivalence",
          app_subtitle1: "Master’s Program in Chemical Engineering, ",
          app_subtitle2: "Bandung Institute of Technology",

          // Menu
          menu_button: "Menu",
          menu_home: "Home",
          menu_app: "Simulation & Modeling Application",
          menu_guide: "Simulation Guide (coming soon)",
          menu_presentation: "Presentation",
          menu_journal: "Journal & Conference (coming soon)",
          menu_bibliography: "Bibliography",
         
          // Card Titles
          card_title_material: "Chemical Material",
          card_title_properties: "Properties",
          card_title_parameters: "Parameters",
          estimation_damage_title: "Estimation of Damage to Structures and Process Equipment",
          estimation_injury_title: "Estimation of Injury Consequences",
          log_title: "Simulation Log",

          // Labels and Inputs
          label_select_material: "Select Material",
          label_volume: "Volume (m³)",
          label_distance: "Distance (m)",
          select_option_default: "— Select —",
          select_option_an: "Ammonium Nitrate (AN)",
          select_option_lpg: "Propane (LPG)",
          select_option_h2: "Hydrogen (H₂)",
          label_ambient_pressure: "Ambient Pressure",
          label_explosion_efficiency: "ηE Explosion Efficiency",
         
          // Parameters Table
          table_header_properties: "Properties",
          table_header_value: "Value",
          table_header_unit: "Unit",
          table_header_literature: "Literature",
          table_header_parameters: "Parameters",
          table_header_sources: "Sources",
          param_mass_material: "(W) Mass Material",
          param_total_energy: "(E) Total Energy",
          param_tnt_equivalent: "(W) TNT Equivalent",
          param_scaled_distance: "(Ze) Scaled Distance",
          param_scaled_overpressure: "(Ps) Scaled Overpressure",
          param_peak_overpressure: "(Po) Peak side-on overpressure",
          source_calculated: "@Calculated",
          source_crowl_kinney: "@Crowl/Kinney",
          source_crowl: "@Crowl",
          source_alonso: "@Alonso",
          source_sadovski: "@Sadovski",

          // Equation Panel
          eq_panel_title: "Representative Overall Reaction",
          eq_panel_placeholder: "Select a material to display the reaction equation.",
          eq_label_detonation: "Detonation",
          eq_label_combustion_propane: "Combustion (propane)",
          eq_label_combustion_explosion: "Combustion/explosion",
         
          // Charts
          chart_title_ps_vs_ze: "Scaled Overpressure vs Scaled Distance",
          btn_export_png: "Export PNG",
          chart_noscript: "Please enable JavaScript to display the chart. Reference: G. F. Kinney & K. J. Graham (1985).",
          chart_noscript_generic: "Please enable JavaScript to display the chart.",
          chart_note_source: "Source: G. F. Kinney & K. J. Graham, Explosive Shocks in Air, Springer-Verlag, 1985.",
          chart_title_po_vs_dist: "Overpressure vs Distance",
          chart_tooltip_compound: "Point",
          chart_tooltip_ref_curve: "Reference Curve",
          chart_x_axis_label: "Scaled Distance (ze)",
          chart_y_axis_label: "Scaled Overpressure Ratio (Ps = Po/Pa, –)",
          chart_x_axis_label_mobile: "ze (m·kg−1/3)",
          chart_y_axis_label_mobile: "Ps",
          chart_title_main: "Scaled Overpressure vs Scaled Distance",
          chart_subtitle_main: "Reference Model: Kinney & Graham (1985)",
          chart_title_mobile: "Ps vs ze",
          chart_subtitle_mobile: "Crowl (2011), Kinney & Graham (1985)",
          overpressure_chart_x_axis_label: "Distance [m]",
          overpressure_chart_y_axis_label: "Overpressure [kPa]",

          // Estimation Panels
          damage_details_label: "Damage Details:",
          structural_label: "Structural:",
          process_equipment_label: "Process Equipment:",
          awaiting_input: "Awaiting input...",
          effects_label: "Effects:",
          unknown: "Unknown",
          primary_effects_label: "Primary Effects:",
          secondary_tertiary_effects_label: "Secondary/Tertiary Effects:",
          conclusion_label: "Conclusion:",
         
          // Log
          btn_sort: "Sort",
          btn_export_csv: "Export CSV",
          btn_import_csv: "Import CSV",
          log_col_node: "Node",
          log_col_material: "Material",
          log_col_volume: "Volume",
          log_col_distance: "Distance",
          log_footnote: "Click \"Save\" to log the calculation results. The last 10 entries will be stored in your browser.",
          log_placeholder: "No simulation data are available.",

          // Footer
          footer_guide: "Guide",
          footer_journal: "Journal",
          footer_profile: "Profile",
          footer_copyright: "Copyright © 2025 by",
          footer_dedication1: "This application is dedicated to my parents for their persistent support and patient guidance throughout my JavaScript journey. ",
          footer_dedication2: "It is also presented to the academic community at ",
          footer_dedication_itb: "Bandung Institute of Technology",
          footer_dedication3: " as a contribution towards inspiring further advancements in JavaScript technology.",

          // Quick Control Panel
          quick_control_panel: "Quick Control Panel",
          btn_save: "Save",
          btn_add_result: "Add to Log & Map",
          float_overpressure_label: "Overpressure (Po)",
         
          // Status Messages
          status_success: "The calculation has been completed successfully.",
          status_error_range: "Ensure that the property is entered within the appropriate range.",
          status_error_invalid_ze: "The calculation outcome is invalid (Ze is non-positive).",
          status_loaded_defaults: "Default values have been loaded.",
          status_log_empty_export: "No log data are available for export.",
          status_import_success: "Log data from CSV file imported successfully!",
          status_import_error: "The file could not be imported: ",
          status_import_error_empty: "CSV file is invalid or empty.",
          status_import_error_missing_cols: "Required columns are missing: ",
          status_import_error_no_data: "No valid data could be retrieved from the CSV file.",
          status_log_saved: "Log entry saved successfully to browser storage.",
          status_export_success: "Export Successful.",

          // Damage & Injury Categories and Descriptions (as keys)
          cat_catastrophic: "Catastrophic",
          cat_major: "Major",
          cat_severe: "Severe",
          cat_serious: "Serious",
          cat_moderate: "Moderate",
          cat_minor: "Minor",
          cat_insignificant: "Insignificant",
          cat_no_effect: "No Effect",
         
          injury_cat_invalid: "Invalid Input",
          injury_cat_no_effect: "No Effect Reported",
          injury_cat_minor: "Minor Injury",
          injury_cat_moderate: "Moderate Injury",
          injury_cat_serious: "Serious Injury",
          injury_cat_severe: "Severe Injury",
          injury_cat_fatality: "Fatality",

          injury_awaiting_input: "Awaiting input...",
          injury_no_serious: "No serious injuries; eardrum damage is insignificant.",
          injury_glass_fragments: "Glass begins to break at 3–5 kPa, where fragments can cause skin/eye injuries.",
          injury_unlikely_primary: "Primary injuries are unlikely, but a risk of secondary injuries from glass fragments persists.",
          injury_minor_contusions: "Minor contusions.",
          injury_moderate_damage: "Moderate structural damage may cause ceiling collapse and falling of small objects.",
          injury_combo_minor: "A combination of minor contusions and secondary injuries from fragments/debris.",
          injury_eardrum_rupture: "Eardrum rupture, moderate contusions.",
          injury_flying_debris: "More extensive structural damage creates flying debris, which may cause bone fractures.",
          injury_increased_severity: "Injury severity is increased due to the combined effects of the blast wave and flying debris.",
          injury_serious_internal: "Serious and potentially fatal internal contusions.",
          injury_entrapment: "Most buildings are likely to be completely destroyed, creating entrapment scenarios under the rubble.",
          injury_highly_fatal: "The combination of internal injuries and entrapment is potentially highly fatal.",
          injury_high_mortality: "Extremely high mortality rate for unprotected individuals; 90%–100% fatality.",
          injury_total_collapse: "Total building collapse; large debris moving at high velocity.",
          injury_extreme_fatality_risk: "The interaction between the blast wave and structural failure poses an extremely high risk of fatality.",
          injury_no_significant_effects: "No significant effects reported.",
          injury_none_anticipated: "No injuries are anticipated.",
         
          damage_no_significant: "No significant structural damage predicted.",
          equipment_no_significant: "No significant equipment damage predicted.",
          alonso_warning: "Warning: Result is extrapolated beyond the valid Alonso model range (1 ≤ ze ≤ 200).",
         
          damage_accidental_glass: "Accidental glass damage [1].",
          damage_minor_glass_architectural: "Minor glass breakage and light architectural damage such as displacement of roof tiles and falling plaster [1].",
          damage_widespread_glass_nonstructural: "Widespread glass shattering and significant damage to non-structural elements like doors, windows, and roofs [1].",
          damage_collapse_unreinforced_walls: "Collapse of unreinforced concrete walls or cement blocks [2].",
          damage_steel_panels_destroyed_tanks_ruptured_1: "Frame-less steel panels destroyed; oil storage tanks ruptured (20.7 kPa - ≤25 kPa) [2].",
          damage_steel_panels_destroyed_tanks_ruptured_2: "Frame-less steel panels destroyed; oil storage tanks ruptured (25 kPa - 27.6 kPa) [2].",
          damage_extensive_nonstructural: "Extensive damage to non-structural elements such as brick facades, roofs, and ceilings [1].",
          damage_total_destruction_houses_1: "Near-total destruction of residential houses (34.5 kPa - ≤40 kPa) [2].",
          damage_total_destruction_houses_2: "Near-total destruction of residential houses (40 kPa - 48.2 kPa) [2].",
          damage_heavy_nonstructural_ceiling_collapse: "Heavy damage to non-structural elements leading to ceiling collapse [1].",
          damage_brick_panels_fail_1: "8-12 inch thick unreinforced brick panels fail from shear or bending (48.2 kPa - ≤55 kPa) [2].",
          damage_brick_panels_fail_2: "8-12 inch thick unreinforced brick panels fail from shear or bending (55 kPa - 55.1 kPa) [2].",
          damage_partial_collapse_concrete_columns: "Partial collapse of non-structural elements and significant damage to concrete columns [1].",
          damage_total_collapse_all_elements: "Near-total collapse of all building elements, including heavy damage to load-bearing concrete columns [1].",

          desc_annoying_noise: "Annoying noise (137 dB if low frequency, 10–15 Hz)",
          desc_breakage_large_windows: "Breakage of large windows previously under stress",
          desc_loud_noise_glass_failure: "Loud noise (143 dB), sonic boom, glass failure",
          desc_small_windows_break: "Small windows break due to pressure",
          desc_typical_pressure_break_glass: "Typical pressure to break glass",
          desc_safe_distance: '"Safe distance," 95% probability of no serious damage below this level, projectile limit, minor ceiling damage, 10% window breakage',
          desc_limited_minor_structural_damage: "Limited minor structural damage",
          desc_minor_structural_damage_houses: "Minor structural damage to houses",
          desc_partial_house_collapse: "Partial house collapse, uninhabitable",
          desc_slight_distortion_steel_frames: "Slight distortion of coated steel frames",
          desc_partial_collapse_roof_walls: "Partial collapse of roof and walls",
          desc_lower_limit_serious_damage: "Lower limit of serious structural damage",
          desc_50_percent_brick_walls_collapse: "50% of brick walls collapse",
          desc_heavy_machinery_damaged: "Heavy machinery (3,000 lb) slightly damaged in industrial buildings; steel frames distorted or detached from foundation",
          desc_light_industrial_structures_collapse: "Light industrial structures collapse",
          desc_utility_poles_break: "Utility poles break; 40,000 lb hydraulic equipment slightly damaged",
          desc_freight_train_cars_destroyed: "Freight train cars completely destroyed",
          desc_fully_loaded_train_cars_destroyed: "Fully loaded train cars totally destroyed",
          desc_likely_total_damage: "Likely total damage to structures; 7,000 lb equipment displaced and severely damaged; 12,000 lb machinery still present",

          equip_no_damage: "No significant damage recorded",
          equip_control_house_steel_roof_windows_broken: "Control house steel roof. Windows and gauges broken. Cooling tower. Louvers fall off (1.37855 - 2.44738 kPa).",
          equip_switchgear_damaged_tank_roof_collapses: "Control house steel roof. Switchgear is damaged from roof collapse. Control house concrete roof. Windows broken. Tank (cone) roof. Roof collapses.",
          equip_control_house_roof_collapses_instruments_damaged: "Control house steel roof. Roof collapses. Control house concrete roof. Frame deforms. Instruments. Are damaged. Windows and gauges broken.",
          equip_concrete_roof_collapses_fire_heater_cracks: "Control house concrete roof. Roof collapses. Instruments. Are damaged. Windows and gauges broken. Fire heater. Brick cracks. Filter. Debris - missile damage occurs.",
          equip_fire_heater_moves: "Fire heater. Unit moves and pipes break.",
          equip_tank_uplifts_instruments_damaged: "Tank (cone roof). Unit uplifts (half tilted). Instruments. Unit is damaged. Unit moves and pipes break. Controls are damaged. Cooling tower. Frame collapses. Control house steel roof. Block walls fall. Pine supports. Unit moves and pipes break.",
          equip_cooling_tower_collapses: "Cooling tower. Frame collapses. Pine supports. Frame deforms.",
          equip_reactor_moves: "Reactor (chemical). Unit moves and pipes break.",
          equip_filter_inner_parts_damaged: "Filter. Inner parts are damaged. Utilities (gas regulatory). Controls are damaged. Utilities (electronic transformer). Debris - missile damage occurs.",
          equip_fire_heater_overturns: "Fire heater. Unit overturns or is destroyed. Reactor (chemical). Frame deforms. Electric motor. Debris - missile damage occurs. Blower. Unit is on foundation.",
          equip_fractionation_column_cracks: "Fractionation column. Frame cracks.",
          equip_instrument_cubicle_overturns: "Instrument cubicle. Unit overturns or is destroyed. Pine supports. Piping breaks. Frame collapses. Fractionation column. Unit moves and pipes break.",
          equip_tank_uplifts_reactor_destroyed: "Tank (cone roof). Unit uplifts (0.9 tilted). Reactor (chemical). Unit is destroyed. Fractionation column. Unit moves and pipes break. Extraction column. Unit moves and pipes break.",
          equip_reactor_cracking_moves: "Reactor (cracking). Unit moves and pipes break. Fractionation column. Unit overturns or is destroyed.",
          equip_generator_overturns: "Generator. Unit overturns or is destroyed. Utilities (electronic transformer). Unit moves and pipes break. Heat exchanger. Unit moves and pipes break.",
          equip_tank_sphere_moves: "Tank sphere. Unit moves and pipes break.",
          equip_reactor_chemical_overturns: "Reactor (chemical). Unit overturns or is destroyed. Electric motor. Unit moves and pipes break. Extraction column. Unit overturns or is destroyed. Heat exchanger. Unit overturns or is destroyed.",
          equip_filter_uplifts: "Filter. Unit uplifts (0.9 tilted).",
          equip_utilities_overturns: "Utilities (electronic transformer). Unit overturns or is destroyed. Utilities (gas regulatory). Controls are damaged. Case is damaged. Steam turbine. Piping breaks. Case is damaged.",
          equip_filter_overturns: "Filter. Unit overturns or is destroyed. Reactor (cracking). Unit overturns or is destroyed. Steam turbine. Unit overturns or is destroyed. Steam turbine. Controls are damaged.",
          equip_steam_turbine_piping_breaks: "Steam turbine. Piping breaks. Tank sphere. Unit moves and pipes break. Pressure vessel (vertical). Unit overturns or is destroyed.",
          equip_tank_sphere_overturns: "Tank sphere. Unit overturns or is destroyed. Pump. Unit moves on foundation.",
          equip_floating_roof_collapses: "Tank (floating roof). Roof collapses. Reactor (cracking). Unit overturns or is destroyed. Steam turbine. Unit moves on foundation."
        },
        id: {
          // Page Titles
          page_title: "Simulasi & Pemodelan Efek Ledakan (Ekuivalensi TNT)",
          app_title: "Simulasi dan Pemodelan Efek Ledakan Berdasarkan Ekuivalensi TNT",
          app_subtitle1: "Program Magister Teknik Kimia, ",
          app_subtitle2: "Institut Teknologi Bandung",
         
          // Menu
          menu_button: "Menu",
          menu_home: "Beranda",
          menu_app: "Aplikasi Simulasi & Pemodelan",
          menu_guide: "Panduan Simulasi (segera hadir)",
          menu_presentation: "Presentasi",
          menu_journal: "Jurnal & Konferensi (segera hadir)",
          menu_bibliography: "Bibliografi",
         
          // Card Titles
          card_title_material: "Material Kimia",
          card_title_properties: "Properti",
          card_title_parameters: "Parameter",
          estimation_damage_title: "Estimasi Kerusakan pada Struktur dan Peralatan Proses",
          estimation_injury_title: "Estimasi Konsekuensi Cedera",
          log_title: "Log Simulasi",
         
          // Labels and Inputs
          label_select_material: "Pilih Material",
          label_volume: "Volume (m³)",
          label_distance: "Jarak (m)",
          select_option_default: "— Pilih —",
          select_option_an: "Amonium Nitrat (AN)",
          select_option_lpg: "Propana (LPG)",
          select_option_h2: "Hidrogen (H₂)",
          label_ambient_pressure: "Tekanan Sekitar",
          label_explosion_efficiency: "ηE Efisiensi Ledakan",
         
          // Parameters Table
          table_header_properties: "Properti",
          table_header_value: "Nilai",
          table_header_unit: "Satuan",
          table_header_literature: "Literatur",
          table_header_parameters: "Parameter",
          table_header_sources: "Sumber",
          param_mass_material: "(W) Massa Material",
          param_total_energy: "(E) Energi Total",
          param_tnt_equivalent: "(W) Ekuivalen TNT",
          param_scaled_distance: "(Ze) Jarak Skala",
          param_scaled_overpressure: "(Ps) Tekanan Berlebih Skala",
          param_peak_overpressure: "(Po) Puncak tekanan berlebih",
          source_calculated: "@Terhitung",
          source_crowl_kinney: "@Crowl/Kinney",
          source_crowl: "@Crowl",
          source_alonso: "@Alonso",
          source_sadovski: "@Sadovski",

          // Equation Panel
          eq_panel_title: "Reaksi Keseluruhan Representatif",
          eq_panel_placeholder: "Pilih material untuk menampilkan persamaan reaksi.",
          eq_label_detonation: "Detonasi",
          eq_label_combustion_propane: "Pembakaran (propana)",
          eq_label_combustion_explosion: "Pembakaran/ledakan",

          // Charts
          chart_title_ps_vs_ze: "Tekanan Berlebih Skala vs Jarak Skala",
          btn_export_png: "Ekspor PNG",
          chart_noscript: "Harap aktifkan JavaScript untuk menampilkan grafik. Referensi: G. F. Kinney & K. J. Graham (1985).",
          chart_noscript_generic: "Harap aktifkan JavaScript untuk menampilkan grafik.",
          chart_note_source: "Sumber: G. F. Kinney & K. J. Graham, Explosive Shocks in Air, Springer-Verlag, 1985.",
          chart_title_po_vs_dist: "Tekanan Berlebih vs Jarak",
          chart_tooltip_compound: "Titik",
          chart_tooltip_ref_curve: "Kurva Referensi",
          chart_x_axis_label: "Jarak Skala (ze)",
          chart_y_axis_label: "Rasio Tekanan Berlebih Skala (Ps = Po/Pa, –)",
          chart_x_axis_label_mobile: "ze (m·kg−1/3)",
          chart_y_axis_label_mobile: "Ps",
          chart_title_main: "Tekanan Berlebih Skala vs Jarak Skala",
          chart_subtitle_main: "Model Referensi: Kinney & Graham (1985)",
          chart_title_mobile: "Ps vs ze",
          chart_subtitle_mobile: "Crowl (2011), Kinney & Graham (1985)",
          overpressure_chart_x_axis_label: "Jarak [m]",
          overpressure_chart_y_axis_label: "Tekanan Berlebih [kPa]",

          // Estimation Panels
          damage_details_label: "Detail Kerusakan:",
          structural_label: "Struktural:",
          process_equipment_label: "Peralatan Proses:",
          awaiting_input: "Menunggu masukan...",
          effects_label: "Efek:",
          unknown: "Tidak Diketahui",
          primary_effects_label: "Efek Primer:",
          secondary_tertiary_effects_label: "Efek Sekunder/Tersier:",
          conclusion_label: "Kesimpulan:",

          // Log
          btn_sort: "Urutkan",
          btn_export_csv: "Ekspor CSV",
          btn_import_csv: "Impor CSV",
          log_col_node: "Node",
          log_col_material: "Material",
          log_col_volume: "Volume",
          log_col_distance: "Jarak",
          log_footnote: "Klik \"Simpan\" untuk mencatat hasil perhitungan. 10 entri terakhir akan disimpan di browser Anda.",
          log_placeholder: "Data simulasi tidak tersedia.",
         
          // Footer
          footer_guide: "Panduan",
          footer_journal: "Jurnal",
          footer_profile: "Profil",
          footer_copyright: "Hak Cipta © 2025 oleh",
          footer_dedication1: "Aplikasi ini didedikasikan untuk orang tua saya atas dukungan dan bimbingan sabar mereka sepanjang perjalanan JavaScript saya. ",
          footer_dedication2: "Aplikasi ini juga dipersembahkan kepada komunitas akademik di ",
          footer_dedication_itb: "Institut Teknologi Bandung",
          footer_dedication3: " sebagai kontribusi untuk menginspirasi kemajuan lebih lanjut dalam teknologi JavaScript.",
         
          // Quick Control Panel
          quick_control_panel: "Panel Kontrol Cepat",
          btn_save: "Simpan",
          btn_add_result: "Tambahkan ke Log & Peta",
          float_overpressure_label: "Tekanan Berlebih (Po)",
         
          // Status Messages
          status_success: "Perhitungan telah berhasil diselesaikan.",
          status_error_range: "Pastikan properti dimasukkan dalam rentang yang sesuai.",
          status_error_invalid_ze: "Hasil perhitungan tidak valid (Ze tidak positif).",
          status_loaded_defaults: "Nilai default telah dimuat.",
          status_log_empty_export: "Tidak ada data log yang tersedia untuk diekspor.",
          status_import_success: "Data log dari file CSV berhasil diimpor!",
          status_import_error: "File tidak dapat diimpor: ",
          status_import_error_empty: "File CSV tidak valid atau kosong.",
          status_import_error_missing_cols: "Kolom yang diperlukan tidak ada: ",
          status_import_error_no_data: "Tidak ada data valid yang dapat diambil dari file CSV.",
          status_log_saved: "Entri log berhasil disimpan di penyimpanan browser.",
          status_export_success: "Ekspor Berhasil.",
         
          // Damage & Injury Categories and Descriptions (as keys)
          cat_catastrophic: "Kacau Total",
          cat_major: "Mayor",
          cat_severe: "Parah",
          cat_serious: "Serius",
          cat_moderate: "Sedang",
          cat_minor: "Ringan",
          cat_insignificant: "Tidak Berarti",
          cat_no_effect: "Tidak Ada Efek",

          injury_cat_invalid: "Input Tidak Valid",
          injury_cat_no_effect: "Tidak Ada Efek",
          injury_cat_minor: "Cedera Ringan",
          injury_cat_moderate: "Cedera Sedang",
          injury_cat_serious: "Cedera Serius",
          injury_cat_severe: "Cedera Parah",
          injury_cat_fatality: "Kematian",
         
          injury_awaiting_input: "Menunggu masukan...",
          injury_no_serious: "Tidak ada cedera serius; kerusakan gendang telinga tidak signifikan.",
          injury_glass_fragments: "Kaca mulai pecah pada 3–5 kPa, di mana pecahan dapat menyebabkan cedera kulit/mata.",
          injury_unlikely_primary: "Cedera primer tidak mungkin terjadi, tetapi risiko cedera sekunder dari pecahan kaca tetap ada.",
          injury_minor_contusions: "Memar ringan.",
          injury_moderate_damage: "Kerusakan struktur tingkat sedang dapat menyebabkan langit-langit runtuh dan benda-benda kecil jatuh.",
          injury_combo_minor: "Kombinasi memar ringan dan cedera sekunder dari pecahan/puing-puing.",
          injury_eardrum_rupture: "Gendang telinga pecah, memar sedang.",
          injury_flying_debris: "Kerusakan struktural yang lebih luas menciptakan puing-puing beterbangan, yang dapat menyebabkan patah tulang.",
          injury_increased_severity: "Tingkat keparahan cedera meningkat karena efek gabungan dari gelombang ledakan dan puing-puing yang beterbangan.",
          injury_serious_internal: "Memar internal yang serius dan berpotensi fatal.",
          injury_entrapment: "Sebagian besar bangunan kemungkinan besar akan hancur total, menciptakan skenario terperangkap di bawah reruntuhan.",
          injury_highly_fatal: "Gabungan cedera internal dan kondisi terperangkap berpotensi sangat fatal.",
          injury_high_mortality: "Tingkat kematian sangat tinggi bagi orang tanpa pelindung; 90%–100% fatal.",
          injury_total_collapse: "Keruntuhan total bangunan; puing-puing besar bergerak dengan kecepatan tinggi.",
          injury_extreme_fatality_risk: "Interaksi antara gelombang ledakan dan kegagalan struktural menimbulkan risiko kematian yang sangat tinggi.",
          injury_no_significant_effects: "Tidak ada efek signifikan yang dilaporkan.",
          injury_none_anticipated: "Tidak ada cedera yang diperkirakan.",
         
          damage_no_significant: "Tidak ada kerusakan struktural signifikan yang diprediksi.",
          equipment_no_significant: "Tidak ada kerusakan peralatan signifikan yang diprediksi.",
          alonso_warning: "Peringatan: Hasil diekstrapolasi di luar rentang valid model Alonso (1 ≤ ze ≤ 200).",

          damage_accidental_glass: "Kerusakan kaca yang tidak disengaja [1].",
          damage_minor_glass_architectural: "Pecahan kaca kecil dan kerusakan arsitektur ringan seperti pergeseran genteng dan plester yang jatuh [1].",
          damage_widespread_glass_nonstructural: "Pecahan kaca yang luas dan kerusakan signifikan pada elemen non-struktural seperti pintu, jendela, dan atap [1].",
          damage_collapse_unreinforced_walls: "Runtuhnya dinding beton tak bertulang atau balok semen [2].",
          damage_steel_panels_destroyed_tanks_ruptured_1: "Panel baja tanpa rangka hancur; tangki penyimpanan minyak pecah (20.7 kPa - ≤25 kPa) [2].",
          damage_steel_panels_destroyed_tanks_ruptured_2: "Panel baja tanpa rangka hancur; tangki penyimpanan minyak pecah (25 kPa - 27.6 kPa) [2].",
          damage_extensive_nonstructural: "Kerusakan luas pada elemen non-struktural seperti fasad bata, atap, dan langit-langit [1].",
          damage_total_destruction_houses_1: "Kehancuran mendekati total pada rumah tinggal (34.5 kPa - ≤40 kPa) [2].",
          damage_total_destruction_houses_2: "Kehancuran mendekati total pada rumah tinggal (40 kPa - 48.2 kPa) [2].",
          damage_heavy_nonstructural_ceiling_collapse: "Kerusakan berat pada elemen non-struktural yang menyebabkan langit-langit runtuh [1].",
          damage_brick_panels_fail_1: "Panel bata tak bertulang setebal 8-12 inci gagal akibat geser atau lentur (48.2 kPa - ≤55 kPa) [2].",
          damage_brick_panels_fail_2: "Panel bata tak bertulang setebal 8-12 inci gagal akibat geser atau lentur (55 kPa - 55.1 kPa) [2].",
          damage_partial_collapse_concrete_columns: "Runtuh parsial elemen non-struktural dan kerusakan signifikan pada kolom beton [1].",
          damage_total_collapse_all_elements: "Runtuh mendekati total semua elemen bangunan, termasuk kerusakan berat pada kolom beton penahan beban [1].",

          desc_annoying_noise: "Kebisingan yang mengganggu (137 dB jika frekuensi rendah, 10–15 Hz)",
          desc_breakage_large_windows: "Pecahnya jendela besar yang sebelumnya mengalami tegangan",
          desc_loud_noise_glass_failure: "Suara keras (143 dB), ledakan sonik, kegagalan kaca",
          desc_small_windows_break: "Jendela kecil pecah karena tekanan",
          desc_typical_pressure_break_glass: "Tekanan tipikal untuk memecahkan kaca",
          desc_safe_distance: '"Jarak aman," probabilitas 95% tidak ada kerusakan serius di bawah tingkat ini, batas proyektil, kerusakan langit-langit kecil, 10% jendela pecah',
          desc_limited_minor_structural_damage: "Kerusakan struktural ringan terbatas",
          desc_minor_structural_damage_houses: "Kerusakan struktural ringan pada rumah",
          desc_partial_house_collapse: "Rumah runtuh sebagian, tidak dapat dihuni",
          desc_slight_distortion_steel_frames: "Distorsi ringan pada rangka baja berlapis",
          desc_partial_collapse_roof_walls: "Runtuh sebagian atap dan dinding",
          desc_lower_limit_serious_damage: "Batas bawah kerusakan struktural serius",
          desc_50_percent_brick_walls_collapse: "50% dinding bata runtuh",
          desc_heavy_machinery_damaged: "Mesin berat (3.000 lb) sedikit rusak di gedung industri; rangka baja terdistorsi atau terlepas dari fondasi",
          desc_light_industrial_structures_collapse: "Struktur industri ringan runtuh",
          desc_utility_poles_break: "Tiang listrik patah; peralatan hidrolik 40.000 lb sedikit rusak",
          desc_freight_train_cars_destroyed: "Gerbong kereta barang hancur total",
          desc_fully_loaded_train_cars_destroyed: "Gerbong kereta bermuatan penuh hancur total",
          desc_likely_total_damage: "Kemungkinan kerusakan total pada struktur; peralatan 7.000 lb bergeser dan rusak parah; mesin 12.000 lb masih ada",

          equip_no_damage: "Tidak ada kerusakan signifikan yang tercatat",
          equip_control_house_steel_roof_windows_broken: "Rumah kontrol atap baja. Jendela dan alat ukur pecah. Menara pendingin. Kisi-kisi jatuh (1.37855 - 2.44738 kPa).",
          equip_switchgear_damaged_tank_roof_collapses: "Rumah kontrol atap baja. Switchgear rusak akibat atap runtuh. Rumah kontrol atap beton. Jendela pecah. Atap tangki (kerucut). Atap runtuh.",
          equip_control_house_roof_collapses_instruments_damaged: "Rumah kontrol atap baja. Atap runtuh. Rumah kontrol atap beton. Rangka berubah bentuk. Instrumen. Rusak. Jendela dan alat ukur pecah.",
          equip_concrete_roof_collapses_fire_heater_cracks: "Rumah kontrol atap beton. Atap runtuh. Instrumen. Rusak. Jendela dan alat ukur pecah. Pemanas api. Bata retak. Filter. Kerusakan akibat serpihan proyektil.",
          equip_fire_heater_moves: "Pemanas api. Unit bergerak dan pipa pecah.",
          equip_tank_uplifts_instruments_damaged: "Atap tangki (kerucut). Unit terangkat (setengah miring). Instrumen. Unit rusak. Unit bergerak dan pipa pecah. Kontrol rusak. Menara pendingin. Rangka runtuh. Rumah kontrol atap baja. Dinding balok jatuh. Penopang pinus. Unit bergerak dan pipa pecah.",
          equip_cooling_tower_collapses: "Menara pendingin. Rangka runtuh. Penopang pinus. Rangka berubah bentuk.",
          equip_reactor_moves: "Reaktor (kimia). Unit bergerak dan pipa pecah.",
          equip_filter_inner_parts_damaged: "Filter. Bagian dalam rusak. Utilitas (regulator gas). Kontrol rusak. Utilitas (transformator elektronik). Kerusakan akibat serpihan proyektil.",
          equip_fire_heater_overturns: "Pemanas api. Unit terbalik atau hancur. Reaktor (kimia). Rangka berubah bentuk. Motor listrik. Kerusakan akibat serpihan proyektil. Blower. Unit berada di atas fondasi.",
          equip_fractionation_column_cracks: "Kolom fraksinasi. Rangka retak.",
          equip_instrument_cubicle_overturns: "Kubikel instrumen. Unit terbalik atau hancur. Penopang pinus. Pipa pecah. Rangka runtuh. Kolom fraksinasi. Unit bergerak dan pipa pecah.",
          equip_tank_uplifts_reactor_destroyed: "Atap tangki (kerucut). Unit terangkat (0.9 miring). Reaktor (kimia). Unit hancur. Kolom fraksinasi. Unit bergerak dan pipa pecah. Kolom ekstraksi. Unit bergerak dan pipa pecah.",
          equip_reactor_cracking_moves: "Reaktor (perengkahan). Unit bergerak dan pipa pecah. Kolom fraksinasi. Unit terbalik atau hancur.",
          equip_generator_overturns: "Generator. Unit terbalik atau hancur. Utilitas (transformator elektronik). Unit bergerak dan pipa pecah. Penukar panas. Unit bergerak dan pipa pecah.",
          equip_tank_sphere_moves: "Tangki bola. Unit bergerak dan pipa pecah.",
          equip_reactor_chemical_overturns: "Reaktor (kimia). Unit terbalik atau hancur. Motor listrik. Unit bergerak dan pipa pecah. Kolom ekstraksi. Unit terbalik atau hancur. Penukar panas. Unit terbalik atau hancur.",
          equip_filter_uplifts: "Filter. Unit terangkat (0.9 miring).",
          equip_utilities_overturns: "Utilitas (transformator elektronik). Unit terbalik atau hancur. Utilitas (regulator gas). Kontrol rusak. Casing rusak. Turbin uap. Pipa pecah. Casing rusak.",
          equip_filter_overturns: "Filter. Unit terbalik atau hancur. Reaktor (perengkahan). Unit terbalik atau hancur. Turbin uap. Unit terbalik atau hancur. Turbin uap. Kontrol rusak.",
          equip_steam_turbine_piping_breaks: "Turbin uap. Pipa pecah. Tangki bola. Unit bergerak dan pipa pecah. Bejana tekan (vertikal). Unit terbalik atau hancur.",
          equip_tank_sphere_overturns: "Tangki bola. Unit terbalik atau hancur. Pompa. Unit bergerak di atas fondasi.",
          equip_floating_roof_collapses: "Tangki (atap apung). Atap runtuh. Reaktor (perengkahan). Unit terbalik atau hancur. Turbin uap. Unit bergerak di atas fondasi."
        }
      };

      let currentLanguage = 'en'; // Default language

      function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLanguage = lang;
        try {
          localStorage.setItem('preferredLanguage', lang);
        } catch (e) {
          console.warn("Could not save language preference to local storage:", e);
        }
       
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-lang-key]').forEach(el => {
          const key = el.getAttribute('data-lang-key');
          const translation = translations[lang][key];
          if (translation !== undefined) {
            if (el.placeholder !== undefined && el.tagName === 'INPUT') {
                el.placeholder = translation;
            } else {
                el.innerHTML = translation;
            }
          }
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        if ($('material').value) {
          renderEquation($('material').value);
        }
        if (chartController) {
            // Memperbaiki bug: Memanggil fungsi update yang benar alih-alih fungsi yang tidak ada.
            updatePsVsZeChart();
        }
        if (overpressureChartController) {
            updateOverpressureChartFromLog();
        }
        const Po_crowl = parseFloat($("Po_crowl")?.value);
        const Po_alonso = parseFloat($("Po_alonso")?.value);
        const Po_sadovski = parseFloat($("Po_sadovski")?.value);
        const isAlonsoExtrapolated = (parseFloat($("Ze")?.value) < 1 || parseFloat($("Ze")?.value) > 200);
        updateEstimationPanels(Po_crowl, Po_alonso, Po_sadovski, isAlonsoExtrapolated);
        updateInjuryPanels(Po_crowl, Po_alonso, Po_sadovski);
        setupFloatingPanel(); 
      }

      function initLanguage() {
        let preferredLanguage = 'en';
        try {
            preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
        } catch (e) {
            console.warn("Could not read language preference from local storage:", e);
        }
        setLanguage(preferredLanguage);

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setLanguage(btn.dataset.lang);
            });
        });
      }
      /*
      ================================================================================
      | END: BILINGUAL TRANSLATION SCRIPT                                            |
      ================================================================================
      */
     
      function getDamageDescriptionKeys(kPa) {
        const keys = [];
        if (kPa >= 0.14 && kPa <= 2) keys.push("damage_accidental_glass");
        if (kPa > 2 && kPa <= 9) keys.push("damage_minor_glass_architectural");
        if (kPa > 9 && kPa <= 25) keys.push("damage_widespread_glass_nonstructural");
        if (kPa >= 13.8 && kPa <= 20.7) keys.push("damage_collapse_unreinforced_walls");
        if (kPa > 20.7 && kPa <= 25) keys.push("damage_steel_panels_destroyed_tanks_ruptured_1");
        if (kPa > 25 && kPa <= 27.6) keys.push("damage_steel_panels_destroyed_tanks_ruptured_2");
        if (kPa > 25 && kPa <= 40) keys.push("damage_extensive_nonstructural");
        if (kPa >= 34.5 && kPa <= 40) keys.push("damage_total_destruction_houses_1");
        if (kPa > 40 && kPa <= 48.2) keys.push("damage_total_destruction_houses_2");
        if (kPa > 40 && kPa <= 55) keys.push("damage_heavy_nonstructural_ceiling_collapse");
        if (kPa > 48.2 && kPa <= 55) keys.push("damage_brick_panels_fail_1");
        if (kPa > 55 && kPa <= 55.1) keys.push("damage_brick_panels_fail_2");
        if (kPa > 55 && kPa <= 76) keys.push("damage_partial_collapse_concrete_columns");
        if (kPa > 76) keys.push("damage_total_collapse_all_elements");
        return keys;
      }
     
      const overpressureDamageLevels = [
        { minPo: 0.14, maxPo: 0.21, descriptionKey: "desc_annoying_noise", citation_ref: 2 },
        { minPo: 0.21, maxPo: 0.28, descriptionKey: "desc_breakage_large_windows", citation_ref: 2 },
        { minPo: 0.28, maxPo: 0.69, descriptionKey: "desc_loud_noise_glass_failure", citation_ref: 2 },
        { minPo: 0.69, maxPo: 1.03, descriptionKey: "desc_small_windows_break", citation_ref: 2 },
        { minPo: 1.03, maxPo: 2.07, descriptionKey: "desc_typical_pressure_break_glass", citation_ref: 2 },
        { minPo: 2.07, maxPo: 2.76, descriptionKey: "desc_safe_distance", citation_ref: 2 },
        { minPo: 2.76, maxPo: 4.8, descriptionKey: "desc_limited_minor_structural_damage", citation_ref: 2 },
        { minPo: 4.8, maxPo: 6.9, descriptionKey: "desc_minor_structural_damage_houses", citation_ref: 2 },
        { minPo: 6.9, maxPo: 9, descriptionKey: "desc_partial_house_collapse", citation_ref: 2 },
        { minPo: 9, maxPo: 13.8, descriptionKey: "desc_slight_distortion_steel_frames", citation_ref: 2 },
        { minPo: 13.8, maxPo: 15.8, descriptionKey: "desc_partial_collapse_roof_walls", citation_ref: 2 },
        { minPo: 15.8, maxPo: 17.2, descriptionKey: "desc_lower_limit_serious_damage", citation_ref: 2 },
        { minPo: 17.2, maxPo: 20.7, descriptionKey: "desc_50_percent_brick_walls_collapse", citation_ref: 2 },
        { minPo: 20.7, maxPo: 25, descriptionKey: "desc_heavy_machinery_damaged", citation_ref: 2 },
        { minPo: 25, maxPo: 34.5, descriptionKey: "desc_light_industrial_structures_collapse", citation_ref: 2 },
        { minPo: 34.5, maxPo: 48.2, descriptionKey: "desc_utility_poles_break", citation_ref: 2 },
        { minPo: 48.2, maxPo: 62, descriptionKey: "desc_freight_train_cars_destroyed", citation_ref: 2 },
        { minPo: 62, maxPo: 68.9, descriptionKey: "desc_fully_loaded_train_cars_destroyed", citation_ref: 2 },
        { minPo: 68.9, maxPo: Infinity, descriptionKey: "desc_likely_total_damage", citation_ref: 2 },
      ];
     
      const processEquipmentDamage = [
        { po: 0, descriptionKey: "equip_no_damage", citation_ref: 3 },
        { po: 3.46, descriptionKey: "equip_control_house_steel_roof_windows_broken", citation_ref: 3 },
        { po: 6.89, descriptionKey: "equip_switchgear_damaged_tank_roof_collapses", citation_ref: 3 },
        { po: 10.34, descriptionKey: "equip_control_house_roof_collapses_instruments_damaged", citation_ref: 3 },
        { po: 13.79, descriptionKey: "equip_concrete_roof_collapses_fire_heater_cracks", citation_ref: 3 },
        { po: 17.24, descriptionKey: "equip_fire_heater_moves", citation_ref: 3 },
        { po: 20.68, descriptionKey: "equip_tank_uplifts_instruments_damaged", citation_ref: 3 },
        { po: 24.13, descriptionKey: "equip_cooling_tower_collapses", citation_ref: 3 },
        { po: 27.58, descriptionKey: "equip_reactor_moves", citation_ref: 3 },
        { po: 31.03, descriptionKey: "equip_filter_inner_parts_damaged", citation_ref: 3 },
        { po: 34.47, descriptionKey: "equip_fire_heater_overturns", citation_ref: 3 },
        { po: 37.92, descriptionKey: "equip_fractionation_column_cracks", citation_ref: 3 },
        { po: 41.37, descriptionKey: "equip_instrument_cubicle_overturns", citation_ref: 3 },
        { po: 44.82, descriptionKey: "equip_tank_uplifts_reactor_destroyed", citation_ref: 3 },
        { po: 48.26, descriptionKey: "equip_reactor_cracking_moves", citation_ref: 3 },
        { po: 51.71, descriptionKey: "equip_generator_overturns", citation_ref: 3 },
        { po: 55.16, descriptionKey: "equip_tank_sphere_moves", citation_ref: 3 },
        { po: 62.05, descriptionKey: "equip_reactor_chemical_overturns", citation_ref: 3 },
        { po: 65.5, descriptionKey: "equip_filter_uplifts", citation_ref: 3 },
        { po: 68.95, descriptionKey: "equip_utilities_overturns", citation_ref: 3 },
        { po: 82.74, descriptionKey: "equip_filter_overturns", citation_ref: 3 },
        { po: 96.53, descriptionKey: "equip_steam_turbine_piping_breaks", citation_ref: 3 },
        { po: 110.32, descriptionKey: "equip_tank_sphere_overturns", citation_ref: 3 },
        { po: 137.9, descriptionKey: "equip_floating_roof_collapses", citation_ref: 3 }
      ];

      const defaultLogData = [
          { material: 'AN', eta: '0.35', e_tnt: '4500', rho: '1725', dh: '2479', vol: '1734.8209', dist: '300', w_tnt: '576999.986', ze: '3.604', ps: '1.096', po_crowl: '111.073', po_alonso: '85.912', po_sadovski: '63.787', lat: '33.901404', lon: '35.519039', poModel: 'crowl' },
          { material: 'AN', eta: '0.35', e_tnt: '4500', rho: '1725', dh: '2479', vol: '1734.8209', dist: '500', w_tnt: '576999.986', ze: '6.006', ps: '0.419', po_crowl: '42.468', po_alonso: '30.771', po_sadovski: '26.163', lat: '33.901404', lon: '35.519039', poModel: 'crowl' },
          { material: 'AN', eta: '0.35', e_tnt: '4500', rho: '1725', dh: '2479', vol: '1734.8209', dist: '700', w_tnt: '576999.986', ze: '8.408', ps: '0.250', po_crowl: '25.310', po_alonso: '15.647', po_sadovski: '15.698', lat: '33.901404', lon: '35.519039', poModel: 'crowl' },
          { material: 'AN', eta: '0.35', e_tnt: '4500', rho: '1725', dh: '2479', vol: '1734.8209', dist: '1000', w_tnt: '576999.986', ze: '12.012', ps: '0.156', po_crowl: '15.813', po_alonso: '10.235', po_sadovski: '9.617', lat: '33.901404', lon: '35.519039', poModel: 'crowl' },
          { material: 'AN', eta: '0.35', e_tnt: '4500', rho: '1725', dh: '2479', vol: '1734.8209', dist: '1500', w_tnt: '576999.986', ze: '18.018', ps: '0.097', po_crowl: '9.857', po_alonso: '6.395', po_sadovski: '5.778', lat: '33.901404', lon: '35.519039', poModel: 'crowl' }
      ];

      let chartController;
      let overpressureChartController; 
      // simulationLog is now globally defined, so we remove the local 'let' declaration here.

      function showStatusMessage(messageKey, isError = false, extraInfo = '') {
          const msgEl = $("msg");
          if (!msgEl) return;
         
          const message = (translations[currentLanguage][messageKey] || messageKey) + extraInfo;
          msgEl.textContent = message;

          if (isError) {
              msgEl.classList.add("bad");
          } else {
              msgEl.classList.remove("bad");
          }
          msgEl.style.display = 'block';
         
          setTimeout(() => {
              if (msgEl.textContent === message) {
                  msgEl.style.display = 'none';
              }
          }, 5000);
      }

      function loadLogo() {
        const img = $("itbLogo"); if (!img) return;
        const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><circle cx="128" cy="128" r="120" fill="%230079c2"/><text x="50%" y="56%" font-family="Georgia, serif" font-size="88" text-anchor="middle" fill="white">ITB</text></svg>';
        img.onerror = () => { img.onerror = null; img.src = fallback; };
        img.src = "/img/Logo_Institut_Teknologi_Bandung.webp";
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
            const a = document.createElement('a'); a.href = url; a.download = 'plot-explosion-ps-vs-ze.png'; a.click();
          });
        }
       
        const getBaseOption = () => ({
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
            series: [ // Pre-define series structure
                {
                  name: translations[currentLanguage].chart_tooltip_ref_curve,
                  type: 'line', showSymbol: false,
                  lineStyle: { width: 2.5, color: BLUE, shadowColor: 'rgba(0, 0, 0, 0.2)', shadowBlur: 5, shadowOffsetY: 2 },
                  data: refPairs, zlevel: 1
                },
                {
                  name: 'Log Data',
                  type: 'scatter', symbolSize: 8,
                  itemStyle: { color: '#64748b', borderColor: '#ffffff', borderWidth: 1, opacity: 0.7 },
                  data: [], zlevel: 2
                },
                {
                  name: 'Current Calculation',
                  type: 'scatter', symbolSize: 12,
                  itemStyle: { color: DANGER, borderColor: '#ffffff', borderWidth: 2, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 5 },
                  data: [], zlevel: 3
                }
            ],
            media: [
                {
                    query: { minWidth: 601 },
                    option: {
                        grid: { left: 72, right: 35, top: 80, bottom: 70 },
                        title: { text: translations[currentLanguage].chart_title_main, subtext: translations[currentLanguage].chart_subtitle_main, left: 'center', top: 10, textStyle: { color: '#212121', fontSize: 20 }, subtextStyle: { color: '#424242' }},
                        xAxis: { name: translations[currentLanguage].chart_x_axis_label, nameLocation: 'middle', nameGap: 35, nameTextStyle: { color: '#212121', fontSize: 16, fontWeight: 'bold' }, axisLabel: { color: '#424242' }},
                        yAxis: { name: translations[currentLanguage].chart_y_axis_label, nameLocation: 'middle', nameGap: 50, nameTextStyle: { color: '#212121', fontSize: 16, fontWeight: 'bold' }, axisLabel: { color: '#424242' }}
                    }
                },
                {
                    query: { maxWidth: 600 },
                    option: {
                        grid: { left: 55, right: 20, top: 70, bottom: 60 },
                        title: { text: translations[currentLanguage].chart_title_mobile, subtext: translations[currentLanguage].chart_subtitle_mobile, left: 'center', top: 10, textStyle: { color: '#212121', fontSize: 16 }, subtextStyle: { color: '#424242', fontSize: 12 }},
                        xAxis: { name: translations[currentLanguage].chart_x_axis_label_mobile, nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#212121', fontSize: 14, fontWeight: 'bold' }, axisLabel: { color: '#424242', fontSize: 10 }},
                        yAxis: { name: translations[currentLanguage].chart_y_axis_label_mobile, nameLocation: 'middle', nameGap: 35, nameTextStyle: { color: '#212121', fontSize: 14, fontWeight: 'bold' }, axisLabel: { color: '#424242', fontSize: 10 }}
                    }
                }
            ]
        });
       
        chart.setOption(getBaseOption());

        return {
          updateChart: function(currentCalcPoint, logDataPoints) {
            chart.setOption(getBaseOption()); 
            const materialSel = $('material');
            const selectedOption = materialSel ? materialSel.options[materialSel.selectedIndex] : null;
            const compoundName = (selectedOption && selectedOption.value) ? selectedOption.text : 'Calculation';

            const currentSeriesData = (currentCalcPoint && Number.isFinite(currentCalcPoint.ze) && Number.isFinite(currentCalcPoint.ps))
              ? [[currentCalcPoint.ze, currentCalcPoint.ps]]
              : [];

            chart.setOption({
              series: [
                { name: translations[currentLanguage].chart_tooltip_ref_curve, data: refPairs },
                { name: 'Log Data', data: logDataPoints || [] },
                { name: `${translations[currentLanguage].chart_tooltip_compound}: ${compoundName}`, data: currentSeriesData }
              ]
            });
          }
        };
      }
     
      // Overwrite the placeholder with the actual function implementation
      updatePsVsZeChart = function() {
          if (!chartController) return;

          const pa = parseFloat($("pa").value);
          if (isNaN(pa)) return;

          // 1. Dapatkan Data Log - SELALU gunakan 'po_crowl' untuk konsistensi.
          const logPoints = simulationLog.map(log => {
              const ze = parseFloat(log.ze);
              const po = parseFloat(log.po_crowl); // Revisi: Dikunci ke model Crowl
              if (!isNaN(ze) && !isNaN(po)) {
                  const ps = po / pa;
                  return [ze, ps];
              }
              return null;
          }).filter(Boolean);

          // 2. Dapatkan Data Perhitungan Saat Ini - SELALU gunakan 'Po_crowl'.
          const currentZe = parseFloat($("Ze")?.value);
          
          let currentPs;
          if (!isNaN(currentZe) && pa > 0) {
              const currentPoCrowl = parseFloat($("Po_crowl")?.value); // Revisi: Hanya menggunakan Crowl
              if (!isNaN(currentPoCrowl)) {
                  currentPs = currentPoCrowl / pa;
              }
          }
          
          const currentCalcPoint = { ze: currentZe, ps: currentPs };
          
          // 3. Perbarui grafik
          chartController.updateChart(currentCalcPoint, logPoints);
      }

      function initializeOverpressureChart() {
          const ctx = document.getElementById('overpressureChart');
          if (!ctx) return null;

          const chart = new Chart(ctx, {
              type: 'line',
              data: {
                  datasets: [
                      { label: 'Crowl', data: [], borderColor: 'rgb(255, 99, 132)', borderWidth: 2.5, tension: 0.4, pointRadius: 3, pointHoverRadius: 5 },
                      { label: 'Alonso', data: [], borderColor: 'rgb(54, 162, 235)', borderWidth: 2.5, tension: 0.4, pointRadius: 3, pointHoverRadius: 5 },
                      { label: 'Sadovski', data: [], borderColor: 'rgb(75, 192, 192)', borderWidth: 2.5, tension: 0.4, pointRadius: 3, pointHoverRadius: 5 }
                  ]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      title: { display: true, text: 'Overpressure vs Distance', font: { size: 20, weight: 'bold' }, padding: { top: 10, bottom: 20 } },
                      legend: { display: true, position: 'top', labels: { usePointStyle: true, pointStyle: 'line' } }
                  },
                  scales: {
                      x: { 
                          type: 'linear', 
                          title: { display: true, text: 'Distance [m]', font: { size: 14, weight: '500' } },
                          grid: { drawOnChartArea: true, color: 'rgba(0, 0, 0, 0.05)' },
                      },
                      y: { 
                          title: { display: true, text: 'Overpressure [kPa]', font: { size: 14, weight: '500' } },
                          grid: { drawOnChartArea: true, color: 'rgba(0, 0, 0, 0.05)' },
                      }
                  }
              }
          });
         
          return {
              chartInstance: chart
          };
      }
     
      function updateOverpressureChartFromLog() {
          if (!overpressureChartController || !overpressureChartController.chartInstance) return;

          const chart = overpressureChartController.chartInstance;
          const msgEl = $('overpressureChartMsg');
          const canvasEl = $('overpressureChart');
         
          chart.options.plugins.title.text = translations[currentLanguage].chart_title_po_vs_dist;
          chart.options.scales.x.title.text = translations[currentLanguage].overpressure_chart_x_axis_label;
          chart.options.scales.y.title.text = translations[currentLanguage].overpressure_chart_y_axis_label;

          canvasEl.style.display = 'block';
          msgEl.style.display = 'none';

          if (simulationLog.length === 0) {
              chart.data.datasets.forEach(dataset => {
                  dataset.data = [];
              });
              chart.options.scales.x.min = 0;
              chart.options.scales.x.max = 3000;
              chart.options.scales.y.min = 0;
              chart.options.scales.y.max = 100;
              chart.update();
              return;
          }

          const crowlPoints = [];
          const alonsoPoints = [];
          const sadovskiPoints = [];
          const allYValues = [];
          const allXValues = [];

          simulationLog.forEach(log => {
              const dist = parseFloat(log.dist);
              if (isNaN(dist)) return;
              allXValues.push(dist);

              const poCrowl = parseFloat(log.po_crowl);
              if (!isNaN(poCrowl)) {
                  crowlPoints.push({ x: dist, y: poCrowl });
                  allYValues.push(poCrowl);
              }

              const poAlonso = parseFloat(log.po_alonso);
              if (!isNaN(poAlonso)) {
                  alonsoPoints.push({ x: dist, y: poAlonso });
                  allYValues.push(poAlonso);
              }

              const poSadovski = parseFloat(log.po_sadovski);
              if (!isNaN(poSadovski)) {
                  sadovskiPoints.push({ x: dist, y: poSadovski });
                  allYValues.push(poSadovski);
              }
          });

          const sortByX = (a, b) => a.x - b.x;
          chart.data.datasets[0].data = crowlPoints.sort(sortByX);
          chart.data.datasets[1].data = alonsoPoints.sort(sortByX);
          chart.data.datasets[2].data = sadovskiPoints.sort(sortByX);
         
          if (allYValues.length > 0) {
              const minX = Math.min(...allXValues);
              const maxX = Math.max(...allXValues);
              const minY = Math.min(...allYValues);
              const maxY = Math.max(...allYValues);

              chart.options.scales.x.min = minX > 0 ? minX * 0.95 : 0;
              chart.options.scales.x.max = maxX * 1.05;
              chart.options.scales.y.min = minY > 0 ? minY * 0.95 : 0;
              chart.options.scales.y.max = maxY * 1.05;
          } else {
              chart.options.scales.x.min = 0;
              chart.options.scales.x.max = 3000;
              chart.options.scales.y.min = 0;
              chart.options.scales.y.max = 100;
          }
         
          chart.update();
      }

      function getImpactCategory(Po) {
        if (Po > 76) return { nameKey: "cat_catastrophic", color: "#991B1B", textColor: "#FFFFFF" };
        if (Po > 55) return { nameKey: "cat_major", color: "#F87171", textColor: "#FFFFFF" };
        if (Po > 40) return { nameKey: "cat_severe", color: "#FCA5A5", textColor: "var(--ink)" };
        if (Po > 25) return { nameKey: "cat_serious", color: "#FCD34D", textColor: "var(--ink)" };
        if (Po > 9) return { nameKey: "cat_moderate", color: "#FDE68A", textColor: "var(--ink)" };
        if (Po > 2) return { nameKey: "cat_minor", color: "#A7F3D0", textColor: "var(--ink)" };
        if (Po >= 0.14) return { nameKey: "cat_insignificant", color: "#D1FAE5", textColor: "var(--ink)" };
        if (Po >= 0) return { nameKey: "cat_no_effect", color: "#E5E7EB", textColor: "var(--ink)" };
        return { nameKey: "unknown", color: "var(--muted)", textColor: "#FFFFFF" };
      }

      function getInjuryRiskCategory(Po) {
          const poValue = parseFloat(Po);
          if (isNaN(poValue)) {
              return { nameKey: "injury_cat_invalid", color: "var(--muted)", textColor: "#FFFFFF" };
          }

          if (poValue < 0.14) {
              return { nameKey: "injury_cat_no_effect", color: "#D1FAE5", textColor: "var(--ink)" };
          } else if (poValue <= 20) {
              return { nameKey: "injury_cat_minor", color: "#FACC15", textColor: "var(--ink)" };
          } else if (poValue <= 30) {
              return { nameKey: "injury_cat_moderate", color: "#FDBA74", textColor: "var(--ink)" };
          } else if (poValue <= 50) {
              return { nameKey: "injury_cat_serious", color: "#FB7185", textColor: "#FFFFFF" };
          } else if (poValue <= 100) {
              return { nameKey: "injury_cat_severe", color: "#EF4444", textColor: "#FFFFFF" };
          } else { // > 100
              return { nameKey: "injury_cat_fatality", color: "#7F1D1D", textColor: "#FFFFFF" };
          }
      }

      // REVISED AND VERIFIED FUNCTION
      function updateEstimationPanels(PoCrowl, PoAlonso, PoSadovski, isAlonsoExtrapolated = false) {
        const methods = { crowl: PoCrowl, alonso: PoAlonso, sadovski: PoSadovski };

        Object.entries(methods).forEach(([method, Po]) => {
            const isPoValid = Number.isFinite(Po);
            const lang = translations[currentLanguage];
            
            const valPoEl = $(`val-Po-${method}`);
            const sevEl = $(`sev-${method}`);
            const structuralListEl = $(`structural-damage-${method}`);
            const equipmentListEl = $(`equipment-damage-${method}`);

            if (!valPoEl || !sevEl || !structuralListEl || !equipmentListEl) {
                console.error(`One or more elements for damage panel '${method}' not found.`);
                return;
            }
            
            // This block handles resetting the panel or updating it with calculated values.
            if (!isPoValid) {
                // If Po is not a valid number, reset the panel to its initial state.
                valPoEl.textContent = '—';
                const impact = getImpactCategory(NaN);
                sevEl.textContent = lang[impact.nameKey] || impact.nameKey;
                sevEl.style.backgroundColor = impact.color;
                sevEl.style.color = impact.textColor;
                structuralListEl.innerHTML = `<li>${lang.awaiting_input}</li>`;
                equipmentListEl.innerHTML = `<li>${lang.awaiting_input}</li>`;
            } else {
                // If Po is valid, populate the panel with details.
                valPoEl.textContent = Po.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                const impact = getImpactCategory(Po);
                sevEl.textContent = lang[impact.nameKey] || impact.nameKey;
                sevEl.style.backgroundColor = impact.color;
                sevEl.style.color = impact.textColor;
                
                // Populate Structural Damage Details from two different sources
                const structuralKeys = getDamageDescriptionKeys(Po);
                const structuralRangeDesc = overpressureDamageLevels.find(range => Po >= range.minPo && Po < range.maxPo);
                let structuralHtml = structuralKeys.map(key => `<li>${(lang[key] || key).replace(/\[(\d+)\]/g, (match, p1) => `(${citations[p1]})`)}</li>`).join('');
                if (structuralRangeDesc) {
                    structuralHtml += `<li>${(lang[structuralRangeDesc.descriptionKey] || structuralRangeDesc.descriptionKey)} (${citations[structuralRangeDesc.citation_ref]})</li>`;
                }
                structuralListEl.innerHTML = structuralHtml || `<li>${lang.damage_no_significant}</li>`;

                // Populate Process Equipment Damage Details
                const equipmentDamage = processEquipmentDamage.slice().reverse().find(item => Po >= item.po);
                equipmentListEl.innerHTML = equipmentDamage ?
                    `<li>${(lang[equipmentDamage.descriptionKey] || equipmentDamage.descriptionKey)} (${citations[equipmentDamage.citation_ref]})</li>` :
                    `<li>${lang.equipment_no_significant}</li>`;
            }

            // Special handling for Alonso extrapolation warning message
            if (method === 'alonso') {
                const existingWarning = structuralListEl.querySelector('.extrapolation-warning');
                if (existingWarning) existingWarning.remove();
                if (isAlonsoExtrapolated && isPoValid) {
                    const warningLi = document.createElement('li');
                    warningLi.className = 'extrapolation-warning';
                    warningLi.style.cssText = 'color: var(--danger); font-weight: bold; font-style: italic;';
                    warningLi.textContent = lang.alonso_warning;
                    structuralListEl.prepend(warningLi);
                }
            }
        });
      }
     
      function getInjuryEffects(Po) {
        const poValue = parseFloat(Po);
        if (isNaN(poValue) || poValue < 0) {
          return {
            primaryKey: "injury_awaiting_input",
            secondaryKey: null,
            conclusionKey: null
          };
        }

        if (poValue >= 0.14 && poValue < 20) {
          return {
            primaryKey: "injury_no_serious",
            secondaryKey: "injury_glass_fragments",
            conclusionKey: "injury_unlikely_primary"
          };
        } else if (poValue >= 20 && poValue <= 30) {
          return {
            primaryKey: "injury_minor_contusions",
            secondaryKey: "injury_moderate_damage",
            conclusionKey: "injury_combo_minor"
          };
        } else if (poValue > 30 && poValue <= 50) {
          return {
            primaryKey: "injury_eardrum_rupture",
            secondaryKey: "injury_flying_debris",
            conclusionKey: "injury_increased_severity"
          };
        } else if (poValue > 50 && poValue <= 100) {
          return {
            primaryKey: "injury_serious_internal",
            secondaryKey: "injury_entrapment",
            conclusionKey: "injury_highly_fatal"
          };
        } else if (poValue > 100) {
          return {
            primaryKey: "injury_high_mortality",
            secondaryKey: "injury_total_collapse",
            conclusionKey: "injury_extreme_fatality_risk"
          };
        } else { // For values below 0.14 kPa
          return {
            primaryKey: "injury_no_significant_effects",
            secondaryKey: null,
            conclusionKey: "injury_none_anticipated"
          };
        }
      }

      // REVISED AND VERIFIED FUNCTION
      function updateInjuryPanels(PoCrowl, PoAlonso, PoSadovski) {
        const updateSinglePanel = (method, Po) => {
            const isPoValid = Number.isFinite(Po);
            const lang = translations[currentLanguage];

            const valPoEl = $(`val-Po-${method}-inj`);
            const effectsListEl = $(`injury-effects-${method}`);
            const sevFootEl = $(`sev-injury-${method}`);

            if (!valPoEl || !effectsListEl || !sevFootEl) {
                console.error(`One or more injury elements for method '${method}' not found.`);
                return;
            }
            
            // The severity footer is always updated based on the Po value (or lack thereof).
            const severity = getInjuryRiskCategory(Po);
            sevFootEl.textContent = lang[severity.nameKey] || severity.nameKey;
            sevFootEl.style.backgroundColor = severity.color;
            sevFootEl.style.color = severity.textColor;
            
            // Reset or update the main content based on Po validity.
            if (!isPoValid) {
                valPoEl.textContent = "—";
                effectsListEl.innerHTML = `<li>${lang.awaiting_input}</li>`;
            } else {
                valPoEl.textContent = Po.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                
                // Get the set of translation keys for different injury effects.
                const effectKeys = getInjuryEffects(Po);
                let html = '';
                
                // Build the list of effects using the keys and translated text.
                if (effectKeys.primaryKey) {
                    html += `<li><strong>${lang.primary_effects_label}</strong> ${(lang[effectKeys.primaryKey] || effectKeys.primaryKey)}</li>`;
                }
                if (effectKeys.secondaryKey) {
                    html += `<li><strong>${lang.secondary_tertiary_effects_label}</strong> ${(lang[effectKeys.secondaryKey] || effectKeys.secondaryKey)}</li>`;
                }
                if (effectKeys.conclusionKey) {
                    html += `<li><strong>${lang.conclusion_label}</strong> ${(lang[effectKeys.conclusionKey] || effectKeys.conclusionKey)}</li>`;
                }

                effectsListEl.innerHTML = html || `<li>${lang.injury_no_significant_effects}</li>`;
            }
        };

        updateSinglePanel('crowl', PoCrowl);
        updateSinglePanel('alonso', PoAlonso);
        updateSinglePanel('sadovski', PoSadovski);
      }

      function calculateValues(isInitialLoad = false) {
        const btnSaveFloat = $('btnSaveResultFloat');
        const btnAddResult = $('btnAddResult');
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

        const resetAll = (msgKey) => {
          ["W_mass", "E_total", "W_tnt", "Ze", "Ps", "Po_crowl", "Po_alonso", "Po_sadovski"].forEach(id => $(id).value = "");
          showStatusMessage(msgKey, true);
          updateEstimationPanels(NaN, NaN, NaN);
          updateInjuryPanels(NaN, NaN, NaN);
          updateFloatingPanelOutputs(NaN, NaN, NaN, false);
          updatePsVsZeChart(); // Clear chart
          if (btnSaveFloat) btnSaveFloat.disabled = true;
          if (btnAddResult) btnAddResult.disabled = true;
        };

        if (hasError) return resetAll("status_error_range");

        const W_mass = rho * vol;
        const E_total = W_mass * dh * eta;
        const W_tnt = E_total / e_tnt;
        const Ze = dist > 0 && W_tnt > 0 ? dist / Math.cbrt(W_tnt) : NaN;

        if (!Number.isFinite(Ze) || Ze <= 0) return resetAll("status_error_invalid_ze");

        $("W_mass").value = W_mass.toFixed(3);
        $("E_total").value = E_total.toFixed(3);
        $("W_tnt").value = W_tnt.toFixed(3);
        $("Ze").value = Ze.toFixed(3);

        const PoPa_crowl = (1616 * (1 + (Ze/4.5)**2)) /
          (Math.sqrt(1 + (Ze/0.048)**2) * Math.sqrt(1 + (Ze/0.32)**2) * Math.sqrt(1 + (Ze/1.35)**2));
        $("Ps").value = PoPa_crowl.toFixed(3);
        
        const Po_crowl = PoPa_crowl * pa;
        const isAlonsoExtrapolated = Ze < 1 || Ze > 200;
        const Po_alonso = ((z) => {
            if (z < 10) return 1.13e6 * z**-2.01;
            return 1.83e5 * z**-1.16;
        })(Ze) / 1000;
       
        const Po_sadovski = ((w, d) => {
            if (!(d > 0 && w > 0)) return NaN;
            const r = Math.cbrt(w) / d;
            return (0.085 * r + 0.3 * r**2 + 0.8 * r**3) * 1000;
        })(W_tnt, dist);

        $("Po_crowl").value = Po_crowl.toFixed(3);
        $("Po_alonso").value = isNaN(Po_alonso) ? "" : Po_alonso.toFixed(3);
        $("Po_sadovski").value = isNaN(Po_sadovski) ? "" : Po_sadovski.toFixed(3);

        updateEstimationPanels(Po_crowl, Po_alonso, Po_sadovski, isAlonsoExtrapolated);
        updateInjuryPanels(Po_crowl, Po_alonso, Po_sadovski);
        updateFloatingPanelOutputs(Po_crowl, Po_alonso, Po_sadovski, true);
        updatePsVsZeChart(); // Update chart with new calculation

        showStatusMessage("status_success");
        if (btnSaveFloat) btnSaveFloat.disabled = false;
        if (btnAddResult) btnAddResult.disabled = false;

        if (!isInitialLoad) {
          //saveStateToURL();
        }
      }

      function compute(isInitialLoad = false) {
        if ($("pa").value === "" || isNaN(parseFloat($("pa").value))) $("pa").value = "101.325";
        calculateValues(isInitialLoad);
      }

      function renderEquation(material) {
        const box = $("eq-text"); if (!box) return;
        if (!material || !eqMap[material]) { 
            box.innerHTML = translations[currentLanguage].eq_panel_placeholder; 
            return; 
        }
        box.innerHTML = eqMap[material].map(item => `<div class="rxn"><small>${translations[currentLanguage][item.labelKey]}</small><div class="rxn-eq">${item.eq}</div></div>`).join("");
      }

      function saveStateToURL() {
        try {
          const params = new URLSearchParams();
          inputFields.forEach(id => {
            const el = $(id);
            if (el && el.value !== undefined && el.value !== "") params.set(id, el.value);
          });
          const q = params.toString();
          const url = q ? `${window.location.pathname}?${q}` : window.location.pathname;
          window.history.replaceState({}, '', url);
        } catch (error) {
          console.warn("Could not save state to URL:", error.message);
        }
      }

      function loadStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        let hasParams = params.has('material');

        if (hasParams) {
          // BUG FIX: Jika memuat dari URL, bersihkan log yang ada/default
          // untuk mencegah tampilan data yang tidak konsisten.
          renderLogTable(); 
          updateOverpressureChartFromLog(); 

          params.forEach((val, key) => {
            const el = $(key); 
            if (el) { el.value = val; }
          });
          const materialEl = $('material');
          if (materialEl.value) {
            renderEquation(materialEl.value);
          }
          compute(true);
          // BUG FIX: Sync the floating panel inputs after loading from URL
          syncFloatingPanelInputs(); 
        } else {
          // PERBAIKAN: Jika tidak ada parameter URL, sinkronkan formulir dengan
          // entri pertama dari log yang sudah dimuat (localStorage atau default).
          // Ini memastikan UI konsisten saat pertama kali dimuat.
          if (simulationLog.length > 0) {
              try {
                  const firstLog = simulationLog[0];
                  const materialSelect = $('material');
                  
                  const findMaterialValue = (abbr) => {
                      const options = materialSelect.options;
                      for (let i = 0; i < options.length; i++) {
                          if (materialAbbreviationMap[options[i].text.trim()] === abbr.trim()) {
                              return options[i].value;
                          }
                      }
                      return '';
                  };
              
                  const materialValue = findMaterialValue(firstLog.material);
                  if (materialValue) {
                      materialSelect.value = materialValue;
                      const p = presets[materialValue];
                      if (p) {
                          Object.keys(p).forEach(key => {
                              const el = $(key);
                              if (el) el.value = p[key];
                          });
                      }
                      renderEquation(materialValue);
                      $('vol').value = firstLog.vol;
                      $('dist').value = firstLog.dist;
                      compute(true);
                      // BUG FIX: Also sync the floating panel here for consistency on initial load
                      syncFloatingPanelInputs(); 
                  }
              } catch (e) {
                  console.error("Gagal menyinkronkan formulir dengan log awal:", e);
              }
          }
        }
      }
     
      function renderLogTable() {
        const logTbody = $('logTbody');
        if (!logTbody) return;

        logTbody.innerHTML = ''; 

        if (simulationLog.length === 0) {
            logTbody.innerHTML = `<tr class="log-placeholder"><td colspan="18">${translations[currentLanguage].log_placeholder}</td></tr>`;
            return;
        }

        simulationLog.forEach((log, index) => {
            const row = document.createElement('tr');
            if (log.isNew) {
              row.classList.add('new-row-animation');
              delete log.isNew;
            }
            row.innerHTML = `
                <td data-label="${translations[currentLanguage].log_col_node}">${index + 1}</td>
                <td data-label="${translations[currentLanguage].log_col_material}">${log.material}</td>
                <td data-label="ηE">${log.eta}</td>
                <td data-label="ETNT (kJ/kg)">${log.e_tnt}</td>
                <td data-label="ρ (kg/m³)">${log.rho}</td>
                <td data-label="ΔHexp (kJ/kg)">${log.dh}</td>
                <td data-label="${translations[currentLanguage].log_col_volume} (m³)">${log.vol}</td>
                <td data-label="${translations[currentLanguage].log_col_distance} (m)">${log.dist}</td>
                <td data-label="WTNT (kg)">${log.w_tnt}</td>
                <td data-label="ze">${log.ze}</td>
                <td data-label="Ps">${log.ps}</td>
                <td data-label="Crowl (kPa)">${log.po_crowl}</td>
                <td data-label="Alonso (kPa)">${log.po_alonso}</td>
                <td data-label="Sadovski (kPa)">${log.po_sadovski}</td>
                <td data-label="Lat">${log.lat}</td>
                <td data-label="Lon">${log.lon}</td>
                <td data-label="Po Model">${log.poModel}</td>
                <td class="col-action">
                    <button class="btn-delete" data-index="${index}" title="Delete this line">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            logTbody.appendChild(row);
        });
        
        updatePsVsZeChart(); // Update chart whenever the log table is re-rendered
      }

      function saveLogToLocalStorage() {
        try {
          if(simulationLog.length > 0) {
            localStorage.setItem('explosionSimLog', JSON.stringify(simulationLog));
          } else {
            localStorage.removeItem('explosionSimLog');
          }
        } catch (e) {
          console.warn("Could not save simulation log to local storage:", e);
        }
      }

      function loadLog() {
        const savedLog = localStorage.getItem('explosionSimLog');
        if (savedLog) {
            try {
                const parsedLog = JSON.parse(savedLog);
                if (Array.isArray(parsedLog)) {
                    simulationLog = parsedLog;
                    return;
                }
            } catch (e) {
                console.error("Failed to load log from local storage:", e);
            }
        }
        simulationLog = [...defaultLogData]; 
      }
     
      const toTopBtn = $('toTop');
      if (toTopBtn) {
        window.addEventListener('scroll', () => {
          if (window.scrollY > 200) {
            toTopBtn.classList.add('show');
          } else {
            toTopBtn.classList.remove('show');
          }
        });
      }

      const dropdown = document.querySelector('.dropdown-menu');
      // Pastikan elemen dropdown ada sebelum menambahkan event listener
      if (dropdown) {
        const dropdownToggle = dropdown.querySelector('.dropdown-toggle');

        // Event listener untuk tombol menu
        if (dropdownToggle) {
          dropdownToggle.addEventListener('click', (event) => {
            // Mencegah event klik menyebar ke elemen lain
            event.stopPropagation();
            // Toggle class 'is-active' untuk menampilkan atau menyembunyikan menu
            dropdown.classList.toggle('is-active');
          });
        }

        // Event listener pada dokumen untuk menutup menu saat klik di luar area menu
        document.addEventListener('click', (event) => {
          // Cek jika menu sedang aktif dan klik terjadi di luar area '.dropdown-menu'
          if (dropdown.classList.contains('is-active') && !dropdown.contains(event.target)) {
            dropdown.classList.remove('is-active');
          }
        });
      }
     
      function setupFloatingPanel() {
        const floatInputs = $('floatPanelInputs');
        const floatOutputs = $('floatPanelOutputs');
        const lang = translations[currentLanguage];
       
        floatInputs.innerHTML = `
          <div class="floating-group material">
            <label for="float_material" class="label">${lang.label_select_material}</label>
            <select id="float_material"></select>
          </div>
          <div class="floating-group volume">
            <label for="float_vol" class="label">${lang.label_volume}</label>
            <input id="float_vol" type="number" min="0" step="any" />
          </div>
          <div class="floating-group distance">
            <label for="float_dist" class="label">${lang.label_distance}</label>
            <input id="float_dist" type="number" min="0" step="any" />
          </div>
        `;

        floatOutputs.innerHTML = `
            <label class="label">${lang.float_overpressure_label}</label>
            <div class="output-values">
                <div class="floating-output-col"><span>Crowl</span><span id="float_po_crowl">—</span></div>
                <div class="floating-output-col"><span>Alonso</span><span id="float_po_alonso">—</span></div>
                <div class="floating-output-col"><span>Sadovski</span><span id="float_po_sadovski">—</span></div>
            </div>
            <div style="margin-top: 12px;">
                <button class="btn" id="btnSaveResultFloat" disabled style="width: 100%;">${lang.btn_add_result}</button>
            </div>
        `;
       
        const originalSelect = $('material');
        const floatSelect = $('float_material');
        floatSelect.innerHTML = originalSelect.innerHTML;
       
        const syncValues = (source, target) => {
            if (source.value !== target.value) {
                target.value = source.value;
                const changeEvent = new Event('change', { bubbles: true });
                const inputEvent = new Event('input', { bubbles: true });
                target.dispatchEvent(changeEvent);
                target.dispatchEvent(inputEvent);
            }
        };
       
        ['material', 'vol', 'dist'].forEach(id => {
            const original = $(id);
            const float = $(`float_${id}`);
           
            original.addEventListener('input', () => { if(float.value !== original.value) float.value = original.value; });
            original.addEventListener('change', () => { if(float.value !== original.value) float.value = original.value; });
           
            float.addEventListener('input', () => syncValues(float, original));
            float.addEventListener('change', () => syncValues(float, original));
        });
      }

      function syncFloatingPanelInputs() {
        $('float_material').value = $('material').value;
        $('float_vol').value = $('vol').value;
        $('float_dist').value = $('dist').value;
      }

      function updateFloatingPanelOutputs(crowl, alonso, sadovski, enabled) {
          const floatCrowl = $('float_po_crowl');
          const floatAlonso = $('float_po_alonso');
          const floatSadovski = $('float_po_sadovski');
          const btnSaveFloat = $('btnSaveResultFloat');
         
          if(floatCrowl) floatCrowl.textContent = isNaN(crowl) ? '—' : crowl.toFixed(3);
          if(floatAlonso) floatAlonso.textContent = isNaN(alonso) ? '—' : alonso.toFixed(3);
          if(floatSadovski) floatSadovski.textContent = isNaN(sadovski) ? '—' : sadovski.toFixed(3);
          if(btnSaveFloat) btnSaveFloat.disabled = !enabled;

      }

      function makeDraggable(panel, handle) {
          let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
          let isDragging = false;

          const dragStart = (e) => {
              if (panel.classList.contains('collapsed')) return;
              isDragging = true;
              panel.style.transition = 'none'; 
             
              const rect = panel.getBoundingClientRect();
              panel.style.width = rect.width + 'px';
              panel.style.left = rect.left + 'px';
              panel.style.transform = 'none';

              let currentEvent = e.type.startsWith('touch') ? e.touches[0] : e;
              pos3 = currentEvent.clientX;
              pos4 = currentEvent.clientY;
             
              document.addEventListener('mouseup', dragEnd);
              document.addEventListener('mousemove', elementDrag);
              document.addEventListener('touchend', dragEnd);
              document.addEventListener('touchmove', elementDrag, { passive: false });
              document.body.classList.add('dragging');
          };
         
          handle.addEventListener('mousedown', dragStart);
          // BUG FIX: Pindahkan event listener 'touchstart' ke luar dari fungsi 'dragStart'
          // untuk mencegah penambahan listener berulang kali (memory leak).
          handle.addEventListener('touchstart', dragStart, { passive: false });

          function elementDrag(e) {
              if (!isDragging) return;
              if (e.type === 'touchmove') e.preventDefault();
             
              let currentEvent = e.type.startsWith('touch') ? e.touches[0] : e;
              if (!currentEvent.clientX) return; 
             
              pos1 = pos3 - currentEvent.clientX;
              pos2 = pos4 - currentEvent.clientY;
              pos3 = currentEvent.clientX;
              pos4 = currentEvent.clientY;
             
              panel.style.top = (panel.offsetTop - pos2) + "px";
              panel.style.left = (panel.offsetLeft - pos1) + "px";
              panel.style.bottom = 'auto'; 
          }

          function dragEnd() {
              if (!isDragging) return;
              isDragging = false;
              panel.style.transition = '';
              panel.style.width = ''; // Reset width to be responsive
              document.removeEventListener('mouseup', dragEnd);
              document.removeEventListener('mousemove', elementDrag);
              document.removeEventListener('touchend', dragEnd);
              document.removeEventListener('touchmove', elementDrag);
              document.body.classList.remove('dragging');
          }
      }
     
      const floatingPanel = $('floatingControlPanel');
      makeDraggable(floatingPanel, floatingPanel.querySelector('.floating-panel-header'));
     
      // --- FINAL ROBUSTNESS CHECK FOR CHART LIBRARIES ---
      if (typeof echarts !== 'undefined') {
        chartController = initializeChart();
      } else {
        console.error("ECharts library failed to load.");
        const chartContainer = $('chart');
        if (chartContainer) chartContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--danger);">Failed to load Ps vs ze chart library. Please check your internet connection.</p>';
      }

      if (typeof Chart !== 'undefined') {
        overpressureChartController = initializeOverpressureChart();
      } else {
        console.error("Chart.js library failed to load.");
        const overpressureChartContainer = $('overpressureChart');
        if (overpressureChartContainer) overpressureChartContainer.parentElement.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--danger);">Failed to load Po vs Distance chart library. Please check your internet connection.</p>';
      }
      
      const debouncedCompute = debounce(() => compute(false), 250);
     
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
        showStatusMessage("status_loaded_defaults");
        compute(false);
      });

      materialSel.addEventListener("init-load", () => {
        const p = presets[materialSel.value];
        if (p) Object.keys(p).forEach(key => $(key).value = p[key]);
        renderEquation(materialSel.value);
        compute(true);
      });

      const saveAction = () => {
        const btnSaveFloat = $('btnSaveResultFloat');
        const btnAddResult = $('btnAddResult');
        if (btnSaveFloat.disabled && btnAddResult.disabled) return;
       
        const selectedOption = materialSel.options[materialSel.selectedIndex];
        const newLogEntry = {
            material: materialAbbreviationMap[selectedOption.text] || selectedOption.text,
            eta: $('eta').value,
            e_tnt: $('e_tnt').value,
            rho: $('rho').value,
            dh: $('dh').value,
            vol: $('vol').value,
            dist: $('dist').value,
            w_tnt: $('W_tnt').value,
            ze: $('Ze').value,
            ps: $('Ps').value,
            po_crowl: $('Po_crowl').value || 'N/A',
            po_alonso: $('Po_alonso').value || 'N/A',
            po_sadovski: $('Po_sadovski').value || 'N/A',
            lat: $('mapLat').value,
            lon: $('mapLon').value,
            poModel: $('poModelSelect').value,
            isNew: true
        };

        if (JSON.stringify(simulationLog) === JSON.stringify(defaultLogData)) {
            simulationLog = [];
        }

        simulationLog.unshift(newLogEntry);

        if (simulationLog.length > 10) {
            simulationLog.pop(); 
        }

        renderLogTable();
        updateOverpressureChartFromLog();
        saveLogToLocalStorage();
        showStatusMessage('status_log_saved'); // Memberikan umpan balik yang jelas kepada pengguna
      };
     
      const btnAddResult = $('btnAddResult');
      if(btnAddResult) btnAddResult.addEventListener('click', saveAction);

      // Atur event listener untuk panel melayang di sini untuk mencegah penambahan ganda.
      // Menggunakan delegasi event, sehingga listener tetap berfungsi bahkan jika tombol di dalamnya dibuat ulang.
      const floatingPanelForEvent = $('floatingControlPanel');
      if(floatingPanelForEvent) {
        floatingPanelForEvent.addEventListener('click', (event) => {
            if (event.target && event.target.id === 'btnSaveResultFloat') {
                saveAction();
            }
        });
      }

      const logTbody = $('logTbody');

      // Fungsi baru untuk menangani klik pada baris log
      function handleLogRowClick(event) {
        const row = event.target.closest('tr');
        // Abaikan klik jika bukan pada baris data atau jika pada tombol hapus
        if (!row || row.classList.contains('log-placeholder') || event.target.closest('.btn-delete')) {
            return;
        }
        
        const deleteButton = row.querySelector('.btn-delete');
        if (!deleteButton) return;
        
        const index = parseInt(deleteButton.dataset.index, 10);
        if (isNaN(index) || !simulationLog[index]) return;

        // 1. Ambil data dari array simulationLog berdasarkan indeks
        const logData = simulationLog[index];

        // 2. Perbarui nilai pada form input utama
        $('vol').value = logData.vol;
        $('dist').value = logData.dist;
        
        // Mengubah material sedikit lebih rumit karena perlu memicu event 'change'
        const materialSelect = $('material');
        // Temukan nilai <option> yang sesuai dengan singkatan material (misal: 'AN')
        const materialValue = Array.from(materialSelect.options).find(opt => 
            (materialAbbreviationMap[opt.text] || opt.value) === logData.material
        )?.value;

        if (materialValue && materialSelect.value !== materialValue) {
            materialSelect.value = materialValue;
            // 3. Memicu event 'change' secara manual untuk menjalankan semua logika terkait
            // seperti memuat properti, menampilkan persamaan, dan yang terpenting,
            // memanggil fungsi `compute()` untuk menghitung ulang semuanya.
            materialSelect.dispatchEvent(new Event('change'));
        } else {
            // Jika material tidak berubah, panggil `compute()` secara manual
            compute(true);
        }

        // 4. Atur sorotan visual pada baris yang dipilih
        document.querySelectorAll('#logTable tbody tr.selected-row').forEach(selectedRow => {
            selectedRow.classList.remove('selected-row');
        });
        row.classList.add('selected-row');

        // 5. Beri notifikasi kepada pengguna
        showStatusMessage(`Data dari log #${index + 1} telah dimuat ke kalkulator.`);
      }

      // Tambahkan event listener ke <tbody>
      logTbody.addEventListener('click', handleLogRowClick);

      logTbody.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.btn-delete');
        if (deleteButton) {
            const indexToDelete = parseInt(deleteButton.dataset.index, 10);
            if (!isNaN(indexToDelete)) {
                simulationLog.splice(indexToDelete, 1);
                renderLogTable();
                updateOverpressureChartFromLog();
                saveLogToLocalStorage();
            }
        }
      });
     
      const btnSortLog = $('btnSortLog');
      btnSortLog.addEventListener('click', () => {
          if (simulationLog.length > 1) {
              simulationLog.sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
              renderLogTable();
              updateOverpressureChartFromLog();
              saveLogToLocalStorage();
          }
      });
     
      const btnExportLog = $('btnExportLog');
      const btnImportLog = $('btnImportLog');
      const importFileInput = $('importFile');

      btnExportLog.addEventListener('click', () => {
          if (simulationLog.length === 0) {
              showStatusMessage('status_log_empty_export', true);
              return;
          }

          const headers = Object.keys(simulationLog[0]).filter(key => key !== 'isNew');
          
          const escapeCsvCell = (cell) => {
              const strCell = (cell === null || cell === undefined) ? '' : String(cell);
              // Jika sel berisi koma, tanda kutip ganda, atau baris baru, sertakan dalam tanda kutip ganda.
              if (/[",\n\r]/.test(strCell)) {
                  // Di dalam string yang dikutip, setiap tanda kutip ganda harus di-escape dengan tanda kutip ganda lainnya.
                  return `"${strCell.replace(/"/g, '""')}"`;
              }
              return strCell;
          };

          // Menggunakan koma (,) sebagai pemisah untuk format CSV standar.
          const csvRows = [headers.join(',')];

          simulationLog.forEach(log => {
              const values = headers.map(header => escapeCsvCell(log[header]));
              csvRows.push(values.join(','));
          });

          const csvString = csvRows.join('\n');
          const dataBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(dataBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'simulation-log.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showStatusMessage('status_export_success');
      });

      btnImportLog.addEventListener('click', () => {
          importFileInput.click();
      });

      importFileInput.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const csv = e.target.result;
                  const lines = csv.split(/\r\n|\n/).filter(line => line.trim() !== '');
                  
                  let newLat, newLon, newPoModel;
                  // Logika baru untuk mem-parsing metadata dan data yang dipisahkan koma
                  const dataLines = lines.filter(line => {
                      if (line.startsWith('#')) {
                          const parts = line.substring(1).split(','); // Hapus '#' lalu pisahkan dengan koma
                          if (parts.length >= 2) {
                              const key = `#${parts[0].trim()}`;
                              const value = parts[1].trim();
                              if (key === '#mapLat') newLat = parseFloat(value);
                              else if (key === '#mapLon') newLon = parseFloat(value);
                              else if (key === '#poModel') newPoModel = value;
                          }
                          return false; // Baris metadata, jangan sertakan dalam dataLines
                      }
                      return true; // Baris data
                  });

                  // Terapkan pembaruan status dari metadata TERLEBIH DAHULU
                  if (typeof newLat === 'number' && !isNaN(newLat) && typeof newLon === 'number' && !isNaN(newLon)) {
                      settings.lat = newLat;
                      settings.lon = newLon;
                      savePartial({ lat: newLat, lon: newLon });
                      updateCoordInputs(); 
                      // PERBAIKAN FINAL: Panggil map.setView() secara langsung di sini.
                      // Ini memastikan peta selalu berpusat pada koordinat yang diimpor,
                      // bahkan jika file CSV tidak berisi baris data log.
                      if (typeof map !== 'undefined' && map.setView) {
                          map.setView([newLat, newLon]);
                      }
                  }

                  if (newPoModel && ['crowl', 'alonso', 'sadovski'].includes(newPoModel)) {
                       // HANYA perbarui variabel settings. Peta akan diperbarui oleh observer.
                       const poModelSelect = document.getElementById('poModelSelect');
                       if(poModelSelect) poModelSelect.value = newPoModel;
                       settings.poModel = newPoModel;
                       savePartial({ poModel: newPoModel });
                  }

                  if (dataLines.length < 1) { // Bisa jadi hanya metadata
                      if (newLat !== undefined || newPoModel !== undefined) {
                          showStatusMessage('status_import_success'); // Metadata berhasil diimpor
                          simulationLog = []; // Kosongkan log jika tidak ada baris data
                      } else {
                          throw new Error(translations[currentLanguage].status_import_error_empty);
                      }
                  } else {
                    const headers = dataLines[0].split(',').map(h => h.trim());
                    const requiredHeaders = ['material', 'eta', 'e_tnt', 'rho', 'dh', 'vol', 'dist', 'w_tnt', 'ze', 'ps', 'po_crowl', 'po_alonso', 'po_sadovski', 'lat', 'lon', 'poModel'];
                    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));

                    if (missingHeaders.length > 0) {
                        throw new Error(`${translations[currentLanguage].status_import_error_missing_cols}${missingHeaders.join(', ')}`);
                    }

                    const importedData = [];
                    const numericalHeaders = ['eta', 'e_tnt', 'vol', 'dist', 'w_tnt', 'ze', 'ps'];
                    const poHeaders = ['po_crowl', 'po_alonso', 'po_sadovski'];

                    for (let i = 1; i < dataLines.length; i++) {
                        const rowNum = i + 1;
                        const values = dataLines[i].split(',').map(v => v.trim());
                        if (values.length !== headers.length) continue;

                        const logEntry = {};
                        for (let j = 0; j < headers.length; j++) {
                            const header = headers[j];
                            const value = values[j];

                            if (numericalHeaders.includes(header) && isNaN(parseFloat(value))) {
                                throw new Error(`Data tidak valid di baris ${rowNum} (kolom "${header}"). Harap masukkan angka yang valid.`);
                            }
                            if (poHeaders.includes(header) && isNaN(parseFloat(value)) && value.toUpperCase() !== 'N/A') {
                                throw new Error(`Data tidak valid di baris ${rowNum} (kolom "${header}"). Harap masukkan angka yang valid atau 'N/A'.`);
                            }
                            logEntry[header] = value;
                        }
                        importedData.push(logEntry);
                    }
                   
                    // BUG FIX: Menghapus error throw untuk file tanpa baris data.
                    // if (importedData.length === 0) {
                    //     throw new Error(translations[currentLanguage].status_import_error_no_data);
                    // }
                   
                    simulationLog = importedData.slice(0, 10);
                    showStatusMessage('status_import_success');
                  }

                  // === ALUR BARU YANG LEBIH KUAT ===
                  // Langkah 1: Segera render tabel log dengan data yang baru diimpor.
                  // Ini adalah prioritas utama untuk memberikan umpan balik kepada pengguna.
                  renderLogTable();
                  updateOverpressureChartFromLog();
                  saveLogToLocalStorage();

                  // Langkah 2: Coba perbarui formulir kalkulator utama dengan entri pertama.
                  // Ini adalah tugas sekunder; jika gagal, log tetap ditampilkan.
                  if (simulationLog.length > 0) {
                      try {
                          const firstLog = simulationLog[0];
                          const materialSelect = $('material');
                          
                          const findMaterialValue = (abbr) => {
                              const options = materialSelect.options;
                              for (let i = 0; i < options.length; i++) {
                                  if (materialAbbreviationMap[options[i].text.trim()] === abbr.trim()) {
                                      return options[i].value;
                                  }
                              }
                              return '';
                          };
                      
                          const materialValue = findMaterialValue(firstLog.material);
                          if (materialValue) {
                              // Atur nilai material.
                              materialSelect.value = materialValue;
                      
                              // PERBAIKAN: Secara eksplisit muat preset, render persamaan, dan hitung ulang
                              // tanpa bergantung pada dispatchEvent untuk alur yang lebih kuat.
                              const p = presets[materialValue];
                              if (p) {
                                  Object.keys(p).forEach(key => {
                                      const el = $(key);
                                      if (el) el.value = p[key];
                                  });
                              }
                              renderEquation(materialValue);
                      
                              // Atur volume dan jarak spesifik dari file impor.
                              $('vol').value = firstLog.vol;
                              $('dist').value = firstLog.dist;
                      
                              // Jalankan ulang perhitungan dengan semua input yang sudah benar.
                              compute(true);
                              
                              // PERBAIKAN: Panggil fungsi sinkronisasi secara manual untuk memastikan
                              // panel kontrol cepat diperbarui setelah impor CSV.
                              syncFloatingPanelInputs();
                          }
                      } catch (e) {
                          console.warn("Gagal memperbarui formulir utama dari CSV yang diimpor, tetapi log berhasil dimuat.", e);
                      }
                  }

              } catch (err) {
                  showStatusMessage('status_import_error', true, err.message);
              } finally {
                  importFileInput.value = '';
              }
          };
          reader.readAsText(file);
      });
     
      function setupCollapsePanel() {
        const panel = $('floatingControlPanel');
        const collapseBtn = $('floatPanelCollapseBtn');
        const header = panel.querySelector('.floating-panel-header');

        const setDockedPosition = () => {
            if (!materialCard) return;
            const materialCardRect = materialCard.getBoundingClientRect();
            let targetTop = Math.max(20, materialCardRect.top);
            panel.style.setProperty('--target-top', `${targetTop}px`);
        };

        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = panel.classList.toggle('collapsed');
           
            if (isCollapsed) {
                const rect = panel.getBoundingClientRect();
                panel.style.setProperty('--target-top', `${rect.top}px`);
                panel.style.setProperty('--target-right', `${window.innerWidth - rect.right}px`);
            } else {
                panel.style.width = ''; // Reset width
            }
        });

        header.addEventListener('click', (e) => {
            if (panel.classList.contains('collapsed') && e.target !== collapseBtn && !collapseBtn.contains(e.target)) {
                panel.classList.remove('collapsed');
                panel.style.width = '';
            }
        });
       
        window.addEventListener('scroll', debounce(() => {
            if (panel.classList.contains('collapsed')) {
                setDockedPosition();
            }
        }, 100));

        window.addEventListener('resize', debounce(() => {
            if (panel.classList.contains('collapsed')) {
                const rect = panel.getBoundingClientRect();
                panel.style.setProperty('--target-right', `${window.innerWidth - rect.right}px`);
            }
        }, 100));
      }
     
      const materialCard = $('materialCard');
      function handlePanelVisibility() {
          if (!isPageLoaded) return; // Do not run until page has settled
          const floatingPanel = $('floatingControlPanel');
          if (!materialCard || !floatingPanel) return;
          const cardRect = materialCard.getBoundingClientRect();
          if (cardRect.bottom < 20) {
              syncFloatingPanelInputs();
              floatingPanel.classList.add('visible');
          } else {
              floatingPanel.classList.remove('visible');
          }
      }

      window.addEventListener('scroll', handlePanelVisibility);
     
      const updateOnResizeOrRotate = () => {
          handlePanelVisibility();
          const floatingPanel = $('floatingControlPanel');
          if (floatingPanel && !floatingPanel.classList.contains('collapsed')) {
              floatingPanel.style.width = '';
          }
      };

      // PERBAIKAN: Gunakan fungsi debounce untuk kedua event listener 
      // untuk mencegah eksekusi ganda saat orientasi berubah.
      const debouncedUpdateOnResizeOrRotate = debounce(updateOnResizeOrRotate, 150);
      window.addEventListener('resize', debouncedUpdateOnResizeOrRotate);
      window.addEventListener('orientationchange', debouncedUpdateOnResizeOrRotate);

      // --- INITIALIZATION SEQUENCE ---
      initLanguage(); 
      loadLogo();
      toTopBtn.addEventListener('click', goTop);
      loadLog();
      renderLogTable();
      updateOverpressureChartFromLog();
      loadStateFromURL();
      setupCollapsePanel(); 
      updatePsVsZeChart(); // Initial plot
     
      setTimeout(() => {
          isPageLoaded = true;
          handlePanelVisibility();
      }, 250);

    });
