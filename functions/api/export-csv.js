// GET /api/export-csv  (admin only) -> CSV download. Same columns as before.
import { isAuthed } from '../_lib/session.js';

function jsonError(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return jsonError({ error: 'Method not allowed' }, 405);
  }

  if (!(await isAuthed(request, env))) {
    return jsonError({ error: 'Unauthorized' }, 401);
  }

  try {
    const { results } = await env.DB
      .prepare(
        'SELECT id, timestamp, name, email, type, message FROM submissions ORDER BY timestamp DESC'
      )
      .all();

    const esc = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const header = 'ID,Timestamp,Name,Email,Type,Message\n';
    const rows = results
      .map((s) => [esc(s.id), esc(s.timestamp), esc(s.name), esc(s.email), esc(s.type), esc(s.message)].join(','))
      .join('\n');
    const csv = header + rows;

    const date = new Date().toISOString().split('T')[0];
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="submissions-' + date + '.csv"',
      },
    });
  } catch (err) {
    return jsonError({ error: 'Failed to generate CSV' }, 500);
  }
}
