// Fungsi bantu umum untuk Worker Hafalanku.

export const SESSION_COOKIE = 'hk_sess';
export const SESSION_DAYS = 14;

export function json(data, status = 200, extra = {}) {
  return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });
}

export function fail(status, message, code) {
  return json({ error: message, code: code || undefined }, status);
}

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function readJson(request, maxBytes = 3_000_000) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) throw new HttpError(413, 'Permintaan terlalu besar.');
  let text;
  try {
    text = await request.text();
  } catch {
    throw new HttpError(400, 'Permintaan tidak bisa dibaca.');
  }
  if (text.length > maxBytes) throw new HttpError(413, 'Permintaan terlalu besar.');
  try {
    const v = JSON.parse(text || '{}');
    if (!v || typeof v !== 'object') throw 0;
    return v;
  } catch {
    throw new HttpError(400, 'Format JSON tidak valid.');
  }
}

export function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

export function sessionCookie(value, maxAgeSec, secure) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${maxAgeSec}`,
  ]
    .filter(Boolean)
    .join('; ');
}

const enc = new TextEncoder();

export function b64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function unb64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
export function b64url(bytes) {
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(text) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function timingSafeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export const now = () => Math.floor(Date.now() / 1000);

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'local';
}

// Tolak permintaan tulis dari situs lain (perlindungan CSRF tambahan).
export function assertSameOrigin(request, url) {
  const m = request.method;
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return;
  const origin = request.headers.get('origin');
  if (origin) {
    let host = '';
    try {
      host = new URL(origin).host;
    } catch {}
    if (host !== url.host) throw new HttpError(403, 'Asal permintaan tidak diizinkan.');
  }
}
