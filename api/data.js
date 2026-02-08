import { put, list } from '@vercel/blob';

const VALID_TYPES = ['projects', 'members', 'events'];

async function readBlob(type) {
  try {
    const { blobs } = await list({ prefix: `data/` });
    const blob = blobs.find(b => b.pathname === `data/${type}.json`);
    if (blob) {
      const resp = await fetch(blob.url);
      return await resp.json();
    }
  } catch (e) {
    console.error(`Error reading ${type} from blob:`, e);
  }
  return null;
}

async function writeBlob(type, data) {
  await put(`data/${type}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const type = req.query.type;
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
  }

  // GET — public read
  if (req.method === 'GET') {
    try {
      const data = await readBlob(type);
      if (data !== null) {
        return res.status(200).json(data);
      }
      // Fallback: no blob data yet, return empty array
      return res.status(200).json([]);
    } catch (error) {
      console.error('Error reading data:', error);
      return res.status(500).json({ error: 'Failed to read data' });
    }
  }

  // POST — admin write (password-protected)
  if (req.method === 'POST') {
    const password = req.headers['x-admin-password'];
    const correctPassword = process.env.ADMIN_PASSWORD || 'globalshaper2025';

    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'Data must be an array' });
      }

      await writeBlob(type, data);
      return res.status(200).json({ success: true, message: `${type} saved successfully` });
    } catch (error) {
      console.error('Error writing data:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
