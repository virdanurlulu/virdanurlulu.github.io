# DEPLOY.md

# Pressure Vessel Builder — Deploy & Debug SOP

Dokumen ini dipakai sebagai SOP singkat untuk menjalankan, menguji, dan deploy aplikasi **Pressure Vessel Builder** berbasis **HTML + CSS + JavaScript Modules** ke **GitHub Pages**.

---

## 1. Tujuan

Checklist ini dipakai supaya:
- project tidak dijalankan dengan cara yang salah (`file:///`)
- struktur folder tetap konsisten
- proses deploy ke GitHub Pages lebih aman
- troubleshooting lebih cepat saat model 3D tidak muncul

---

## 2. Struktur folder yang direkomendasikan

```text
pressure-vessel-builder/
├─ .nojekyll
├─ index.html
├─ DEPLOY.md
├─ README.md
├─ styles/
│  └─ main.css
├─ src/
│  ├─ main.js
│  ├─ bootstrap.js
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
└─ vendor/
   └─ three/
```

Catatan:
- `index.html` harus berada di root folder publish.
- File `.nojekyll` sebaiknya ada di root repo.
- Gunakan nama file yang konsisten. Hindari perbedaan huruf besar-kecil seperti `Main.js` vs `main.js`.

---

## 3. Aturan penting sebelum test

### Jangan jalankan dengan cara ini
Jangan buka file dengan double click seperti:
```text
file:///C:/Users/.../index.html
```

Cara ini sering membuat:
- JavaScript module gagal dimuat
- import map gagal dibaca
- viewer 3D kosong walaupun HTML dan CSS tetap tampil

### Jalankan dengan cara ini
Gunakan server lokal.

#### Opsi A — Python
Buka terminal di folder project, lalu jalankan:
```bash
python -m http.server 8000
```

Lalu buka:
```text
http://localhost:8000
```

#### Opsi B — VS Code Live Server
- buka folder project di VS Code
- install extension **Live Server**
- klik kanan `index.html`
- pilih **Open with Live Server**

---

## 4. Checklist local testing

Sebelum push ke GitHub, cek ini:

- [ ] halaman utama tampil
- [ ] panel input tampil normal
- [ ] canvas 3D tampil
- [ ] tombol `Fit View` bekerja
- [ ] tombol view `ISO / Front / Right / Top` bekerja
- [ ] perubahan diameter mengubah geometri
- [ ] perubahan panjang shell memperpanjang vessel
- [ ] perubahan head type mengubah bentuk head
- [ ] perubahan nozzle mengubah posisi / ukuran nozzle
- [ ] export JSON bekerja
- [ ] export STL bekerja
- [ ] export GLB bekerja

---

## 5. Aturan path dan import

Gunakan path relatif.

### Contoh yang aman
```html
<link rel="stylesheet" href="./styles/main.css">
<script type="module" src="./src/bootstrap.js"></script>
```

### Hindari jika repo bukan user-site root
```html
<link rel="stylesheet" href="/styles/main.css">
<script type="module" src="/src/bootstrap.js"></script>
```

Alasan:
- path absolut dengan awalan `/` bisa gagal kalau project dipasang sebagai **project site**
- path relatif lebih aman untuk local server maupun GitHub Pages

---

## 6. Checklist sebelum push

- [ ] `index.html` ada di root
- [ ] `styles/main.css` ada
- [ ] `src/main.js` atau `src/bootstrap.js` ada
- [ ] tidak ada import ke file yang sudah dipindah / dihapus
- [ ] semua file baru sudah ikut di-stage dan di-commit
- [ ] tidak ada typo nama file
- [ ] tidak ada duplikasi file lama yang membingungkan
- [ ] file `.nojekyll` ada

---

## 7. SOP deploy GitHub Pages

### A. Jika repo adalah user site
Nama repo:
```text
username.github.io
```

Maka URL publik biasanya:
```text
https://username.github.io/
```

### B. Jika repo adalah project site
Nama repo misalnya:
```text
pressure-vessel-builder
```

