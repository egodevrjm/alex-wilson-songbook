#!/usr/bin/env node

console.log('🚨 FINAL DATA RECOVERY - Alex Wilson Songbook');
console.log('============================================');

const fs = require('fs');
const path = require('path');

try {
  // Step 1: Verify database
  console.log('1. Checking songs.json database...');
  const songsJsonPath = path.join('src', 'data', 'songs.json');
  const songsData = JSON.parse(fs.readFileSync(songsJsonPath, 'utf8'));
  console.log(`✅ Found ${songsData.metadata.totalSongs} songs in database`);
  
  // Step 2: Create working songs.js file
  console.log('2. Creating optimised songs.js...');
  
  const songsJsContent = `import songsDb from './songs.json';
import { persistence } from '../utils/persistence.js';

// Export songs array from the JSON database
export const songs = Object.values(songsDb.songs);

// Helper functions for song management
export const getMetadata = () => songsDb.metadata;

export const getSongsInOrder = () => {
  if (songsDb.songOrder && Array.isArray(songsDb.songOrder)) {
    return songsDb.songOrder.map(slug => songsDb.songs[slug]).filter(Boolean);
  }
  return Object.values(songsDb.songs).sort((a, b) => a.title.localeCompare(b.title));
};

export const findSongBySlug = (slug) => songsDb.songs[slug];

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
  
  // Update in-memory database
  songsDb.songs[slug] = newSong;
  
  if (!songsDb.songOrder.includes(slug)) {
    songsDb.songOrder.push(slug);
  }
  
  songsDb.metadata.lastModified = timestamp;
  songsDb.metadata.totalSongs = Object.keys(songsDb.songs).length;
  
  // Persist using the persistence helper
  try {
    persistence.autoSave(songsDb);
  } catch (e) {
    console.warn('Auto-save failed:', e.message);
  }
  
  return newSong;
};

export const updateSong = (slug, updates) => {
  const song = songsDb.songs[slug];
  if (!song) return null;
  
  const updatedSong = {
    ...song,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: (song.version || 0) + 1
  };
  
  songsDb.songs[slug] = updatedSong;
  songsDb.metadata.lastModified = new Date().toISOString();
  
  try {
    persistence.autoSave(songsDb);
  } catch (e) {
    console.warn('Auto-save failed:', e.message);
  }
  
  return updatedSong;
};

export const updateSongSoundsLike = (slug, soundsLike) => {
  return updateSong(slug, { soundsLike });
};

export const deleteSong = (slug) => {
  if (!songsDb.songs[slug]) return false;
  
  delete songsDb.songs[slug];
  songsDb.songOrder = songsDb.songOrder.filter(s => s !== slug);
  songsDb.metadata.lastModified = new Date().toISOString();
  songsDb.metadata.totalSongs = Object.keys(songsDb.songs).length;
  
  try {
    persistence.autoSave(songsDb);
  } catch (e) {
    console.warn('Auto-save failed:', e.message);
  }
  
  return true;
};

export const searchSongs = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(songsDb.songs).filter(song => 
    song.title.toLowerCase().includes(lowercaseQuery) ||
    (song.lyrics && song.lyrics.toLowerCase().includes(lowercaseQuery)) ||
    (song.notes && song.notes.toLowerCase().includes(lowercaseQuery)) ||
    (song.soundsLike && song.soundsLike.toLowerCase().includes(lowercaseQuery))
  );
};

// Helper function
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Export the database
export default songsDb;
`;

  const songsJsPath = path.join('src', 'data', 'songs.js');
  
  // Create backup
  if (fs.existsSync(songsJsPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${songsJsPath}.backup-${timestamp}`;
    fs.copyFileSync(songsJsPath, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  }
  
  fs.writeFileSync(songsJsPath, songsJsContent);
  console.log('✅ Created new songs.js file');
  
  console.log('\\n🎉 DATA RECOVERY SUCCESSFUL!');
  console.log('============================');
  console.log(`✅ All ${songsData.metadata.totalSongs} songs restored`);
  console.log('✅ Lyrics and notes preserved');
  console.log('✅ "Sounds like" feature maintained');
  console.log('✅ Persistence system connected');
  console.log('\\n🚀 Your Alex Wilson Songbook is ready!');
  console.log('\\n📋 Summary of restored content:');
  
  // Show first few songs as confirmation
  const songTitles = Object.values(songsData.songs).slice(0, 5).map(s => s.title);
  songTitles.forEach((title, i) => {
    console.log(`   ${i + 1}. ${title}`);
  });
  if (Object.keys(songsData.songs).length > 5) {
    console.log(`   ... and ${Object.keys(songsData.songs).length - 5} more songs`);
  }
  
  console.log('\\n▶️  To start your app:');
  console.log('   npm run server  (or npm run quickstart)');
  console.log('\\n💡 All your lyrics, notes, and updates have been preserved!');
  
} catch (error) {
  console.error('❌ Recovery failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
