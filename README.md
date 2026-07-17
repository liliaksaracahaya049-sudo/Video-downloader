# Unduh Video

Website buat download video/audio dari TikTok, Instagram, YouTube, dan Facebook.
Backend pakai Node.js + Express, mesin pengunduhnya pakai **yt-dlp**.

## Isi folder

- `server.js` — backend, tempat semua logika pemrosesan link
- `public/` — halaman website (HTML, CSS, JS) yang dilihat pengguna
- `package.json` — daftar dependensi Node.js

## Cara jalanin di komputer sendiri

1. Install Node.js (versi 18 ke atas) kalau belum ada.
2. Install **yt-dlp** dan **ffmpeg** (dua-duanya wajib, ffmpeg dipakai buat gabungin video+audio dan convert ke mp3):
   - yt-dlp: `pip install yt-dlp` (butuh Python), atau download binary dari https://github.com/yt-dlp/yt-dlp
   - ffmpeg: cari installer sesuai OS kamu di https://ffmpeg.org/download.html
3. Di folder proyek ini, jalankan:
   ```
   npm install
   npm start
   ```
4. Buka `http://localhost:3000` di browser.

## Cara deploy gratis ke Render

1. Push folder ini ke repository GitHub.
2. Buka https://render.com, daftar/login (gratis, gak perlu kartu kredit di awal).
3. Klik **New +** → **Web Service**, hubungkan ke repo GitHub kamu.
4. Isi pengaturan:
   - **Build Command**: `apt-get update && apt-get install -y ffmpeg python3-pip && pip3 install yt-dlp && npm install`
   - **Start Command**: `npm start`
5. Pilih plan **Free**, lalu klik **Create Web Service**.
6. Tunggu proses build selesai — nanti Render kasih kamu link website-nya (contoh: `https://nama-proyek.onrender.com`).

Catatan: di free tier, server bakal "tidur" kalau 15 menit gak ada yang akses, jadi akses pertama setelah itu bakal butuh waktu sekitar 30-60 detik buat "bangun" lagi. Ini normal, bukan error.

## Yang perlu diperhatikan

- Ini masih versi dasar: satu link → satu file. Belum ada pembatasan durasi video atau ukuran file.
- Platform sosial media kadang mengubah sistem mereka, jadi yt-dlp perlu diperbarui secara berkala (`pip install -U yt-dlp`) supaya tetap berfungsi.
- Gunakan sesuai izin dan aturan hak cipta konten yang diunduh.
