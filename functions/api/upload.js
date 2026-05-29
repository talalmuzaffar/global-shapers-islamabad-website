// POST /api/upload  (multipart/form-data, field "file")  [admin only]
// Stores the image in R2 and returns { url: "/img/<key>" } for use as
// project imageUrl / member photoUrl.
import { isAuthed } from '../_lib/session.js';

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!(await isAuthed(request, env))) return json({ error: 'Unauthorized' }, 401);

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ error: 'Expected multipart/form-data' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return json({ error: 'No file provided' }, 400);
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return json({ error: 'Unsupported file type. Use JPEG, PNG, WebP or GIF.' }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: 'File too large (max 10 MB)' }, 400);
  }

  const key =
    'uploads/' + Date.now() + '-' + crypto.randomUUID().slice(0, 8) + '.' + ext;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ success: true, url: '/img/' + key });
}
