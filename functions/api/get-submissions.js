// GET /api/get-submissions  (admin only)
// Returns { success: true, submissions: [...] } — same shape as before.
import { isAuthed } from '../_lib/session.js';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!(await isAuthed(request, env))) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { results } = await env.DB
      .prepare(
        'SELECT id, timestamp, name, email, type, message FROM submissions ORDER BY timestamp DESC'
      )
      .all();
    return json({ success: true, submissions: results });
  } catch (err) {
    return json({ error: 'Failed to fetch submissions' }, 500);
  }
}
