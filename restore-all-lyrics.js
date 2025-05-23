#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYSING SONG DATA');
console.log('===================');

// Read the JSON database
const jsonPath = path.join('src', 'data', 'songs.json');
const songsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Read the markdown export
const markdownPath = 'aw_songs.md';
const markdownContent = fs.readFileSync(markdownPath, 'utf8');

console.log(`JSON Database: ${songsData.metadata.totalSongs} songs`);

// Parse markdown to find sections
const markdownSections = markdownContent.split('## ').filter(section => section.trim());
const markdownSongCount = markdownSections.length - 1; // First section is header
console.log(`Markdown Export: ${markdownSongCount} songs`);

// Extract song data from markdown
const markdownSongs = {};
markdownSections.forEach(section => {
  if (section.includes('### Lyrics')) {
    const title = section.split('\n')[0].trim();
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    // Extract lyrics between ``` blocks
    const lyricsMatch = section.match(/```([\s\S]*?)```/);
    const lyrics = lyricsMatch ? lyricsMatch[1].trim() : '';
    
    // Extract notes after ### Notes
    const notesMatch = section.match(/### Notes([\s\S]*?)(?=###|---|\n\n<a id=|$)/);
    const notes = notesMatch ? notesMatch[1].trim() : '';
    
    markdownSongs[slug] = {
      title,
      slug,
      lyrics,
      notes
    };
  }
});

console.log(`\nParsed ${Object.keys(markdownSongs).length} songs from markdown`);

// Find songs with missing lyrics in JSON
let missingLyrics = 0;
let missingFromJson = 0;

console.log('\n🔍 COMPARING LYRICS...');
console.log('====================');

Object.keys(songsData.songs).forEach(slug => {
  const jsonSong = songsData.songs[slug];
  const markdownSong = markdownSongs[slug];
  
  if (!markdownSong) {
    console.log(`❌ Song "${jsonSong.title}" exists in JSON but not in markdown`);
    missingFromJson++;
    return;
  }
  
  if (!jsonSong.lyrics || jsonSong.lyrics.trim() === '') {
    if (markdownSong.lyrics && markdownSong.lyrics.trim() !== '') {
      console.log(`⚠️  Song "${jsonSong.title}" has lyrics in markdown but not in JSON`);
      missingLyrics++;
    }
  }
});

console.log('\n📊 SUMMARY');
console.log('==========');
console.log(`Songs in JSON: ${Object.keys(songsData.songs).length}`);
console.log(`Songs in Markdown: ${Object.keys(markdownSongs).length}`);
console.log(`Songs missing lyrics in JSON: ${missingLyrics}`);
console.log(`Songs missing from JSON: ${missingFromJson}`);

if (missingLyrics > 0 || missingFromJson > 0) {
  console.log('\n🔧 RECOVERY NEEDED');
  console.log('=================');
  console.log('Some lyrics and/or songs are missing from the JSON database.');
  console.log('Would you like to run the recovery script? (y/n)');
  
  // For automated recovery, let's proceed
  console.log('\n🚀 STARTING AUTOMATED RECOVERY...');
  
  // Add missing songs and lyrics
  let addedSongs = 0;
  let restoredLyrics = 0;
  
  Object.keys(markdownSongs).forEach(slug => {
    const markdownSong = markdownSongs[slug];
    const jsonSong = songsData.songs[slug];
    
    if (!jsonSong) {
      // Add new song
      songsData.songs[slug] = {
        id: Date.now() + addedSongs,
        title: markdownSong.title,
        slug: markdownSong.slug,
        lyrics: markdownSong.lyrics,
        notes: markdownSong.notes,
        soundsLike: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      
      // Add to song order
      if (!songsData.songOrder.includes(slug)) {
        songsData.songOrder.push(slug);
      }
      
      addedSongs++;
      console.log(`✅ Added song: ${markdownSong.title}`);
    } else if (!jsonSong.lyrics || jsonSong.lyrics.trim() === '') {
      // Restore lyrics
      if (markdownSong.lyrics && markdownSong.lyrics.trim() !== '') {
        songsData.songs[slug].lyrics = markdownSong.lyrics;
        songsData.songs[slug].updatedAt = new Date().toISOString();
        songsData.songs[slug].version = (jsonSong.version || 0) + 1;
        restoredLyrics++;
        console.log(`✅ Restored lyrics for: ${markdownSong.title}`);
      }
    }
  });
  
  // Update metadata
  songsData.metadata.totalSongs = Object.keys(songsData.songs).length;
  songsData.metadata.lastModified = new Date().toISOString();
  
  // Save updated database
  fs.writeFileSync(jsonPath, JSON.stringify(songsData, null, 2));
  
  console.log('\n🎉 RECOVERY COMPLETE!');
  console.log('==================');
  console.log(`✅ Added ${addedSongs} new songs`);
  console.log(`✅ Restored lyrics for ${restoredLyrics} songs`);
  console.log(`✅ Total songs in database: ${songsData.metadata.totalSongs}`);
  console.log('\n🚀 Your Alex Wilson Songbook is fully restored!');
} else {
  console.log('\n✅ All songs and lyrics are present in the JSON database!');
  console.log('No recovery needed.');
}
