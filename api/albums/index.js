// API Route: GET /api/albums
// Returns all albums for public and admin users

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const albums = await kv.get('albums') || [];
    
    res.status(200).json({
      success: true,
      albums: albums,
      count: albums.length
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch albums'
    });
  }
}
