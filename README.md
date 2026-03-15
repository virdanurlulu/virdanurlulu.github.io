# Pressure Vessel Builder — Modular Structure

Aplikasi ini adalah **prototype web-based parametric engineering builder** yang siap dipasang di **GitHub Pages**. Fokus utamanya bukan FEA/CFD seperti ANSYS, tetapi **builder geometri parametrik** yang bisa dikembangkan bertahap menjadi software desain equipment.

## Struktur folder

```text
pressure-vessel-builder/
├─ index.html
├─ styles/
│  └─ main.css
├─ src/
│  ├─ main.js
│  ├─ state/
│  │  └─ modelStore.js
│  ├─ core/
│  │  ├─ scene.js
│  │  ├─ camera.js
│  │  ├─ renderer.js
│  │  └─ controls.js
│  ├─ geometry/
│  │  ├─ shellBuilder.js
│  │  ├─ headBuilder.js
│  │  ├─ nozzleBuilder.js
│  │  ├─ supportBuilder.js
│  │  ├─ pipeBuilder.js
│  │  └─ vesselBuilder.js
│  ├─ ui/
│  │  ├─ formBindings.js
│  │  ├─ summaryPanel.js
│  │  └─ toolbar.js
│  ├─ calc/
│  │  ├─ geometrySummary.js
│  │  ├─ weightCalc.js
│  │  └─ volumeCalc.js
│  ├─ export/
│  │  ├─ exportJSON.js
│  │  ├─ exportSTL.js
│  │  └─ exportGLB.js
│  └─ utils/
│     ├─ units.js
│     └─ math.js
└─ README.md
```

## Kenapa struktur ini lebih aman

Struktur ini dipisah **berdasarkan domain fungsi**, bukan berdasarkan “tahap”.  
Jadi:
- revisi geometri shell cukup di `geometry/shellBuilder.js`
- revisi head cukup di `geometry/headBuilder.js`
- revisi input form cukup di `ui/formBindings.js`
- revisi summary engineering cukup di `calc/`

Dengan pola ini, bug dan perubahan tidak tersebar ke banyak file demo.

## Jenis builder yang tersedia

### 1. Pipe Builder
- outer diameter
- inner diameter / thickness
- length
- elbow angle
- bend radius
- outlet length
- orientation

### 2. Pressure Vessel Builder
Mempunyai 3 jenis equipment:
- **Standard Vessel**
- **Pig Launcher**
- **Reboiler**

## Catatan teknis

Versi ini masih fokus pada:
- **parametric 3D builder**
- **data panel dinamis**
- **ringkasan geometri / volume / estimasi massa**
- **export JSON / STL / GLB**

Yang sudah ditingkatkan pada versi refine ini:
- quick opening closure visual untuk Pig Launcher
- nozzle naming helper (N1, N2, N3)
- flange ring / split flange pada nozzle dan channel-shell joint
- saddle dan skirt support lebih detail secara visual
- helper label tidak ikut export STL/GLB

Belum mencakup:
- ASME thickness code check
- MAWP
- nozzle reinforcement detail sesuai code
- saddle stress check
- boolean CAD/B-Rep presisi
- FEA/CFD

## Cara pakai

1. Upload seluruh folder ke repository GitHub.
2. Aktifkan GitHub Pages.
3. Buka `index.html` melalui URL Pages atau server lokal.

## Saran pengembangan berikutnya

- tambah `import JSON`
- tambah `naming/tagging` nozzle
- tambahkan `course shell` dan `flange library`
- buat `material database`
- tambahkan `engineering table`
- migrasi ke `React + Zustand + Vite` jika nanti proyek makin besar


## Catatan menjalankan aplikasi

- Jangan buka `index.html` langsung lewat `file:///...` karena browser sering memblokir ES modules lokal.
- Jalankan lewat **GitHub Pages**, **VS Code Live Server**, atau server lokal sederhana.
- Versi ini memakai **import map** untuk `three` dan `three/addons`, supaya OrbitControls / STLExporter / GLTFExporter bisa dimuat dengan benar di browser.
