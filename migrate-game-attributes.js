#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the songs.json file
const songsPath = path.join(__dirname, 'src', 'data', 'songs.json');
const songsData = JSON.parse(fs.readFileSync(songsPath, 'utf8'));

// Game attributes to add to each song
const gameAttributes = {
  released: false,
  type: "full",
  attributes: {
    rawness: 5,
    production: 3,
    crossoverAppeal: 3,
    emotionalImpact: 5
  },
  performances: [],
  covers: [],
  audience: [],
  gameMetadata: {
    firstPerformed: null,
    totalPlays: 0,
    peakAudience: 0,
    streamingPlays: 0,
    lastModifiedInGame: null
  }
};

// Update each song with game attributes
Object.keys(songsData.songs).forEach(slug => {
  const song = songsData.songs[slug];
  
  // Only add game attributes if they don't already exist
  if (!song.hasOwnProperty('released')) {
    // Determine initial attributes based on song content
    const attributes = { ...gameAttributes.attributes };
    
    // Analyze song title and notes for attribute hints
    const titleLower = song.title.toLowerCase();
    const notesLower = (song.notes || '').toLowerCase();
    const lyricsLower = (song.lyrics || '').toLowerCase();
    
    // Adjust rawness based on emotional keywords
    if (titleLower.includes('hell') || titleLower.includes('grief') || 
        titleLower.includes('mourning') || titleLower.includes('weight') ||
        notesLower.includes('raw') || notesLower.includes('brutal')) {
      attributes.rawness = 8;
    }
    
    // Adjust production based on song description
    if (notesLower.includes('acoustic') || notesLower.includes('sparse') ||
        notesLower.includes('minimal')) {
      attributes.production = 2;
    } else if (notesLower.includes('anthemic') || notesLower.includes('driving')) {
      attributes.production = 5;
    }
    
    // Adjust crossover appeal
    if (notesLower.includes('rock') || notesLower.includes('pop') || 
        titleLower.includes('devil') || titleLower.includes('georgia')) {
      attributes.crossoverAppeal = 6;
    }
    
    // Adjust emotional impact
    if (titleLower.includes('mother') || titleLower.includes('guilt') ||
        titleLower.includes('love') || notesLower.includes('haunting') ||
        notesLower.includes('cathartic')) {
      attributes.emotionalImpact = 8;
    }
    
    // Apply game attributes
    Object.assign(song, {
      ...gameAttributes,
      attributes
    });
  }
});

// Backup the original file
const backupPath = path.join(__dirname, 'src', 'data', 'songs.backup.' + Date.now() + '.json');
fs.writeFileSync(backupPath, JSON.stringify(songsData, null, 2));
console.log('Backup created at:', backupPath);

// Write the updated data
fs.writeFileSync(songsPath, JSON.stringify(songsData, null, 2));
console.log('Songs updated with game attributes successfully!');

// Show summary
const totalSongs = Object.keys(songsData.songs).length;
console.log(`\nMigration Summary:`);
console.log(`- Total songs processed: ${totalSongs}`);
console.log(`- Game attributes added to all songs`);
console.log(`- Attributes customized based on song content analysis`);
console.log('\nYou can now enable Game Mode in the app settings!');
