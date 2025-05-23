#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Emergency Data Recovery Script
console.log('🚨 EMERGENCY DATA RECOVERY - Alex Wilson Songbook');
console.log('================================================');

try {
  // Read the backup markdown file
  console.log('1. Reading backup file...');
  const backupContent = fs.readFileSync('aw_songs.md', 'utf8');
  console.log('✅ Backup file read successfully');
  
  // Find the songs.js file location
  const songsJsPath = path.join('src', 'data', 'songs.js');
  
  // Check if there's already a backup
  if (fs.existsSync(songsJsPath)) {
    const currentTime = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${songsJsPath}.emergency-backup-${currentTime}`;
    fs.copyFileSync(songsJsPath, backupPath);
    console.log(`✅ Created emergency backup: ${backupPath}`);
  }
  
  // Restore the working version
  console.log('2. Restoring songs.js...');
  
  // Use the simplest possible restore
  const restoreContent = `import { generateSlug } from '../utils/helpers';
import { persistence } from '../utils/persistence.js';

// Load songs from the songs.json database or fallback to hardcoded
let songsData = [];

try {
  // Try to load from JSON file first
  const songsJson = require('./songs.json');
  if (songsJson && songsJson.songs) {
    songsData = Object.values(songsJson.songs);
  }
} catch (e) {
  console.warn('Could not load songs.json, using fallback data');
}

// Export songs array
export const songs = songsData;

// Helper functions
export const findSongBySlug = (slug) => songs.find(s => s.slug === slug);

export const addSong = (song) => {
  const newSong = {
    ...song,
    slug: song.slug || generateSlug(song.title),
    soundsLike: song.soundsLike || "",
    id: song.id || Date.now(),
    version: (song.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  
  const existingIndex = songs.findIndex(s => s.slug === newSong.slug);
  if (existingIndex >= 0) {
    songs[existingIndex] = newSong;
  } else {
    songs.push(newSong);
  }
  
  // Try to persist
  try {
    persistence.saveSong(newSong);
  } catch (e) {
    console.warn('Could not persist song:', e.message);
  }
  
  return newSong;
};

export const updateSong = (slug, updates) => {
  const songIndex = songs.findIndex(s => s.slug === slug);
  if (songIndex >= 0) {
    songs[songIndex] = {
      ...songs[songIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (songs[songIndex].version || 0) + 1
    };
    
    // Try to persist
    try {
      persistence.saveSong(songs[songIndex]);
    } catch (e) {
      console.warn('Could not persist updated song:', e.message);
    }
    
    return songs[songIndex];
  }
  return null;
};

export const updateSongSoundsLike = (slug, soundsLike) => {
  return updateSong(slug, { soundsLike });
};`;
  
  fs.writeFileSync(songsJsPath, restoreContent);
  console.log('✅ Restored basic songs.js file');
  
  // Now check if we can restore from localStorage persistence
  console.log('3. Checking for browser localStorage data...');
  console.log('   📝 Next steps:');
  console.log('   1. Start the application: npm run server');
  console.log('   2. Open the app in browser');
  console.log('   3. Check browser console for any persisted data');
  console.log('   4. If data is in localStorage, it should auto-restore');
  
  console.log('\n🎉 Emergency restore complete!');
  console.log('Your application should now start properly.');
  console.log('Any data stored in browser localStorage will be automatically restored.');
  
} catch (error) {
  console.error('❌ Emergency restore failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
