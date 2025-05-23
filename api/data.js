// Comprehensive Data API for Alex Wilson Songbook
// Updated to use standard Redis with connection URL

import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

// Initialize Redis client with connection pooling
let redis = null;

const getRedisClient = async () => {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL
    });
    
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    redis.on('connect', () => {
      console.log('Redis Client Connected');
    });
    
    await redis.connect();
  }
  return redis;
};

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
  const { method } = req;
  const { action, type, id } = req.query;

  try {
    const redisClient = await getRedisClient();

    // GET operations (public)
    if (method === 'GET') {
      switch (action) {
        case 'songs':
          const songsData = await redisClient.get('songs');
          const songs = songsData ? JSON.parse(songsData) : [];
          return res.json({ success: true, data: songs });
          
        case 'albums':
          const albumsData = await redisClient.get('albums');
          const albums = albumsData ? JSON.parse(albumsData) : [];
          return res.json({ success: true, data: albums });
          
        case 'media':
          const mediaKey = `${type}-${id}`; // e.g., 'image-song-slug' or 'audio-song-slug'
          const mediaData = await redisClient.get(mediaKey);
          const media = mediaData ? JSON.parse(mediaData) : null;
          return res.json({ success: true, data: media });
          
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    // POST/PUT/DELETE operations (admin only)
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    if (method === 'POST' || method === 'PUT') {
      const data = req.body;
      
      switch (action) {
        case 'songs':
          // Get existing songs
          const existingSongsData = await redisClient.get('songs');
          const existingSongs = existingSongsData ? JSON.parse(existingSongsData) : [];
          
          const songIndex = existingSongs.findIndex(s => s.slug === data.slug);
          
          const song = {
            ...data,
            id: data.id || `song-${Date.now()}`,
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString()
          };

          if (songIndex !== -1) {
            existingSongs[songIndex] = song;
          } else {
            existingSongs.push(song);
          }
          
          await redisClient.set('songs', JSON.stringify(existingSongs));
          return res.json({ success: true, data: song });

        case 'albums':
          // Get existing albums
          const existingAlbumsData = await redisClient.get('albums');
          const existingAlbums = existingAlbumsData ? JSON.parse(existingAlbumsData) : [];
          
          const albumIndex = existingAlbums.findIndex(a => a.id === data.id);
          
          const album = {
            ...data,
            id: data.id || `album-${Date.now()}`,
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString()
          };
          
          if (albumIndex !== -1) {
            existingAlbums[albumIndex] = album;
          } else {
            existingAlbums.push(album);
          }
          
          await redisClient.set('albums', JSON.stringify(existingAlbums));
          return res.json({ success: true, data: album });

        case 'media':
          const mediaKey = `${data.type}-${data.songSlug}`;
          const mediaObject = {
            data: data.data,
            filename: data.filename,
            mimeType: data.mimeType,
            uploadedAt: new Date().toISOString()
          };
          await redisClient.set(mediaKey, JSON.stringify(mediaObject));
          return res.json({ success: true, message: 'Media uploaded' });

        case 'initialize':
          // Initialize with sample data
          const currentSongsData = await redisClient.get('songs');
          const currentSongs = currentSongsData ? JSON.parse(currentSongsData) : [];
          
          const currentAlbumsData = await redisClient.get('albums');
          const currentAlbums = currentAlbumsData ? JSON.parse(currentAlbumsData) : [];
          
          if (currentSongs.length === 0) {
            const sampleSongs = [
              {
                id: 'sample-1',
                title: 'Kentucky Hills',
                slug: 'kentucky-hills',
                lyrics: `**Verse 1:**\nWay up in them Kentucky hills\nWhere the morning mist still lingers\nOn the hollers and the rills\nI was raised by weathered fingers\n\n**Chorus:**\nBut I ain't lookin' back no more\nTo them days of hurt and sorrow\nGot my guitar and these old scars\nAnd I'm singin' for tomorrow`,
                notes: 'Written during a difficult period, reflecting on childhood in eastern Kentucky.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                soundsLike: 'Chris Stapleton meets Tyler Childers'
              },
              {
                id: 'sample-2',
                title: 'Blackberry Wine',
                slug: 'blackberry-wine',
                lyrics: `**Verse 1:**\nShe left me with a mason jar\nOf blackberry wine so sweet\nSaid "drink this when you miss me\nAnd remember how we used to meet"\n\n**Chorus:**\nDown by the creek where the blackberries grow\nIn the summer heat and the evening glow\nThat blackberry wine takes me back in time\nTo when your heart was mine`,
                notes: 'A nostalgic love song about lost romance and memories preserved in simple moments.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                soundsLike: 'Jason Isbell with a touch of Johnny Cash'
              }
            ];
            
            await redisClient.set('songs', JSON.stringify(sampleSongs));
          }
          
          if (currentAlbums.length === 0) {
            const sampleAlbums = [
              {
                id: 'sample-album-1',
                title: 'Holler Songs',
                description: 'A collection of songs about growing up in rural Kentucky.',
                songs: [
                  { slug: 'kentucky-hills', title: 'Kentucky Hills' },
                  { slug: 'blackberry-wine', title: 'Blackberry Wine' }
                ],
                createdAt: new Date().toISOString()
              }
            ];
            
            await redisClient.set('albums', JSON.stringify(sampleAlbums));
          }
          
          return res.json({ success: true, message: 'Sample data initialized' });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (method === 'DELETE') {
      switch (action) {
        case 'songs':
          const songsData = await redisClient.get('songs');
          const songs = songsData ? JSON.parse(songsData) : [];
          const filteredSongs = songs.filter(s => s.slug !== id);
          await redisClient.set('songs', JSON.stringify(filteredSongs));
          
          // Clean up associated media
          await redisClient.del(`image-${id}`);
          await redisClient.del(`audio-${id}`);
          
          return res.json({ success: true, remainingCount: filteredSongs.length });

        case 'albums':
          const albumsData = await redisClient.get('albums');
          const albums = albumsData ? JSON.parse(albumsData) : [];
          const filteredAlbums = albums.filter(a => a.id !== id);
          await redisClient.set('albums', JSON.stringify(filteredAlbums));
          return res.json({ success: true, remainingCount: filteredAlbums.length });

        case 'media':
          const mediaKey = `${type}-${id}`;
          await redisClient.del(mediaKey);
          return res.json({ success: true, message: 'Media deleted' });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
