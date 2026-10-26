-- Hafalanku: skema database D1
-- Jalankan sekali: salin seluruh isi file ini ke D1 → hafalanku-db → Console → Execute (lihat README.md)
-- Aman dijalankan ulang: semua perintah memakai IF NOT EXISTS.

-- ===== Akun & sesi =====
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'guru' CHECK (role IN ('admin','guru')),
  pw_hash     TEXT NOT NULL,                 -- pbkdf2$putaran$salt$hash
  must_change INTEGER NOT NULL DEFAULT 0,    -- 1 = wajib ganti kata sandi
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,              -- SHA-256 dari token cookie
  user_id     TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Pembatas percobaan salah (login admin dan verifikasi wali)
CREATE TABLE IF NOT EXISTS attempts (
  key       TEXT PRIMARY KEY,
  n         INTEGER NOT NULL,
  first_at  INTEGER NOT NULL
) WITHOUT ROWID;

-- ===== Data hafalan =====
-- Kolom "data" menyimpan objek lengkap (JSON) persis seperti yang dipakai
-- aplikasi. Kolom lain hanya untuk pencarian dan index.
CREATE TABLE IF NOT EXISTS classes (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  grade  INTEGER NOT NULL DEFAULT 0,
  data   TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS students (
  id        TEXT PRIMARY KEY,
  class_id  TEXT NOT NULL DEFAULT '',
  name      TEXT NOT NULL,
  nis       TEXT NOT NULL DEFAULT '',
  dob       TEXT NOT NULL DEFAULT '',
  status    TEXT NOT NULL DEFAULT '',
  alumni    INTEGER NOT NULL DEFAULT 0,
  data      TEXT NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis   ON students(nis);

-- Setoran hafalan (riwayat)
CREATE TABLE IF NOT EXISTS progress (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL DEFAULT '',
  class_id    TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL DEFAULT '',
  auto        INTEGER NOT NULL DEFAULT 0,
  data        TEXT NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id, date);
CREATE INDEX IF NOT EXISTS idx_progress_date ON progress(date);

-- Arsip setoran lama: catatan setoran yang sudah dipindah dari "progress" supaya
-- tidak ikut dimuat setiap kali aplikasi dibuka. Struktur sama dengan progress.
CREATE TABLE IF NOT EXISTS progress_archive (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL DEFAULT '',
  class_id    TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL DEFAULT '',
  auto        INTEGER NOT NULL DEFAULT 0,
  data        TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS exams (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL DEFAULT '',
  data        TEXT NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_exams_student ON exams(student_id);

-- Target surat dan ayat
CREATE TABLE IF NOT EXISTS surahs (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL DEFAULT '',
  data  TEXT NOT NULL
) WITHOUT ROWID;

-- Pesan guru untuk orang tua (satu baris per anak)
CREATE TABLE IF NOT EXISTS messages (
  student_id  TEXT PRIMARY KEY,
  data        TEXT NOT NULL
) WITHOUT ROWID;

-- Arsip pergantian tahun ajaran
CREATE TABLE IF NOT EXISTS archive (
  id    TEXT PRIMARY KEY,
  data  TEXT NOT NULL
) WITHOUT ROWID;

-- Pengaturan aplikasi (satu baris per pengaturan, nilai berupa JSON)
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
) WITHOUT ROWID;
