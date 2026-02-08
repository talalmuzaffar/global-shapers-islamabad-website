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

    // Build CSV
    const csvHeader = 'ID,Timestamp,Name,Email,Type,Message\n';
    const csvRows = submissions.map(sub => {
      const esc = (s) => `"${(s || '').replace(/"/g, '""')}"`;
      return [esc(sub.id), esc(sub.timestamp), esc(sub.name), esc(sub.email), esc(sub.type), esc(sub.message)].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${new Date().toISOString().split('T')[0]}.csv"`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    return res.status(500).json({ error: 'Failed to generate CSV' });
  }
}
