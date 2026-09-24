# Finance Dashboard

> **Personal Financial Workstation** — Analitis, presisi, transparan, dan berfokus pada integritas data keuangan tanpa distraksi.

---

## 📌 Deskripsi & Identitas Proyek

**Finance Dashboard** adalah platform workstation keuangan pribadi (*personal finance and investment workstation*) modern yang dirancang untuk memberikan kendali penuh atas posisi finansial Anda.

Aplikasi ini menggabungkan pencatatan multi-rekening kas/bank, alokasi aset portofolio investasi, sistem anggaran bulanan (*budgeting*), visualisasi analitik arus kas (*cashflow*), serta sistem ekspor/cadangan data lokal dalam satu antarmuka terpadu yang cepat dan elegan.

---

## 💡 Alasan Dibuat (*Why This Project Exists*)

1. **Menghindari Estetika "Casino Trading" & Angka Semu**:
   Banyak aplikasi keuangan modern terjebak dalam visualisasi berlebihan, warna neon agresif, dan metrik yang membingungkan. Finance Dashboard dibangun dengan filosofi desain yang tenang (*calm*), profesional, dan jujur terhadap data moneter.
2. **Integritas Matematis & Rekonsiliasi Kas Riil**:
   Seringkali aplikasi pencatat keuangan memisahkan saldo rekening dengan mutasi transaksi, menyebabkan angka saldo menjadi statis atau tidak sinkron. Finance Dashboard menerapkan prinsip *ledger*: saldo akun selalu dihitung secara matematis dari saldo awal ditambah total pemasukan dikurangi pengeluaran.
3. **Privasi & Kedaulatan Data (*Privacy & Data Sovereignty First*)**:
   Data keuangan adalah informasi yang sangat sensitif. Aplikasi ini menyimpan seluruh data secara lokal di perangkat pengguna melalui `localStorage` terenkapsulasi, tanpa mengirimkan rekaman transaksi atau kekayaan pribadi ke server pihak ketiga.
4. **Portabilitas & Kebebasan Pengguna**:
   Pengguna memiliki kendali penuh untuk mencadangkan seluruh basis data ke dalam satu file JSON terenkripsi/terverifikasi, atau mengekspor tabel transaksi, akun, portofolio, dan anggaran ke dalam format CSV standar yang dapat diolah lebih lanjut menggunakan Microsoft Excel atau Google Sheets.

---

## 🛠️ Bahasa Pemrograman & Teknologi yang Digunakan

Proyek ini dibangun menggunakan arsitektur modern berbasis TypeScript murni dengan dependensi yang ramping dan efisien:

