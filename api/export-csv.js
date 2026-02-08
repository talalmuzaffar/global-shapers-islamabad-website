// API endpoint to export submissions as CSV
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check password
  const password = req.headers['x-admin-password'];
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password !== correctPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch submissions (replace with your actual data source)
    const submissions = []; // Replace with actual data fetching
    
    // Convert to CSV
    const csvHeader = 'ID,Timestamp,Name,Email,Type,Message\n';
    const csvRows = submissions.map(sub => {
      const escapedMessage = sub.message.replace(/"/g, '""'); // Escape quotes
      return `"${sub.id}","${sub.timestamp}","${sub.name}","${sub.email}","${sub.type}","${escapedMessage}"`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contact-submissions-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    return res.status(500).json({ error: 'Failed to generate CSV' });
  }
}

