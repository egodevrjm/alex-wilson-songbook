/**
 * Emergency localStorage cleanup script
 * Run this in the browser console if localStorage is too full to complete migration
 */

console.log('🧹 Starting emergency localStorage cleanup...\n');

// Get all localStorage keys
const allKeys = Object.keys(localStorage);
console.log(`Found ${allKeys.length} total keys in localStorage\n`);

// Categorize keys
const songKeys = {
  lyrics: [],
  notes: [],
  title: [],
  soundsLike: [],
  image: [],
  audio: [],
  other: []
};

// Sort keys by category
allKeys.forEach(key => {
  if (key.startsWith('lyrics-')) songKeys.lyrics.push(key);
  else if (key.startsWith('notes-')) songKeys.notes.push(key);
  else if (key.startsWith('title-')) songKeys.title.push(key);
  else if (key.startsWith('soundsLike-')) songKeys.soundsLike.push(key);
  else if (key.startsWith('image-')) songKeys.image.push(key);
  else if (key.startsWith('audio-')) songKeys.audio.push(key);
  else songKeys.other.push(key);
});

// Display counts
console.log('📊 Storage breakdown:');
console.log(`- Lyrics entries: ${songKeys.lyrics.length}`);
console.log(`- Notes entries: ${songKeys.notes.length}`);
console.log(`- Title entries: ${songKeys.title.length}`);
console.log(`- SoundsLike entries: ${songKeys.soundsLike.length}`);
console.log(`- Image entries: ${songKeys.image.length}`);
console.log(`- Audio entries: ${songKeys.audio.length}`);
console.log(`- Other entries: ${songKeys.other.length}`);

// Calculate approximate storage used
const calculateSize = (keys) => {
  let totalSize = 0;
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      totalSize += key.length + value.length;
    }
  });
  return totalSize;
};

const totalSize = calculateSize(allKeys);
console.log(`\n💾 Estimated total storage used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// Function to clean up song data
const cleanupSongData = () => {
  console.log('\n🗑️ Removing individual song property entries...');
  
  let removed = 0;
  const keysToRemove = [
    ...songKeys.lyrics,
    ...songKeys.notes,
    ...songKeys.title,
    ...songKeys.soundsLike,
    ...songKeys.image,
    ...songKeys.audio
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      removed++;
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  });
  
  console.log(`✅ Removed ${removed} song property entries`);
  
  // Check new size
  const newSize = calculateSize(Object.keys(localStorage));
  console.log(`\n💾 New storage size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📉 Freed up: ${((totalSize - newSize) / 1024 / 1024).toFixed(2)} MB`);
};

// Provide options to user
console.log('\n⚠️  WARNING: This will remove individual song properties from localStorage.');
console.log('The app will migrate data from other sources (custom-songs, etc.)');
console.log('\nTo proceed with cleanup, run: cleanupSongData()');
console.log('To see what would be removed without deleting, run: songKeys');

// Make functions available globally
window.cleanupSongData = cleanupSongData;
window.songKeys = songKeys;
