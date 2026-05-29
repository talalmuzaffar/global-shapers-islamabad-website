// POST /api/auth/logout — clears the session cookie.
import { cookieHeader } from '../../_lib/session.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieHeader(null) },
  });
}
