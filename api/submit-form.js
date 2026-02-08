import { put, list, head } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, message, type } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const submission = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    name: name.trim(),
    email: email.trim(),
    message: message ? message.trim() : '',
    type: type ? type.trim() : 'general',
  };

  try {
    // Load existing submissions
    let submissions = [];
    try {
      const { blobs } = await list({ prefix: 'submissions/' });
      const mainBlob = blobs.find(b => b.pathname === 'submissions/data.json');
      if (mainBlob) {
        const resp = await fetch(mainBlob.url);
        submissions = await resp.json();
      }
    } catch {
      submissions = [];
    }

    // Add new submission
    submissions.unshift(submission);

    // Save back to blob
    await put('submissions/data.json', JSON.stringify(submissions), {
      access: 'public',
      addRandomSuffix: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
      id: submission.id,
    });
  } catch (error) {
    console.error('Error storing submission:', error);
    return res.status(500).json({ error: 'Failed to store submission. Please try again.' });
  }
}
