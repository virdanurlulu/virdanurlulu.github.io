# Pressure Vessel Builder — Final Revised Package

Paket ini adalah versi final hasil revisi untuk **upload ke GitHub Pages**.

## Fitur utama

- **Builder modular berbasis HTML + CSS + JavaScript Modules**
- **Pipe Builder**
  - outer diameter
  - inner diameter / thickness
  - straight length
  - elbow angle
  - bend radius
  - outlet length
  - orientation
- **Pressure Vessel Builder** dengan jenis equipment:
  - Standard Vessel
  - Pig Launcher
  - Reboiler
- **Panel input dinamis**
- **Update model 3D real-time**
- **Engineering summary awal**
  - volume
  - area
  - estimasi massa
- **Export**
  - JSON
  - STL
  - GLB
- **Runtime diagnostic patch**
  - jika engine 3D gagal dimuat, area viewer menampilkan pesan error dan tidak blank total

## Revisi penting yang sudah masuk

### Audit Tahap 1 — Parametric 3D Builder
Sudah ditambahkan / dirapikan:
- Pipe Builder
- parameter OD / ID / thickness yang lebih eksplisit
- Standard Vessel Builder
- Pig Launcher
- Reboiler

### Audit Tahap 2 — Data panel dan update dinamis
Sudah ditambahkan / dirapikan:
- struktur modular per domain
- state store terpusat
- input form yang memicu update real-time
- render model ulang saat parameter berubah

### Refinement geometry
Sudah ditambahkan:
- quick opening closure visual untuk Pig Launcher
- nozzle naming helper (`N1`, `N2`, `N3`)
- flange ring / split flange visual
- support detail (saddle, skirt, gusset, base plate, wear plate)
- helper label tidak ikut export STL/GLB

## Struktur folder

```text
pressure-vessel-builder-final-github/
├─ .nojekyll
├─ DEPLOY.md
├─ README.md
├─ index.html
├─ styles/
│  └─ main.css
└─ src/
   ├─ bootstrap.js
   ├─ main.js
   ├─ state/
   ├─ core/
   ├─ geometry/
   ├─ ui/
   ├─ calc/
   ├─ export/
   └─ utils/
```

## Cara pakai paling aman

### Untuk lokal
**Jangan** buka `index.html` dengan double click (`file:///...`).

Gunakan salah satu:
- **VS Code Live Server**, atau
- server lokal Python:

```bash
python -m http.server 8000
```

lalu buka:

```text
http://localhost:8000
```

### Untuk GitHub Pages
1. Upload seluruh isi folder ini ke repo GitHub.
2. Pastikan `index.html` ada di root source publish.
3. Aktifkan **GitHub Pages** dari `main` dan folder `/(root)`.
4. Tambahkan hard refresh (`Ctrl + F5`) setelah deploy.
5. Ikuti `DEPLOY.md` untuk SOP lengkap.

## Catatan teknis penting

- Versi ini masih memakai **import map** ke CDN `three.js` dan `three/addons`.
- Kalau jaringan tertentu memblokir CDN, viewer 3D bisa gagal dimuat.
- Runtime diagnostic patch akan menampilkan pesan error di viewer jika itu terjadi.

## Batasan versi ini

Belum mencakup:
- ASME code check
- MAWP
- nozzle reinforcement detail sesuai code
- saddle stress analysis
- boolean CAD/B-Rep presisi
- FEA/CFD

## Rekomendasi tahap berikutnya

- local dependency untuk `three.js` dan addons
- import JSON / load project
- component table / nozzle table
- validation rules
- flange library yang lebih detail
- material database
