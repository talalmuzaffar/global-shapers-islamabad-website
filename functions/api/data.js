// GET  /api/data?type=projects|members|events  -> bare JSON array (public)
// POST /api/data?type=...   body: array          -> replace dataset (admin only)
// Response shapes are identical to the previous Vercel/Blob implementation
// so the existing js/script.js and js/admin.js need no changes.

import { isAuthed } from '../_lib/session.js';

const VALID_TYPES = ['projects', 'members', 'events'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return json({ error: 'Invalid type. Must be one of: ' + VALID_TYPES.join(', ') }, 400);
  }

  if (request.method === 'GET') {
    try {
      const { results } = await env.DB
        .prepare('SELECT data FROM ' + type + ' ORDER BY position ASC')
        .all();
      const records = results.map((r) => JSON.parse(r.data));
      return json(records);
    } catch (err) {
      return json({ error: 'Failed to read data' }, 500);
    }
  }

  if (request.method === 'POST') {
    if (!(await isAuthed(request, env))) {
      return json({ error: 'Unauthorized' }, 401);
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    if (!Array.isArray(data)) {
      return json({ error: 'Data must be an array' }, 400);
    }

    try {
      // Replace the whole dataset atomically: clear then re-insert in order.
      const stmts = [env.DB.prepare('DELETE FROM ' + type)];
      data.forEach((rec, i) => {
        const id = rec && rec.id ? String(rec.id) : type + '-' + i;
        stmts.push(
          env.DB
            .prepare('INSERT INTO ' + type + ' (id, position, data) VALUES (?, ?, ?)')
            .bind(id, i, JSON.stringify(rec))
        );
      });
      await env.DB.batch(stmts);
      return json({ success: true, message: type + ' saved successfully' });
    } catch (err) {
      return json({ error: 'Failed to save data' }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
