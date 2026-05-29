// GET /api/auth/session -> { authed: boolean }
import { isAuthed } from '../../_lib/session.js';

export async function onRequest(context) {
  const { request, env } = context;
  const authed = await isAuthed(request, env);
  return new Response(JSON.stringify({ authed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
