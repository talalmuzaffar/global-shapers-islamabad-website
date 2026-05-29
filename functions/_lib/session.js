// Signed session cookie helper (HMAC-SHA256 via Web Crypto).
// Token format: base64url(payloadJSON).base64url(hmac)
// Payload = { exp: <unix-seconds> }. No user data — single shared admin.

const COOKIE_NAME = 'gs_admin';
const TTL_SECONDS = 60 * 60 * 8; // 8 hours

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(secret) {
  const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL_SECONDS });
  const payloadB64 = b64urlEncode(new TextEncoder().encode(payload));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return payloadB64 + '.' + b64urlEncode(new Uint8Array(sig));
}

export async function verifyToken(token, secret) {
  if (!token || token.indexOf('.') === -1) return false;
  const [payloadB64, sigB64] = token.split('.');
  const key = await hmacKey(secret);
  let ok;
  try {
    ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64),
      new TextEncoder().encode(payloadB64)
    );
  } catch (e) {
    return false;
  }
  if (!ok) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch (e) {
    return false;
  }
}

export function cookieHeader(token) {
  const maxAge = token ? TTL_SECONDS : 0;
  const value = token || '';
  return (
    COOKIE_NAME + '=' + value +
    '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + maxAge
  );
}

export function readCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v.join('=');
  }
  return null;
}

// Guard helper for protected endpoints. Returns true if the request carries
// a valid session cookie.
export async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false;
  return verifyToken(readCookie(request), env.SESSION_SECRET);
}
