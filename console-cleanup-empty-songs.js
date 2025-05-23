/**
 * Quick console script to remove empty songs
 * Run this in the browser console to clean up migration artifacts
 */

// Import the storage module (this assumes the app is loaded)
const checkAndRemoveEmptySongs = async () => {
  console.log('🔍 Scanning for empty songs...');
  
  // Get all songs from IndexedDB
  const { songStorage } = await import('/src/utils/storage/songStorage.js');
  const allSongs = await songStorage.getAllSongs();
  
  console.log(`Found ${allSongs.length} total songs`);
  
  // Find empty songs
  const emptySongs = allSongs.filter(song => {
    const hasTitle = song.title && song.title.trim() && song.title !== song.slug;
    const hasLyrics = song.lyrics && song.lyrics.trim();
    const hasNotes = song.notes && song.notes.trim();
    const hasSoundsLike = song.soundsLike && song.soundsLike.trim();
    const hasAudio = song.audio;
    const hasImage = song.image;
    
    // Song is empty if it has no meaningful content
    return !hasTitle && !hasLyrics && !hasNotes && !hasSoundsLike && !hasAudio && !hasImage;
  });
  
  console.log(`Found ${emptySongs.length} empty songs:`);
  emptySongs.forEach(song => {
    console.log(`- ${song.slug} (title: "${song.title || 'none'}")`);
  });
  
  if (emptySongs.length === 0) {
    console.log('✅ No empty songs found!');
    return;
  }
  
  // Ask for confirmation
  if (confirm(`Found ${emptySongs.length} empty songs. Remove them all?`)) {
    console.log('🗑️ Removing empty songs...');
    
    for (const song of emptySongs) {
      try {
        await songStorage.deleteSong(song.slug);
        console.log(`✓ Removed: ${song.slug}`);
      } catch (error) {
        console.error(`✗ Failed to remove ${song.slug}:`, error);
      }
    }
    
    console.log('✅ Cleanup complete! Refresh the page to see changes.');
  } else {
    console.log('❌ Cleanup cancelled');
  }
};

// Run the cleanup
checkAndRemoveEmptySongs();
