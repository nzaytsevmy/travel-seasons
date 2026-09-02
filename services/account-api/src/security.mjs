import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256url = (value) => createHash('sha256').update(value).digest('base64url');
export const hmac = (secret, value) => createHmac('sha256', secret).update(value).digest('base64url');

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signedValue(secret, payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${hmac(secret, body)}`;
}

export function readSignedValue(secret, value) {
  const [body, signature, extra] = String(value || '').split('.');
  if (!body || !signature || extra || !safeEqual(signature, hmac(secret, body))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
}

export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const at = part.indexOf('=');
    if (at < 1) return null;
    return [part.slice(0, at).trim(), decodeURIComponent(part.slice(at + 1).trim())];
  }).filter(Boolean));
}

export function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge != null) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export class RateLimiter {
  #entries = new Map();
  constructor({ limit, windowMs, clock = Date.now }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.clock = clock;
  }
  allow(key) {
    const now = this.clock();
    const current = this.#entries.get(key);
    if (!current || current.resetAt <= now) {
      this.#entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    current.count += 1;
    return current.count <= this.limit;
  }
}
