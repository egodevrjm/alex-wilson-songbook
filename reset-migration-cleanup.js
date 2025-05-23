/**
 * Reset migration and clean up empty songs
 * Run this in the browser console to fix the recurring empty songs issue
 */

const resetAndCleanup = async () => {
  console.log('🔧 Starting migration reset and cleanup...\n');
  
  try {
    // Step 1: Clear the migration flag from IndexedDB
    console.log('1️⃣ Clearing migration flag...');
    const dbRequest = indexedDB.open('AlexWilsonSongbookDB', 2);
    
    await new Promise((resolve, reject) => {
      dbRequest.onsuccess = async (event) => {
        const db = event.target.result;
        
        try {
          // Clear migration flag
          const transaction = db.transaction(['settings'], 'readwrite');
          const store = transaction.objectStore('settings');
          store.delete('migration-completed');
          
          await new Promise((resolve) => {
            transaction.oncomplete = resolve;
          });
          
          console.log('✅ Migration flag cleared');
          db.close();
          resolve();
        } catch (error) {
          db.close();
          reject(error);
        }
      };
      
      dbRequest.onerror = reject;
    });
    
    // Step 2: Remove empty songs from IndexedDB
    console.log('\n2️⃣ Scanning for empty songs...');
    const { songStorage } = await import('/src/utils/storage/songStorage.js');
    await songStorage.init();
    
    const allSongs = await songStorage.getAllSongs();
    console.log(`Found ${allSongs.length} total songs`);
    
    // Find empty songs
    const emptySongs = allSongs.filter(song => {
      // More aggressive empty detection
      const hasValidTitle = song.title && 
                          song.title.trim() && 
                          song.title !== song.slug &&
                          song.title.length > 2;
      const hasLyrics = song.lyrics && song.lyrics.trim().length > 10;
      const hasNotes = song.notes && song.notes.trim().length > 5;
      const hasSoundsLike = song.soundsLike && song.soundsLike.trim();
      const hasAudio = song.audio;
      const hasImage = song.image;
      
      // Consider empty if no valid title AND no substantial content
      const lacksContent = !hasLyrics && !hasNotes && !hasSoundsLike && !hasAudio && !hasImage;
      const hasOnlySlugTitle = song.title === song.slug || !song.title || song.title.trim().length < 3;
      
      return (hasOnlySlugTitle && lacksContent) || (!hasValidTitle && !hasLyrics && !hasNotes);
    });
    
    console.log(`\nFound ${emptySongs.length} empty songs:`);
    emptySongs.forEach(song => {
      console.log(`- ${song.slug} (title: "${song.title || 'none'}")`);
    });
    
    if (emptySongs.length > 0) {
      console.log('\n3️⃣ Removing empty songs...');
      
      for (const song of emptySongs) {
        try {
          await songStorage.deleteSong(song.slug);
          console.log(`✓ Removed: ${song.slug}`);
        } catch (error) {
          console.error(`✗ Failed to remove ${song.slug}:`, error);
        }
      }
    }
    
    // Step 3: Clean up any remaining localStorage entries
    console.log('\n4️⃣ Cleaning localStorage remnants...');
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('lyrics-') || 
      key.startsWith('notes-') || 
      key.startsWith('title-') || 
      key.startsWith('soundsLike-') ||
      key.startsWith('image-') ||
      key.startsWith('audio-')
    );
    
    if (localStorageKeys.length > 0) {
      console.log(`Found ${localStorageKeys.length} individual song entries in localStorage`);
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ Cleaned localStorage');
    } else {
      console.log('✅ localStorage already clean');
    }
    
    console.log('\n✨ Cleanup complete!');
    console.log('🔄 Please refresh the page to see the changes.');
    console.log('\n⚠️  Note: The migration will run once more on next load, but will skip empty songs.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Run it
resetAndCleanup();