Maka URL publik biasanya:
```text
https://username.github.io/pressure-vessel-builder/
```

### C. Langkah deploy
1. push semua file ke branch `main`
2. buka **Settings**
3. buka menu **Pages**
4. pada **Build and deployment**, pilih:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. simpan pengaturan
6. tunggu proses publish selesai
7. buka URL site
8. lakukan `Ctrl + F5`

---

## 8. Checklist setelah deploy

- [ ] URL GitHub Pages terbuka
- [ ] layout tidak rusak
- [ ] form input tampil
- [ ] model 3D tampil
- [ ] parameter vessel berubah real-time
- [ ] export JSON / STL / GLB masih bekerja
- [ ] tidak ada error besar di browser console

---

## 9. SOP debug jika model 3D tidak muncul

Kalau halaman tampil tetapi model 3D kosong, lakukan urutan berikut.

### Langkah 1 — cek apakah project dibuka lewat `file:///`
Kalau iya, hentikan. Jalankan ulang lewat:
- `http://localhost:8000`
- atau Live Server
- atau GitHub Pages

### Langkah 2 — buka Developer Tools
Tekan:
```text
F12
```
Lalu cek tab:
- **Console**
- **Network**

### Langkah 3 — identifikasi gejala

#### Kasus A — HTML tampil, canvas kosong
Kemungkinan:
- error JavaScript runtime
- module import gagal
- Three.js / addon gagal dimuat

#### Kasus B — file `src/...` atau `styles/...` status 404
Kemungkinan:
- path salah
- folder salah
- huruf besar-kecil nama file tidak cocok

#### Kasus C — site tampil versi lama
Kemungkinan:
- cache browser
- deploy belum selesai
- branch/folder Pages belum sesuai

---

## 10. Pesan error umum dan arti praktisnya

### `Failed to load module script`
Biasanya berarti:
- file modul tidak ditemukan
- MIME type salah
- project dibuka dari `file:///`

### `404 Not Found`
Biasanya berarti:
- path file salah
- file belum ikut ke-push
- nama file beda huruf besar-kecil

### `Failed to resolve module specifier`
Biasanya berarti:
- import module salah
- import map salah
- dependency eksternal tidak bisa dimuat

### `Uncaught TypeError`
Biasanya berarti:
- elemen HTML dengan `id` tertentu tidak ditemukan
- objek scene / renderer belum terbuat
- fungsi dipanggil sebelum module siap

---

## 11. Checklist debug cepat 1 menit

Kalau model tidak muncul, cek urutan ini:

- [ ] apakah dibuka lewat `http://localhost` atau GitHub Pages
- [ ] apakah `index.html` ada di root
- [ ] apakah `src/bootstrap.js` atau `src/main.js` benar-benar ada
- [ ] apakah `styles/main.css` termuat
- [ ] apakah ada error merah di Console
- [ ] apakah ada 404 di tab Network
- [ ] apakah browser masih menyimpan cache lama
- [ ] apakah nama file di import sama persis dengan nama file di repo

---

## 12. Rekomendasi pengembangan berikutnya

Supaya deploy lebih stabil, disarankan:
- gunakan dependency lokal untuk `three`, `OrbitControls`, `STLExporter`, dan `GLTFExporter`
- pertahankan struktur modular per domain, bukan per tahap
- pisahkan logic builder, kalkulasi, UI, dan export
- tambahkan file `CHANGELOG.md` untuk melacak revisi

---

## 13. SOP commit yang direkomendasikan

Contoh pesan commit:
```text
feat: add pig launcher quick opening closure
fix: correct github pages module import path
refactor: split geometry builders into modular files
docs: add DEPLOY.md checklist for github pages
```

---

## 14. Jika masih gagal

Kalau setelah semua langkah di atas model tetap tidak muncul, kirim ke reviewer teknis:
1. screenshot halaman
2. screenshot tab **Console**
3. screenshot tab **Network**
4. URL GitHub Pages
5. struktur root repo
6. nama branch yang dipublish

Dengan 6 data itu, diagnosa biasanya bisa jauh lebih cepat.
