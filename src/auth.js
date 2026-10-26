// Akun, kata sandi (PBKDF2), sesi (cookie HttpOnly), dan pembatas percobaan.
import {
  HttpError, SESSION_COOKIE, SESSION_DAYS, b64, unb64, getCookie, now,
  randomToken, sha256Hex, timingSafeEqual,
} from './util.js';

const enc = new TextEncoder();

function iterations(env) {
  const n = parseInt(env.PBKDF2_ITER, 10);
  if (!Number.isFinite(n)) return 30000;
  return Math.min(100000, Math.max(1000, n));
}

async function derive(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(env, password) {
  const iter = iterations(env);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const h = await derive(password, salt, iter);
  return `pbkdf2$${iter}$${b64(salt)}$${b64(h)}`;
}

export async function verifyPassword(password, stored) {
  const p = String(stored || '').split('$');
  if (p.length !== 4 || p[0] !== 'pbkdf2') return { ok: false, iter: 0 };
  const iter = parseInt(p[1], 10);
  if (!iter) return { ok: false, iter: 0 };
  const h = await derive(password, unb64(p[2]), iter);
  return { ok: timingSafeEqual(b64(h), p[3]), iter };
}

export function publicUser(u) {
  return { id: u.id, name: u.name, u: u.username, role: u.role, must: !!u.must_change };
}

export function validateUsername(u) {
  u = String(u || '').trim();
  if (u.length < 3 || /\s/.test(u)) return 'Username minimal 3 karakter dan tanpa spasi.';
  if (u.length > 40) return 'Username terlalu panjang.';
  return '';
}
export function validateName(n) {
  n = String(n || '').trim();
  if (n.length < 3) return 'Nama lengkap wajib diisi.';
  if (n.length > 100) return 'Nama terlalu panjang.';
  return '';
}
export function validatePassword(p) {
  p = String(p || '');
  if (p.length < 6) return 'Kata sandi minimal 6 karakter.';
  if (p.length > 200) return 'Kata sandi terlalu panjang.';
  return '';
}

// ---------- pembatas percobaan ----------
export async function isBlocked(env, key, max, windowSec) {
  const row = await env.DB.prepare('SELECT n, first_at FROM attempts WHERE key = ?1').bind(key).first();
  if (!row) return false;
  if (now() - row.first_at > windowSec) return false;
  return row.n >= max;
}
export async function recordFail(env, key, windowSec) {
  const t = now();
  await env.DB.prepare(
    `INSERT INTO attempts (key, n, first_at) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       n = CASE WHEN ?2 - first_at > ?3 THEN 1 ELSE n + 1 END,
       first_at = CASE WHEN ?2 - first_at > ?3 THEN ?2 ELSE first_at END`
  ).bind(key, t, windowSec).run();
}
export async function clearFails(env, key) {
  await env.DB.prepare('DELETE FROM attempts WHERE key = ?1').bind(key).run();
}

// ---------- sesi ----------
export async function createSession(env, userId) {
  const token = randomToken(32);
  const hash = await sha256Hex(token);
  const t = now();
  const exp = t + SESSION_DAYS * 86400;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?1').bind(t),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)').bind(hash, userId, exp, t),
  ]);
  return { token, maxAge: SESSION_DAYS * 86400 };
}

export async function getUser(env, request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.name, u.role, u.must_change, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?1`
  ).bind(hash).first();
  if (!row) return null;
  const t = now();
  if (row.expires_at < t) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(hash).run();
    return null;
  }
  // Perpanjang sesi paling sering sekali sehari (hemat penulisan D1).
  if (row.expires_at - t < (SESSION_DAYS - 1) * 86400) {
    await env.DB.prepare('UPDATE sessions SET expires_at = ?1 WHERE token_hash = ?2').bind(t + SESSION_DAYS * 86400, hash).run();
  }
  return row;
}

export async function requireUser(env, request) {
  const u = await getUser(env, request);
  if (!u) throw new HttpError(401, 'Sesi berakhir. Silakan masuk kembali.', 'UNAUTH');
  return u;
}
export async function requireAdmin(env, request) {
  const u = await requireUser(env, request);
  if (u.role !== 'admin') throw new HttpError(403, 'Hanya admin yang boleh melakukan ini.');
  return u;
}

export async function destroySession(env, request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(await sha256Hex(token)).run();
}
export { SESSION_COOKIE };
