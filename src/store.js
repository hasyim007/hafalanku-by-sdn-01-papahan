// Penyimpanan data hafalan di D1: membaca per halaman dan menyimpan perubahan.
//
// Browser tidak pernah mengakses D1. Admin/guru memuat data lewat GET
// /api/data/:tabel (per halaman agar ringan) dan mengirim hanya baris yang
// berubah lewat POST /api/sync. Batas plan gratis: 50 query D1 per request
// Worker dan 100 parameter per query, jadi baris digabung per statement dan
// jumlah statement dibatasi.
import { HttpError, json } from './util.js';

const MAX_STATEMENTS = 45; // di bawah batas 50 query per request (plan gratis)
const MAX_PARAMS = 96; // di bawah batas 100 parameter per query
const MAX_ROW_BYTES = 1_900_000; // batas baris D1 sekitar 2 MB

const str = (v) => (v == null ? '' : String(v));
const key = (v) => (v == null ? '' : String(v));

export const TABLES = {
  classes: {
    pk: 'id', cols: ['id', 'name', 'grade', 'data'], page: 500,
    row: (id, o, j) => [id, str(o.name), Number(o.grade) || parseInt(o.name, 10) || 0, j],
  },
  students: {
    pk: 'id', cols: ['id', 'class_id', 'name', 'nis', 'dob', 'status', 'alumni', 'data'], page: 600,
    row: (id, o, j) => [id, key(o.classId), str(o.name), str(o.nis), str(o.dob), str(o.status), o.alumni ? 1 : 0, j],
  },
  progress: {
    pk: 'id', cols: ['id', 'student_id', 'class_id', 'date', 'auto', 'data'], page: 800,
    row: (id, o, j) => [id, key(o.studentId), key(o.classId), str(o.date), o.auto ? 1 : 0, j],
  },
  exams: {
    pk: 'id', cols: ['id', 'student_id', 'date', 'data'], page: 800,
    row: (id, o, j) => [id, key(o.studentId), str(o.date), j],
  },
  surahs: {
    pk: 'id', cols: ['id', 'name', 'data'], page: 500,
    row: (id, o, j) => [id, str(o.name), j],
  },
  messages: {
    pk: 'student_id', cols: ['student_id', 'data'], page: 600,
    row: (id, o, j) => [id, j],
  },
  archive: {
    pk: 'id', cols: ['id', 'data'], page: 30,
    row: (id, o, j) => [id, j],
  },
  settings: {
    pk: 'key', cols: ['key', 'value'], page: 200, valueCol: 'value', anyJson: true,
    row: (id, o, j) => [id, j],
  },
};

// ---------- baca (per halaman) ----------
export async function readPage(env, table, after, limit) {
  const c = TABLES[table];
  if (!c) throw new HttpError(404, 'Tabel tidak dikenal.');
  const lim = Math.max(1, Math.min(c.page, parseInt(limit, 10) || c.page));
  const vcol = c.valueCol || 'data';
  const res = await env.DB.prepare(
    `SELECT ${c.pk} AS k, ${vcol} AS v FROM ${table} WHERE ${c.pk} > ?1 ORDER BY ${c.pk} LIMIT ?2`
  ).bind(after || '', lim).all();
  const rows = res.results || [];
  // Isi kolom JSON disusun langsung sebagai teks (tanpa parse) agar hemat CPU.
  const parts = rows.map((r) => (c.anyJson ? `{"k":${JSON.stringify(r.k)},"v":${r.v}}` : r.v));
  const next = rows.length === lim ? rows[rows.length - 1].k : null;
  return json(`{"rows":[${parts.join(',')}],"next":${JSON.stringify(next)}}`);
}

