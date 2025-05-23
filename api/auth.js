// Vercel API Route for Authentication
// This runs on the server, so the password is not exposed to clients

import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    // Get admin password from environment variable
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'alexwilson2024';
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }

    // Create JWT token (expires in 24 hours)
    const token = jwt.sign(
      { 
        isAdmin: true, 
        timestamp: Date.now() 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success with token
    res.status(200).json({
      success: true,
      token: token
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
}
