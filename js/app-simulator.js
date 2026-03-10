// public/js/app-simulator.js
let simulationLog = []; // Make simulationLog globally accessible for better module interaction
let lastApiResults = null; // <-- TAMBAHKAN BARIS INI
let updatePsVsZeChart = () => {}; // Define a placeholder function in a shared scope
let isSliderVisible = false; // Lacak status visibilitas slider
let currentLanguage = "en"; // Default language
let xyPlotController; // <-- TAMBAHKAN INI
let translations = {};
let userManuallyMinimized = false; // Track if the user intentionally minimized the QCP

const translateKey = (key, fallbackKey = "unknown") => {
	const lang = translations[currentLanguage] || translations["en"];
	const englishTranslations = translations["en"];

	if (!key) {
		// Ensure englishTranslations is checked before accessing fallbackKey
		const fallbackText =
			lang[fallbackKey] ||
			(englishTranslations && englishTranslations[fallbackKey]) ||
			fallbackKey;
		// console.log(`Translate Fallback: "${fallbackKey}" -> "${fallbackText}"`);
		return fallbackText;
	}

	const currentLangText = lang[key];
	// Ensure englishTranslations is checked before accessing key
	const englishText = englishTranslations
		? englishTranslations[key]
		: undefined;
	let result = key; // Default to key itself if not found anywhere

	if (currentLangText !== undefined) {
		result = currentLangText;
	} else if (englishText !== undefined) {
		result = englishText;
	}

	// console.log(`Translate Key: "${key}", Lang: ${currentLanguage}, Result: "${result}"`);
	return result;
};

// Global utility functions
function debounce(func, delay = 250) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}

window.formatNumber = (num, decimals = 3) => {
	const parsed = typeof num === "string" ? parseFloat(num) : num;
	if (parsed === null || parsed === undefined || isNaN(parsed)) return "—";
	const lang = document.documentElement.lang || "en";
	const locale = lang === "id" ? "id-ID" : "en-US";
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	}).format(parsed);
};

window.getNormalizedInputValue = (id) => {
	const el = document.getElementById(id);
	if (!el) return "";
	let valStr = el.value;
	if (!valStr) return "";
	// Gunakan variabel global currentLanguage
	if (typeof currentLanguage !== "undefined" && currentLanguage === "id") {
		// ID: 1.000,5 -> 1000.5
		return valStr.replace(/\./g, "").replace(",", ".");
	} else {
		// EN: 1,000.5 -> 1000.5
		return valStr.replace(/,/g, "");
	}
};

window.formatPrecision = (num, precision = 4) => {
	const parsed = typeof num === "string" ? parseFloat(num) : num;
	if (parsed === null || parsed === undefined || isNaN(parsed)) return "—";
	const lang = document.documentElement.lang || "en";
	const locale = lang === "id" ? "id-ID" : "en-US";
	return parsed.toLocaleString(locale, {
		maximumSignificantDigits: precision,
	});
};

function toggleDetails(id) {
	var element = document.getElementById(id);
	// Cek apakah display BUKAN 'none' (artinya terlihat atau default)
	if (element.style.display !== "none") {
		element.style.display = "none";
	} else {
		element.style.display = "block";
	}
}

function setupNumberInputs() {
	const inputs = document.querySelectorAll('input[data-type="number"]');
	inputs.forEach((input) => {
		if (input.dataset.hasNumberListener) return;
		input.dataset.hasNumberListener = "true";

		input.addEventListener("keypress", function (e) {
			const char = String.fromCharCode(e.which);
			const allowed = "0123456789.,-";
			if (allowed.indexOf(char) === -1) {
				e.preventDefault();
			}
		});

		// Optional: formatting on blur
		input.addEventListener("blur", function () {
			const raw = this.value;
			if (!raw) return;
			// Try to parse using current lang logic
			let valStr = raw;
			if (currentLanguage === "id") {
				valStr = valStr.replace(/\./g, "").replace(",", ".");
			} else {
				valStr = valStr.replace(/,/g, "");
			}
			const val = parseFloat(valStr);
			if (!isNaN(val)) {
				this.value = window.formatNumber(val);
			}
		});
	});
}

const fields = ["rho", "vol", "dh", "eta", "e_tnt", "dist", "pa"];
const inputFields = ["material", ...fields];
const $ = (id) => document.getElementById(id);
function saveFormStateToLocalStorage() {
	try {
		const currentState = {};
		inputFields.forEach((id) => {
			const el = $(id);
			if (el && el.value !== undefined) {
				// Simpan nilai yang sudah dinormalisasi (format internasional)
				currentState[id] = window.getNormalizedInputValue(id);
			}
		});
		localStorage.setItem("explosionSimState", JSON.stringify(currentState));
	} catch (error) {
		console.warn("Could not save form state to localStorage:", error);
	}
}

function parseNumberLoose(s) {
	if (s == null) return NaN;
	s = String(s)
		.trim()
		.replace(/\s+/g, "")
		.replace(/\u00A0/g, "");
	if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s))
		s = s.replace(/\./g, "").replace(",", ".");
	else if (/^\d+,\d+$/.test(s)) s = s.replace(",", ".");
	else s = s.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, "");
	return Number(s);
}

function extractNumbers(line) {
	const toks = String(line).match(/-?\d+(?:[.,]\d+)?/g) || [];
	return toks.map(parseNumberLoose).filter((n) => Number.isFinite(n));
}

function parseData(text) {
	const out = [];
	const rows = (text || "")
		.split(/[\r\n]+/)
		.map((r) => r.trim())
		.filter(Boolean);
	for (const r of rows) {
		const nums = extractNumbers(r);
		if (!nums.length) continue;
		const rVal = nums[0];
		const poVal = nums.length > 1 ? nums[1] : null;
		if (rVal > 0)
			out.push({
				r: rVal,
				Po: poVal != null && Number.isFinite(poVal) ? poVal : null,
			});
	}
	out.sort((a, b) => a.r - b.r);
	return out;
}

