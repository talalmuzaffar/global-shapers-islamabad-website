// API endpoint to handle contact form submissions
// Vercel Serverless Function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data
  const { name, email, message, type } = req.body;

  // Validate required fields (message is optional)
  if (!name || !email || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Message is optional
  const submissionMessage = message ? message.trim() : '';

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Create submission object
  const submission = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    name: name.trim(),
    email: email.trim(),
    message: submissionMessage,
    type: type.trim(),
  };

  try {
    // In production, you would store this in a database or file storage
    // For now, we'll use Vercel's approach with environment variables
    // You can integrate with: Airtable, Google Sheets, Supabase, or Vercel KV
    
    // For demonstration, we'll return success
    // In production, you should:
    // 1. Store in Vercel KV: await kv.set(`submission:${submission.id}`, submission)
    // 2. Or use a service like Airtable/Google Sheets
    
    return res.status(200).json({ 
      success: true, 
      message: 'Form submitted successfully',
      id: submission.id 
    });
  } catch (error) {
    console.error('Error storing submission:', error);
    return res.status(500).json({ error: 'Failed to store submission' });
  }
}

