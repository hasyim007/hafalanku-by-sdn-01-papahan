// API portal orang tua / wali. Tidak butuh login, tetapi:
//  - daftar kelas dan nama anak hanya memuat nama (tanpa NIS/tanggal lahir),
//  - laporan satu anak baru dikirim setelah NIS atau tanggal lahir dicek di SERVER,
//  - percobaan salah dibatasi per alamat IP dan per anak.
import { HttpError, json, readJson, clientIp } from './util.js';
import { isBlocked, recordFail, clearFails } from './auth.js';

const WINDOW = 600; // 10 menit
const MAX_PER_STUDENT = 5;
const MAX_PER_IP = 40;

const nisNorm = (v) => String(v == null ? '' : v).replace(/[^0-9a-z]/gi, '').toLowerCase();

// Sama dengan HKDOB.parse di aplikasi: terima 2026-03-09 atau 09/03/2026.
function dobParse(v) {
  const t = String(v == null ? '' : v).trim();
  if (!t) return '';
  let y, m, d, a;
  if ((a = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))) { y = +a[1]; m = +a[2]; d = +a[3]; }
  else if ((a = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))) { d = +a[1]; m = +a[2]; y = +a[3]; }
  else return '';
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

async function parentConfig(env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'set.parent'").first();
  let p = {};
  try { p = row ? JSON.parse(row.value) || {} : {}; } catch {}
  return Object.assign({ on: true, needDob: true, needNis: false }, p);
}

function methodsFor(cfg, s) {
  const m = [];
  if (cfg.needDob && s.dob) m.push('dob');
  if (cfg.needNis && nisNorm(s.nis)) m.push('nis');
  return m;
}

async function publicSetting(env, k) {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?1').bind(k).first();
  if (!row) return '';
  try { return JSON.parse(row.value); } catch { return ''; }
}

export async function waliInfo(env) {
  const cfg = await parentConfig(env);
  const [school, appName, year] = await Promise.all([
    publicSetting(env, 'set.school'), publicSetting(env, 'set.appName'), publicSetting(env, 'set.year'),
  ]);
  const res = await env.DB.prepare(
    `SELECT c.id, c.name, c.grade FROM classes c
      WHERE EXISTS (SELECT 1 FROM students s WHERE s.class_id = c.id AND s.alumni = 0 AND s.status != 'Nonaktif')
      ORDER BY c.grade, c.name`
  ).all();
  return json({
    on: !!cfg.on,
    needVerify: !!(cfg.needDob || cfg.needNis),
    school: school || '', appName: appName || '', year: year || '',
    classes: (res.results || []).map((r) => ({ id: r.id, name: r.name, grade: r.grade })),
  });
}

export async function waliStudents(env, url) {
  const cfg = await parentConfig(env);
  if (!cfg.on) throw new HttpError(403, 'Portal orang tua sedang dinonaktifkan oleh sekolah.', 'OFF');
  const kelas = String(url.searchParams.get('kelas') || '');
  if (!kelas || kelas.length > 80) return json({ students: [] });
  const res = await env.DB.prepare(
    `SELECT id, name, nis, dob FROM students
      WHERE class_id = ?1 AND alumni = 0 AND status != 'Nonaktif' ORDER BY name`
  ).bind(kelas).all();
  return json({
    students: (res.results || []).map((r) => ({ id: r.id, name: r.name, m: methodsFor(cfg, r) })),
  });
}

export async function waliReport(env, request) {
  const body = await readJson(request, 20_000);
  const id = String(body.id == null ? '' : body.id);
  if (!id || id.length > 80) throw new HttpError(400, 'Pilih nama anak terlebih dahulu.');
  const cfg = await parentConfig(env);
  if (!cfg.on) throw new HttpError(403, 'Portal orang tua sedang dinonaktifkan oleh sekolah.', 'OFF');

  const ip = clientIp(request);
  const kIp = `w:ip:${ip}`;
  const kSt = `w:s:${ip}:${id}`;
  if ((await isBlocked(env, kSt, MAX_PER_STUDENT, WINDOW)) || (await isBlocked(env, kIp, MAX_PER_IP, WINDOW))) {
    throw new HttpError(429, 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.', 'LOCK');
  }

  const row = await env.DB.prepare(
    `SELECT id, class_id, nis, dob, data FROM students WHERE id = ?1 AND alumni = 0 AND status != 'Nonaktif'`
  ).bind(id).first();
  if (!row) throw new HttpError(404, 'Data anak tidak ditemukan.');

  if (cfg.needDob || cfg.needNis) {
    const av = methodsFor(cfg, row);
    if (!av.length) {
      throw new HttpError(422, 'Data verifikasi anak belum diisi oleh sekolah. Silakan hubungi guru kelas.', 'NOVER');
    }
    const mode = av.includes(body.mode) ? body.mode : av[0];
    let ok = false;
    if (mode === 'nis') {
      const k = nisNorm(body.nis);
      ok = !!k && k === nisNorm(row.nis);
    } else {
      const v = dobParse(body.dob);
      ok = !!v && v === dobParse(row.dob);
    }
    if (!ok) {
      await recordFail(env, kSt, WINDOW);
      await recordFail(env, kIp, WINDOW);
      throw new HttpError(401, mode === 'nis' ? 'NIS belum sesuai. Silakan periksa kembali.' : 'Tanggal lahir belum sesuai. Silakan periksa kembali.', 'BAD');
    }
    await clearFails(env, kSt);
  }

  const [cls, logs, exams, msg, sets, surahs] = await Promise.all([
    env.DB.prepare('SELECT data FROM classes WHERE id = ?1').bind(row.class_id).first(),
    env.DB.prepare('SELECT data FROM progress WHERE student_id = ?1 ORDER BY date, id').bind(id).all(),
    env.DB.prepare('SELECT data FROM exams WHERE student_id = ?1 ORDER BY date, id').bind(id).all(),
    env.DB.prepare('SELECT data FROM messages WHERE student_id = ?1').bind(id).first(),
    env.DB.prepare("SELECT key, value FROM settings WHERE key LIKE 'set.%' OR key = 'levelmap'").all(),
    env.DB.prepare('SELECT data FROM surahs ORDER BY id').all(),
  ]);

  const settings = [];
  let levelMap = 'null';
  for (const r of sets.results || []) {
    if (r.key === 'levelmap') levelMap = r.value;
    else settings.push(`${JSON.stringify(r.key.slice(4))}:${r.value}`);
  }
  const arr = (res) => `[${(res.results || []).map((r) => r.data).join(',')}]`;
  return json(
    `{"student":${row.data},"cls":${cls ? cls.data : 'null'},"logs":${arr(logs)},"exams":${arr(exams)},` +
      `"message":${msg ? msg.data : 'null'},"settings":{${settings.join(',')}},"levelMap":${levelMap},"surahs":${arr(surahs)}}`
  );
}