// ---------- tulis (ubah/hapus baris) ----------
function upsertStatements(env, table, items) {
  const c = TABLES[table];
  const perStmt = Math.max(1, Math.floor(MAX_PARAMS / c.cols.length));
  const vcol = c.valueCol || 'data';
  const setList = c.cols.filter((x) => x !== c.pk).map((x) => `${x}=excluded.${x}`).join(',');
  const stmts = [];
  for (let i = 0; i < items.length; i += perStmt) {
    const chunk = items.slice(i, i + perStmt);
    const ph = '(' + c.cols.map(() => '?').join(',') + ')';
    const sql = `INSERT INTO ${table} (${c.cols.join(',')}) VALUES ${chunk.map(() => ph).join(',')} ON CONFLICT(${c.pk}) DO UPDATE SET ${setList}`;
    stmts.push(env.DB.prepare(sql).bind(...chunk.flat()));
  }
  return stmts;
}

function deleteStatements(env, table, ids) {
  const c = TABLES[table];
  const stmts = [];
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90);
    stmts.push(env.DB.prepare(`DELETE FROM ${table} WHERE ${c.pk} IN (${chunk.map(() => '?').join(',')})`).bind(...chunk));
  }
  return stmts;
}

export async function applySync(env, body) {
  const up = Array.isArray(body.up) ? body.up : [];
  const del = Array.isArray(body.del) ? body.del : [];
  if (up.length > 600 || del.length > 2000) throw new HttpError(413, 'Terlalu banyak perubahan dalam satu permintaan.');

  // kelompokkan per tabel; id yang sama dalam satu kiriman: yang terakhir menang
  const upBy = {};
  for (const it of up) {
    const c = it && TABLES[it.t];
    if (!c) throw new HttpError(400, 'Tabel tidak dikenal.');
    const id = key(it.id);
    if (!id || id.length > 80) throw new HttpError(400, 'ID tidak valid.');
    const j = typeof it.j === 'string' ? it.j : '';
    if (j.length > MAX_ROW_BYTES) throw new HttpError(413, 'Satu data terlalu besar (mis. gambar logo). Perkecil ukurannya.');
    let o;
    try {
      o = JSON.parse(j);
    } catch {
      throw new HttpError(400, 'Data bukan JSON yang valid.');
    }
    if (!c.anyJson && (!o || typeof o !== 'object' || Array.isArray(o))) throw new HttpError(400, 'Bentuk data tidak valid.');
    (upBy[it.t] ||= new Map()).set(id, c.row(id, o || {}, j));
  }
  const delBy = {};
  for (const it of del) {
    if (!it || !TABLES[it.t]) throw new HttpError(400, 'Tabel tidak dikenal.');
    const id = key(it.id);
    if (!id) continue;
    (delBy[it.t] ||= new Set()).add(id);
  }

  const stmts = [];
  // hapus lebih dulu, lalu simpan; id yang dihapus dan disimpan lagi tetap ada
  for (const t of Object.keys(delBy)) stmts.push(...deleteStatements(env, t, [...delBy[t]]));
  for (const t of Object.keys(upBy)) stmts.push(...upsertStatements(env, t, [...upBy[t].values()]));

  if (stmts.length > MAX_STATEMENTS) throw new HttpError(413, 'Terlalu banyak perubahan sekaligus.', 'TOO_BIG');
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true, up: up.length, del: del.length, statements: stmts.length });
}

// ---------- arsip setoran lama ----------
// Memindahkan catatan setoran dengan tanggal sebelum "before" dari tabel progress ke
// progress_archive (satu batch = satu transaksi, jadi tidak ada baris yang hilang di tengah).
// Dipanggil berulang oleh aplikasi sampai "left" = 0. Tiap panggilan dibatasi agar
// penulisan D1 harian (plan gratis 100.000 baris) tidak habis sekaligus.
const ARCH_STEP = 1500;
const isoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

export async function archiveInfo(env, before) {
  if (!isoDate(before)) throw new HttpError(400, 'Tanggal batas tidak valid.');
  const [a, b, c] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n FROM progress WHERE date != '' AND date < ?1").bind(before).first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM progress').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM progress_archive').first(),
  ]);
  return json({ movable: a ? a.n : 0, active: b ? b.n : 0, archived: c ? c.n : 0 });
}

