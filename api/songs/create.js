// API Route: POST /api/songs/create
// Creates or updates a song (admin only)

import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.isAdmin === true;
  } catch (error) {
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const songData = req.body;
    
    // Validate required fields
    if (!songData.title || !songData.slug) {
      return res.status(400).json({ error: 'Title and slug are required' });
    }

    // Get existing songs
    const existingSongs = await kv.get('songs') || [];
    
    // Check if updating existing song
    const existingIndex = existingSongs.findIndex(s => s.slug === songData.slug);
    
    // Add timestamp
    const now = new Date().toISOString();
    const song = {
      ...songData,
      id: songData.id || `song-${Date.now()}`,
      updatedAt: now,
      createdAt: songData.createdAt || now
    };

    if (existingIndex !== -1) {
      // Update existing song
      existingSongs[existingIndex] = song;
    } else {
      // Add new song
      existingSongs.push(song);
    }

    // Save to KV storage
    await kv.set('songs', existingSongs);

    res.status(200).json({
      success: true,
      song: song,
      message: existingIndex !== -1 ? 'Song updated' : 'Song created'
    });

  } catch (error) {
    console.error('Error saving song:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save song'
    });
  }
}
