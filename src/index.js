// Hafalanku: Cloudflare Worker (API) + file statis dari folder public/.
//
//   /api/auth/*       masuk, keluar, akun pertama
//   /api/me           info akun yang sedang masuk
//   /api/users        kelola akun admin/guru
//   /api/data/:tabel  baca data (per halaman)
//   /api/sync         simpan perubahan data
//   /api/wali/*       portal orang tua (verifikasi di server)
import {
  HttpError, json, fail, readJson, now, clientIp, assertSameOrigin, sessionCookie,
  SESSION_COOKIE, timingSafeEqual,
} from './util.js';
import {
  hashPassword, verifyPassword, publicUser, getUser, requireUser, requireAdmin, createSession, destroySession,
  isBlocked, recordFail, clearFails, validateName, validateUsername, validatePassword,
} from './auth.js';
import { readPage, applySync, TABLES, archiveInfo, archiveMove, archiveRead, archiveClear, archiveStudentCount, archiveStudentDelete, archiveStudentsCount, archiveStudentsDelete } from './store.js';
import { listUsers, createUser, updateUser, deleteUser, updateSelf } from './users.js';
import { waliInfo, waliStudents, waliReport } from './wali.js';

const LOGIN_WINDOW = 900; // 15 menit

async function route(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method;
  const secure = url.protocol === 'https:';
  assertSameOrigin(request, url);

  // ---------- akun & sesi ----------
  if (path === '/api/auth/status' && method === 'GET') {
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
    const u = await getUser(env, request);
    return json({ needsSetup: !n || n.n === 0, setupReady: !!env.SETUP_KEY, user: u ? publicUser(u) : null });
  }

  if (path === '/api/auth/setup' && method === 'POST') {
    const b = await readJson(request, 10_000);
    const ip = clientIp(request);
    const k = `setup:${ip}`;
    if (await isBlocked(env, k, 5, LOGIN_WINDOW)) throw new HttpError(429, 'Terlalu banyak percobaan. Coba lagi nanti.');
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
    if (n && n.n > 0) throw new HttpError(409, 'Akun admin sudah dibuat. Silakan masuk.');
    if (!env.SETUP_KEY) throw new HttpError(503, 'SETUP_KEY belum diatur. Di dashboard Cloudflare: Workers & Pages → hafalanku → Settings → Variables and Secrets → Add (Type: Secret, nama SETUP_KEY), lalu Deploy.', 'NOKEY');
    if (!timingSafeEqual(String(b.key || ''), env.SETUP_KEY)) {
      await recordFail(env, k, LOGIN_WINDOW);
      throw new HttpError(403, 'Kunci setup tidak cocok.', 'BADKEY');
    }
    const name = String(b.name || '').trim(), username = String(b.username || '').trim(), password = String(b.password || '');
    const err = validateName(name) || validateUsername(username) || validatePassword(password);
    if (err) throw new HttpError(400, err);
    const id = 'u' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    await env.DB.prepare(
      "INSERT INTO users (id, username, name, role, pw_hash, must_change, created_at) VALUES (?1, ?2, ?3, 'admin', ?4, 0, ?5)"
    ).bind(id, username, name, await hashPassword(env, password), now()).run();
    await clearFails(env, k);
    const s = await createSession(env, id);
    return json({ user: { id, name, u: username, role: 'admin', must: false } }, 201, {
      'set-cookie': sessionCookie(s.token, s.maxAge, secure),
    });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const b = await readJson(request, 10_000);
    const username = String(b.username || '').trim();
    const password = String(b.password || '');
    if (!username || !password || username.length > 60 || password.length > 200) throw new HttpError(400, 'Username dan kata sandi wajib diisi.');
    const kU = `login:u:${username.toLowerCase()}`;
    const kIp = `login:ip:${clientIp(request)}`;
    if ((await isBlocked(env, kU, 8, LOGIN_WINDOW)) || (await isBlocked(env, kIp, 40, LOGIN_WINDOW))) {
      throw new HttpError(429, 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.', 'LOCK');
    }
    const row = await env.DB.prepare('SELECT * FROM users WHERE username = ?1').bind(username).first();
    let ok = false;
    if (row) {
      const v = await verifyPassword(password, row.pw_hash);
      ok = v.ok;
      if (ok) {
        const want = parseInt(env.PBKDF2_ITER, 10) || 30000;
        if (v.iter !== Math.min(100000, Math.max(1000, want))) {
          // samakan jumlah putaran hash dengan pengaturan terbaru
          await env.DB.prepare('UPDATE users SET pw_hash = ?1 WHERE id = ?2').bind(await hashPassword(env, password), row.id).run();
        }
      }
    }
    if (!ok) {
      await recordFail(env, kU, LOGIN_WINDOW);
      await recordFail(env, kIp, LOGIN_WINDOW);
      throw new HttpError(401, 'Username atau kata sandi tidak cocok.', 'INVALID');
    }
    await clearFails(env, kU);
    const s = await createSession(env, row.id);
    return json({ user: publicUser(row) }, 200, { 'set-cookie': sessionCookie(s.token, s.maxAge, secure) });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    await destroySession(env, request);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0, secure) });
  }

  if (path === '/api/me' && method === 'GET') {
    const u = await requireUser(env, request);
    return json({ user: publicUser(u) });
  }
  if (path === '/api/me' && method === 'PUT') return updateSelf(env, request);

  // ---------- akun guru ----------
  if (path === '/api/users' && method === 'GET') return listUsers(env, request);
  if (path === '/api/users' && method === 'POST') return createUser(env, request);
  const um = path.match(/^\/api\/users\/([A-Za-z0-9_-]{1,60})$/);
  if (um && method === 'PUT') return updateUser(env, request, um[1]);
  if (um && method === 'DELETE') return deleteUser(env, request, um[1]);

  // ---------- data hafalan (admin/guru) ----------
  const dm = path.match(/^\/api\/data\/([a-z]+)$/);
  if (dm && method === 'GET') {
    await requireUser(env, request);
    if (!TABLES[dm[1]]) throw new HttpError(404, 'Tabel tidak dikenal.');
    return readPage(env, dm[1], url.searchParams.get('after') || '', url.searchParams.get('limit'));
  }
  if (path === '/api/sync' && method === 'POST') {
    await requireUser(env, request);
    return applySync(env, await readJson(request, 3_500_000));
  }

  // ---------- arsip setoran lama (hanya admin) ----------
  if (path === '/api/archive/info' && method === 'GET') {
    await requireAdmin(env, request);
    return archiveInfo(env, url.searchParams.get('before'));
  }
  if (path === '/api/archive/move' && method === 'POST') {
    await requireAdmin(env, request);
    return archiveMove(env, await readJson(request, 2_000));
  }
  if (path === '/api/archive/count' && method === 'GET') {
    await requireAdmin(env, request);
    return archiveStudentCount(env, url.searchParams.get('student'));
  }
  if (path === '/api/archive/delete-student' && method === 'POST') {
    await requireAdmin(env, request);
    return archiveStudentDelete(env, await readJson(request, 2_000));
  }
  if (path === '/api/archive/students-count' && method === 'POST') {
    await requireAdmin(env, request);
    return archiveStudentsCount(env, await readJson(request, 200_000));
  }
  if (path === '/api/archive/students-delete' && method === 'POST') {
    await requireAdmin(env, request);
    return archiveStudentsDelete(env, await readJson(request, 200_000));
  }
  if (path === '/api/archive/clear' && method === 'POST') {
    await requireAdmin(env, request);
    return archiveClear(env);
  }
  if (path === '/api/archive/read' && method === 'GET') {
    await requireAdmin(env, request);
    return archiveRead(env, url.searchParams.get('after') || '', url.searchParams.get('limit'));
  }

  // ---------- portal wali (publik, dibatasi) ----------
  if (path === '/api/wali/info' && method === 'GET') return waliInfo(env);
  if (path === '/api/wali/anak' && method === 'GET') return waliStudents(env, url);
  if (path === '/api/wali/lapor' && method === 'POST') return waliReport(env, request);

  if (path === '/api/health') return json({ ok: true, time: now() });
  return fail(404, 'Alamat API tidak ditemukan.');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await route(request, env, url);
    } catch (e) {
      if (e instanceof HttpError) {
        const headers = e.status === 401 ? { 'set-cookie': sessionCookie('', 0, url.protocol === 'https:') } : {};
        return json({ error: e.message, code: e.code }, e.status, e.code === 'UNAUTH' ? headers : {});
      }
      console.error('Kesalahan server:', e && e.stack ? e.stack : e);
      const msg = String(e && e.message || '');
      if (/no such table/i.test(msg)) return fail(500, 'Database belum disiapkan. Jalankan schema.sql (lihat README).', 'NOSCHEMA');
      return fail(500, 'Terjadi kesalahan di server.');
    }
  },
};