- **Bahasa Pemrograman**:
  - [TypeScript](https://www.typescriptlang.org/) — Menjamin keamanan tipe (*type safety*), validasi kontrak domain model yang ketat, dan meminimalkan potensi runtime error.
- **Frontend Framework & Library**:
  - [React 19](https://react.dev/) — Pustaka antarmuka deklaratif berbasis komponen fungsional dan hooks modern.
  - [Tailwind CSS v4](https://tailwindcss.com/) — Engine styling generasi terbaru untuk visual workstation finansial premium (dark theme native).
  - [Vite 8](https://vite.dev/) — Tooling pengembangan dan bundler ultra-cepat dengan Hot Module Replacement (HMR).
- **Testing & Quality Assurance**:
  - **Node.js Test Runner Native (`node --test`)** — Menjalankan automated test suite tanpa overhead library testing eksternal.
  - [ESLint 10](https://eslint.org/) — Analisis statis kode untuk memastikan konsistensi dan kepatuhan standar kode.

---

## ✨ Fitur & Fungsi Utama

### 1. 🏦 Full Account Ledger Integration
- Mendukung multi-rekening: **Bank**, **Tunai/Cash**, **E-Wallet**, dan rekening lainnya.
- Perhitungan saldo dinamis berbasis buku besar (*ledger*):
  $$\text{Saldo Akhir} = \text{Opening Balance} + \sum(\text{Pemasukan Terkait}) - \sum(\text{Pengeluaran Terkait})$$
- Menampilkan rincian mutasi bersih dan riwayat aktivitas transaksi per rekening.

### 2. 🎯 Budget vs Realization Engine
- Menentukan batas pengeluaran bulanan (*spending limit*) per kategori untuk bulan target tertentu (`YYYY-MM`).
- Rekonsiliasi pengeluaran riil otomatis: mengagregasi seluruh transaksi pengeluaran pada bulan dan kategori yang bersangkutan.
- Indikator status semantik:
  - 🟢 **On Track** ($< 80\%$ limit)
  - 🟡 **Near Limit** ($\ge 80\%$ s.d. $100\%$ limit)
  - 🔴 **Over Budget** ($> 100\%$ limit)
- Ringkasan kesehatan anggaran bulanan (*budget health summary*) di dashboard utama.

### 3. 📊 Cashflow Analytics & Trend Visualizer
- **Dual-Column Comparison Chart**: Grafik perbandingan kolom bulanan antara *Inflow* (pemasukan) dan *Outflow* (pengeluaran) dalam jendela waktu 6 bulan berurutan.
- **Rasio Tabungan (*Savings Rate*)**: Menghitung efisiensi tabungan bulanan secara transparan.
- **Category Expense Trend & MoM Shifts**: Menganalisis pergeseran kenaikan atau penurunan biaya per kategori dibandingkan bulan sebelumnya (*Month-over-Month change*).

### 4. 📈 Portfolio & Asset Management
- Pelacakan alokasi aset investasi: Saham, Kripto, Forex, dan Kas.
- Metrik performa investasi: *Cost Basis*, *Market Value*, serta *Profit & Loss* ($/ \%) yang objektif.
- Analisis kualitas portofolio dan deteksi risiko konsentrasi aset.

### 5. 💾 Export, Backup & Restore System
- **Full JSON Snapshot**: Cadangkan seluruh akun, transaksi, portofolio, dan anggaran dalam 1 file JSON terverifikasi.
- **Strategi Pemulihan Fleksibel**:
  - *Replace All*: Menimpa data dengan data backup.
  - *Merge with Current*: Menggabungkan data cadangan tanpa menghapus data aktif.
- **CSV Tabular Export**: Unduh data secara terpisah ke dalam format `.csv` untuk Transaksi, Rekening, Portofolio, dan Anggaran.

### 6. 🔍 Quick Search & Filter Transaksi
- Pencarian instan dan penyaringan transaksi berdasarkan judul, kategori, jenis transaksi (*income* / *expense*), atau tanggal.

---

## 🚀 Panduan Memulai (*Getting Started*)

### Prasyarat
- [Node.js](https://nodejs.org/) versi 22 atau lebih baru.
- npm (Node Package Manager).

### Instalasi & Menjalankan Proyek

1. **Clone repository**:
   ```bash
   git clone https://github.com/RAZKdev/Finance-Dashboard.git
   cd Finance-Dashboard
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan lokal**:
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173`.

4. **Jalankan pengujian otomatis (Automated Unit Tests)**:
   ```bash
   npm test
   ```
   *(Menjalankan 26 unit test verifikasi ledger, anggaran, cashflow, portofolio, dan sistem backup).*

5. **Build untuk produksi**:
   ```bash
   npm run build
   ```

6. **Pemeriksaan linter**:
   ```bash
   npm run lint
   ```

---

## 🔒 Keamanan & Kebijakan Data
- **Tanpa Pengumpulan Data**: Seluruh data tersimpan secara eksklusif pada peramban lokal Anda.
- **Pembersihan CSV**: Mencegah kerentanan formula injection pada spreadsheet dengan sanitasi karakter koma, kutip ganda, dan baris baru.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi terbuka untuk penggunaan pribadi dan edukasi.
