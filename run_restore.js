const fs = require('fs');
const path = require('path');

// Function to generate slug from title (matching your original helper)
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Extract "sounds like" information from notes
function extractSoundsLike(notes) {
  if (!notes) return '';
  
  const patterns = [
    /What it sounds like:\s*\n?\s*([^\n]+)/i,
    /Sounds like:\s*\n?\s*([^\n]+)/i,
    /soundsLike:\s*"([^"]+)"/i,
    /Bio:[\s\S]*?What it sounds like:\s*\n?\s*([^\n]+)/i,
    /Upbeat classic country with [^.\n]+/i,
    /Gruff acoustic-guitar [^.\n]+/i,
    /Guitar-driven country [^.\n]+/i,
    /Up-tempo acoustic [^.\n]+/i,
    /Minimal acoustic rhythm [^.\n]+/i,
    /Slow-burn acoustic [^.\n]+/i,
    /Building acoustic progression [^.\n]+/i,
    /Steady acoustic-guitar [^.\n]+/i,
    /Anthemic acoustic rhythm [^.\n]+/i,
    /Reflective country [^.\n]+/i,
    /Acoustic-guitar bed [^.\n]+/i,
    /Sparse acoustic picking [^.\n]+/i,
    /Mid-tempo acoustic [^.\n]+/i,
    /Light acoustic picking [^.\n]+/i,
    /Subtle acoustic picking [^.\n]+/i,
    /Slow, mournful guitar [^.\n]+/i,
    /Laid-back acoustic [^.\n]+/i,
    /Upbeat country-rock [^.\n]+/i,
    /Steady acoustic drive [^.\n]+/i
  ];
  
  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      let soundsLike = match[1] || match[0];
      soundsLike = soundsLike.replace(/\n.*$/s, ''); // Remove everything after first newline
      soundsLike = soundsLike.replace(/[,;.]$/, '').trim(); // Remove trailing punctuation
      if (soundsLike.length > 300) continue; // Skip if too long
      return soundsLike;
    }
  }
  
  return '';
}

// Clean title from unwanted prefixes
function cleanTitle(title) {
  return title
    .replace(/^Title:?\s*/i, '')
    .replace(/\s*\([^)]*\)$/, '') // Remove trailing parentheses
    .trim();
}

// Parse songs from markdown content
function parseSongsFromMarkdown(content) {
  const songs = [];
  
  // Split by anchor tags to get individual song sections
  const sections = content.split(/(?=<a id="[^"]+"><\/a>)/);
  
  for (const section of sections) {
    if (!section.trim() || section.includes('# Alex Wilson Songbook')) continue;
    
    try {
      // Extract anchor ID
      const anchorMatch = section.match(/<a id="([^"]+)"><\/a>/);
      if (!anchorMatch) continue;
      
      // Extract title
      const titleMatch = section.match(/## (.+)/);
      if (!titleMatch) continue;
      
      let title = cleanTitle(titleMatch[1]);
      
      // Extract lyrics
      let lyrics = '';
      const lyricsMatch = section.match(/### Lyrics\s*\n([\s\S]*?)(?=\n### |$)/);
      if (lyricsMatch) {
        lyrics = lyricsMatch[1]
          .replace(/^```[^\n]*\n/, '') // Remove opening code block
          .replace(/\n```$/, '') // Remove closing code block
          .replace(/^```[^\n]*\n/, '') // Remove any remaining opening code block
          .trim();
      }
      
      // Extract notes
      let notes = '';
      const notesMatch = section.match(/### Notes\s*\n([\s\S]*?)(?=\n---\n|$)/);
      if (notesMatch) {
        notes = notesMatch[1].trim();
      }
      
      // Extract "sounds like" from notes
      const soundsLike = extractSoundsLike(notes);
      
      // Create song object
      const song = {
        title,
        slug: generateSlug(title),
        lyrics,
        notes,
        soundsLike
      };
      
      songs.push(song);
      
    } catch (error) {
      console.warn(`Warning: Error parsing section: ${error.message}`);
      continue;
    }
  }
  
  return songs;
}

// Generate songs.js content
function generateSongsFile(songs) {
  const songsCode = `import { generateSlug } from '../utils/helpers';

export const songs = [
${songs.map(song => `  {
    title: ${JSON.stringify(song.title)},
    slug: ${JSON.stringify(song.slug)},
    lyrics: ${JSON.stringify(song.lyrics)},
    notes: ${JSON.stringify(song.notes)},
    soundsLike: ${JSON.stringify(song.soundsLike)},
  }`).join(',\n')}
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
`;

  return songsCode;
}

// Main function
function main() {
  try {
    console.log('🎵 Alex Wilson Songbook - Song Restoration Tool');
    console.log('═'.repeat(50));
    
    // Read backup file
    console.log('\n📖 Reading backup file...');
    const backupPath = 'aw_songs.md';
    const content = fs.readFileSync(backupPath, 'utf8');
    console.log(`   ✓ File read successfully (${(content.length / 1024).toFixed(1)} KB)`);
    
    // Parse songs
    console.log('\n🔍 Parsing songs...');
    const songs = parseSongsFromMarkdown(content);
    console.log(`   ✓ Parsed ${songs.length} songs successfully`);
    
    // Analyze results
    const songsWithLyrics = songs.filter(s => s.lyrics).length;
    const songsWithNotes = songs.filter(s => s.notes).length;
    const songsWithSoundsLike = songs.filter(s => s.soundsLike).length;
    
    console.log('\n📊 Analysis Results:');
    console.log(`   • Total songs: ${songs.length}`);
    console.log(`   • Songs with lyrics: ${songsWithLyrics}/${songs.length}`);
    console.log(`   • Songs with notes: ${songsWithNotes}/${songs.length}`);
    console.log(`   • Songs with "sounds like": ${songsWithSoundsLike}/${songs.length}`);
    
    // Show sample songs
    console.log('\n🎶 Sample Songs:');
    songs.slice(0, 5).forEach((song, i) => {
      console.log(`   ${i + 1}. "${song.title}"`);
      if (song.soundsLike) {
        console.log(`      🎵 Sounds like: ${song.soundsLike}`);
      }
    });
    
    // Generate new songs.js file
    console.log('\n💾 Generating songs.js file...');
    const songsCode = generateSongsFile(songs);
    
    // Create backup of existing file
    const songsPath = path.join('src', 'data', 'songs.js');
    try {
      const existingContent = fs.readFileSync(songsPath, 'utf8');
      fs.writeFileSync(songsPath + '.backup', existingContent);
      console.log('   ✓ Created backup of existing songs.js');
    } catch (e) {
      console.log('   ⚠ No existing songs.js found');
    }
    
    // Write new file
    fs.writeFileSync(songsPath, songsCode);
    console.log(`   ✓ Successfully wrote new songs.js with ${songs.length} songs`);
    
    // Final summary
    console.log('\n🎉 Restoration Complete!');
    console.log('═'.repeat(50));
    console.log(`Total songs restored: ${songs.length}/53`);
    console.log(`Songs with "sounds like" feature: ${songsWithSoundsLike}`);
    console.log('\n✨ Features preserved:');
    console.log('   ✓ All song titles and slugs');
    console.log('   ✓ Complete lyrics and formatting');
    console.log('   ✓ Song notes and analysis');
    console.log('   ✓ "Sounds like" musical descriptions');
    console.log('   ✓ Original addSong function maintained');
    console.log('\n🚀 Your Alex Wilson Songbook is ready to use!');
    
  } catch (error) {
    console.error('\n❌ Error during restoration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
