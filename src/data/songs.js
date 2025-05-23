import songsDb from './songs.json';
import { persistence } from '../utils/persistence.js';

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
  const timestamp = new Date().toISOString();
  
  // Generate slug if not provided
  const slug = song.slug || generateSlug(song.title);
  
  const newSong = {
    ...song,
    id: song.id || Date.now(),
    slug,
    soundsLike: song.soundsLike || "",
    updatedAt: timestamp,
    version: (song.version || 0) + 1,
    createdAt: song.createdAt || timestamp
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
  
  // Persist changes
  persistence.autoSave(songsDb);
  
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
  persistence.autoSave(songsDb);
  
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
  
  persistence.autoSave(songsDb);
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

  let markdown = `# ${songsDb.metadata.title}

*Exported on ${timestamp}*

Total songs: ${songsDb.metadata.totalSongs}
Last modified: ${songsDb.metadata.lastModified}

## Table of Contents

${getSongsInOrder().map((song, index) => 
  `${index + 1}. [${song.title}](#${song.slug})`
).join('\n')}

---

`;

  // Add each song
  getSongsInOrder().forEach(song => {
    markdown += `<a id="${song.slug}"></a>

## ${song.title}

### Lyrics

\`\`\`
${song.lyrics}
\`\`\`

### Notes

${song.notes}

${song.soundsLike ? `### Sounds Like

${song.soundsLike}

` : ''}### Metadata
- Created: ${song.createdAt}
- Modified: ${song.updatedAt}
- Version: ${song.version}

---

`;
  });

  return markdown;
};

// Helper function for generating slugs
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Initialize from localStorage if available
const loadFromStorage = () => {
  const stored = persistence.loadFromStorage();
  if (stored) {
    // Merge stored data with current data
    Object.assign(songsDb, stored);
  }
};

// Load on module initialization
loadFromStorage();

// Export the database for direct access if needed
export default songsDb;