// Pengelolaan akun login (admin dan guru).
import { HttpError, json, readJson, now } from './util.js';
import {
  hashPassword, verifyPassword, publicUser, validateName, validateUsername, validatePassword,
  requireAdmin, requireUser,
} from './auth.js';

const rowToUser = (r) => ({ id: r.id, username: r.username, name: r.name, role: r.role, must_change: r.must_change });

export async function listUsers(env, request) {
  const me = await requireUser(env, request);
  if (me.role !== 'admin') return json({ users: [publicUser(me)] });
  const res = await env.DB.prepare('SELECT id, username, name, role, must_change FROM users ORDER BY role, name').all();
  return json({ users: (res.results || []).map((r) => publicUser(rowToUser(r))) });
}

async function usernameTaken(env, username, exceptId) {
  const r = await env.DB.prepare('SELECT id FROM users WHERE username = ?1').bind(username).first();
  return !!r && r.id !== exceptId;
}

export async function createUser(env, request) {
  await requireAdmin(env, request);
  const b = await readJson(request, 10_000);
  const name = String(b.name || '').trim(), username = String(b.username || '').trim(), password = String(b.password || '');
  const err = validateName(name) || validateUsername(username) || validatePassword(password);
  if (err) throw new HttpError(400, err);
  if (await usernameTaken(env, username, '')) throw new HttpError(409, 'Username sudah dipakai akun lain.');
  const id = 'u' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  await env.DB.prepare(
    "INSERT INTO users (id, username, name, role, pw_hash, must_change, created_at) VALUES (?1, ?2, ?3, 'guru', ?4, 1, ?5)"
  ).bind(id, username, name, await hashPassword(env, password), now()).run();
  return json({ user: { id, name, u: username, role: 'guru', must: true } }, 201);
}

// Admin mengubah akun lain: nama, username, dan (opsional) setel ulang kata sandi.
export async function updateUser(env, request, id) {
  const me = await requireAdmin(env, request);
  const b = await readJson(request, 10_000);
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first();
  if (!row) throw new HttpError(404, 'Akun tidak ditemukan.');
  const name = String(b.name == null ? row.name : b.name).trim();
  const username = String(b.username == null ? row.username : b.username).trim();
  const password = String(b.password || '');
  let err = validateName(name) || validateUsername(username);
  if (!err && password) err = validatePassword(password);
  if (err) throw new HttpError(400, err);
  if (await usernameTaken(env, username, id)) throw new HttpError(409, 'Username sudah dipakai akun lain.');
  const stmts = [];
  if (password) {
    const must = id === me.id ? 0 : 1;
    stmts.push(env.DB.prepare('UPDATE users SET name=?1, username=?2, pw_hash=?3, must_change=?4 WHERE id=?5')
      .bind(name, username, await hashPassword(env, password), must, id));
    if (id !== me.id) stmts.push(env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(id));
  } else {
    stmts.push(env.DB.prepare('UPDATE users SET name=?1, username=?2 WHERE id=?3').bind(name, username, id));
  }
  await env.DB.batch(stmts);
  const fresh = await env.DB.prepare('SELECT id, username, name, role, must_change FROM users WHERE id = ?1').bind(id).first();
  return json({ user: publicUser(rowToUser(fresh)) });
}

export async function deleteUser(env, request, id) {
  const me = await requireAdmin(env, request);
  if (id === me.id) throw new HttpError(400, 'Akun yang sedang dipakai tidak bisa dihapus.');
  const row = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?1').bind(id).first();
  if (!row) throw new HttpError(404, 'Akun tidak ditemukan.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM users WHERE id = ?1').bind(id),
  ]);
  return json({ ok: true });
}

// Akun sendiri: ganti nama, username, dan kata sandi.
// Kata sandi saat ini wajib, kecuali akun sedang wajib ganti sandi (baru dibuat / disetel ulang).
export async function updateSelf(env, request) {
  const me = await requireUser(env, request);
  const b = await readJson(request, 10_000);
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(me.id).first();
  const forced = !!row.must_change;
  const current = String(b.current || '');
  if (!forced) {
    const v = await verifyPassword(current, row.pw_hash);
    if (!v.ok) throw new HttpError(403, 'Kata sandi saat ini tidak cocok.', 'BADPW');
  }
  const name = String(b.name == null ? row.name : b.name).trim();
  const username = String(b.username == null ? row.username : b.username).trim();
  const next = String(b.password || '');
  let err = validateName(name) || validateUsername(username);
  if (!err && (next || forced)) err = validatePassword(next);
  if (err) throw new HttpError(400, err);
  if (await usernameTaken(env, username, me.id)) throw new HttpError(409, 'Username sudah dipakai akun lain.');
  if (forced) {
    const same = await verifyPassword(next, row.pw_hash);
    if (same.ok) throw new HttpError(400, 'Kata sandi baru harus berbeda dari kata sandi sebelumnya.');
  }
  if (next) {
    await env.DB.prepare('UPDATE users SET name=?1, username=?2, pw_hash=?3, must_change=0 WHERE id=?4')
      .bind(name, username, await hashPassword(env, next), me.id).run();
  } else {
    await env.DB.prepare('UPDATE users SET name=?1, username=?2 WHERE id=?3').bind(name, username, me.id).run();
  }
  return json({ user: { id: me.id, name, u: username, role: me.role, must: false } });
}
export { verifyPassword };
