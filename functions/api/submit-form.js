// POST /api/submit-form  body: { name, email, message, type }
// Atomic single-row INSERT (fixes the read-modify-write race of the old
// Blob implementation). Response shape matches the previous Vercel version.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  const { name, email, message, type } = body || {};

  if (!name || !email) {
    return json({ error: 'Name and email are required' }, 400);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ error: 'Invalid email address' }, 400);
  }

  const submission = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    name: String(name).trim(),
    email: String(email).trim(),
    message: message ? String(message).trim() : '',
    type: type ? String(type).trim() : 'general',
  };

  try {
    await env.DB
      .prepare(
        'INSERT INTO submissions (id, timestamp, name, email, type, message) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(
        submission.id,
        submission.timestamp,
        submission.name,
        submission.email,
        submission.type,
        submission.message
      )
      .run();

    return json({ success: true, message: 'Form submitted successfully', id: submission.id });
  } catch (err) {
    return json({ error: 'Failed to store submission. Please try again.' }, 500);
  }
}
