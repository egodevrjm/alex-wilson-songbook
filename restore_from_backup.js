const fs = require('fs');
const path = require('path');

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Helper function to clean up song title
function cleanTitle(title) {
  // Remove markdown formatting and IDs
  return title
    .replace(/^#+\s*/, '') // Remove markdown headers
    .replace(/\s*\(\d+\)$/, '') // Remove trailing numbers in parentheses
    .replace(/\s*-\s*\d+$/, '') // Remove trailing dash and numbers
    .replace(/^\d+\.\s*/, '') // Remove leading numbers and dots
    .replace(/\[.*?\]/g, '') // Remove any square brackets content
    .replace(/Title:\s*/i, '') // Remove "Title:" prefix
    .trim();
}

// Parse the markdown backup file
function parseMarkdownBackup(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const songs = [];
  
  // Split by song sections (## headers with links)
  const songSections = content.split(/(?=<a id="[^"]*"><\/a>\n\n## )/);
  
  // Skip the first section (it's just the table of contents)
  for (let i = 1; i < songSections.length; i++) {
    const section = songSections[i];
    
    // Extract title
    const titleMatch = section.match(/## (.+?)(?:\n|$)/);
    if (!titleMatch) continue;
    
    const rawTitle = titleMatch[1];
    const title = cleanTitle(rawTitle);
    const slug = generateSlug(title);
    
    // Extract lyrics (content between triple backticks)
    const lyricsMatches = section.match(/```[\s\S]*?```/g);
    let lyrics = '';
    
    if (lyricsMatches && lyricsMatches.length > 0) {
      // Get the first/main lyrics block
      lyrics = lyricsMatches[0]
        .replace(/^```[^\n]*\n?/, '') // Remove opening ```
        .replace(/\n?```$/, '') // Remove closing ```
        .trim();
    }
    
    // Extract notes section
    let notes = '';
    const notesMatch = section.match(/### Notes\s*([\s\S]*?)(?=\n---|\n<a id=|$)/);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    }
    
    // If no explicit notes section, take everything after lyrics
    if (!notes) {
      const afterLyricsMatch = section.match(/```[\s\S]*?```\s*([\s\S]*?)(?=\n---|\n<a id=|$)/);
      if (afterLyricsMatch) {
        notes = afterLyricsMatch[1].trim();
      }
    }
    
    // Clean up notes (remove extra markdown artifacts)
    notes = notes
      .replace(/^#+\s*.*$/gm, '') // Remove remaining headers
      .replace(/^\s*$\n/gm, '') // Remove empty lines
      .trim();
    
    // Create song object
    const song = {
      title,
      slug,
      lyrics,
      notes,
      soundsLike: "" // Preserve the new feature
    };
    
    songs.push(song);
  }
  
  return songs;
}

// Generate the new songs.js file
function generateSongsFile(songs, outputPath) {
  const songsCode = songs.map(song => {
    const escapedLyrics = song.lyrics.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    const escapedNotes = song.notes.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    
    return `  {
    title: "${song.title}",
    slug: "${song.slug}",
    lyrics: \`${escapedLyrics}\`,
    notes: \`${escapedNotes}\`,
    soundsLike: "${song.soundsLike}",
  }`;
  }).join(',\n');

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

  fs.writeFileSync(outputPath, fileContent, 'utf8');
}

// Main execution
try {
  const backupPath = path.join(__dirname, 'aw_songs.md');
  const outputPath = path.join(__dirname, 'src', 'data', 'songs.js');
  
  console.log('Parsing backup file...');
  const songs = parseMarkdownBackup(backupPath);
  
  console.log(`Found ${songs.length} songs in backup.`);
  console.log('Song titles:');
  songs.forEach((song, index) => {
    console.log(`${index + 1}. ${song.title}`);
  });
  
  console.log('\nGenerating updated songs.js file...');
  generateSongsFile(songs, outputPath);
  
  console.log(`✅ Successfully restored all ${songs.length} songs to ${outputPath}`);
  console.log('✅ Preserved the "soundsLike" feature for all songs');
  
} catch (error) {
  console.error('❌ Error during restoration:', error.message);
  process.exit(1);
}
