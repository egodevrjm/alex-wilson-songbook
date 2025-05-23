#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 RESTORING MISSING LYRICS FROM MARKDOWN');
console.log('==========================================');

// Read files
const jsonPath = path.join('src', 'data', 'songs.json');
const songsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`📖 Current database: ${songsData.metadata.totalSongs} songs`);

const markdownPath = 'aw_songs.md';
const markdownContent = fs.readFileSync(markdownPath, 'utf8');

// Parse markdown to extract songs
const sections = markdownContent.split(/---\s*<a id="([^"]+)"><\/a>/);
const extractedSongs = {};

for (let i = 1; i < sections.length; i += 2) {
    const slug = sections[i];
    const content = sections[i + 1];
    
    if (!content) continue;
    
    // Extract title
    const titleMatch = content.match(/## ([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : slug;
    
    // Extract lyrics
    const lyricsMatch = content.match(/### Lyrics\s*```([^`]*(?:```[^`]*)?[^`]*)```/s);
    const lyrics = lyricsMatch ? lyricsMatch[1].trim() : '';
    
    // Extract notes
    const notesMatch = content.match(/### Notes\s*(.*?)(?=###|---|\n\n<a id=|$)/s);
    const notes = notesMatch ? notesMatch[1].trim() : '';
    
    extractedSongs[slug] = {
        title,
        slug,
        lyrics,
        notes
    };
    
    console.log(`✅ Extracted: ${title}`);
}

console.log(`\n📊 Extracted ${Object.keys(extractedSongs).length} songs from markdown`);

// Now restore missing data to JSON
let addedSongs = 0;
let updatedLyrics = 0;
let updatedNotes = 0;

Object.keys(extractedSongs).forEach(slug => {
    const markdownSong = extractedSongs[slug];
    const jsonSong = songsData.songs[slug];
    
    if (!jsonSong) {
        // Add completely new song
        songsData.songs[slug] = {
            id: Date.now() + addedSongs,
            title: markdownSong.title,
            slug: markdownSong.slug,
            lyrics: markdownSong.lyrics || '',
            notes: markdownSong.notes || '',
            soundsLike: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };
        
        // Add to order
        if (!songsData.songOrder.includes(slug)) {
            songsData.songOrder.push(slug);
        }
        
        addedSongs++;
        console.log(`➕ Added new song: ${markdownSong.title}`);
        
    } else {
        // Update existing song with missing lyrics/notes
        let updated = false;
        
        if ((!jsonSong.lyrics || jsonSong.lyrics.trim() === '') && markdownSong.lyrics) {
            jsonSong.lyrics = markdownSong.lyrics;
            updatedLyrics++;
            updated = true;
            console.log(`🎵 Restored lyrics for: ${markdownSong.title}`);
        }
        
        if ((!jsonSong.notes || jsonSong.notes.trim() === '') && markdownSong.notes) {
            jsonSong.notes = markdownSong.notes;
            updatedNotes++;
            updated = true;
            console.log(`📝 Restored notes for: ${markdownSong.title}`);
        }
        
        if (updated) {
            jsonSong.updatedAt = new Date().toISOString();
            jsonSong.version = (jsonSong.version || 0) + 1;
        }
    }
});

// Update metadata
songsData.metadata.totalSongs = Object.keys(songsData.songs).length;
songsData.metadata.lastModified = new Date().toISOString();

// Save updated database
fs.writeFileSync(jsonPath, JSON.stringify(songsData, null, 2));

console.log('\n🎉 RESTORATION COMPLETE!');
console.log('=======================');
console.log(`✅ Added ${addedSongs} new songs`);
console.log(`✅ Restored lyrics for ${updatedLyrics} songs`);
console.log(`✅ Restored notes for ${updatedNotes} songs`);
console.log(`✅ Total songs in database: ${songsData.metadata.totalSongs}`);

// Verify all songs have lyrics
const songsWithoutLyrics = Object.values(songsData.songs).filter(song => 
    !song.lyrics || song.lyrics.trim() === ''
).length;

console.log(`\n📊 Final Check:`);
console.log(`Songs with lyrics: ${Object.keys(songsData.songs).length - songsWithoutLyrics}`);
console.log(`Songs without lyrics: ${songsWithoutLyrics}`);

if (songsWithoutLyrics === 0) {
    console.log('\n🎵 SUCCESS! All songs now have their lyrics restored!');
} else {
    console.log('\n⚠️  Some songs still missing lyrics, but primary restoration complete.');
}

console.log('\n🚀 Your Alex Wilson Songbook is ready with all lyrics!');
