// Script to restore all songs from backup and maintain 'sounds like' feature
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to clean up title for slug generation
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Function to extract songs from markdown backup
function parseSongsFromMarkdown(markdownContent) {
  const songs = [];
  
  // Split by '---' to separate songs
  const sections = markdownContent.split(/\n---\n/);
  
  // Skip the header section and table of contents
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    
    // Extract song ID from the first line
    const firstLineMatch = section.match(/<a id="([^"]+)"><\/a>/);
    if (!firstLineMatch) continue;
    
    const songId = firstLineMatch[1];
    
    // Extract title
    const titleMatch = section.match(/## (.+)/);
    if (!titleMatch) continue;
    
    const title = titleMatch[1].trim();
    
    // Extract lyrics (between ### Lyrics and ### Notes)
    const lyricsMatch = section.match(/### Lyrics\s*\n```[\s\S]*?\n([\s\S]*?)\n```/);
    const lyrics = lyricsMatch ? lyricsMatch[1].trim() : '';
    
    // Extract notes (everything after ### Notes)
    const notesMatch = section.match(/### Notes\s*\n([\s\S]*?)(?=\n### |$)/);
    let notes = notesMatch ? notesMatch[1].trim() : '';
    
    // Extract "sounds like" from notes
    let soundsLike = '';
    const soundsLikeMatches = [
      /What it sounds like:\s*([^\n]+)/,
      /Sounds like:\s*([^\n]+)/,
      /"sounds like": "([^"]+)"/,
      /soundsLike: "([^"]+)"/
    ];
    
    for (const regex of soundsLikeMatches) {
      const match = notes.match(regex);
      if (match) {
        soundsLike = match[1].trim();
        // Remove the "sounds like" line from notes to avoid duplication
        notes = notes.replace(match[0], '').trim();
        break;
      }
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
  }
  
  return songs;
}

// Function to create new songs.js file
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
    // Read the backup file
    console.log('Reading backup file...');
    const backupPath = join(__dirname, 'aw_songs.md');
    const backupContent = readFileSync(backupPath, 'utf8');
    
    // Parse songs from backup
    console.log('Parsing songs from backup...');
    const songs = parseSongsFromMarkdown(backupContent);
    
    console.log(`Found ${songs.length} songs in backup`);
    
    // Log some examples for verification
    console.log('\nSample songs:');
    songs.slice(0, 3).forEach(song => {
      console.log(`- ${song.title} (slug: ${song.slug})`);
      if (song.soundsLike) {
        console.log(`  Sounds like: ${song.soundsLike}`);
      }
    });
    
    // Create new songs.js file
    console.log('\nGenerating new songs.js file...');
    const songsFileContent = createSongsFile(songs);
    
    // Write to file
    const songsFilePath = join(__dirname, 'src', 'data', 'songs.js');
    writeFileSync(songsFilePath, songsFileContent);
    
    console.log(`\n✅ Successfully restored ${songs.length} songs to ${songsFilePath}`);
    console.log('\nFeatures preserved:');
    console.log('- All song titles, slugs, lyrics, and notes');
    console.log(`- "Sounds like" feature maintained for ${songs.filter(s => s.soundsLike).length} songs`);
    console.log('- Original addSong function preserved');
    
    // Create summary
    const songsWithSoundsLike = songs.filter(s => s.soundsLike).length;
    console.log(`\nSummary:`);
    console.log(`- Total songs: ${songs.length}`);
    console.log(`- Songs with "sounds like": ${songsWithSoundsLike}`);
    console.log(`- Songs without "sounds like": ${songs.length - songsWithSoundsLike}`);
    
  } catch (error) {
    console.error('Error restoring songs:', error);
    process.exit(1);
  }
}

// Run the restoration
if (import.meta.url === `file://${process.argv[1]}`) {
  restoreSongs();
}

export { restoreSongs };
