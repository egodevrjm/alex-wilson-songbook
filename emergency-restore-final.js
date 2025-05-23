#!/usr/bin/env node

console.log('🚨 EMERGENCY DATA RECOVERY - Alex Wilson Songbook');
console.log('================================================');

const fs = require('fs');
const path = require('path');

try {
  // Step 1: Verify songs.json exists
  console.log('1. Checking songs.json database...');
  const songsJsonPath = path.join('src', 'data', 'songs.json');
  if (!fs.existsSync(songsJsonPath)) {
    console.error('❌ songs.json not found!');
    process.exit(1);
  }
  
  const songsData = JSON.parse(fs.readFileSync(songsJsonPath, 'utf8'));
  console.log(`✅ Found ${songsData.metadata.totalSongs} songs in database`);
  
  // Step 2: Create proper songs.js that loads from the JSON file
  console.log('2. Restoring songs.js integration...');
  
  const songsJsContent = `import { generateSlug } from '../utils/helpers';
import { persistence } from '../utils/persistence.js';

// Load songs from the songs.json database
let songsDatabase = {};

try {
  // Import the songs database
  const songsData = await import('./songs.json');
  songsDatabase = songsData.default || songsData;
  console.log('✅ Loaded songs from database:', songsDatabase.metadata);
} catch (error) {
  console.error('Error loading songs database:', error);
  // Fallback to empty database structure
  songsDatabase = {
    songs: {},
    songOrder: [],
    metadata: {
      version: "1.0.0",
      title: "Alex Wilson Songbook",
      totalSongs: 0,
      lastModified: new Date().toISOString()
    }
  };
}

// Export songs array from the database
export const songs = Object.values(songsDatabase.songs || {});

// Get database metadata
export const getMetadata = () => songsDatabase.metadata;

// Get songs in order
export const getSongsInOrder = () => {
  if (songsDatabase.songOrder && Array.isArray(songsDatabase.songOrder)) {
    return songsDatabase.songOrder
      .map(slug => songsDatabase.songs[slug])
      .filter(Boolean);
  }
  // Fallback to alphabetical order
  return Object.values(songsDatabase.songs || {})
    .sort((a, b) => a.title.localeCompare(b.title));
};

// Find song by slug
export const findSongBySlug = (slug) => songsDatabase.songs[slug];

// Add or update a song
export const addSong = (song) => {
  const timestamp = new Date().toISOString();
  const slug = song.slug || generateSlug(song.title);
  
  const newSong = {
    ...song,
    id: song.id || Date.now(),
    slug,
    soundsLike: song.soundsLike || "",
    updatedAt: timestamp,
    version: (song.version || 0) + 1,
    createdAt: song.createdAt || timestamp
  };
  
  // Add to database
  songsDatabase.songs[slug] = newSong;
  
  // Initialize songOrder if it doesn't exist
  if (!songsDatabase.songOrder) {
    songsDatabase.songOrder = [];
  }
  
  // Add to order if new song
  if (!songsDatabase.songOrder.includes(slug)) {
    songsDatabase.songOrder.push(slug);
  }
  
  // Update metadata
  songsDatabase.metadata.lastModified = timestamp;
  songsDatabase.metadata.totalSongs = Object.keys(songsDatabase.songs).length;
  
  // Try to persist changes
  try {
    persistence.autoSave(songsDatabase);
  } catch (e) {
    console.warn('Could not auto-save:', e.message);
  }
  
  return newSong;
};

// Update specific song field
export const updateSong = (slug, updates) => {
  const song = songsDatabase.songs[slug];
  if (!song) return null;
  
  const updatedSong = {
    ...song,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: (song.version || 0) + 1
  };
  
  songsDatabase.songs[slug] = updatedSong;
  songsDatabase.metadata.lastModified = new Date().toISOString();
  
  // Try to persist changes
  try {
    persistence.autoSave(songsDatabase);
  } catch (e) {
    console.warn('Could not auto-save update:', e.message);
  }
  
  return updatedSong;
};

// Update the soundsLike field for a song
export const updateSongSoundsLike = (slug, soundsLike) => {
  return updateSong(slug, { soundsLike });
};

// Delete a song
export const deleteSong = (slug) => {
  if (!songsDatabase.songs[slug]) return false;
  
  delete songsDatabase.songs[slug];
  
  // Remove from songOrder if it exists
  if (songsDatabase.songOrder) {
    songsDatabase.songOrder = songsDatabase.songOrder.filter(s => s !== slug);
  }
  
  songsDatabase.metadata.lastModified = new Date().toISOString();
  songsDatabase.metadata.totalSongs = Object.keys(songsDatabase.songs).length;
  
  // Try to persist changes
  try {
    persistence.autoSave(songsDatabase);
  } catch (e) {
    console.warn('Could not auto-save deletion:', e.message);
  }
  
  return true;
};

// Search songs
export const searchSongs = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(songsDatabase.songs || {}).filter(song => 
    song.title.toLowerCase().includes(lowercaseQuery) ||
    (song.lyrics && song.lyrics.toLowerCase().includes(lowercaseQuery)) ||
    (song.notes && song.notes.toLowerCase().includes(lowercaseQuery)) ||
    (song.soundsLike && song.soundsLike.toLowerCase().includes(lowercaseQuery))
  );
};

// Export the database for direct access if needed
export default songsDatabase;
`;

  const songsJsPath = path.join('src', 'data', 'songs.js');
  
  // Backup existing file if it exists
  if (fs.existsSync(songsJsPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${songsJsPath}.emergency-backup-${timestamp}`;
    fs.copyFileSync(songsJsPath, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  }
  
  fs.writeFileSync(songsJsPath, songsJsContent);
  console.log('✅ Restored songs.js integration');
  
  console.log('\\n🎉 RECOVERY COMPLETE!');
  console.log('=====================================');
  console.log(`✅ Database verified with ${songsData.metadata.totalSongs} songs`);
  console.log('✅ Integration layer restored');
  console.log('✅ Persistence system connected');
  console.log('\\n📱 Your app should now work properly!');
  console.log('\\n▶️  Next steps:');
  console.log('   1. Start the app: npm run start');
  console.log('   2. Open in browser: http://localhost:5173');
  console.log('   3. All your songs and lyrics should be restored!');
  
} catch (error) {
  console.error('❌ Recovery failed:', error.message);
  process.exit(1);
}
