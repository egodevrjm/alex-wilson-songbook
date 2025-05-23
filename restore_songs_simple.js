#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple script to convert markdown backup to songs.js format
// Run this from the alex-wilson-songbook directory with: node restore_songs_simple.js

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

function cleanTitle(title) {
  return title
    .replace(/^#+\s*/, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/\s*-\s*\d+$/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Title:\s*/i, '')
    .trim();
}

function escapeLiterals(str) {
  return str.replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

async function restoreSongs() {
  try {
    console.log('Reading backup file...');
    const backupPath = './aw_songs.md';
    const content = fs.readFileSync(backupPath, 'utf8');
    
    console.log('Parsing songs...');
    const songs = [];
    
    // Split by song sections
    const sections = content.split(/(?=<a id="[^"]*"><\/a>\n\n## )/);
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      
      // Extract title
      const titleMatch = section.match(/## (.+?)(?:\n|$)/);
      if (!titleMatch) continue;
      
      const title = cleanTitle(titleMatch[1]);
      const slug = generateSlug(title);
      
      // Extract lyrics
      let lyrics = '';
      const lyricsMatch = section.match(/```([^`]*)```/);
      if (lyricsMatch) {
        lyrics = lyricsMatch[1].trim();
      }
      
      // Extract notes
      let notes = '';
      const notesMatch = section.match(/### Notes\s*([\s\S]*?)(?=\n---|\n<a id=|$)/);
      if (notesMatch) {
        notes = notesMatch[1].trim();
      } else {
        // Alternative: everything after lyrics
        const afterLyrics = section.match(/```[^`]*```\s*([\s\S]*?)(?=\n---|\n<a id=|$)/);
        if (afterLyrics) {
          notes = afterLyrics[1].trim();
        }
      }
      
      // Clean notes
      notes = notes
        .replace(/^#+\s*.*$/gm, '')
        .replace(/^\s*$\n/gm, '')
        .trim();
      
      songs.push({
        title,
        slug,
        lyrics: escapeLiterals(lyrics),
        notes: escapeLiterals(notes),
        soundsLike: ""
      });
    }
    
    console.log(`Parsed ${songs.length} songs`);
    
    // Generate songs.js
    const songsCode = songs.map(song => 
      `  {
    title: "${song.title}",
    slug: "${song.slug}",
    lyrics: \`${song.lyrics}\`,
    notes: \`${song.notes}\`,
    soundsLike: "${song.soundsLike}",
  }`
    ).join(',\n');

    const fileContent = `import { generateSlug } from '../utils/helpers';

export const songs = [
${songsCode}
];

// Function to add or update a song
export const addSong = (song) => {
  const newSong = {
    ...song,
    slug: song.slug || generateSlug(song.title),
    soundsLike: song.soundsLike || "",
  };
  
  const existingIndex = songs.findIndex(s => s.slug === newSong.slug);
  if (existingIndex >= 0) {
    songs[existingIndex] = newSong;
  } else {
    songs.push(newSong);
  }
  
  return newSong;
};

// Function to update the soundsLike field for a song
export const updateSongSoundsLike = (slug, soundsLike) => {
  const songIndex = songs.findIndex(s => s.slug === slug);
  if (songIndex >= 0) {
    songs[songIndex].soundsLike = soundsLike;
    return songs[songIndex];
  }
  return null;
};`;

    // Write to songs.js
    const outputPath = './src/data/songs.js';
    fs.writeFileSync(outputPath, fileContent, 'utf8');
    
    console.log('✅ Successfully restored all songs!');
    console.log(`✅ Found and restored ${songs.length} songs`);
    console.log('✅ Preserved soundsLike feature for all songs');
    console.log(`✅ Updated ${outputPath}`);
    
    // List all song titles
    console.log('\nRestored songs:');
    songs.forEach((song, index) => {
      console.log(`${index + 1}. ${song.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the restoration
restoreSongs();
