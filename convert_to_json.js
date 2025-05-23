#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Convert the markdown backup to a JSON database format
 * This will become the new primary data source for persistent changes
 */

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

async function convertToJson() {
  try {
    console.log('🔄 Converting aw_songs.md to JSON database...');
    
    // Read the markdown backup
    const backupPath = './aw_songs.md';
    const content = fs.readFileSync(backupPath, 'utf8');
    
    console.log('📖 Parsing markdown file...');
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
      
      // Extract "sounds like" if it exists
      let soundsLike = '';
      const soundsLikeMatch = section.match(/What it sounds like:\s*([^\n]+)/);
      if (soundsLikeMatch) {
        soundsLike = soundsLikeMatch[1].trim();
      }
      
      // Clean notes
      notes = notes
        .replace(/^#+\s*.*$/gm, '')
        .replace(/^\s*$\n/gm, '')
        .trim();
      
      // Create song object with metadata
      const song = {
        id: Date.now() + i, // Unique ID for each song
        title,
        slug,
        lyrics,
        notes,
        soundsLike,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      
      songs.push(song);
    }
    
    // Create the JSON database structure
    const database = {
      metadata: {
        version: "1.0.0",
        title: "Alex Wilson Songbook",
        description: "Complete collection of Alex Wilson's country songs",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalSongs: songs.length
      },
      songs: songs.reduce((acc, song) => {
        acc[song.slug] = song;
        return acc;
      }, {}),
      songOrder: songs.map(song => song.slug) // Maintain order
    };
    
    // Write JSON database
    const jsonPath = './src/data/songs.json';
    fs.writeFileSync(jsonPath, JSON.stringify(database, null, 2), 'utf8');
    
    console.log('✅ JSON database created successfully!');
    console.log(`📊 Converted ${songs.length} songs`);
    console.log(`💾 Database saved to: ${jsonPath}`);
    
    // Create new songs.js that reads from JSON
    const newSongsJs = `import songsDb from './songs.json';

// Load songs from JSON database
export const songs = Object.values(songsDb.songs);

// Get database metadata
export const getMetadata = () => songsDb.metadata;

// Get songs in order
export const getSongsInOrder = () => 
  songsDb.songOrder.map(slug => songsDb.songs[slug]);

// Find song by slug
export const findSongBySlug = (slug) => songsDb.songs[slug];

// Add or update a song
export const addSong = (song) => {
  const slug = song.slug || generateSlug(song.title);
  const timestamp = new Date().toISOString();
  
  const newSong = {
    ...song,
    id: song.id || Date.now(),
    slug,
    soundsLike: song.soundsLike || "",
    updatedAt: timestamp,
    version: (song.version || 0) + 1
  };
  
  // Add to database
  songsDb.songs[slug] = newSong;
  
  // Add to order if new song
  if (!songsDb.songOrder.includes(slug)) {
    songsDb.songOrder.push(slug);
  }
  
  // Update metadata
  songsDb.metadata.lastModified = timestamp;
  songsDb.metadata.totalSongs = Object.keys(songsDb.songs).length;
  
  // Persist to JSON file
  persistDatabase();
  
  return newSong;
};

// Update specific song field
export const updateSong = (slug, updates) => {
  const song = songsDb.songs[slug];
  if (!song) return null;
  
  const updatedSong = {
    ...song,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: song.version + 1
  };
  
  songsDb.songs[slug] = updatedSong;
  songsDb.metadata.lastModified = new Date().toISOString();
  
  // Persist changes
  persistDatabase();
  
  return updatedSong;
};

// Update the soundsLike field for a song
export const updateSongSoundsLike = (slug, soundsLike) => {
  return updateSong(slug, { soundsLike });
};

// Delete a song
export const deleteSong = (slug) => {
  if (!songsDb.songs[slug]) return false;
  
  delete songsDb.songs[slug];
  songsDb.songOrder = songsDb.songOrder.filter(s => s !== slug);
  songsDb.metadata.lastModified = new Date().toISOString();
  songsDb.metadata.totalSongs = Object.keys(songsDb.songs).length;
  
  persistDatabase();
  return true;
};

// Search songs
export const searchSongs = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(songsDb.songs).filter(song => 
    song.title.toLowerCase().includes(lowercaseQuery) ||
    song.lyrics.toLowerCase().includes(lowercaseQuery) ||
    song.notes.toLowerCase().includes(lowercaseQuery) ||
    song.soundsLike.toLowerCase().includes(lowercaseQuery)
  );
};

// Persist database to file (for Node.js environments)
const persistDatabase = () => {
  if (typeof window === 'undefined' && typeof require !== 'undefined') {
    // Server-side: write to file
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'songs.json');
    
    try {
      fs.writeFileSync(dbPath, JSON.stringify(songsDb, null, 2), 'utf8');
      console.log('✅ Database persisted to file');
    } catch (error) {
      console.error('❌ Failed to persist database:', error);
    }
  } else {
    // Client-side: you might want to implement localStorage backup
    // or send updates to a server endpoint
    console.log('📝 Database updated in memory');
  }
};

// Export/import functions
export const exportToMarkdown = () => {
  const timestamp = new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });

  let markdown = \`# Alex Wilson Songbook

*Exported on \${timestamp}*

Total songs: \${songsDb.metadata.totalSongs}

## Table of Contents

\${getSongsInOrder().map((song, index) => 
  \`\${index + 1}. [\${song.title}](#\${song.slug})\`
).join('\\n')}

---

\`;

  // Add each song
  getSongsInOrder().forEach(song => {
    markdown += \`<a id="\${song.slug}"></a>

## \${song.title}

### Lyrics

\\\`\\\`\\\`
\${song.lyrics}
\\\`\\\`\\\`

### Notes

\${song.notes}

\${song.soundsLike ? \`### Sounds Like

\${song.soundsLike}

\` : ''}---

\`;
  });

  return markdown;
};

// Helper function for generating slugs
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .trim();
}

// Export the database for direct access if needed
export default songsDb;`;

    // Write the new songs.js
    const songsJsPath = './src/data/songs.js';
    fs.writeFileSync(songsJsPath, newSongsJs, 'utf8');
    
    console.log('✅ Updated songs.js to use JSON database');
    console.log('');
    console.log('🎉 Conversion complete!');
    console.log('');
    console.log('📁 Files created/updated:');
    console.log(`   • ${jsonPath} - Primary JSON database`);
    console.log(`   • ${songsJsPath} - Updated JavaScript module`);
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Test the application: npm run dev');
    console.log('   2. All changes will now persist automatically');
    console.log('   3. You can export to markdown anytime for backups');
    console.log('   4. Consider adding the JSON file to your git repository');
    
    // List all converted songs
    console.log('');
    console.log('📝 Converted songs:');
    songs.forEach((song, index) => {
      console.log(`   ${index + 1}. ${song.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    process.exit(1);
  }
}

// Run the conversion
convertToJson();
