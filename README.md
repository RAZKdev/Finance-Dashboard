# Finance Dashboard

> Personal financial workstation yang lokal-first, transparan, dan fokus pada integritas data keuangan.

## 1. Deskripsi Proyek

**Finance Dashboard** adalah aplikasi keuangan pribadi yang menggabungkan pencatatan multi-rekening, anggaran bulanan, analitik arus kas, portofolio investasi, backup/restore, dan pemantauan pasar dalam satu antarmuka. Seluruh data disimpan di browser pengguna melalui `localStorage`; tidak ada transaksi atau kekayaan pribadi yang dikirim ke server pihak ketiga.

## 2. Kenapa Proyek Ini Dibuat

Banyak aplikasi keuangan memprioritaskan visual yang ramai, warna neon, dan metrik yang sulit diverifikasi. Akibatnya, pengguna melihat angka yang terasa "pintar" tetapi tidak dapat direkonsiliasi dengan mutasi rekening sebenarnya.

Finance Dashboard dibuat untuk:

- **Menjaga integritas ledger:** saldo akun dihitung dari saldo awal + pemasukan − pengeluaran, bukan angka statis.
- **Menghindari estetika "casino trading":** tampilan tenang, profesional, dan jujur terhadap data.
- **Menjaga privasi:** data tetap di perangkat pengguna.
- **Memberi kendali penuh:** pengguna dapat mengekspor seluruh data ke JSON/CSV dan memulihkannya kapan saja.
- **Membantu pengambilan keputusan:** anggaran, arus kas, dan portofolio disajikan dalam satu dashboard.

## 3. Fungsi & Fitur Utama

1. **Full Account Ledger** — mendukung rekening bank, tunai, e-wallet, dan lainnya; saldo dihitung dari mutasi transaksi; riwayat transaksi dapat difilter, tetapi belum ada tampilan riwayat khusus per rekening.
2. **Budget vs Realization** — batas pengeluaran per kategori dan bulan (`YYYY-MM`), rekonsiliasi otomatis dengan transaksi riil, serta status `On Track`, `Near Limit`, dan `Over Budget`.
3. **Cashflow Analytics** — grafik inflow/outflow enam bulan, savings rate, dan analisis tren pengeluaran per kategori (month-over-month).
4. **Portfolio & Asset Management** — pelacakan saham, kripto, forex, dan kas; cost basis, market value, profit/loss, serta deteksi konsentrasi aset.
5. **Export, Backup & Restore** — snapshot JSON untuk seluruh data, opsi replace/merge, dan ekspor CSV untuk transaksi, rekening, portofolio, serta anggaran.
6. **Quick Search & Filter** — pencarian dan filter transaksi berdasarkan judul, kategori, jenis, atau tanggal.
7. **Live Market Feed** — kurs forex dan harga kripto dari API publik; saham IHSG melalui proxy Vite `/api/yahoo` (tersedia saat dev/server Vite, tidak pada build statis); dilengkapi snapshot lokal dan tombol refresh manual.
8. **Candlestick Chart** — chart OHLC interaktif dengan mode candlestick/line, timeframe, crosshair, dan perpindahan aset cepat.
9. **Keamanan Data** — escaping CSV standar untuk koma, kutip, dan baris baru; sanitasi formula injection (`=`, `+`, `-`, `@`) belum diterapkan. Data keuangan tidak dikirim ke server, tetapi feed pasar memanggil API eksternal/proxy.

## 4. Bahasa Pemrograman & Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Bahasa utama | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| Build tool | Vite 8 |
| Penyimpanan | `localStorage` |
| Testing | Node.js native test runner (`node --test`) |
| Lint | ESLint 10 |

## 5. Struktur Direktori

```text
Finance-Dashboard/
├── src/
│   ├── components/          # Accounts, budgets, cashflow, portfolio, markets, transactions, UI
│   ├── data/                # Seed data dan definisi pasar
│   ├── types/               # Tipe domain keuangan
│   ├── utils/               # Perhitungan akun, anggaran, cashflow, portofolio, backup
│   ├── App.tsx
│   └── main.tsx
├── test-baseline.mjs        # Pengujian baseline
├── start.bat                # Launcher Windows
├── vite.config.ts
└── package.json
```

## 6. Cara Menjalankan

**Prasyarat:** Node.js `^20.19.0`, `^22.13.0`, atau `>=24` dan npm (persyaratan Vite 8 dan dependensinya).

```bash
npm install
npm run dev
```

Buka `http://localhost:5173/` (Vite memakai `base: '/'`).

Di Windows, `start.bat` juga tersedia.

**Build produksi:**

```bash
npm run build
npm run preview
```

## 7. Pengujian

```bash
npm test
npm run lint
```

Pengujian baseline mencakup perhitungan ledger, anggaran, arus kas, portofolio, dan utilitas backup.

## 8. Catatan & Lisensi

- Data keuangan disimpan di browser; gunakan backup JSON secara berkala.
- Fitur live market membutuhkan koneksi internet; data terakhir disimpan sebagai snapshot lokal. Feed saham IHSG membutuhkan proxy Vite `/api/yahoo`; tanpa proxy, harga saham tidak diperbarui.
- Proyek ini ditujukan untuk penggunaan pribadi dan edukasi. Belum ada berkas lisensi di repo.
