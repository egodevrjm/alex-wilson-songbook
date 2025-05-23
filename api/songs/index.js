// API Route: GET /api/songs
// Returns all songs for public and admin users

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all songs from Vercel KV
    const songs = await kv.get('songs') || [];
    
    res.status(200).json({
      success: true,
      songs: songs,
      count: songs.length
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch songs'
    });
  }
}
