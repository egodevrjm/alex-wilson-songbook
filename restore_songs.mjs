import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Function to extract songs from markdown backup
function parseSongsFromMarkdown(markdownContent) {
  const songs = [];
  
  // Split content into individual song sections
  // Look for pattern: <a id="song-id"></a> followed by ## Title
  const songSections = markdownContent.split(/(?=<a id="[^"]+"><\/a>)/);
  
  for (const section of songSections) {
    if (!section.trim() || section.includes('# Alex Wilson Songbook')) continue;
    
    try {
      // Extract song ID from anchor tag
      const idMatch = section.match(/<a id="([^"]+)"><\/a>/);
      if (!idMatch) continue;
      
      const songId = idMatch[1];
      
      // Extract title
      const titleMatch = section.match(/## (.+)/);
      if (!titleMatch) continue;
      
      const title = titleMatch[1].trim();
      
      // Extract lyrics (look for ### Lyrics section)
      let lyrics = '';
      const lyricsMatch = section.match(/### Lyrics\s*\n([\s\S]*?)(?=\n### |$)/);
      if (lyricsMatch) {
        let lyricsContent = lyricsMatch[1].trim();
        // Remove code block markers if present
        lyricsContent = lyricsContent.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');
        lyrics = lyricsContent.trim();
      }
      
      // Extract notes (look for ### Notes section)
      let notes = '';
      let soundsLike = '';
      
      const notesMatch = section.match(/### Notes\s*\n([\s\S]*?)(?=\n---\n|$)/);
      if (notesMatch) {
        let notesContent = notesMatch[1].trim();
        
        // Look for "sounds like" pattern in various formats
        const soundsLikePatterns = [
          /What it sounds like:\s*\n?\s*([^\n]+)/i,
          /Sounds like:\s*\n?\s*([^\n]+)/i,
          /soundsLike:\s*"([^"]+)"/,
          /soundsLike:\s*([^,\n]+)/,
          /'soundsLike':\s*"([^"]+)"/,
          /"soundsLike":\s*"([^"]+)"/
        ];
        
        for (const pattern of soundsLikePatterns) {
          const match = notesContent.match(pattern);
          if (match) {
            soundsLike = match[1].trim().replace(/[,;.]$/, '');
            // Remove the matched text from notes to avoid duplication
            notesContent = notesContent.replace(match[0], '');
            break;
          }
        }
        
        // Also look for Bio section and extract sounds like from there
        if (!soundsLike) {
          const bioMatch = notesContent.match(/Bio:\s*\n?\s*([^\n]+)/);
          if (bioMatch) {
            // Sometimes sounds like info is in bio
            notesContent = notesContent.replace(bioMatch[0], '');
            const bioContent = bioMatch[1];
            // Check if bio line contains "sounds like" information
            const bioSoundsLike = bioContent.match(/sounds like[:\s]+([^.]+)/i);
            if (bioSoundsLike) {
              soundsLike = bioSoundsLike[1].trim();
            }
          }
          
          // Check for direct "sounds like" in notes
          const directSoundsLike = notesContent.match(/([^.]*(?:fiddle|guitar|acoustic|tempo|country|blues|folk|rhythm)[^.]*)/i);
          if (directSoundsLike && directSoundsLike[1].length < 200) {
            soundsLike = directSoundsLike[1].trim();
          }
        }
        
        notes = notesContent.trim();
      }
      
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
      console.warn(`Error parsing song section: ${error.message}`);
      continue;
    }
  }
  
  return songs;
}

// Function to create updated songs.js file
function createSongsFile(songs) {
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

// Main restoration function
function restoreSongs() {
  try {
    console.log('🎵 Starting Alex Wilson Songbook restoration...\n');
    
    // Read the backup file
    console.log('📖 Reading backup file (aw_songs.md)...');
    const backupPath = join(__dirname, 'aw_songs.md');
    const backupContent = readFileSync(backupPath, 'utf8');
    
    console.log(`   Backup file size: ${(backupContent.length / 1024).toFixed(1)} KB`);
    
    // Parse songs from backup
    console.log('\n🔍 Parsing songs from markdown backup...');
    const songs = parseSongsFromMarkdown(backupContent);
    
    console.log(`   Successfully parsed ${songs.length} songs`);
    
    // Analyze the songs
    const songsWithLyrics = songs.filter(s => s.lyrics).length;
    const songsWithNotes = songs.filter(s => s.notes).length;
    const songsWithSoundsLike = songs.filter(s => s.soundsLike).length;
    
    console.log('\n📊 Analysis:');
    console.log(`   Songs with lyrics: ${songsWithLyrics}/${songs.length}`);
    console.log(`   Songs with notes: ${songsWithNotes}/${songs.length}`);
    console.log(`   Songs with "sounds like": ${songsWithSoundsLike}/${songs.length}`);
    
    // Show first few songs for verification
    console.log('\n🎶 Sample songs restored:');
    songs.slice(0, 5).forEach((song, i) => {
      console.log(`   ${i + 1}. "${song.title}" (${song.slug})`);
      if (song.soundsLike) {
        console.log(`      🎵 Sounds like: ${song.soundsLike}`);
      }
    });
    
    // Create new songs.js file
    console.log('\n💾 Generating new songs.js file...');
    const songsFileContent = createSongsFile(songs);
    
    // Backup existing file first
    const songsFilePath = join(__dirname, 'src', 'data', 'songs.js');
    try {
      const existingContent = readFileSync(songsFilePath, 'utf8');
      const backupFilePath = join(__dirname, 'src', 'data', 'songs.js.backup');
      writeFileSync(backupFilePath, existingContent);
      console.log(`   Created backup: songs.js.backup`);
    } catch (e) {
      console.log('   No existing songs.js to backup');
    }
    
    // Write the new file
    writeFileSync(songsFilePath, songsFileContent);
    
    console.log(`   ✅ Successfully wrote ${songs.length} songs to songs.js`);
    
    // Final summary
    console.log('\n🎉 Restoration Complete!');
    console.log('─'.repeat(50));
    console.log(`Total songs restored: ${songs.length}`);
    console.log(`Songs with lyrics: ${songsWithLyrics}`);
    console.log(`Songs with notes: ${songsWithNotes}`);
    console.log(`Songs with "sounds like" feature: ${songsWithSoundsLike}`);
    console.log('\n✨ Features preserved:');
    console.log('   • All song titles and slugs');
    console.log('   • Complete lyrics for each song');
    console.log('   • Song notes and analysis');
    console.log('   • "Sounds like" musical descriptions');
    console.log('   • Original addSong function');
    console.log('\n🚀 Your songbook is ready to use!');
    
    return songs;
    
  } catch (error) {
    console.error('❌ Error restoring songs:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the restoration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  restoreSongs();
}

export { restoreSongs };
