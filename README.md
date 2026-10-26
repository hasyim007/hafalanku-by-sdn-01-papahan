# Hafalanku — Cloudflare Worker + D1

Pencatatan hafalan siswa. Halaman statis di `public/`, API di `src/` (Worker), data di D1.
Browser tidak pernah mengakses D1 langsung; semua lewat `/api/...`.

```
wrangler.toml     konfigurasi Worker, folder public/, binding D1
schema.sql        tabel + index D1 (aman dijalankan ulang)
drop-schema.sql   hapus semua tabel (hati-hati)
src/              API: index.js (router), auth.js, users.js, store.js, wali.js, util.js
public/
  index.html          pilih peran (Admin/Guru atau Orang Tua)
  admin/login.html    login admin
  admin/index.html    dashboard admin (semua menu)
  wali/index.html     portal orang tua
  assets/             CSS, JS, gambar
```

## Deploy lewat dashboard Cloudflare + GitHub (tanpa npm)

Semua dikerjakan di browser. Perintah build dijalankan otomatis oleh Cloudflare.

**1. Upload ke GitHub**
Buat repositori baru di GitHub, lalu upload seluruh isi folder `hafalanku` (isi folder ini, bukan folder induknya:
`public/`, `src/`, `wrangler.toml`, `schema.sql`, dst. harus ada di halaman utama repo). Repo boleh *private*.

**2. Buat database D1**
Dashboard Cloudflare → *Storage & Databases* → *D1 SQL Database* → *Create database*, nama `hafalanku-db`.
Salin **Database ID** (UUID) dari halaman database.

**3. Tempel ID ke `wrangler.toml` di GitHub**
Buka `wrangler.toml` di GitHub → ikon pensil (edit) → ganti `GANTI-DENGAN-DATABASE-ID` dengan ID tadi → *Commit changes*.
Ini wajib dilakukan di file, bukan di dashboard: Workers Builds menimpa binding dashboard dengan isi `wrangler.toml`.

**4. Hubungkan repo ke Worker**
*Workers & Pages* → *Create* → *Import a repository* (atau *Connect to Git*) → pilih repo → *Save and Deploy*.
Biarkan *Build command* kosong; *Deploy command* biarkan bawaan (`npx wrangler deploy`).
Nama Worker harus sama dengan `name` di `wrangler.toml` (`hafalanku`). Setelah selesai, Cloudflare menampilkan alamat `https://hafalanku.<akun-anda>.workers.dev`.
Setiap kali file di GitHub berubah, Cloudflare men-deploy ulang otomatis.

**5. Buat tabel**
D1 → `hafalanku-db` → tab *Console*. Buka `schema.sql` di GitHub, salin seluruh isinya, tempel ke console → *Execute*.
(Jika console menolak banyak perintah sekaligus, jalankan per blok `CREATE TABLE ...` / `CREATE INDEX ...`.)

**6. Kunci setup admin**
Worker `hafalanku` → *Settings* → *Variables and Secrets* → *Add* → Type **Secret**, nama `SETUP_KEY`, isi bebas (panjang dan acak) → *Deploy*.

**7. Buat akun admin pertama**
Buka `https://hafalanku.<akun-anda>.workers.dev/admin/login.html`. Karena belum ada akun, muncul formulir
**Buat akun admin pertama** (isi SETUP_KEY tadi, nama, username, kata sandi). Formulir hilang setelah admin pertama dibuat.

Guru lain ditambahkan admin di **Pengaturan → Akun Login**; guru membuat kata sandi sendiri saat pertama masuk.

Label menu Cloudflare kadang berubah; bila berbeda, cari menu dengan fungsi yang sama.

## Logo dan gambar dari Google Drive

Agar database tidak terisi file gambar, empat slot gambar (logo aplikasi, logo sekolah, logo formulir, logo kop)
punya tombol **Link Drive** di samping **Unggah logo**:
1. Di Google Drive, klik kanan file gambar → *Bagikan* → akses umum **Siapa saja yang memiliki link** → *Salin link*.
2. Di Hafalanku klik **Link Drive**, tempel link, *Pasang*, lalu simpan seperti biasa.

Yang tersimpan di D1 hanya teks link. Gambar dimuat langsung dari Google oleh browser guru dan orang tua.
Bila file dipindah, dihapus, atau aksesnya dibatasi, logo tidak tampil lagi (logo aplikasi kembali ke bawaan).
Unggah file tetap tersedia, tetapi gambar yang diunggah disimpan di D1.

## Cadangan ke Google Drive

Di **Pengaturan → Data Aplikasi** ada kartu **Cadangan ke Google Drive** dengan tombol *Cadangkan ke Drive* dan *Pulihkan dari Drive*.
Cadangan berupa file JSON yang sama dengan tombol *Unduh cadangan*, disimpan di folder **Hafalanku Cadangan** pada Drive akun Google
yang dipilih saat masuk. Aplikasi hanya meminta izin `drive.file`, jadi hanya bisa melihat file yang dibuatnya sendiri.
Memulihkan dari Drive memakai pratinjau dan salinan pengaman yang sama dengan pemulihan dari file.

Pengaturan satu kali (admin), gratis:
1. Buka console.cloud.google.com, buat proyek baru.
2. *APIs & Services → OAuth consent screen*: pilih *External*, isi nama aplikasi dan email. Selama status masih *Testing*,
   tambahkan email Google yang akan dipakai mencadangkan di *Test users* (maksimal 100 akun).
