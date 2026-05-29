// POST /api/auth/login  body: { password }
// On success sets an HttpOnly signed session cookie.
import { createToken, cookieHeader } from '../../_lib/session.js';

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: 'Server auth not configured' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  if (!body || body.password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Invalid password' }, 401);
  }

  const token = await createToken(env.SESSION_SECRET);
  return json({ success: true }, 200, { 'Set-Cookie': cookieHeader(token) });
}
