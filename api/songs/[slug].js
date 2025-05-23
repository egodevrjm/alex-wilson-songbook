// API Route: DELETE /api/songs/[slug]
// Deletes a song by slug (admin only)

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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ error: 'Song slug is required' });
    }

    // Get existing songs
    const existingSongs = await kv.get('songs') || [];
    
    // Find song to delete
    const songIndex = existingSongs.findIndex(s => s.slug === slug);
    
    if (songIndex === -1) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Remove song
    const deletedSong = existingSongs.splice(songIndex, 1)[0];
    
    // Save updated songs
    await kv.set('songs', existingSongs);

    // Also clean up any associated media
    try {
      await kv.del(`song-image-${slug}`);
      await kv.del(`song-audio-${slug}`);
    } catch (error) {
      // Non-critical if media cleanup fails
      console.warn('Media cleanup failed:', error);
    }

    res.status(200).json({
      success: true,
      deletedSong: deletedSong,
      remainingCount: existingSongs.length
    });

  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete song'
    });
  }
}