export async function archiveMove(env, body) {
  const before = body && body.before;
  if (!isoDate(before)) throw new HttpError(400, 'Tanggal batas tidak valid.');
  const pick = "SELECT id FROM progress WHERE date != '' AND date < ?1 ORDER BY id LIMIT ?2";
  const res = await env.DB.batch([
    env.DB.prepare(
      `INSERT OR REPLACE INTO progress_archive (id, student_id, class_id, date, auto, data)
       SELECT id, student_id, class_id, date, auto, data FROM progress WHERE id IN (${pick})`
    ).bind(before, ARCH_STEP),
    env.DB.prepare(`DELETE FROM progress WHERE id IN (${pick})`).bind(before, ARCH_STEP),
    env.DB.prepare("SELECT COUNT(*) AS n FROM progress WHERE date != '' AND date < ?1").bind(before),
  ]);
  const moved = (res[1] && res[1].meta && res[1].meta.changes) || 0;
  const left = (res[2] && res[2].results && res[2].results[0] && res[2].results[0].n) || 0;
  return json({ ok: true, moved, left });
}

// Baca arsip (per halaman) untuk unduh CSV.
export async function archiveRead(env, after, limit) {
  const lim = Math.max(1, Math.min(800, parseInt(limit, 10) || 800));
  const res = await env.DB.prepare('SELECT id AS k, data AS v FROM progress_archive WHERE id > ?1 ORDER BY id LIMIT ?2')
    .bind(after || '', lim).all();
  const rows = res.results || [];
  const next = rows.length === lim ? rows[rows.length - 1].k : null;
  return json(`{"rows":[${rows.map((r) => r.v).join(',')}],"next":${JSON.stringify(next)}}`);
}

// Dipakai tombol "Kosongkan SEMUA data": arsip setoran ikut dihapus.
export async function archiveClear(env) {
  await env.DB.prepare('DELETE FROM progress_archive').run();
  return json({ ok: true });
}

// Setoran milik satu anak di arsip (dipakai saat anak dihapus).
export async function archiveStudentCount(env, student) {
  const sid = String(student || '');
  if (!sid) throw new HttpError(400, 'ID anak tidak valid.');
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM progress_archive WHERE student_id = ?1').bind(sid).first();
  return json({ n: r ? r.n : 0 });
}

export async function archiveStudentDelete(env, body) {
  const sid = String((body && body.student) || '');
  if (!sid) throw new HttpError(400, 'ID anak tidak valid.');
  const r = await env.DB.prepare('DELETE FROM progress_archive WHERE student_id = ?1').bind(sid).run();
  return json({ ok: true, deleted: (r && r.meta && r.meta.changes) || 0 });
}

// Banyak anak sekaligus (hapus per rombel / per kelas / semua anak).
const ARCH_IDS_PER_STMT = 90;
function idsFrom(body) {
  const a = body && Array.isArray(body.students) ? body.students : [];
  const ids = [...new Set(a.map((x) => String(x == null ? '' : x)).filter((x) => x && x.length <= 80))];
  if (!ids.length) throw new HttpError(400, 'Daftar anak kosong.');
  if (ids.length > 3000) throw new HttpError(413, 'Terlalu banyak anak sekaligus.');
  return ids;
}
function chunks(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += ARCH_IDS_PER_STMT) out.push(ids.slice(i, i + ARCH_IDS_PER_STMT));
  return out;
}
export async function archiveStudentsCount(env, body) {
  const res = await env.DB.batch(chunks(idsFrom(body)).map((c) =>
    env.DB.prepare(`SELECT COUNT(*) AS n FROM progress_archive WHERE student_id IN (${c.map((_, i) => '?' + (i + 1)).join(',')})`).bind(...c)));
  return json({ n: res.reduce((s, r) => s + ((r.results && r.results[0] && r.results[0].n) || 0), 0) });
}
export async function archiveStudentsDelete(env, body) {
  const res = await env.DB.batch(chunks(idsFrom(body)).map((c) =>
    env.DB.prepare(`DELETE FROM progress_archive WHERE student_id IN (${c.map((_, i) => '?' + (i + 1)).join(',')})`).bind(...c)));
  return json({ ok: true, deleted: res.reduce((s, r) => s + ((r.meta && r.meta.changes) || 0), 0) });
}
