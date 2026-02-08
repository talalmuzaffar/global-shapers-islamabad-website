import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin password
  const password = req.headers['x-admin-password'];
  const correctPassword = process.env.ADMIN_PASSWORD || 'globalshaper2025';

  if (password !== correctPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let submissions = [];
    const { blobs } = await list({ prefix: 'submissions/' });
    const mainBlob = blobs.find(b => b.pathname === 'submissions/data.json');

    if (mainBlob) {
      const resp = await fetch(mainBlob.url);
      submissions = await resp.json();
    }

    return res.status(200).json({
      success: true,
      submissions: submissions,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}