3. *APIs & Services → Library*: aktifkan **Google Drive API**.
4. *Credentials → Create credentials → OAuth client ID*, jenis **Web application**. Di *Authorized JavaScript origins* isi alamat aplikasi
   (mis. `https://hafalanku.<akun-anda>.workers.dev`, tanpa garis miring di akhir). Redirect URI dikosongkan.
5. Salin **Client ID** lalu tempel di kartu tersebut di Hafalanku dan klik *Simpan*. Tidak perlu mengubah `wrangler.toml` atau deploy ulang.

Client ID disimpan di pengaturan (D1) dan bukan rahasia. Tidak ada Client Secret yang dipakai. Jika memakai alamat lain
(domain sendiri, `wrangler dev`), tambahkan alamat itu ke *Authorized JavaScript origins*. Hanya cadangan manual; tidak ada cadangan otomatis terjadwal.

## Memindahkan data lama

Data lama ada di localStorage browser, jadi tidak pindah otomatis.
1. Di file Hafalanku lama: **Pengaturan → Data Aplikasi → Cadangkan** (unduh file JSON).
2. Di versi baru, login admin: **Pengaturan → Data Aplikasi → Pulihkan** dan pilih file itu.
   Data langsung tersimpan ke D1 (tunggu tulisan "Tersimpan di server").
Alternatif: **Data Anak → Impor Excel** untuk anak per kelas.

## Jalankan di komputer sendiri (opsional, butuh Node.js)

```bash
echo "SETUP_KEY=percobaan123" > .dev.vars
npm run db:init:local
npm run dev        # http://localhost:8787
```

## Batas plan gratis dan cara aplikasi menjaganya

- D1: 5 juta baris dibaca/hari, 100 ribu baris ditulis/hari, 5 GB. Kuota reset 00:00 UTC; bila habis, query gagal sampai reset.
- Plan gratis: maksimal 50 query D1 per request Worker dan 100 parameter per query. `/api/sync` menggabungkan baris
  per statement, membatasi jumlahnya, dan browser memecah impor besar jadi beberapa request.
- Yang dikirim ke server hanya baris yang berubah (bukan seluruh data). Membuka dashboard membaca seluruh data sekali
  (per halaman 500–800 baris); satu kali buka dengan ±5.000 setoran memakai ±6.000 baris dibaca.
- File statis (halaman, CSS, JS) tidak memakai kuota request Worker; Worker hanya jalan untuk `/api/*`.
- CPU 10 ms per request: hash kata sandi memakai PBKDF2 30.000 putaran (`PBKDF2_ITER` di `wrangler.toml`).
  Di plan Workers berbayar naikkan ke 100000. Bila login gagal dengan error 1102, turunkan nilainya.

## Keamanan

- Kata sandi disimpan sebagai hash PBKDF2 + salt acak. Sesi memakai cookie `HttpOnly`, `SameSite=Lax`, `Secure`, berlaku 14 hari.
- Login dikunci 15 menit setelah 8 kali salah (per username) atau 40 kali (per IP).
- Verifikasi wali (tanggal lahir/NIS) dicek di server. 5 kali salah per anak per IP mengunci 10 menit.
  Laporan satu anak baru dikirim setelah verifikasi lolos; data anak lain tidak ikut terkirim.
- Daftar kelas dan **nama** anak tampil di portal wali sebelum verifikasi (sama seperti versi lama), tanpa NIS/tanggal lahir.
  Jangan matikan kedua verifikasi di Pengaturan → Portal Orang Tua, atau siapa pun bisa membuka laporan.
- Kunci setup (`SETUP_KEY`) disimpan sebagai Secret, jangan ditulis di `wrangler.toml` atau GitHub.
- `VAPID-KEYS-RAHASIA.txt` dari repo lama tidak dipakai di sini. Bila repo lama publik, anggap kunci itu bocor dan buat ulang.

## Pemecahan masalah

| Gejala | Sebab / solusi |
|---|---|
| "Database belum disiapkan" | Jalankan isi `schema.sql` di D1 Console (langkah 5) |
| Build gagal / "database_id" | Langkah 3: ID asli harus ada di `wrangler.toml` di GitHub |
| Formulir setup memberi peringatan SETUP_KEY | Langkah 6 belum dilakukan atau belum di-Deploy |
| Lencana "Belum tersimpan (offline?)" | Koneksi putus; aplikasi mencoba lagi otomatis, jangan tutup tab |
| "Sesi berakhir" | Masuk lagi (tab baru); perubahan tertunda dikirim otomatis |
| Lupa kata sandi admin | di D1 Console jalankan `DELETE FROM users; DELETE FROM sessions;` lalu buka halaman login untuk setup ulang (data hafalan tidak terhapus) |

Beberapa guru yang mengedit baris yang sama bersamaan: perubahan terakhir yang menang. Muat ulang halaman untuk melihat perubahan guru lain.

## Arsip setoran lama

Supaya aplikasi tetap ringan dan hemat kuota baca D1, setoran lama bisa dipindah ke tabel `progress_archive`:
menu Pengaturan → Tahun ajaran → **Arsip setoran lama** (hanya admin).

- Jalankan ulang `schema.sql` di D1 Console sekali (aman diulang) agar tabel `progress_archive` dan index tanggal terbentuk.
- Data tidak dihapus. Setoran yang diarsipkan tidak ikut dimuat, jadi tidak tampil di riwayat, grafik, rekap, dan portal orang tua.
- Capaian hafalan anak (`surahProgress`) tersimpan di data anak, jadi tidak berubah.
- Tombol **Unduh arsip setoran (CSV)** mengunduh semua setoran yang sudah diarsipkan.
- Cadangan JSON hanya berisi setoran yang masih aktif.