document.addEventListener("DOMContentLoaded", () => {
	let isPageLoaded = false; // Flag to prevent premature execution
	const presets = {
		AN: { rho: 800, dh: 1583, e_tnt: 4580, eta: 1 },
		LPG: { rho: 492, dh: 46011, e_tnt: 4686, eta: 0.02 },
		H2: { rho: 40.857, dh: 130800, e_tnt: 4520, eta: 0.04606 },
	};
	const eqMap = {
		AN: [
			{
				labelKey: "eq_label_detonation",
				eq: '2 NH<sub>4</sub>NO<sub>3</sub>(s) <span class="arrow">→</span> 2 N<sub>2</sub>(g) + O<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)',
			},
		],
		LPG: [
			{
				labelKey: "eq_label_combustion_propane",
				eq: 'C<sub>3</sub>H<sub>8</sub>(g) + 5 O<sub>2</sub>(g) <span class="arrow">→</span> 3 CO<sub>2</sub>(g) + 4 H<sub>2</sub>O(g)',
			},
		],
		H2: [
			{
				labelKey: "eq_label_combustion_explosion",
				eq: '2 H<sub>2</sub>(g) + O<sub>2</sub>(g) <span class="arrow">→</span> 2 H<sub>2</sub>O(g)',
			},
		],
	};
	const materialAbbreviationMap = {
		"Ammonium Nitrate (AN)": "AN",
		"Propane (LPG)": "LPG",
		"Hydrogen (H₂)": "H2",
		"Amonium Nitrat (AN)": "AN",
		"Propana (LPG)": "LPG",
		"Hidrogen (H₂)": "H2",
	};

	const citations = {
		1: "Wang et al., 2023",
		2: "Clancey, 1972; Crowl & Louvar, 2011",
		3: "Clancey, 1972; CCPS, 2000",
		4: "Jeremić & Bajić, 2006",
		5: "TNO. (1992). Methods for the determination of possible damage to people and objects resulting from releases of hazardous materials (Green Book). CPR 16E. The Hague: Committee for the Prevention of Disasters.",
	};

	function formatCitations(text) {
		if (!text) return "";
		return text.replace(/\[(\d+)\]/g, (match, number) => {
			const citationText = citations[number] || "Unknown citation";
			return ` <cite>(${citationText})</cite>`;
		});
	}
	// --- START: Code to load the menu ---
	const menuPlaceholder = document.getElementById("menu-placeholder");
	if (menuPlaceholder) {
		fetch("/html/_menu.html") // Make sure the path is correct relative to your HTML file
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.text();
			})
			.then((html) => {
				menuPlaceholder.innerHTML = html;
				// **IMPORTANT:** Re-attach event listeners after loading the menu
				setupMenuToggle(); // Call a function to set up the menu click behavior
			})
			.catch((error) => {
				console.error("Error loading menu:", error);
				menuPlaceholder.innerHTML =
					'<p style="color:red; text-align:center;">Error loading menu.</p>';
			});
	} else {
		console.log("Menu placeholder not found!"); // <-- Cek ini jika placeholder tidak ada
	}

	// Function to set up the dropdown toggle behavior
	function setupMenuToggle() {
		const dropdown = document.querySelector(".dropdown-menu"); // Find the newly added menu
		if (dropdown) {
			const dropdownToggle = dropdown.querySelector(".dropdown-toggle");
			if (dropdownToggle) {
				dropdownToggle.addEventListener("click", (event) => {
					event.stopPropagation();
					dropdown.classList.toggle("is-active");
				});
			}
			// Close menu when clicking outside
			document.addEventListener("click", (event) => {
				if (
					dropdown.classList.contains("is-active") &&
					!dropdown.contains(event.target)
				) {
					dropdown.classList.remove("is-active");
				}
			});
		}
	}

	/*===================================================
      | START: BILINGUAL TRANSLATION SCRIPT                 
      ====================================================*/

	const footerPlaceholder = document.getElementById("footer-placeholder");

	if (footerPlaceholder) {
		fetch("/html/_footer.html") // Pastikan path ini benar
			.then((response) => {
				if (!response.ok) {
					console.error(`Gagal memuat footer: Status ${response.status}`);
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.text();
			})
			.then((html) => {
				footerPlaceholder.innerHTML = html;

				// **PENTING:** Terapkan terjemahan ke footer yang baru dimuat
				// Panggil kembali fungsi yang menerapkan terjemahan ke elemen baru
				// (Asumsi: fungsi setLanguage atau fungsi terjemahan internal Anda
				// dapat dipanggil ulang untuk menargetkan elemen baru)
				if (typeof setLanguage === "function") {
					// Panggil ulang dengan bahasa saat ini untuk menerjemahkan footer
					setLanguage(currentLanguage);
				} else {
					console.warn(
						"setLanguage function not found globally, cannot translate loaded footer.",
					);
				}
			})
			.catch((error) => {
				console.error("Error loading footer:", error);
				footerPlaceholder.innerHTML =
					'<p style="color:red; text-align:center;">Error loading footer.</p>';
			});
	} else {
		console.log("Footer placeholder not found!"); // Log untuk debug
	}
	// --- END: Kode untuk memuat footer ---

	function setupMapExport() {
		const btn = $("btnExportMap");
		if (!btn) return;

		btn.addEventListener("click", () => {
			const mapCard = document.querySelector(
				'section[aria-labelledby="contour-map-head"]',
			);
			if (!mapCard) return;

			if (typeof html2canvas === "undefined") {
				console.error("html2canvas not loaded");
				alert("Library html2canvas not loaded.");
				return;
			}

			html2canvas(mapCard, {
				useCORS: true,
				allowTaint: true,
				scale: 2,
				backgroundColor: "#ffffff",
				ignoreElements: (element) => {
					if (
						element.id === "btnExportMap" ||
						element.id === "fsBtn" ||
						element.id === "fsBtnMobile"
					) {
						return true;
					}
					return false;
				},
			})
				.then((canvas) => {
					const url = canvas.toDataURL("image/png");
					const a = document.createElement("a");
					a.href = url;
					a.download = "explosion-contour-map.png";
					a.click();
				})
				.catch((err) => {
					console.error("Map export failed:", err);
					alert("Failed to export map.");
				});
		});
	}

	async function loadTranslationsAndInit() {
		try {
			// 1. Ambil kedua file JSON secara paralel
			const [enResponse, idResponse] = await Promise.all([
				fetch("/lang/en.json"), // Sesuaikan path jika perlu
				fetch("/lang/id.json"), // Sesuaikan path jika perlu
			]);

			if (!enResponse.ok || !idResponse.ok) {
				throw new Error("Gagal memuat file terjemahan.");
			}

			// 2. Ubah respons menjadi JSON
			const enData = await enResponse.json();
			const idData = await idResponse.json();

			// 3. Isi variabel 'translations' global
			translations = {
				en: enData,
				id: idData,
			};

			// 4. Pindahkan SEMUA kode inisialisasi ke SINI
			// Ini memastikan sisa skrip hanya berjalan SETELAH
			// file terjemahan berhasil dimuat.
			// ---> TAMBAHKAN BLOK SUPABASE DI SINI <---
			try {
				if (typeof supabase !== "undefined") {
					// Ganti dengan URL dan Kunci Anon Proyek Supabase Anda
					const SUPABASE_URL = "https://pjnbshyobrpkkbkoxnqk.supabase.co";
					const SUPABASE_ANON_KEY =
						"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbmJzaHlvYnJwa2tia294bnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTQ0OTYsImV4cCI6MjA3NzIzMDQ5Nn0.xtbLpO3SOPEYMVaeCXzig5GFX4ghVUFlwt3DmePdY5E";
					const supabaseClient = supabase.createClient(
						SUPABASE_URL,
						SUPABASE_ANON_KEY,
					);

					let { data: scenarioRows, error } = await supabaseClient
						.from("scenarios") // Nama tabel Anda
						.select("id, name, data_points"); // Kolom yang Anda buat

					if (error) {
						throw new Error("Gagal mengambil skenario: " + error.message);
					}

					// Ubah data (array) dari Supabase menjadi format (objek)
					// yang diharapkan oleh aplikasi Anda.
					scenarioRows.forEach((row) => {
						simulationScenarios[row.id] = {
							name: row.name,
							data: row.data_points, // Perhatikan: data_points -> data
						};
					});
				}
			} catch (dbError) {
				console.error("Error Supabase:", dbError);
				// Tampilkan error ke pengguna agar mereka tahu datanya gagal dimuat
				showStatusMessage(
					"Gagal memuat skenario dari database.",
					true,
					dbError.message,
				);
				// Anda bisa memutuskan apakah akan menghentikan aplikasi atau lanjut
				// tanpa data skenario
			}
			// ---> AKHIR BLOK SUPABASE <---
			// --- MULAI BLOK YANG DIPINDAHKAN ---
			initLanguage();
			setupNumberInputs();
			loadLogo();
			if (toTopBtn) toTopBtn.addEventListener("click", goTop);
			populateSimulationSelector();
			setupSliderArrows();
			setupSliderDescriptions();
			setupMapExport();
			initializeSimulationState(); // <-- Satu baris ini menggantikan pemanggilan loadLog() dan render...() yang lama
			loadStateFromURL();
			setupCollapsePanel();
			updatePsVsZeChart(); // Initial plot

			isInitializing = false;

			// ========================================================== -->
			// GANTI BLOK INTERAKSI LAMA DENGAN YANG BARU INI
			// ========================================================== -->
			// Hentikan slideshow jika pengguna berinteraksi dengan slider APAPUN
			document.querySelectorAll(".slider-nav").forEach((nav) => {
				nav.addEventListener("click", stopSlideshow);
			});
			document.querySelectorAll(".slider").forEach((slider) => {
				slider.addEventListener("pointerdown", stopSlideshow);
			});
			// ========================================================== -->

			setTimeout(() => {
				isPageLoaded = true;
				handlePanelVisibility();
			}, 250);
			// --- AKHIR BLOK YANG DIPINDAHKAN ---
		} catch (error) {
			console.error("Error memuat terjemahan:", error);
			// Tampilkan pesan error ke pengguna
			document.body.innerHTML =
				'<h1 style="color: red; text-align: center; padding-top: 50px;">Error: Gagal memuat data aplikasi. Silakan coba muat ulang halaman.</h1>';
		}
	}
	// ---> AKHIR FUNGSI TAMBAHAN <---

	function setLanguage(lang) {
		if (!translations[lang]) return;
		const oldLang = currentLanguage;
		currentLanguage = lang;
		try {
			localStorage.setItem("preferredLanguage", lang);
		} catch (e) {
			console.warn("Could not save language preference to local storage:", e);
		}

		document.documentElement.lang = lang;

		// Update browser tab title based on page context
		let pageTitleKey = document.body.getAttribute("data-title-key") || "app_title";
		const pageTitle = translateKey(pageTitleKey);
		if (pageTitle) {
			document.title = pageTitle;
		}

		// Menerjemahkan semua elemen dengan data-lang-key (Ini aman untuk semua halaman)
		document.querySelectorAll("[data-lang-key]").forEach((el) => {
			const key = el.getAttribute("data-lang-key");
			// Gunakan translateKey global yang sudah ada
			const translation = translateKey(key, key); // Fallback ke key jika tidak ditemukan
			if (translation !== undefined) {
				if (
					el.placeholder !== undefined &&
					(el.tagName === "INPUT" || el.tagName === "TEXTAREA")
				) {
					el.placeholder = translation;
				} else {
					// Gunakan innerHTML agar tag <strong> dll. di dalam terjemahan berfungsi
					el.innerHTML = translation;
				}
			}
		});

		// Ensure specific labels are correctly set after general translation
		const materialSel = $("material");
		const etaLabel = document.querySelector('label[for="eta"]');
		const logHeaderEta = $("log_header_eta");

		const dhLabel = document.querySelector('label[for="dh"]');
		const logHeaderDh = $("log_header_dh");
		const paramTotalEnergy = document.querySelector(
			'[data-lang-key="param_total_energy"]',
		);

		if (materialSel && materialSel.value === "AN") {
			if (etaLabel) etaLabel.innerHTML = "f<sub>AN</sub>";
			if (logHeaderEta) logHeaderEta.textContent = "fAN";
			if (dhLabel) dhLabel.innerHTML = "ΔH<sub>decomp</sub>";
			if (logHeaderDh) logHeaderDh.innerHTML = "ΔH<sub>decomp</sub>";
			if (paramTotalEnergy)
				paramTotalEnergy.textContent = translateKey("param_effective_energy");
		}

		// Update status tombol bahasa (Ini aman untuk semua halaman)
		document.querySelectorAll(".lang-btn").forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.lang === lang);
		});

		// Reformat inputs with data-type="number"
		document.querySelectorAll('input[data-type="number"]').forEach((input) => {
			const raw = input.value;
			if (!raw) return;
			let valStr = raw;
			// Parse using OLD language rules
			if (oldLang === "id") {
				valStr = valStr.replace(/\./g, "").replace(",", ".");
			} else {
				valStr = valStr.replace(/,/g, "");
			}
			const val = parseFloat(valStr);
			if (!isNaN(val)) {
				// Format using NEW language rules (window.formatNumber uses currentLanguage which is already updated)
				input.value = window.formatNumber(val);
			}
		});

		// Localize numbers in elements with data-localize-number attribute
		document.querySelectorAll("[data-localize-number]").forEach((el) => {
			const rawValue = el.getAttribute("data-localize-number");
			if (!rawValue) return;

			// Replace numbers in the string with localized versions
			// Regex matches integers and decimals: \d+(\.\d+)?
			// We use a replacer function to format each match
			const localized = rawValue.replace(/(\d+(\.\d+)?)/g, (match) => {
				// Avoid formatting if it looks like an ID or unwanted pattern (optional check)
				// For now, simple formatting:
				return window.formatNumber(match, (match.split(".")[1] || "").length);
			});

			el.innerHTML = localized;
		});

		// Localize placeholders for numeric inputs
		document.querySelectorAll('input[data-type="number"]').forEach((el) => {
			const originalPlaceholder =
				el.getAttribute("data-original-placeholder") ||
				el.getAttribute("placeholder");
			if (!originalPlaceholder) return;

			if (!el.getAttribute("data-original-placeholder")) {
				el.setAttribute("data-original-placeholder", originalPlaceholder);
			}

			const localized = originalPlaceholder.replace(
				/(\d+(\.\d+)?)/g,
				(match) => {
					return window.formatNumber(match, (match.split(".")[1] || "").length);
				},
			);

			el.setAttribute("placeholder", localized);
		});

		// --- AWAL BLOK KHUSUS SIMULASI (Tambahkan Cek) ---
		const materialSelect = $("material"); // Cek sekali saja
		if (materialSelect) {
			if (materialSelect.value) {
				renderEquation(materialSelect.value);
			}
			// Update panel hanya jika kita di halaman simulasi (panel ada)
			if ($("panel-damage-crowl")) {
				// Cek keberadaan salah satu panel
				if (lastApiResults) {
					updateEstimationPanels(
						lastApiResults.Po_crowl,
						lastApiResults.Po_alonso,
						lastApiResults.Po_sadovski,
						lastApiResults.isAlonsoExtrapolated,
						lastApiResults.assessments,
					);
					updateInjuryPanels(
						lastApiResults.Po_crowl,
						lastApiResults.Po_alonso,
						lastApiResults.Po_sadovski,
						lastApiResults.isAlonsoExtrapolated,
						lastApiResults.assessments,
					);
					// Update output inputs
					if ($("W_mass"))
						$("W_mass").value = formatNumber(lastApiResults.W_mass);
					if ($("E_total"))
						$("E_total").value = formatNumber(lastApiResults.E_total);
					if ($("W_tnt")) $("W_tnt").value = formatNumber(lastApiResults.W_tnt);
					if ($("Ze")) $("Ze").value = formatNumber(lastApiResults.Ze);
					if ($("Ps")) $("Ps").value = formatNumber(lastApiResults.Ps);
					if ($("Po_crowl"))
						$("Po_crowl").value = formatNumber(lastApiResults.Po_crowl);
					if ($("Po_alonso"))
						$("Po_alonso").value = formatNumber(lastApiResults.Po_alonso);
					if ($("Po_sadovski"))
						$("Po_sadovski").value = formatNumber(lastApiResults.Po_sadovski);
				} else {
					updateEstimationPanels(NaN, NaN, NaN, false, null);
					updateInjuryPanels(NaN, NaN, NaN, false, null);
				}
			}
		}
		// --- AKHIR BLOK KHUSUS SIMULASI ---

		if (typeof renderLogTable === "function") {
			renderLogTable();
		}

		// --- AWAL BLOK CHART (Tambahkan Cek) ---
		// Asumsi chartController & overpressureChartController adalah global atau di window
		if (
			typeof chartController !== "undefined" &&
			chartController &&
			typeof updatePsVsZeChart === "function"
		) {
			updatePsVsZeChart();
		}
		if (
			typeof overpressureChartController !== "undefined" &&
			overpressureChartController &&
			typeof updateOverpressureChartFromLog === "function"
		) {
			if (overpressureChartController.chartInstance) {
				overpressureChartController.chartInstance.options.locale =
					lang === "id" ? "id-ID" : "en-US";
			}
			updateOverpressureChartFromLog();
		}
		// --- AKHIR BLOK CHART ---

		// --- AWAL BLOK PANEL MELAYANG (Tambahkan Cek) ---
		if ($("floatPanelInputs")) {
			// Cek jika elemen panel melayang ada
			setupFloatingPanel(); // Setup ulang untuk terjemahan label
			// Update output panel melayang jika ada hasil terakhir
			if (lastApiResults) {
				updateFloatingPanelOutputs(
					lastApiResults.Po_crowl,
					lastApiResults.Po_alonso,
					lastApiResults.Po_sadovski,
					true,
				);
			} else {
				updateFloatingPanelOutputs(NaN, NaN, NaN, false);
			}
		}

		// --- Update Placeholder Dropdown Simulasi ---
		const simulationSelector = $("simulationSelector");
		if (simulationSelector) {
			const placeholderOption =
				simulationSelector.querySelector('option[value=""]');
			if (placeholderOption) {
				placeholderOption.textContent = translateKey(
					"sim_log_select",
					"Select Simulation Log",
				);
			}
		}
		// --- AKHIR BLOK PANEL MELAYANG ---

		// --- Update Teks Tombol Slider (Aman, sudah ada cek di dalam fungsi updateToggleButtonVisibility) ---
		const selector = $("simulationSelector");
		if (selector) {
			updateToggleButtonVisibility(selector.value); // Update visibilitas tombol show/hide slider
		}
		// Juga update teks tombol jika sudah terlihat
		const btnToggleSlider = $("btnToggleSlider");
		if (btnToggleSlider && btnToggleSlider.style.display !== "none") {
			const currentKey = btnToggleSlider.getAttribute("data-lang-key");
			if (currentKey) {
				btnToggleSlider.textContent = translateKey(
					currentKey,
					"btn_toggle_slider",
				);
			}
		}

		// --- Update Main Calculator Outputs ---
		// Panggil compute untuk memformat ulang output (Ze, W_mass, dll) sesuai bahasa baru
		// Gunakan parameter true (isInitialLoad) untuk menghindari pesan error validasi jika input kosong
		if (typeof compute === "function") {
			compute(true);
		}
	} // Akhir fungsi setLanguage
	function initLanguage() {
		let preferredLanguage = "en";
		try {
			preferredLanguage = localStorage.getItem("preferredLanguage") || "en";
		} catch (e) {
			console.warn("Could not read language preference from local storage:", e);
		}
		setLanguage(preferredLanguage);
		document.querySelectorAll(".lang-btn").forEach((btn) => {
			btn.addEventListener("click", () => {
				setLanguage(btn.dataset.lang);
			});
		});
	}
	/*
      ========================================================
      | END: BILINGUAL TRANSLATION SCRIPT                    |
      =======================================================*/

	// GANTI DENGAN BLOK DI BAWAH INI
	let simulationScenarios = {};

	// ====== START: DYNAMIC SLIDESHOW SCRIPT BLOCK ======
	// Variabel global untuk menyimpan ID interval slideshow
	let slideshowInterval = null;

	// Fungsi untuk menghentikan slideshow yang sedang berjalan
	function stopSlideshow() {
		if (slideshowInterval) {
			clearInterval(slideshowInterval);
			slideshowInterval = null;
		}
	}

	// Fungsi untuk memulai slideshow untuk slider tertentu
	function startSlideshow(activeSliderContainer) {
		stopSlideshow(); // Selalu hentikan slideshow sebelumnya
		if (!activeSliderContainer) return;

		const slider = activeSliderContainer.querySelector(".slider");
		if (!slider) return;

		const totalSlides = slider.querySelectorAll(".slide-item").length;
		if (totalSlides <= 1) return; // Jangan jalankan slideshow jika hanya ada satu gambar

		slideshowInterval = setInterval(() => {
			const slideWidth = slider.clientWidth;
			let nextSlideIndex = Math.round(slider.scrollLeft / slideWidth) + 1;

			if (nextSlideIndex >= totalSlides) {
				nextSlideIndex = 0; // Kembali ke awal
			}

			slider.scrollTo({
				left: nextSlideIndex * slideWidth,
				behavior: "smooth",
			});
		}, 1500); // Interval 1.5 detik
	}

	// Fungsi utama untuk mengontrol visibilitas semua slider
	function updateSliderVisibility() {
		const selector = document.getElementById("simulationSelector");
		if (!selector) return;

		const sliderMap = {
			gangneung: document.getElementById("gangneungSliderContainer"),
			beirut: document.getElementById("beirutSliderContainer"),
			tianjin: document.getElementById("tianjinSliderContainer"),
			wenling: document.getElementById("wenlingSliderContainer"),
			sanJuanico: document.getElementById("sanjuanicoSliderContainer"),
			experiment: document.getElementById("experimentSliderContainer"),
		};

		// --- AWAL PERBAIKAN ---

		// 1. Sembunyikan semua slider terlebih dahulu
		Object.values(sliderMap).forEach((slider) => {
			if (slider) slider.style.display = "none";
		});

		// 2. Dapatkan slider yang aktif
		const selectedValue = selector.value;
		let activeSlider = null;
		if (sliderMap[selectedValue]) {
			activeSlider = sliderMap[selectedValue];
		}

		// 3. Hentikan slideshow apa pun yang sedang berjalan
		stopSlideshow();

		// 4. Periksa apakah slider harus terlihat
		// Jika tombol "Real Event" AKTIF (isSliderVisible = true) DAN ada slider yang valid,
		// maka tampilkan slider itu dan mulai slideshow-nya.
		if (isSliderVisible && activeSlider) {
			activeSlider.style.display = "block";
			startSlideshow(activeSlider);
		}

		// Jika tombol "Real Event" TIDAK AKTIF (isSliderVisible = false),
		// atau jika tidak ada slider yang valid,
		// maka fungsi ini hanya akan menyembunyikan semuanya (sudah dilakukan di langkah 1).

		// --- AKHIR PERBAIKAN ---
	}
	function updateToggleButtonVisibility(selectedValue) {
		const btnToggleSlider = $("btnToggleSlider");
		if (!btnToggleSlider) return;

		// Peta ini HANYA berisi skenario yang MEMILIKI slider di index.html
		const sliderMap = {
			gangneung: true,
			beirut: true,
			tianjin: true,
			wenling: true,
			sanJuanico: true,
			experiment: true,
		};

		if (sliderMap[selectedValue]) {
			btnToggleSlider.style.display = ""; // Tampilkan tombol (kembali ke default)
		} else {
			btnToggleSlider.style.display = "none"; // Sembunyikan tombol

			// Jika tombol disembunyikan, pastikan slider juga ikut tersembunyi
			if (isSliderVisible) {
				isSliderVisible = false;
				updateSliderVisibility(); // Ini akan menyembunyikan slider yang mungkin sedang terbuka

				// Reset teks tombol kembali ke "Real Event"
				const newKey = "btn_toggle_slider";
				btnToggleSlider.setAttribute("data-lang-key", newKey);
				btnToggleSlider.textContent = translateKey(newKey, "btn_toggle_slider");
			}
		}
	}
	// ====== START: SLIDER ARROW NAVIGATION SCRIPT ======
	function setupSliderArrows() {
		// Cari semua slider wrapper di halaman
		document.querySelectorAll(".slider-wrapper").forEach((wrapper) => {
			const slider = wrapper.querySelector(".slider");
			const prevButton = wrapper.querySelector(".slider-arrow.prev");
			const nextButton = wrapper.querySelector(".slider-arrow.next");

			// Lewati jika salah satu elemen tidak ditemukan
			if (!slider || !prevButton || !nextButton) return;

			// Tambahkan event listener untuk tombol "Next"
			nextButton.addEventListener("click", () => {
				const slideWidth = slider.clientWidth;
				// Geser ke kanan sejauh lebar satu slide
				slider.scrollBy({ left: slideWidth, behavior: "smooth" });
				stopSlideshow(); // Hentikan slideshow otomatis saat panah diklik
			});

			// Tambahkan event listener untuk tombol "Previous"
			prevButton.addEventListener("click", () => {
				const slideWidth = slider.clientWidth;
				// Geser ke kiri sejauh lebar satu slide
				slider.scrollBy({ left: -slideWidth, behavior: "smooth" });
				stopSlideshow(); // Hentikan slideshow otomatis saat panah diklik
			});
		});
	}

	function setupSliderDescriptions() {
		const sliderContainers = document.querySelectorAll(
			'.card[id$="SliderContainer"]',
		);
		if (!sliderContainers.length) return;

		sliderContainers.forEach((container) => {
			const slider = container.querySelector(".slider");
			const descriptionEl = container.querySelector(".slider-description");
			const slides = container.querySelectorAll(".slide-item");

			if (!slider || !descriptionEl || !slides.length) return;

			const observerCallback = (entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const descKey = entry.target.getAttribute("data-desc-key");
						if (descKey) {
							descriptionEl.innerHTML = translateKey(descKey);
						}
					}
				});
			};

			const observer = new IntersectionObserver(observerCallback, {
				root: slider,
				threshold: 0.6,
			});

			slides.forEach((slide) => observer.observe(slide));

			// Set initial description for the first slide
			const firstSlideKey = slides[0].getAttribute("data-desc-key");
			if (firstSlideKey) {
				descriptionEl.innerHTML = translateKey(firstSlideKey);
			}
		});
	}
	// ====== END: SLIDER ARROW NAVIGATION SCRIPT ======

	let chartController;
	let overpressureChartController;
	// simulationLog is now globally defined, so we remove the local 'let' declaration here.
	function showStatusMessage(messageKey, isError = false, extraInfo = "") {
		const msgEl = $("msg");
		if (!msgEl) return;
		const message =
			(translations[currentLanguage][messageKey] || messageKey) + extraInfo;
		msgEl.textContent = message;
		if (isError) {
			msgEl.classList.add("bad");
		} else {
			msgEl.classList.remove("bad");
		}
		msgEl.style.display = "block";

		// Auto-hide only if it's NOT an error message
		if (!isError) {
			setTimeout(() => {
				if (msgEl.textContent === message) {
					msgEl.style.display = "none";
				}
			}, 5000);
		}
	}

	function loadLogo() {
		const img = $("itbLogo");
		if (!img) return;
		const fallback =
			'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><circle cx="128" cy="128" r="120" fill="%230079c2"/><text x="50%" y="56%" font-family="Georgia, serif" font-size="88" text-anchor="middle" fill="white">ITB</text></svg>';
		img.onerror = () => {
			img.onerror = null;
			img.src = fallback;
		};
		img.src = "/img/Logo_Institut_Teknologi_Bandung.webp";
	}

	function goTop() {
		try {
			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch (e) {
			window.scrollTo(0, 0);
		}
	}
	function initializeChart() {
		const chartDom = document.getElementById("chart");
		if (!chartDom) return null;
		const chart = echarts.init(chartDom);
		new ResizeObserver(() => chart.resize()).observe(chartDom);
		const css = getComputedStyle(document.documentElement);
		const BLUE = (css.getPropertyValue("--blue-itb") || "#0079c2").trim();
		const DANGER = (css.getPropertyValue("--danger") || "#DC2626").trim();
		const fPs = (ze) =>
			(1616 * (1 + (ze / 4.5) ** 2)) /
			(Math.sqrt(1 + (ze / 0.048) ** 2) *
				Math.sqrt(1 + (ze / 0.32) ** 2) *
				Math.sqrt(1 + (ze / 1.35) ** 2));
		const logspace = (min, max, n = 1000) =>
			Array.from(
				{ length: n },
				(_, i) =>
					10 **
					(Math.log10(min) +
						((Math.log10(max) - Math.log10(min)) * i) / (n - 1)),
			);
		const refPairs = logspace(0.01, 100).map((z) => [z, fPs(z)]);
		const btn = $("btnExport");
		if (btn) {
			btn.addEventListener("click", () => {
				const card = btn.closest(".card");
				if (!card) return;

				if (typeof html2canvas === "undefined") {
					console.error("html2canvas not loaded");
					alert("Library html2canvas not loaded.");
					return;
				}

				html2canvas(card, {
					useCORS: true,
					allowTaint: true,
					scale: 2,
					backgroundColor: "#ffffff",
					ignoreElements: (element) => {
						if (element.id === "btnExport") {
							return true;
						}
						return false;
					},
				})
					.then((canvas) => {
						const url = canvas.toDataURL("image/png");
						const a = document.createElement("a");
						a.href = url;
						a.download = "plot-explosion-ps-vs-ze.png";
						a.click();
					})
					.catch((err) => {
						console.error("Chart export failed:", err);
						alert("Failed to export chart.");
					});
			});
		}

		const btnOverpressure = $("btnExportOverpressureChart");
		if (btnOverpressure) {
			btnOverpressure.addEventListener("click", () => {
				const card = btnOverpressure.closest(".card");
				if (!card) return;

				if (typeof html2canvas === "undefined") {
					console.error("html2canvas not loaded");
					alert("Library html2canvas not loaded.");
					return;
				}

				html2canvas(card, {
					useCORS: true,
					allowTaint: true,
					scale: 2,
					backgroundColor: "#ffffff",
					ignoreElements: (element) => {
						if (element.id === "btnExportOverpressureChart") {
							return true;
						}
						return false;
					},
				})
					.then((canvas) => {
						const url = canvas.toDataURL("image/png");
						const a = document.createElement("a");
						a.href = url;
						a.download = "overpressure-vs-distance.png";
						a.click();
					})
					.catch((err) => {
						console.error("Chart export failed:", err);
						alert("Failed to export chart.");
					});
			});
		}

		const getBaseOption = () => ({
			backgroundColor: "transparent",
			tooltip: {
				confine: true,
				trigger: "item",
				formatter: (p) => {
					const v = Array.isArray(p.value) ? p.value : [];
					const zeV = window.formatPrecision(v[0]);
					const psV = window.formatPrecision(v[1]);
					return `<b>${p.seriesName}</b><br/>ze: ${zeV}<br/>Ps: ${psV}`;
				},
				backgroundColor: "#FFFFFF",
				borderColor: "#cccccc",
				borderWidth: 1,
				textStyle: { color: "#212121" },
			},
			xAxis: {
				type: "log",
				logBase: 10,
				min: 0.01,
				max: 100,
				axisLine: { lineStyle: { color: "#94a3b8" } },
				splitLine: { lineStyle: { color: "rgba(0, 0, 0, 0.1)", width: 2 } },
				minorSplitLine: {
					show: true,
					lineStyle: { color: "rgba(0, 0, 0, 0.05)" },
				},
			},
			yAxis: {
				type: "log",
				logBase: 10,
				min: 0.01,
				max: 10000,
				nameRotate: 90,
				axisLine: { lineStyle: { color: "#94a3b8" } },
				splitLine: { lineStyle: { color: "rgba(0, 0, 0, 0.1)", width: 2 } },
				minorSplitLine: {
					show: true,
					lineStyle: { color: "rgba(0, 0, 0, 0.05)" },
				},
			},
			series: [
				// Pre-define series structure
				{
					name: translations[currentLanguage].chart_tooltip_ref_curve,
					type: "line",
					showSymbol: false,
					lineStyle: {
						width: 2.5,
						color: BLUE,
						shadowColor: "rgba(0, 0, 0, 0.2)",
						shadowBlur: 5,
						shadowOffsetY: 2,
					},
					data: refPairs,
					zlevel: 1,
				},
				{
					name: "Log Data",
					type: "scatter",
					symbolSize: 8,
					itemStyle: {
						color: "#64748b",
						borderColor: "#ffffff",
						borderWidth: 1,
						opacity: 0.7,
					},
					data: [],
					zlevel: 2,
				},
				{
					name: "Current Calculation",
					type: "scatter",
					symbolSize: 12,
					itemStyle: {
						color: DANGER,
						borderColor: "#ffffff",
						borderWidth: 2,
						shadowColor: "rgba(0,0,0,0.3)",
						shadowBlur: 5,
					},
					data: [],
					zlevel: 3,

					// ==================================================
					// --- AWAL PERUBAHAN: Tambahkan blok 'label' ini ---
					// ==================================================
					label: {
						show: true, // Membuat label selalu terbuka
						position: "left",
						// position: function (params) {
						//   const zeValue = params.value[0];
						//   // Jika nilai ze > 30, pindah ke kiri agar tidak terpotong
						//   if (Number.isFinite(zeValue) && zeValue > 30) {
						//     return 'left';
						//   }
						//   // Jika tidak, tetap di kanan
						//   return 'right';
						// }, // Posisi label di sebelah kanan titik
						backgroundColor: "rgba(255, 255, 255, 0.9)", // Latar belakang putih transparan
						borderColor: "#999",
						borderWidth: 1,
						borderRadius: 4,
						padding: [4, 6],
						color: "#212121", // Warna teks
						fontSize: 10,
						fontWeight: "bold",
						formatter: (p) => {
							// p.value adalah array [ze, ps]
							const v = Array.isArray(p.value) ? p.value : [];
							const zeV = window.formatPrecision(v[0]);
							const psV = window.formatPrecision(v[1]);
							// Format dalam satu baris
							return `ze: ${zeV}, Ps: ${psV}`;
						},
					},
					// ==================================================
					// --- AKHIR PERUBAHAN ---
					// ==================================================
				},
			],
			media: [
				{
					query: { minWidth: 601 },
					option: {
						grid: { left: 72, right: 35, top: 80, bottom: 70 },
						title: {
							text: translations[currentLanguage].chart_title_main,
							subtext: translations[currentLanguage].chart_subtitle_main,
							left: "center",
							top: 10,
							textStyle: { color: "#212121", fontSize: 20 },
							subtextStyle: { color: "#424242" },
						},
						xAxis: {
							name: translations[currentLanguage].chart_x_axis_label,
							nameLocation: "middle",
							nameGap: 35,
							nameTextStyle: {
								color: "#212121",
								fontSize: 16,
								fontWeight: "bold",
							},
							axisLabel: {
								color: "#424242",
								formatter: (value) =>
									value.toLocaleString(document.documentElement.lang || "en"),
							},
						},
						yAxis: {
							name: translations[currentLanguage].chart_y_axis_label,
							nameLocation: "middle",
							nameGap: 50,
							nameTextStyle: {
								color: "#212121",
								fontSize: 16,
								fontWeight: "bold",
							},
							axisLabel: {
								color: "#424242",
								formatter: (value) =>
									value.toLocaleString(document.documentElement.lang || "en"),
							},
						},
					},
				},
				{
					query: { maxWidth: 600 },
					option: {
						grid: { left: 55, right: 20, top: 70, bottom: 60 },
						title: {
							text: translations[currentLanguage].chart_title_mobile,
							subtext: translations[currentLanguage].chart_subtitle_mobile,
							left: "center",
							top: 10,
							textStyle: { color: "#212121", fontSize: 16 },
							subtextStyle: { color: "#424242", fontSize: 12 },
						},
						xAxis: {
							name: translations[currentLanguage].chart_x_axis_label_mobile,
							nameLocation: "middle",
							nameGap: 30,
							nameTextStyle: {
								color: "#212121",
								fontSize: 14,
								fontWeight: "bold",
							},
							axisLabel: {
								color: "#424242",
								fontSize: 10,
								formatter: (value) =>
									value.toLocaleString(document.documentElement.lang || "en"),
							},
						},
						yAxis: {
							name: translations[currentLanguage].chart_y_axis_label_mobile,
							nameLocation: "middle",
							nameGap: 35,
							nameTextStyle: {
								color: "#212121",
								fontSize: 14,
								fontWeight: "bold",
							},
							axisLabel: {
								color: "#424242",
								fontSize: 10,
								formatter: (value) =>
									value.toLocaleString(document.documentElement.lang || "en"),
							},
						},
					},
				},
			],
		});

		// chart.setOption(getBaseOption());
		return {
			updateChart: function (currentCalcPoint, logDataPoints) {
				chart.setOption(getBaseOption());
				const materialSel = $("material");
				const selectedOption = materialSel
					? materialSel.options[materialSel.selectedIndex]
					: null;
				const compoundName =
					selectedOption && selectedOption.value
						? selectedOption.text
						: "Calculation";
				const currentSeriesData =
					currentCalcPoint &&
					Number.isFinite(currentCalcPoint.ze) &&
					Number.isFinite(currentCalcPoint.ps)
						? [[currentCalcPoint.ze, currentCalcPoint.ps]]
						: [];
				chart.setOption({
					series: [
						{
							name: translations[currentLanguage].chart_tooltip_ref_curve,
							data: refPairs,
						},
						{ name: "Log Data", data: logDataPoints || [] },
						{
							name: `${translations[currentLanguage].chart_tooltip_compound}: ${compoundName}`,
							data: currentSeriesData,
						},
					],
				});
			},
		};
	}

	// Overwrite the placeholder with the actual function implementation
	updatePsVsZeChart = function () {
		if (!chartController) return;

		// Helper untuk parsing angka yang sadar locale (Language-Aware)
		const safeParseFloat = (val) => {
			if (typeof val === "number") return val;
			if (!val) return NaN;
			let str = String(val).trim();

			// Cek bahasa yang sedang aktif
			if (typeof currentLanguage !== "undefined" && currentLanguage === "id") {
				// Format Indonesia: 1.000,50
				// Hapus titik (ribuan), ganti koma dengan titik (desimal)
				str = str.replace(/\./g, "").replace(",", ".");
			} else {
				// Format Inggris/Default: 1,000.50
				// Hapus koma (ribuan)
				str = str.replace(/,/g, "");
			}

			return parseFloat(str);
		};

		const pa = safeParseFloat($("pa").value);
		// if (isNaN(pa)) return; // Removed global check

		// 1. Dapatkan Data Log - Prioritaskan 'ps' tersimpan
		const logPoints = simulationLog
			.map((log) => {
				const ze = safeParseFloat(log.ze);
				let ps = safeParseFloat(log.ps);

				// Jika ps tidak valid di log, coba hitung dari po_crowl dan pa saat ini
				if (isNaN(ps)) {
					const po = safeParseFloat(log.po_crowl);
					if (!isNaN(po) && !isNaN(pa) && pa !== 0) {
						ps = po / pa;
					}
				}

				if (!isNaN(ze) && !isNaN(ps)) {
					return [ze, ps];
				}
				return null;
			})
			.filter(Boolean);

		// 2. Dapatkan Data Perhitungan Saat Ini - SELALU gunakan 'Po_crowl'.
		const currentZe = safeParseFloat($("Ze")?.value);
		let currentPs;
		if (!isNaN(currentZe) && !isNaN(pa) && pa > 0) {
			const currentPoCrowl = safeParseFloat($("Po_crowl")?.value); // Revisi: Hanya menggunakan Crowl
			if (!isNaN(currentPoCrowl)) {
				currentPs = currentPoCrowl / pa;
			}
		}
		const currentCalcPoint = { ze: currentZe, ps: currentPs };
		// 3. Perbarui grafik
		chartController.updateChart(currentCalcPoint, logPoints);
	};

	function initializeOverpressureChart() {
		const ctx = document.getElementById("overpressureChart");
		if (!ctx) return null;
		const chart = new Chart(ctx, {
			type: "line",
			data: {
				datasets: [
					{
						label: "Crowl",
						data: [],
						borderColor: "rgb(255, 99, 132)",
						borderWidth: 2.5,
						tension: 0.4,
						pointRadius: 3,
						pointHoverRadius: 5,
					},
					{
						label: "Alonso",
						data: [],
						borderColor: "rgb(54, 162, 235)",
						borderWidth: 2.5,
						tension: 0.4,
						pointRadius: 3,
						pointHoverRadius: 5,
					},
					{
						label: "Sadovski",
						data: [],
						borderColor: "rgb(75, 192, 192)",
						borderWidth: 2.5,
						tension: 0.4,
						pointRadius: 3,
						pointHoverRadius: 5,
					},
				],
			},
			options: {
				locale: document.documentElement.lang === "id" ? "id-ID" : "en-US",
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: "Overpressure vs Distance",
						font: { size: 20, weight: "bold" },
						padding: { top: 10, bottom: 20 },
					},
					legend: {
						display: true,
						position: "top",
						labels: { usePointStyle: true, pointStyle: "line" },
					},
				},
				scales: {
					x: {
						type: "linear",
						title: {
							display: true,
							text: "Distance [m]",
							font: { size: 14, weight: "500" },
						},
						grid: { drawOnChartArea: true, color: "rgba(0, 0, 0, 0.05)" },
					},
					y: {
						title: {
							display: true,
							text: "Overpressure [kPa]",
							font: { size: 14, weight: "500" },
						},
						grid: { drawOnChartArea: true, color: "rgba(0, 0, 0, 0.05)" },
					},
				},
			},
		});

		return {
			chartInstance: chart,
		};
	}

	function updateOverpressureChartFromLog() {
		if (
			!overpressureChartController ||
			!overpressureChartController.chartInstance
		)
			return;
		const chart = overpressureChartController.chartInstance;
		const msgEl = $("overpressureChartMsg");
		const canvasEl = $("overpressureChart");
		chart.options.plugins.title.text =
			translations[currentLanguage].chart_title_po_vs_dist;
		chart.options.scales.x.title.text =
			translations[currentLanguage].overpressure_chart_x_axis_label;
		chart.options.scales.y.title.text =
			translations[currentLanguage].overpressure_chart_y_axis_label;
		canvasEl.style.display = "block";
		msgEl.style.display = "none";

		if (simulationLog.length === 0) {
			chart.data.datasets.forEach((dataset) => {
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
		simulationLog.forEach((log) => {
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

	// FUNGSI BARU: Untuk menyorot baris pertama dari tabel log
	function highlightFirstRow() {
		const logTbody = $("logTbody");
		if (!logTbody) return;
		// Hapus sorotan yang sudah ada dari baris lain
		const currentlySelected = logTbody.querySelector(".selected-row");
		if (currentlySelected) {
			currentlySelected.classList.remove("selected-row");
		}
		// Tambahkan kelas sorotan ke baris data pertama di tabel
		const firstRow = logTbody.querySelector("tr:not(.log-placeholder)");
		if (firstRow) {
			firstRow.classList.add("selected-row");
		}
	}

	function updateEstimationPanels(
		PoCrowl,
		PoAlonso,
		PoSadovski,
		isAlonsoExtrapolated = false,
		assessmentDataFromArgs,
	) {
		let assessmentData = null;
		if (assessmentDataFromArgs !== undefined) {
			assessmentData = assessmentDataFromArgs;
		} else if (lastApiResults && lastApiResults.assessments) {
			assessmentData = lastApiResults.assessments;
		}

		const methods = { crowl: PoCrowl, alonso: PoAlonso, sadovski: PoSadovski };

		Object.entries(methods).forEach(([method, Po]) => {
			const isPoValid = Number.isFinite(Po);
			const assessment =
				assessmentData && assessmentData[method]
					? assessmentData[method]
					: null;

			const valPoEl = $(`val-Po-${method}`);
			const sevEl = $(`sev-${method}`);
			const structuralListEl = $(`structural-damage-${method}`);
			const equipmentListEl = $(`equipment-damage-${method}`);

			if (!valPoEl || !sevEl || !structuralListEl || !equipmentListEl) {
				console.error(`Missing elements for damage panel: ${method}`);
				return;
			}

			const impactCategoryNameKey =
				isPoValid && assessment && assessment.impactCategoryNameKey
					? assessment.impactCategoryNameKey
					: "awaiting_input";

			valPoEl.textContent = formatNumber(Po);

			sevEl.textContent = translateKey(impactCategoryNameKey);
			if (isPoValid && assessment) {
				sevEl.style.backgroundColor = assessment.impactColor || "var(--muted)";
				sevEl.style.color = assessment.impactTextColor || "#FFFFFF";
			} else {
				sevEl.style.backgroundColor = "var(--muted)";
				sevEl.style.color = "#FFFFFF";
			}

			if (!isPoValid || !assessment) {
				structuralListEl.innerHTML = `<li>${translateKey(
					"awaiting_input",
				)}</li>`;
				equipmentListEl.innerHTML = `<li>${translateKey(
					"awaiting_input",
				)}</li>`;
			} else {
				// Updated logic for structuralInfo
				let structuralHtml = (assessment.structuralInfo || [])
					.map((item) => {
						let description = translateKey(item.key);
						let formattedDescription = formatCitations(description);
						return `<li>${formattedDescription}</li>`;
					})
					.join("");
				structuralListEl.innerHTML =
					structuralHtml || `<li>${translateKey("damage_no_significant")}</li>`;

				// Updated logic for equipmentInfo
				if (assessment.equipmentInfo && assessment.equipmentInfo.key) {
					let description = translateKey(assessment.equipmentInfo.key);
					let formattedDescription = formatCitations(description);
					equipmentListEl.innerHTML = `<li>${formattedDescription}</li>`;
				} else {
					equipmentListEl.innerHTML = `<li>${translateKey(
						"equipment_no_significant",
					)}</li>`;
				}
			}

			const panelContentEl = $(`panel-damage-${method}`).querySelector(".pad");

			const existingWarnings = panelContentEl.querySelectorAll(
				".extrapolation-warning, .extrapolation-warning-crowl, .extrapolation-warning-sadovski",
			);

			existingWarnings.forEach((el) => el.remove());

			let warningKey = null;

			const zeValue = parseFloat($("Ze")?.value);

			if (
				method === "crowl" &&
				!isNaN(zeValue) &&
				(zeValue < 1 || zeValue > 100)
			) {
				warningKey = "crowl_warning";
			} else if (method === "alonso" && isAlonsoExtrapolated) {
				warningKey = "alonso_warning";
			} else if (
				method === "sadovski" &&
				!isNaN(zeValue) &&
				(zeValue <= 1 || zeValue > 15)
			) {
				warningKey = "sadovski_warning";
			}
			if (warningKey && isPoValid) {
				const poValueParagraph = valPoEl.parentElement;
				if (poValueParagraph) {
					const warningDiv = document.createElement("div");
					warningDiv.className = `extrapolation-warning extrapolation-warning-${method}`;
					warningDiv.style.cssText =
						"color: var(--danger); font-weight: bold; font-style: italic; font-size: 13px; margin: 4px 0 10px;";
					warningDiv.textContent = translateKey(warningKey);
					poValueParagraph.insertAdjacentElement("afterend", warningDiv);
				}
			}
		});
	}

	function updateInjuryPanels(
		PoCrowl,
		PoAlonso,
		PoSadovski,
		isAlonsoExtrapolated = false,
		assessmentDataFromArgs,
	) {
		let assessmentData = null;
		if (assessmentDataFromArgs !== undefined) {
			assessmentData = assessmentDataFromArgs;
		} else if (lastApiResults && lastApiResults.assessments) {
			assessmentData = lastApiResults.assessments;
		}

		const updateSinglePanel = (method, Po) => {
			const isPoValid = Number.isFinite(Po);
			const assessment =
				assessmentData && assessmentData[method]
					? assessmentData[method]
					: null;
			const injuryEffects = assessment ? assessment.injuryEffects : null;

			const valPoEl = $(`val-Po-${method}-inj`);
			const effectsListEl = $(`injury-effects-${method}`);
			const sevFootEl = $(`sev-injury-${method}`);

			if (!valPoEl || !effectsListEl || !sevFootEl) {
				console.error(`Missing elements for injury panel: ${method}`);
				return;
			}

			const injuryCategoryNameKey =
				isPoValid && assessment && assessment.injuryCategoryNameKey
					? assessment.injuryCategoryNameKey
					: "injury_cat_invalid";

			sevFootEl.textContent = translateKey(
				injuryCategoryNameKey,
				"injury_cat_invalid",
			);
			if (isPoValid && assessment) {
				sevFootEl.style.backgroundColor =
					assessment.injuryColor || "var(--muted)";
				sevFootEl.style.color = assessment.injuryTextColor || "#FFFFFF";
			} else {
				sevFootEl.style.backgroundColor = "var(--muted)";
				sevFootEl.style.color = "#FFFFFF";
			}

			valPoEl.textContent = formatNumber(Po);

			if (!isPoValid || !injuryEffects) {
				effectsListEl.innerHTML = `<li>${translateKey("awaiting_input")}</li>`;
			} else {
				let html = "";
				if (injuryEffects.primaryKey) {
					let text = translateKey(injuryEffects.primaryKey);
					html += `<li><strong>${translateKey(
						"primary_effects_label",
					)}</strong> ${formatCitations(text)}</li>`;
				}
				if (injuryEffects.secondaryKey) {
					let text = translateKey(injuryEffects.secondaryKey);
					html += `<li><strong>${translateKey(
						"secondary_tertiary_effects_label",
					)}</strong> ${formatCitations(text)}</li>`;
				}
				if (injuryEffects.conclusionKey) {
					let text = translateKey(injuryEffects.conclusionKey);
					html += `<li><strong>${translateKey(
						"conclusion_label",
					)}</strong> ${formatCitations(text)}</li>`;
				}
				effectsListEl.innerHTML =
					html || `<li>${translateKey("injury_no_significant_effects")}</li>`;
			}

			const panelContentEl = $(`panel-injury-${method}`).querySelector(".pad");
			const existingWarnings = panelContentEl.querySelectorAll(
				".extrapolation-warning, .extrapolation-warning-crowl-inj, .extrapolation-warning-sadovski-inj",
			);
			existingWarnings.forEach((el) => el.remove());
			let warningKey = null;
			const zeValue = parseFloat($("Ze")?.value);
			if (
				method === "crowl" &&
				!isNaN(zeValue) &&
				(zeValue < 1 || zeValue > 100)
			) {
				warningKey = "crowl_warning";
			} else if (method === "alonso" && isAlonsoExtrapolated) {
				warningKey = "alonso_warning";
			} else if (
				method === "sadovski" &&
				!isNaN(zeValue) &&
				(zeValue <= 1 || zeValue > 15)
			) {
				warningKey = "sadovski_warning";
			}
			if (warningKey && isPoValid) {
				const poValueParagraph = valPoEl.parentElement;
				if (poValueParagraph) {
					const warningDiv = document.createElement("div");
					warningDiv.className = `extrapolation-warning extrapolation-warning-${method}-inj`;
					warningDiv.style.cssText =
						"color: var(--danger); font-weight: bold; font-style: italic; font-size: 13px; margin: 4px 0 10px;";
					warningDiv.textContent = translateKey(warningKey);
					poValueParagraph.insertAdjacentElement("afterend", warningDiv);
				}
			}
		};

		updateSinglePanel("crowl", PoCrowl);
		updateSinglePanel("alonso", PoAlonso);
		updateSinglePanel("sadovski", PoSadovski);
	} // Akhir dari updateInjuryPanels
	// Ini adalah fungsi BARU di dalam file HTML Anda (atau di file .js eksternal)
	// Fungsi ini TIDAK berisi formula.
	async function calculateValues(isInitialLoad = false) {
		// Ambil referensi ke tombol simpan
		const btnSaveFloat = $("btnSaveResultFloat");
		const btnAddResult = $("btnAddResult");

		// --- 1. Bagian validasi input (tetap di frontend) ---
		fields.forEach((id) => $(id)?.classList.remove("input-error"));
		let hasError = false;
		const getFloat = (id) => {
			const el = $(id);
			if (!el) return NaN;
			// Ganti koma dengan titik untuk parsing standar JS
			const normalizedValue = el.value.replace(/\./g, "").replace(/,/g, ".");
			// Cek jika formatnya sebenarnya format Inggris (titik sebagai desimal) yang mungkin terinput
			// Tetapi karena kita normalisasi, jika user input 1.000 (seribu ID) -> 1000.
			// Jika user input 1,000 (satu koma nol ID) -> 1.000 -> 1.
			// Strategi:
			// 1. Cek bahasa saat ini.
			// 2. Jika ID, hapus titik (ribuan), ganti koma jadi titik (desimal).
			// 3. Jika EN, hapus koma (ribuan), biarkan titik (desimal).

			let valStr = el.value;
			if (currentLanguage === "id") {
				// Hapus titik ribuan, ganti koma desimal jadi titik
				valStr = valStr.replace(/\./g, "").replace(",", ".");
			} else {
				// Hapus koma ribuan
				valStr = valStr.replace(/,/g, "");
			}

			const val = parseFloat(valStr);

			if (isNaN(val)) {
				// Only add error class if not initial load
				if (!isInitialLoad) el.classList.add("input-error");
				hasError = true;
			}
			return val;
		};
		let [rho, vol, dh, eta, e_tnt, dist, pa] = fields.map(getFloat);

		// Fungsi untuk reset (tetap di frontend)
		const resetAll = (msgKey) => {
			[
				"W_mass",
				"E_total",
				"W_tnt",
				"Ze",
				"Ps",
				"Po_crowl",
				"Po_alonso",
				"Po_sadovski",
			].forEach((id) => ($(id).value = ""));
			lastApiResults = null; // <-- TAMBAHKAN RESET INI
			showStatusMessage(msgKey, true);
			updateEstimationPanels(NaN, NaN, NaN);
			updateInjuryPanels(NaN, NaN, NaN);
			updateFloatingPanelOutputs(NaN, NaN, NaN, false);
			updatePsVsZeChart(); // Clear chart
			if (btnSaveFloat) btnSaveFloat.disabled = true;
			if (btnAddResult) btnAddResult.disabled = true;
		};

		let errorMsgKey = "status_error_range";

		// Override eta for AN (UI shows 0.346 but calculation uses 1)
		if ($("material")?.value === "AN") {
			// Jika AN, hitung fAN = dh / e_tnt
			if (dh > 0 && e_tnt > 0) {
				const calculatedFan = dh / e_tnt;
				const etaInput = $("eta");
				if (etaInput) {
					etaInput.value = window.formatNumber(calculatedFan);
					// Hapus error class jika ada sebelumnya (karena mungkin sekarang valid)
					etaInput.classList.remove("input-error");
				}

				// Validasi rentang 0.3 - 0.55
				if (calculatedFan < 0.3 || calculatedFan > 0.55) {
					if (!isInitialLoad && etaInput) {
						etaInput.classList.add("input-error");
					}
					hasError = true;
					errorMsgKey = "error_fan_range";
				}
			}
			eta = 1;
		} else {
			// Validasi generic untuk material lain
			if (!(eta >= 0 && eta <= 1)) {
				if (!isInitialLoad) $("eta").classList.add("input-error");
				hasError = true;
			}
		}

		if (!(e_tnt > 0)) {
			if (!isInitialLoad) $("e_tnt").classList.add("input-error");
			hasError = true;
		}

		if (hasError) return resetAll(errorMsgKey);

		// --- 2. Panggil API (Ini bagian yang berubah total) ---
		try {
			// Tampilkan status loading (opsional)
			showStatusMessage("Menghitung di server...", false);

			// Kumpulkan data untuk dikirim ke API
			const inputData = { rho, vol, dh, eta, e_tnt, dist, pa };

			// Panggil API Anda!
			const response = await fetch("/explosion/tnt-equivalence", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(inputData),
			});

			// Ambil hasil JSON dari server
			const results = await response.json();

			// Jika server mengembalikan error (misal: input tidak valid)
			if (!response.ok) {
				lastApiResults = null; // <-- Reset jika error
				throw new Error(results.message || "Error tidak diketahui dari server");
			}

			// Simpan hasil *sebelum* menampilkannya
			lastApiResults = results; // <-- Simpan hasil yang valid

			// --- 3. Tampilkan hasil dari server (Frontend hanya menampilkan) ---
			$("W_mass").value = formatNumber(results.W_mass);
			$("E_total").value = formatNumber(results.E_total);
			$("W_tnt").value = formatNumber(results.W_tnt);
			$("Ze").value = formatNumber(results.Ze);
			$("Ps").value = formatNumber(results.Ps);
			$("Po_crowl").value = formatNumber(results.Po_crowl);
			$("Po_alonso").value = formatNumber(results.Po_alonso);
			$("Po_sadovski").value = formatNumber(results.Po_sadovski);

			// --- 4. Panggil fungsi UI Anda yang lain (TIDAK BERUBAH) ---
			updateEstimationPanels(
				results.Po_crowl,
				results.Po_alonso,
				results.Po_sadovski,
				results.isAlonsoExtrapolated,
				results.assessments,
			);
			updateInjuryPanels(
				results.Po_crowl,
				results.Po_alonso,
				results.Po_sadovski,
				results.isAlonsoExtrapolated,
				results.assessments,
			);
			updateFloatingPanelOutputs(
				results.Po_crowl,
				results.Po_alonso,
				results.Po_sadovski,
				true,
			);
			updatePsVsZeChart();

			showStatusMessage("status_success");
			if (btnSaveFloat) btnSaveFloat.disabled = false;
			if (btnAddResult) btnAddResult.disabled = false;

			if (!isInitialLoad) {
				saveFormStateToLocalStorage();
			}
		} catch (error) {
			console.error("Fetch Error:", error);
			resetAll("status_error_invalid_ze"); // Gunakan pesan error yang relevan
			showStatusMessage(error.message, true); // Tampilkan pesan error dari server
		}
	}

	function compute(isInitialLoad = false) {
		const paInput = $("pa");
		if (!paInput) return; // Cegah error pada halaman tanpa simulator
		if (paInput.value === "" || isNaN(parseFloat(paInput.value)))
			paInput.value = "101.325";
		calculateValues(isInitialLoad);
	}

	function renderEquation(material) {
		const box = $("eq-text");
		if (!box) return;
		if (!material || !eqMap[material]) {
			box.innerHTML = translations[currentLanguage].eq_panel_placeholder;
			return;
		}
		box.innerHTML = eqMap[material]
			.map(
				(item) =>
					`<div class="rxn"><small>${
						translations[currentLanguage][item.labelKey]
					}</small><div class="rxn-eq">${item.eq}</div></div>`,
			)
			.join("");
	}

	function saveStateToURL() {
		try {
			const params = new URLSearchParams();
			inputFields.forEach((id) => {
				const el = $(id);
				if (el && el.value !== undefined && el.value !== "")
					params.set(id, el.value);
			});
			const q = params.toString();
			const url = q
				? `${window.location.pathname}?${q}`
				: window.location.pathname;
			window.history.replaceState({}, "", url);
		} catch (error) {
			console.warn("Could not save state to URL:", error.message);
		}
	}

	function loadStateFromURL() {
		if (!$("material")) return;
		let stateLoaded = false;
		try {
			const savedStateJSON = localStorage.getItem("explosionSimState");
			if (savedStateJSON) {
				const savedState = JSON.parse(savedStateJSON);
				inputFields.forEach((id) => {
					if (savedState[id] !== undefined) {
						// Skip restoring these fields to keep them empty by default
						const defaultEmptyFields = [
							"vol",
							"dist",
							"material",
							"rho",
							"dh",
							"eta",
							"e_tnt",
						];
						if (defaultEmptyFields.includes(id)) return;
						const el = $(id);
						if (el) {
							// Format nilai yang dimuat agar sesuai dengan locale saat ini
							const val = parseFloat(savedState[id]);
							if (!isNaN(val)) {
								el.value = window.formatNumber(val);
							} else {
								el.value = savedState[id];
							}
						}
					}
				});
				stateLoaded = true;
			}
		} catch (error) {
			console.error("Gagal memuat state dari localStorage:", error);
			localStorage.removeItem("explosionSimState");
		}

		// --- AWAL BAGIAN YANG DIPERBAIKI ---
		// Jika tidak ada state tersimpan (pengguna baru), muat default Beirut
		if (!stateLoaded && simulationLog.length > 0) {
			const firstLog = simulationLog[0]; // Data Beirut node 1
			const materialSelect = $("material");
			// Temukan nilai <option> yang sesuai dengan singkatan material
			const materialValue = Array.from(materialSelect.options).find(
				(opt) =>
					(materialAbbreviationMap[opt.text] || opt.value) ===
					firstLog.material,
			)?.value;
			if (materialValue) {
				// We no longer set materialSelect.value here to keep "— Select —" as default
				// Also keeping property fields empty
				$("vol").value = "";
				$("dist").value = "";
				$("rho").value = "";
				$("dh").value = "";
				$("eta").value = "";
				$("e_tnt").value = "";
			}
		}
		// --- AKHIR BAGIAN YANG DIPERBAIKI ---

		renderEquation($("material").value);
		// Panggil compute HANYA SEKALI di akhir, setelah semua nilai form diatur
		compute(true);
		syncFloatingPanelInputs();
	}

	function renderLogTable() {
		const logTbody = $("logTbody");
		if (!logTbody) return;

		logTbody.innerHTML = "";

		if (simulationLog.length === 0) {
			logTbody.innerHTML = `<tr class="log-placeholder"><td colspan="18">${translations[currentLanguage].log_placeholder}</td></tr>`;
			return;
		}

		simulationLog.forEach((log, index) => {
			const row = document.createElement("tr");
			if (log.isNew) {
				row.classList.add("new-row-animation");
				delete log.isNew;
			}
			row.innerHTML = `
                <td data-label="${
									translations[currentLanguage].log_col_node
								}">${index + 1}</td>
                <td data-label="${
									translations[currentLanguage].log_col_material
								}">${log.material}</td>
                <td data-label="ηE">${formatNumber(log.eta)}</td>
                <td data-label="ETNT (kJ/kg)">${formatNumber(log.e_tnt)}</td>
                <td data-label="ρ (kg/m³)">${formatNumber(log.rho)}</td>
                <td data-label="ΔHexp (kJ/kg)">${formatNumber(log.dh)}</td>
                <td data-label="${
									translations[currentLanguage].log_col_volume
								} (m³)">${formatNumber(log.vol)}</td>
                <td data-label="${
									translations[currentLanguage].log_col_distance
								} (m)">${formatNumber(log.dist)}</td>
                <td data-label="WTNT (kg)">${formatNumber(log.w_tnt)}</td>
                <td data-label="ze">${formatNumber(log.ze)}</td>
                <td data-label="Ps">${formatNumber(log.ps)}</td>
                <td data-label="Crowl (kPa)">${formatNumber(log.po_crowl)}</td>
                <td data-label="Alonso (kPa)">${formatNumber(log.po_alonso)}</td>
                <td data-label="Sadovski (kPa)">${formatNumber(log.po_sadovski)}</td>
                <td data-label="Lat">${formatNumber(log.lat, 6)}</td>
                <td data-label="Lon">${formatNumber(log.lon, 6)}</td>
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
			if (simulationLog.length > 0) {
				localStorage.setItem("explosionSimLog", JSON.stringify(simulationLog));
			} else {
				localStorage.removeItem("explosionSimLog");
			}
		} catch (e) {
			console.warn("Could not save simulation log to local storage:", e);
		}
	}

	function loadLog() {
		const savedLog = localStorage.getItem("explosionSimLog");
		if (savedLog) {
			try {
				const parsedLog = JSON.parse(savedLog);
				if (Array.isArray(parsedLog) && parsedLog.length > 0) {
					simulationLog = parsedLog;
					return;
				}
			} catch (e) {
				console.error("Failed to load log from local storage:", e);
			}
		}
		// Fallback to the default scenario (Beirut)
		simulationLog = [...simulationScenarios.beirut.data];
	}
	const toTopBtn = $("toTop");
	if (toTopBtn) {
		window.addEventListener("scroll", () => {
			if (window.scrollY > 200) {
				toTopBtn.classList.add("show");
			} else {
				toTopBtn.classList.remove("show");
			}
		});
	}

	const dropdown = document.querySelector(".dropdown-menu");
	// Pastikan elemen dropdown ada sebelum menambahkan event listener
	if (dropdown) {
		const dropdownToggle = dropdown.querySelector(".dropdown-toggle");
		// Event listener untuk tombol menu
		if (dropdownToggle) {
			dropdownToggle.addEventListener("click", (event) => {
				// Mencegah event klik menyebar ke elemen lain
				event.stopPropagation();
				// Toggle class 'is-active' untuk menampilkan atau menyembunyikan menu
				dropdown.classList.toggle("is-active");
			});
		}
		// Event listener pada dokumen untuk menutup menu saat klik di luar area menu
		document.addEventListener("click", (event) => {
			// Cek jika menu sedang aktif dan klik terjadi di luar area '.dropdown-menu'
			if (
				dropdown.classList.contains("is-active") &&
				!dropdown.contains(event.target)
			) {
				dropdown.classList.remove("is-active");
			}
		});
	}

	function setupFloatingPanel() {
		const floatInputs = $("floatPanelInputs");
		const floatOutputs = $("floatPanelOutputs");
		const lang = translations[currentLanguage];
		floatInputs.innerHTML = `
          <div class="floating-group material">
            <label for="float_material" class="label">${lang.label_select_material}</label>
            <select id="float_material"></select>
          </div>
          <div class="floating-group volume">
            <label for="float_vol" class="label">${lang.label_volume}</label>
            <input id="float_vol" type="text" data-type="number" min="0" step="any" placeholder="e.g., ${window.formatNumber(12.5)}" />
          </div>
          <div class="floating-group distance">
            <label for="float_dist" class="label">${lang.label_distance}</label>
            <input id="float_dist" type="text" data-type="number" min="0" step="any" placeholder="e.g., ${window.formatNumber(150)}" />
          </div>
        `;
		floatOutputs.innerHTML = `
            <span class="label">${lang.float_overpressure_label}</span>
            <div class="output-values">
                <div class="floating-output-col"><span>Crowl</span><span id="float_po_crowl">—</span></div>
                <div class="floating-output-col"><span>Alonso</span><span id="float_po_alonso">—</span></div>
                <div class="floating-output-col"><span>Sadovski</span><span id="float_po_sadovski">—</span></div>
            </div>
            <div style="margin-top: 12px;">
                <button class="btn" id="btnSaveResultFloat" disabled style="width: 100%;">${lang.btn_add_result}</button>
            </div>
        `;
		setupNumberInputs();

		const originalSelect = $("material");
		const floatSelect = $("float_material");
		floatSelect.innerHTML = originalSelect.innerHTML;
		const syncValues = (source, target) => {
			if (source.value !== target.value) {
				target.value = source.value;
				const changeEvent = new Event("change", { bubbles: true });
				const inputEvent = new Event("input", { bubbles: true });
				target.dispatchEvent(changeEvent);
				target.dispatchEvent(inputEvent);
			}
		};

		["material", "vol", "dist"].forEach((id) => {
			const original = $(id);
			const float = $(`float_${id}`);
			if (original && float) {
				original.addEventListener("input", () => {
					if (float.value !== original.value) float.value = original.value;
				});
				original.addEventListener("change", () => {
					if (float.value !== original.value) float.value = original.value;
				});
				float.addEventListener("input", () => syncValues(float, original));
				float.addEventListener("change", () => syncValues(float, original));
			}
		});
	}

	function syncFloatingPanelInputs() {
		const floatMat = $("float_material");
		const mat = $("material");
		if (floatMat && mat) floatMat.value = mat.value;

		const floatVol = $("float_vol");
		const vol = $("vol");
		if (floatVol && vol) floatVol.value = vol.value;

		const floatDist = $("float_dist");
		const dist = $("dist");
		if (floatDist && dist) floatDist.value = dist.value;
	}

	function updateFloatingPanelOutputs(crowl, alonso, sadovski, enabled) {
		const floatCrowl = $("float_po_crowl");
		const floatAlonso = $("float_po_alonso");
		const floatSadovski = $("float_po_sadovski");
		const btnSaveFloat = $("btnSaveResultFloat");

		if (floatCrowl) floatCrowl.textContent = formatNumber(crowl);
		if (floatAlonso) floatAlonso.textContent = formatNumber(alonso);
		if (floatSadovski) floatSadovski.textContent = formatNumber(sadovski);
		if (btnSaveFloat) btnSaveFloat.disabled = !enabled;
	}

	function makeDraggable(panel, handle) {
		if (!panel || !handle) return;
		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		let isDragging = false;

		const dragStart = (e) => {
			if (panel.classList.contains("collapsed")) return;
			isDragging = true;
			panel.style.transition = "none";
			const rect = panel.getBoundingClientRect();
			panel.style.width = rect.width + "px";
			panel.style.left = rect.left + "px";
			panel.style.transform = "none";
			let currentEvent = e.type.startsWith("touch") ? e.touches[0] : e;
			pos3 = currentEvent.clientX;
			pos4 = currentEvent.clientY;
			document.addEventListener("mouseup", dragEnd);
			document.addEventListener("mousemove", elementDrag);
			document.addEventListener("touchend", dragEnd);
			document.addEventListener("touchmove", elementDrag, { passive: false });
			document.body.classList.add("dragging");
		};

		handle.addEventListener("mousedown", dragStart);
		// BUG FIX: Pindahkan event listener 'touchstart' ke luar dari fungsi 'dragStart'
		// untuk mencegah penambahan listener berulang kali (memory leak).
		handle.addEventListener("touchstart", dragStart, { passive: false });

		function elementDrag(e) {
			if (!isDragging) return;
			if (e.type === "touchmove") e.preventDefault();
			let currentEvent = e.type.startsWith("touch") ? e.touches[0] : e;
			if (!currentEvent.clientX) return;
			pos1 = pos3 - currentEvent.clientX;
			pos2 = pos4 - currentEvent.clientY;
			pos3 = currentEvent.clientX;
			pos4 = currentEvent.clientY;
			panel.style.top = panel.offsetTop - pos2 + "px";
			panel.style.left = panel.offsetLeft - pos1 + "px";
			panel.style.bottom = "auto";
		}

		function dragEnd() {
			if (!isDragging) return;
			isDragging = false;
			panel.style.transition = "";
			panel.style.width = ""; // Reset width to be responsive
			document.removeEventListener("mouseup", dragEnd);
			document.removeEventListener("mousemove", elementDrag);
			document.removeEventListener("touchend", dragEnd);
			document.removeEventListener("touchmove", elementDrag);
			document.body.classList.remove("dragging");
		}
	}

	const floatingPanel = $("floatingControlPanel");
	if (floatingPanel) {
		makeDraggable(
			floatingPanel,
			floatingPanel.querySelector(".floating-panel-header"),
		);
	}
	// --- FINAL ROBUSTNESS CHECK FOR CHART LIBRARIES ---
	if (typeof echarts !== "undefined") {
		chartController = initializeChart();
	} else {
		const chartContainer = $("chart");
		if (chartContainer) {
			console.error("ECharts library failed to load.");
			chartContainer.innerHTML =
				'<p style="padding: 20px; text-align: center; color: var(--danger);">Failed to load Ps vs ze chart library. Please check your internet connection.</p>';
		}
	}

	if (typeof Chart !== "undefined") {
		overpressureChartController = initializeOverpressureChart();
	} else {
		const overpressureChartContainer = $("overpressureChart");
		if (overpressureChartContainer) {
			console.error("Chart.js library failed to load.");
			overpressureChartContainer.parentElement.innerHTML =
				'<p style="padding: 20px; text-align: center; color: var(--danger);">Failed to load Po vs Distance chart library. Please check your internet connection.</p>';
		}
	}

	let isInitializing = true; // Tambahkan penanda (flag) global ini

	const debouncedCompute = debounce(() => compute(false), 250);

	inputFields.forEach((id) => {
		const el = $(id);
		if (el && el.tagName === "INPUT") {
			el.addEventListener("input", () => {
				// Tambahkan pengecekan ini:
				// Hanya jalankan kalkulasi jika proses inisialisasi sudah selesai.
				if (!isInitializing) {
					debouncedCompute();
					syncFloatingPanelInputs();
				}
			});
		}
	});

	const materialSel = $("material");
	if (materialSel) {
		materialSel.addEventListener("change", () => {
			// Disable the default "— Select —" option if a valid material is selected
			if (materialSel.value !== "") {
				const defaultOption = materialSel.querySelector('option[value=""]');
				if (defaultOption) {
					defaultOption.disabled = true;
				}
			}

			const p = presets[materialSel.value];
			if (p) Object.keys(p).forEach((key) => ($(key).value = p[key]));

			// Logic for AN and H2 specific behavior
			const etaInput = $("eta");
			const etaNote = $("eta_note");
			const etaLabel = document.querySelector('label[for="eta"]');
			const logHeaderEta = $("log_header_eta");

			// New elements to update
			const dhLabel = document.querySelector('label[for="dh"]');
			const logHeaderDh = $("log_header_dh");
			const paramTotalEnergy = document.querySelector(
				'[data-lang-key="param_total_energy"]',
			);

			if (materialSel.value === "AN") {
				if (etaLabel) {
					etaLabel.innerHTML = "f<sub>AN</sub>";
				}
				if (logHeaderEta) {
					logHeaderEta.textContent = "fAN";
				}
				if (dhLabel) {
					dhLabel.innerHTML = "ΔH<sub>decomp</sub>";
				}
				if (logHeaderDh) {
					logHeaderDh.innerHTML = "ΔH<sub>decomp</sub>";
				}
				if (paramTotalEnergy) {
					paramTotalEnergy.textContent = translateKey("param_effective_energy");
				}

				if (etaInput) {
					etaInput.value = window.formatNumber(0.346);
					etaInput.disabled = true;
				}
				if (etaNote) {
					etaNote.setAttribute(
						"data-lang-key",
						"label_explosion_efficiency_note",
					);
					etaNote.textContent = translateKey(
						"label_explosion_efficiency_note",
						"not used for AN",
					);
					etaNote.style.display = "block";
				}
			} else if (materialSel.value === "H2") {
				if (etaLabel) {
					etaLabel.innerHTML = translateKey("label_explosion_efficiency");
				}
				if (logHeaderEta) {
					logHeaderEta.textContent = "ηE";
				}
				// Revert labels for H2
				if (dhLabel) {
					dhLabel.innerHTML = "ΔH<sub>explosion</sub>";
				}
				if (logHeaderDh) {
					logHeaderDh.innerHTML = "ΔH<sub>exp</sub>";
				}
				if (paramTotalEnergy) {
					paramTotalEnergy.textContent = translateKey("param_total_energy");
				}

				if (etaInput) {
					etaInput.disabled = false;
				}
				if (etaNote) {
					etaNote.setAttribute(
						"data-lang-key",
						"label_explosion_efficiency_note_h2",
					);
					etaNote.textContent = translateKey(
						"label_explosion_efficiency_note_h2",
						"range from 1 % to 10 %",
					);
					etaNote.style.display = "block";
				}
			} else {
				if (etaLabel) {
					etaLabel.innerHTML = translateKey("label_explosion_efficiency");
				}
				if (logHeaderEta) {
					logHeaderEta.textContent = "ηE";
				}
				// Revert labels for others
				if (dhLabel) {
					dhLabel.innerHTML = "ΔH<sub>explosion</sub>";
				}
				if (logHeaderDh) {
					logHeaderDh.innerHTML = "ΔH<sub>exp</sub>";
				}
				if (paramTotalEnergy) {
					paramTotalEnergy.textContent = translateKey("param_total_energy");
				}

				if (etaInput) {
					etaInput.disabled = false;
				}
				if (etaNote) {
					etaNote.setAttribute(
						"data-lang-key",
						"label_explosion_efficiency_note_h2",
					);
					etaNote.textContent = translateKey(
						"label_explosion_efficiency_note_h2",
						"range from 1 % to 10 %",
					);
					etaNote.style.display = "block";
				}
			}

			renderEquation(materialSel.value);
			showStatusMessage("status_loaded_defaults");
			compute(false);
			syncFloatingPanelInputs();
		});

		materialSel.addEventListener("init-load", () => {
			const p = presets[materialSel.value];
			if (p) Object.keys(p).forEach((key) => ($(key).value = p[key]));
			renderEquation(materialSel.value);
			compute(true);
		});
	}

	const saveAction = () => {
		const btnSaveFloat = $("btnSaveResultFloat");
		const btnAddResult = $("btnAddResult");
		if (btnSaveFloat.disabled && btnAddResult.disabled) return;

		// Helper to normalize input string to standard number string
		const getNormalizedVal = (id) => {
			const el = $(id);
			if (!el) return "";
			let valStr = el.value;
			if (!valStr) return "";
			if (currentLanguage === "id") {
				// ID: 1.000,5 -> 1000.5
				return valStr.replace(/\./g, "").replace(",", ".");
			} else {
				// EN: 1,000.5 -> 1000.5
				return valStr.replace(/,/g, "");
			}
		};

		// --- AWAL PERBAIKAN ---
		let newLat, newLon;

		// Cek status CRS peta SAAT INI (via variabel global 'window.map')
		if (window.map && window.map.options.crs === L.CRS.Cartesian) {
			// Jika peta sedang dalam mode Kartesius, paksa koordinat baru menjadi "null"
			newLat = "null";
			newLon = "null";
		} else {
			// Jika tidak, gunakan nilai geo dari input field
			newLat = $("mapLat").value;
			newLon = $("mapLon").value;
		}
		// --- AKHIR PERBAIKAN ---
		const selectedOption = materialSel.options[materialSel.selectedIndex];
		const newLogEntry = {
			material:
				materialAbbreviationMap[selectedOption.text] || selectedOption.text,
			eta: getNormalizedVal("eta"),
			e_tnt: getNormalizedVal("e_tnt"),
			rho: getNormalizedVal("rho"),
			dh: getNormalizedVal("dh"),
			vol: getNormalizedVal("vol"),
			dist: getNormalizedVal("dist"),
			w_tnt: getNormalizedVal("W_tnt"),
			ze: getNormalizedVal("Ze"),
			ps: getNormalizedVal("Ps"),
			po_crowl: getNormalizedVal("Po_crowl") || "N/A",
			po_alonso: getNormalizedVal("Po_alonso") || "N/A",
			po_sadovski: getNormalizedVal("Po_sadovski") || "N/A",
			lat: newLat,
			lon: newLon,
			poModel: $("poModelSelect").value,
			isNew: true,
		};

		if (JSON.stringify(simulationLog) === JSON.stringify(simulationScenarios)) {
			simulationLog = [];
		}

		simulationLog.unshift(newLogEntry);

		if (simulationLog.length > 10) {
			simulationLog.pop();
		}

		renderLogTable();
		updateOverpressureChartFromLog();
		saveLogToLocalStorage();
		showStatusMessage("status_log_saved"); // Memberikan umpan balik yang jelas kepada pengguna
	};

	const btnAddResult = $("btnAddResult");
	if (btnAddResult) btnAddResult.addEventListener("click", saveAction);

	// Atur event listener untuk panel melayang di sini untuk mencegah penambahan ganda.
	// Menggunakan delegasi event, sehingga listener tetap berfungsi bahkan jika tombol di dalamnya dibuat ulang.
	const floatingPanelForEvent = $("floatingControlPanel");
	if (floatingPanelForEvent) {
		floatingPanelForEvent.addEventListener("click", (event) => {
			if (event.target && event.target.id === "btnSaveResultFloat") {
				saveAction();
			}
		});
	}

	const logTbody = $("logTbody");
	// *** MODIFICATION START ***
	// Fungsi ini akan dipanggil oleh handleLogRowClick untuk menampilkan popup.
	function showMapPopupForLog(logData) {
		// Memastikan peta dan fungsi-fungsi yang diperlukan tersedia di objek window.
		// Variabel-variabel ini diekspos oleh skrip peta (di blok window.load).
		if (
			typeof window.map === "undefined" ||
			typeof window.destPoint === "undefined"
		) {
			console.error(
				"Objek peta (map) atau fungsi destPoint tidak tersedia. Pastikan skrip peta telah dimuat.",
			);
			return;
		}

		const lat = parseFloat(logData.lat);
		const lon = parseFloat(logData.lon);
		const radius = parseFloat(logData.dist);

		if (isNaN(lat) || isNaN(lon)) {
			// KASUS 1: DATA LAT/LON NULL
			// Panggil fungsi global untuk beralih ke peta Kartesius.
			if (typeof window.switchToCartesianMap === "function") {
				window.switchToCartesianMap();
			}
			// Kita tidak bisa menampilkan popup geo, jadi kita berhenti di sini.
			return;
		}

		// KASUS 2: DATA LAT/LON VALID
		// Panggil fungsi global untuk memastikan kita berada di peta geografis.
		if (typeof window.switchToGeoMap === "function") {
			// Berikan koordinat baru agar peta bisa berpusat di sana.
			window.switchToGeoMap([lat, lon]);
		}

		// --- AKHIR PERUBAHAN LOGIKA ---
		if (isNaN(radius)) return;
		// Pilih nilai Po berdasarkan model yang aktif di peta.
		const poModelSelect = $("poModelSelect");
		const selectedModel = poModelSelect ? poModelSelect.value : "crowl";
		const modelKeyMap = {
			crowl: "po_crowl",
			alonso: "po_alonso",
			sadovski: "po_sadovski",
		};
		const poKey = modelKeyMap[selectedModel];
		const poValue = formatNumber(logData[poKey]);

		// Konten popup.
		const popupContent = `<b>r = ${radius} m</b><br>Po: ${poValue}`;

		// Hitung posisi untuk popup di tepi lingkaran (misalnya, arah timur laut).
		const popupLatLng = window.destPoint(lat, lon, radius, 45); // 45 derajat bearing

		// Buka popup di peta. Leaflet akan menangani penutupan popup yang sudah ada.
		window.map.openPopup(popupContent, popupLatLng);
	}

	// Fungsi yang diperbarui untuk menangani klik pada baris log
	function handleLogRowClick(event) {
		const row = event.target.closest("tr");
		// Abaikan klik jika bukan pada baris data atau jika pada tombol hapus
		if (
			!row ||
			row.classList.contains("log-placeholder") ||
			event.target.closest(".btn-delete")
		) {
			return;
		}

		const deleteButton = row.querySelector(".btn-delete");
		if (!deleteButton) return;

		const index = parseInt(deleteButton.dataset.index, 10);
		if (isNaN(index) || !simulationLog[index]) return;

		// 1. Ambil data dari array simulationLog berdasarkan indeks
		const logData = simulationLog[index];
		// *** NEW FEATURE: Panggil fungsi untuk menampilkan popup di peta. ***
		showMapPopupForLog(logData);

		// 2. Perbarui nilai pada form input utama
		// Gunakan window.formatNumber agar sesuai dengan format lokal (misal: koma untuk ID)
		$("vol").value = window.formatNumber(logData.vol);
		$("dist").value = window.formatNumber(logData.dist);
		$("rho").value = window.formatNumber(logData.rho);
		$("dh").value = window.formatNumber(logData.dh);
		$("eta").value = window.formatNumber(logData.eta);
		$("e_tnt").value = window.formatNumber(logData.e_tnt);

		// Mengubah material sedikit lebih rumit karena perlu memicu event 'change'
		const materialSelect = $("material");

		// Normalisasi material dari log jika perlu (khusus H2)
		let targetMaterial = logData.material;
		if (targetMaterial === "H₂") targetMaterial = "H2";

		// Temukan nilai <option> yang sesuai dengan singkatan material (misal: 'AN')
		const materialValue = Array.from(materialSelect.options).find(
			(opt) =>
				(materialAbbreviationMap[opt.text] || opt.value) === targetMaterial,
		)?.value;

		if (materialValue && materialSelect.value !== materialValue) {
			materialSelect.value = materialValue;
			// 3. Memicu event 'change' secara manual untuk menjalankan semua logika terkait
			materialSelect.dispatchEvent(new Event("change"));
		} else {
			// Jika material tidak berubah, panggil `compute()` secara manual
			compute(true);
		}
		// SINKRONKAN PANEL MELAYANG
		syncFloatingPanelInputs();

		// 4. Atur sorotan visual pada baris yang dipilih
		document
			.querySelectorAll("#logTable tbody tr.selected-row")
			.forEach((selectedRow) => {
				selectedRow.classList.remove("selected-row");
			});
		row.classList.add("selected-row");

		// 5. Beri notifikasi kepada pengguna
		showStatusMessage(
			`Data dari log #${index + 1} telah dimuat ke kalkulator.`,
		);
	}
	// *** MODIFICATION END ***
	// Tambahkan event listener ke <tbody>
	if (logTbody) {
		logTbody.addEventListener("click", handleLogRowClick);
		logTbody.addEventListener("click", (event) => {
			const deleteButton = event.target.closest(".btn-delete");
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
	}

	const btnSortLog = $("btnSortLog");
	if (btnSortLog) {
		btnSortLog.addEventListener("click", () => {
			if (simulationLog.length > 1) {
				simulationLog.sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
				renderLogTable();
				updateOverpressureChartFromLog();
				saveLogToLocalStorage();
			}
		});
	}

	const btnExportLog = $("btnExportLog");
	const btnImportLog = $("btnImportLog");
	const importFileInput = $("importFile");

	if (btnExportLog) {
		btnExportLog.addEventListener("click", () => {
			if (simulationLog.length === 0) {
				showStatusMessage("status_log_empty_export", true);
				return;
			}

			const headers = Object.keys(simulationLog[0]).filter(
				(key) => key !== "isNew",
			);

			const escapeCsvCell = (cell) => {
				const strCell = cell === null || cell === undefined ? "" : String(cell);
				if (/[",\n\r]/.test(strCell)) {
					return `"${strCell.replace(/"/g, '""')}"`;
				}
				return strCell;
			};

			const csvRows = [headers.join(",")];

			simulationLog.forEach((log) => {
				const values = headers.map((header) => escapeCsvCell(log[header]));
				csvRows.push(values.join(","));
			});

			const csvString = csvRows.join("\n");
			const dataBlob = new Blob([csvString], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(dataBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "simulation-log.csv";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			showStatusMessage("status_export_success");
		});
	}

	if (btnImportLog) {
		btnImportLog.addEventListener("click", () => {
			importFileInput.click();
		});
	}

	if (importFileInput) {
		importFileInput.addEventListener("change", (event) => {
			const file = event.target.files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const csv = e.target.result;
					const lines = csv
						.split(/\r\n|\n/)
						.filter((line) => line.trim() !== "");

					let newLat, newLon, newPoModel;
					const dataLines = lines.filter((line) => {
						if (line.startsWith("#")) {
							const parts = line.substring(1).split(",");
							if (parts.length >= 2) {
								const key = `#${parts[0].trim()}`;
								const value = parts[1].trim();
								if (key === "#mapLat") newLat = parseFloat(value);
								else if (key === "#mapLon") newLon = parseFloat(value);
								else if (key === "#poModel") newPoModel = value;
							}
							return false;
						}
						return true;
					});

					if (
						typeof newLat === "number" &&
						!isNaN(newLat) &&
						typeof newLon === "number" &&
						!isNaN(newLon)
					) {
						settings.lat = newLat;
						settings.lon = newLon;
						savePartial({ lat: newLat, lon: newLon });
						updateCoordInputs();
						if (typeof map !== "undefined" && map.setView) {
							map.setView([newLat, newLon]);
						}
					}

					if (
						newPoModel &&
						["crowl", "alonso", "sadovski"].includes(newPoModel)
					) {
						const poModelSelect = document.getElementById("poModelSelect");
						if (poModelSelect) poModelSelect.value = newPoModel;
						settings.poModel = newPoModel;
						savePartial({ poModel: newPoModel });
					}

					if (dataLines.length < 1) {
						if (newLat !== undefined || newPoModel !== undefined) {
							showStatusMessage("status_import_success");
							simulationLog = [];
						} else {
							throw new Error(
								translations[currentLanguage].status_import_error_empty,
							);
						}
					} else {
						const headers = dataLines[0].split(",").map((h) => h.trim());
						const requiredHeaders = [
							"material",
							"eta",
							"e_tnt",
							"rho",
							"dh",
							"vol",
							"dist",
							"w_tnt",
							"ze",
							"ps",
							"po_crowl",
							"po_alonso",
							"po_sadovski",
							"lat",
							"lon",
							"poModel",
						];
						const missingHeaders = requiredHeaders.filter(
							(rh) => !headers.includes(rh),
						);

						if (missingHeaders.length > 0) {
							throw new Error(
								`${
									translations[currentLanguage].status_import_error_missing_cols
								}${missingHeaders.join(", ")}`,
							);
						}

						const importedData = [];
						const numericalHeaders = [
							"eta",
							"e_tnt",
							"vol",
							"dist",
							"w_tnt",
							"ze",
							"ps",
						];
						const poHeaders = ["po_crowl", "po_alonso", "po_sadovski"];

						for (let i = 1; i < dataLines.length; i++) {
							const rowNum = i + 1;
							// Gunakan regex untuk split CSV yang menghormati tanda kutip (quoted fields)
							// Mencocokkan koma hanya jika diikuti oleh jumlah tanda kutip genap (artinya di luar kutip)
							const values = dataLines[i]
								.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
								.map((v) => v.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

							if (values.length !== headers.length) continue;

							const logEntry = {};
							for (let j = 0; j < headers.length; j++) {
								const header = headers[j];
								const value = values[j];

								if (
									numericalHeaders.includes(header) &&
									isNaN(parseFloat(value))
								) {
									throw new Error(
										`Data tidak valid di baris ${rowNum} (kolom "${header}"). Harap masukkan angka yang valid.`,
									);
								}
								if (
									poHeaders.includes(header) &&
									isNaN(parseFloat(value)) &&
									value.toUpperCase() !== "N/A"
								) {
									throw new Error(
										`Data tidak valid di baris ${rowNum} (kolom "${header}"). Harap masukkan angka yang valid atau 'N/A'.`,
									);
								}
								logEntry[header] = value;
							}
							importedData.push(logEntry);
						}

						simulationLog = importedData.slice(0, 10);
						showStatusMessage("status_import_success");
					}

					renderLogTable();
					updateOverpressureChartFromLog();
					saveLogToLocalStorage();

					if (simulationLog.length > 0) {
						// --- AWAL BAGIAN YANG DIPERBAIKI ---
						try {
							const firstLog = simulationLog[0];
							const materialSelect = $("material");

							const findMaterialValue = (abbr) => {
								const options = materialSelect.options;
								for (let i = 0; i < options.length; i++) {
									// Pencocokan yang lebih kuat, mengabaikan spasi ekstra
									const optionText = options[i].text.trim();
									if (
										(materialAbbreviationMap[optionText] ||
											options[i].value) === abbr.trim()
									) {
										return options[i].value;
									}
								}
								return "";
							};

							const materialValue = findMaterialValue(firstLog.material);
							if (materialValue) {
								// 1. Atur semua nilai form terlebih dahulu
								materialSelect.value = materialValue;
								$("vol").value = firstLog.vol;
								$("dist").value = firstLog.dist;
								$("rho").value = firstLog.rho;
								$("dh").value = firstLog.dh;
								$("eta").value = firstLog.eta;
								$("e_tnt").value = firstLog.e_tnt;

								// 2. Perbarui tampilan persamaan reaksi
								renderEquation(materialValue);

								// 3. Panggil kalkulasi HANYA SEKALI di akhir
								compute(true);

								// 4. Sinkronkan dengan panel kontrol cepat
								syncFloatingPanelInputs();
							}
						} catch (e) {
							console.warn(
								"Gagal memperbarui formulir utama dari CSV yang diimpor, tetapi log berhasil dimuat.",
								e,
							);
						}
						// --- AKHIR BAGIAN YANG DIPERBAIKI ---
					}
				} catch (err) {
					showStatusMessage("status_import_error", true, err.message);
				} finally {
					importFileInput.value = "";
				}

				// --- TAMBAHKAN KODE BARU DI BAWAH INI ---
				// Memicu klik pada baris pertama setelah impor CSV berhasil.
				// Ini menyamakan perilaku dengan saat memilih skenario dari dropdown.
				setTimeout(() => {
					const firstRow = document.querySelector(
						"#logTbody tr:not(.log-placeholder)",
					);
					if (firstRow) {
						firstRow.click();
					}
				}, 150); // Penundaan sedikit lebih lama untuk memastikan semua rendering selesai.
				// --- AKHIR DARI KODE TAMBAHAN ---
			};
			reader.readAsText(file);
		});
	}

	function setupCollapsePanel() {
		const panel = $("floatingControlPanel");
		if (!panel) return;
		const collapseBtn = $("floatPanelCollapseBtn");
		const header = panel.querySelector(".floating-panel-header");
		const mediaQuery = window.matchMedia("(max-width: 768px)");

		const setDockedPosition = () => {
			if (!materialCard) return;
			const materialCardRect = materialCard.getBoundingClientRect();
			let targetTop = Math.max(20, materialCardRect.top);
			panel.style.setProperty("--target-top", `${targetTop}px`);
		};

		if (collapseBtn) {
			collapseBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				if (mediaQuery.matches) {
					// On mobile, this button closes the panel
					panel.classList.remove("is-open-on-mobile");
					// Ensure it's considered 'collapsed' for consistency with CSS hiding
					panel.classList.add("collapsed");
				} else {
					// On desktop, toggle 'collapsed'
					const isCollapsed = panel.classList.toggle("collapsed");
					userManuallyMinimized = isCollapsed; // Update flag on manual toggle
					if (isCollapsed) {
						const rect = panel.getBoundingClientRect();
						panel.style.setProperty("--target-top", `${rect.top}px`);
						panel.style.setProperty(
							"--target-right",
							`${window.innerWidth - rect.right}px`,
						);
					} else {
						panel.style.width = ""; // Reset width
					}
				}
			});
		}

		if (header) {
			header.addEventListener("click", (e) => {
				if (mediaQuery.matches) {
					// On mobile, clicking header opens the panel if it's currently closed
					if (
						!panel.classList.contains("is-open-on-mobile") &&
						e.target !== collapseBtn &&
						!collapseBtn.contains(e.target)
					) {
						panel.classList.add("is-open-on-mobile");
						panel.classList.remove("collapsed"); // Ensure it's not considered collapsed
					}
				} else {
					// On desktop, clicking header uncollapses if it's collapsed
					if (
						panel.classList.contains("collapsed") &&
						e.target !== collapseBtn &&
						!collapseBtn.contains(e.target)
					) {
						panel.classList.remove("collapsed");
						userManuallyMinimized = false; // Reset flag when expanded via header click
						panel.style.width = "";
					}
				}
			});
		}

		window.addEventListener(
			"scroll",
			debounce(() => {
				if (panel.classList.contains("collapsed") && !mediaQuery.matches) {
					setDockedPosition();
				}
			}, 100),
		);

		window.addEventListener(
			"resize",
			debounce(() => {
				if (panel.classList.contains("collapsed") && !mediaQuery.matches) {
					const rect = panel.getBoundingClientRect();
					panel.style.setProperty(
						"--target-right",
						`${window.innerWidth - rect.right}px`,
					);
				}
			}, 100),
		);
	}

	const materialCard = $("materialCard");
	function handlePanelVisibility() {
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		if (mediaQuery.matches) return; // Disable scroll-based visibility for mobile

		if (!isPageLoaded) return; // Do not run until page has settled
		const floatingPanel = $("floatingControlPanel");
		if (!materialCard || !floatingPanel) return;
		const cardRect = materialCard.getBoundingClientRect();

		if (cardRect.bottom < 20) {
			// <--- Condition for showing panel
			syncFloatingPanelInputs();
			floatingPanel.classList.add("visible");

			// Only uncollapse if the user hasn't manually minimized it
			if (!userManuallyMinimized) {
				floatingPanel.classList.remove("collapsed");
			} else {
				floatingPanel.classList.add("collapsed");
			}
		} else {
			floatingPanel.classList.remove("visible");
			// On desktop, ensure it's collapsed when materialCard comes back into view 
			// so it's ready for the next time it becomes visible
			floatingPanel.classList.add("collapsed");
		}
	}

	const updateOnResizeOrRotate = () => {
		handlePanelVisibility(); // This will now only work on desktop
		const floatingPanel = $("floatingControlPanel");
		if (floatingPanel && !floatingPanel.classList.contains("collapsed")) {
			floatingPanel.style.width = "";
		}
	};

	const debouncedUpdateOnResizeOrRotate = debounce(updateOnResizeOrRotate, 150);
	window.addEventListener("resize", debouncedUpdateOnResizeOrRotate);
	window.addEventListener("orientationchange", debouncedUpdateOnResizeOrRotate);

	function loadAndDisplayScenario(scenarioKey) {
		if (!simulationScenarios[scenarioKey]) return;

		// Ganti log saat ini dengan data skenario yang dipilih
		simulationLog = [...simulationScenarios[scenarioKey].data];

		// Perbarui semua elemen UI yang relevan
		renderLogTable();
		updateOverpressureChartFromLog();
		saveLogToLocalStorage();

		// Muat entri pertama dari skenario baru ke dalam kalkulator utama
		if (simulationLog.length > 0) {
			const firstLog = simulationLog[0];
			const materialSelect = $("material");
			let materialValue = firstLog.material;

			// Normalisasi "H₂" (subscript) menjadi "H2" (biasa) agar cocok dengan value di dropdown
			if (materialValue === "H₂") {
				materialValue = "H2";
			}

			const optionExists = Array.from(materialSelect.options).some(
				(opt) => opt.value === materialValue,
			);

			if (optionExists) {
				// Set material value
				materialSelect.value = materialValue;

				// Populate inputs from firstLog (formatted)
				$("vol").value = window.formatNumber(firstLog.vol);
				$("dist").value = window.formatNumber(firstLog.dist);
				$("rho").value = window.formatNumber(firstLog.rho);
				$("dh").value = window.formatNumber(firstLog.dh);
				$("eta").value = window.formatNumber(firstLog.eta);
				$("e_tnt").value = window.formatNumber(firstLog.e_tnt);

				// Picu event 'change' agar kalkulator dan properti material ikut ter-update
				// Catatan: Jika event listener 'change' me-reset nilai input ke preset,
				// kita mungkin perlu memindah populasi input ke SETELAH event dispatch.
				// Namun, biasanya preset hanya mengisi jika field kosong atau reset.
				// Untuk amannya, kita panggil compute() yang akan membaca nilai yang sudah kita set.
				materialSelect.dispatchEvent(new Event("change"));

				// Paksa nilai input lagi jika event change meresetnya (opsional, tapi aman)
				$("vol").value = window.formatNumber(firstLog.vol);
				$("dist").value = window.formatNumber(firstLog.dist);
				$("rho").value = window.formatNumber(firstLog.rho);
				$("dh").value = window.formatNumber(firstLog.dh);
				$("eta").value = window.formatNumber(firstLog.eta);
				$("e_tnt").value = window.formatNumber(firstLog.e_tnt);

				compute(true);
				syncFloatingPanelInputs();
			} else {
				console.error(
					`Material "${materialValue}" dari data skenario tidak ditemukan di dropdown.`,
				);
			}
		}

		// Panggil fungsi untuk menyorot baris pertama setelah tabel diperbarui
		highlightFirstRow();
	}

	function initializeSimulationState() {
		const selector = $("simulationSelector");
		if (!selector) return;

		// Selalu atur dropdown ke kosong (placeholder) saat refresh
		selector.value = "";
		simulationLog = [];
		renderLogTable();
		if (typeof updateOverpressureChartFromLog === "function") {
			updateOverpressureChartFromLog();
		}

		updateToggleButtonVisibility(selector.value);
		updateSliderVisibility();
	}

	// Fungsi ini mengisi pilihan dropdown dan mengatur listener untuk menyimpan perubahan
	function populateSimulationSelector() {
		const selector = $("simulationSelector");
		if (!selector) return;

		selector.innerHTML = "";

		const placeholder = document.createElement("option");
		placeholder.value = "";
		placeholder.textContent = translateKey(
			"sim_log_select",
			"Select Simulation Log",
		);
		placeholder.hidden = true;
		placeholder.selected = true;
		selector.appendChild(placeholder);

		Object.keys(simulationScenarios).forEach((key) => {
			const option = document.createElement("option");
			option.value = key;
			option.textContent = simulationScenarios[key].name;
			selector.appendChild(option);
		});

		selector.addEventListener("change", (event) => {
			const selectedScenarioKey = event.target.value;
			// --- AWAL KODE BARU UNTUK HIDE SLIDER ---
			if (isSliderVisible) {
				// Hanya reset jika slider sedang terlihat
				isSliderVisible = false; // Set status kembali ke hidden

				// Reset teks tombol "Real Event" / "Hide Event"
				const btnToggleSlider = $("btnToggleSlider");
				if (btnToggleSlider) {
					const newKey = "btn_toggle_slider"; // Kunci teks default
					btnToggleSlider.setAttribute("data-lang-key", newKey);
					btnToggleSlider.textContent = translateKey(
						newKey,
						"btn_toggle_slider",
					);
				}
			}
			updateToggleButtonVisibility(selectedScenarioKey);
			loadAndDisplayScenario(selectedScenarioKey);
			// --- AWAL PERBAIKAN: Reset "Select Po" dropdown ---
			const poModelSelect = $("poModelSelect"); // Helper $() Anda
			if (poModelSelect) {
				poModelSelect.value = "crowl";
				// Picu event 'change' agar peta di map-loader.js merespons
				poModelSelect.dispatchEvent(new Event("change"));
			}
			// --- AKHIR PERBAIKAN ---
			// --- AWAL KODE PERBAIKAN ---
			// Tambahkan pemicu klik di sini.
			// Ini memastikan baris pertama dari data yang baru dimuat akan diklik,
			// sehingga memicu pembaruan popup di peta.
			setTimeout(() => {
				const firstRow = document.querySelector(
					"#logTbody tr:not(.log-placeholder)",
				);
				if (firstRow) {
					firstRow.click();
				}
			}, 100);
			// --- AKHIR KODE PERBAIKAN ---

			// Simpan kunci skenario yang dipilih ke localStorage setiap kali ada perubahan
			try {
				localStorage.setItem("lastSelectedScenario", selectedScenarioKey);
			} catch (e) {
				console.warn("Gagal menyimpan skenario terakhir ke localStorage:", e);
			}
			updateSliderVisibility(); // <-- TAMBAHKAN BARIS INI
		});
	}

	// // --- INITIALIZATION SEQUENCE ---
	// initLanguage();
	// loadLogo();
	// toTopBtn.addEventListener('click', goTop);
	// populateSimulationSelector();
	// setupSliderArrows();
	// initializeSimulationState(); // <-- Satu baris ini menggantikan pemanggilan loadLog() dan render...() yang lama
	// loadStateFromURL();
	// setupCollapsePanel();
	// updatePsVsZeChart(); // Initial plot

	// isInitializing = false;

	// // ========================================================== -->
	// // GANTI BLOK INTERAKSI LAMA DENGAN YANG BARU INI
	// // ========================================================== -->
	// // Hentikan slideshow jika pengguna berinteraksi dengan slider APAPUN
	// document.querySelectorAll('.slider-nav').forEach(nav => {
	//     nav.addEventListener('click', stopSlideshow);
	// });
	// document.querySelectorAll('.slider').forEach(slider => {
	//     slider.addEventListener('pointerdown', stopSlideshow);
	// });
	// // ========================================================== -->

	// setTimeout(() => {
	//     isPageLoaded = true;
	//     handlePanelVisibility();
	// }, 250);

	const btnToggleSlider = $("btnToggleSlider");
	if (btnToggleSlider) {
		btnToggleSlider.addEventListener("click", () => {
			isSliderVisible = !isSliderVisible; // Balik status

			// Perbarui teks tombol
			const newKey = isSliderVisible ? "btn_hide_slider" : "btn_toggle_slider";
			btnToggleSlider.setAttribute("data-lang-key", newKey);
			btnToggleSlider.textContent = translateKey(newKey, "btn_toggle_slider"); // Asumsi 'translateKey' adalah fungsi global Anda

			// Terapkan perubahan visibilitas
			updateSliderVisibility();
		});
	}

	loadTranslationsAndInit();

	// --- NEW MOBILE TOGGLE LOGIC ---
	const mobileFloatingPanelToggle = $("mobileFloatingPanelToggle");
	// floatingPanel is already declared globally, so just use it
	const mediaQuery = window.matchMedia("(max-width: 768px)");

	if (mobileFloatingPanelToggle && floatingPanel) {
		mobileFloatingPanelToggle.addEventListener("click", () => {
			if (mediaQuery.matches) {
				floatingPanel.classList.toggle("is-open-on-mobile");
				// When opened, ensure it's not considered 'collapsed' by the desktop logic
				if (floatingPanel.classList.contains("is-open-on-mobile")) {
					floatingPanel.classList.remove("collapsed");
				} else {
					// If closing, ensure it's considered 'collapsed' for consistency with CSS hiding
					floatingPanel.classList.add("collapsed");
				}
			}
		});
	}

	// --- RESTORE DESKTOP SCROLL/RESIZE LISTENERS (previously in manageFloatingPanelVisibilityLogic) ---
	// Initial check for desktop panel visibility
	handlePanelVisibility(); // Call once to set initial state

	// Add scroll listener for desktop panel visibility
	window.addEventListener("scroll", handlePanelVisibility);

	// The updateOnResizeOrRotate function is declared globally, just add the listeners here.
	window.addEventListener("resize", debouncedUpdateOnResizeOrRotate);
	window.addEventListener("orientationchange", debouncedUpdateOnResizeOrRotate);
}); // End of DOMContentLoaded event listener
