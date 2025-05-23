/**
 * Direct song inspection and removal
 * This will show you all songs and let you remove specific ones
 */

console.log('Loading song data...\n');

// Get songs from IndexedDB directly
const inspectAndClean = async () => {
  // Open the database
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('AlexWilsonSongbookDB', 2);
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = reject;
  });

  // Get all songs
  const transaction = db.transaction(['songs'], 'readonly');
  const store = transaction.objectStore('songs');
  const songs = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = reject;
  });

  console.log(`Total songs: ${songs.length}\n`);

  // Show first 10 songs
  console.log('First 10 songs:');
  songs.slice(0, 10).forEach((song, index) => {
    console.log(`${index + 1}. "${song.title || '(no title)'}" [${song.slug}]`);
    console.log(`   Lyrics: ${song.lyrics ? song.lyrics.substring(0, 50) + '...' : '(none)'}`);
    console.log(`   Empty: ${(!song.title || song.title === song.slug) && !song.lyrics && !song.notes ? '⚠️ YES' : 'No'}`);
    console.log('');
  });

  // Find likely empty songs
  const empty = songs.filter(s => {
    const noRealTitle = !s.title || s.title === s.slug || s.title.trim() === '';
    const noLyrics = !s.lyrics || s.lyrics.trim() === '';
    const noNotes = !s.notes || s.notes.trim() === '';
    const noAudio = !s.audio;
    const noImage = !s.image;
    const noSoundsLike = !s.soundsLike || s.soundsLike.trim() === '';
    
    return noRealTitle && noLyrics && noNotes && noAudio && noImage && noSoundsLike;
  });

  console.log(`\n🗑️ Found ${empty.length} empty songs:`);
  empty.forEach((song, i) => {
    console.log(`${i + 1}. ${song.slug}`);
  });

  // Create removal functions
  window.removeAllEmpty = async () => {
    const { songStorage } = await import('/src/utils/storage/songStorage.js');
    console.log(`Removing ${empty.length} empty songs...`);
    
    for (const song of empty) {
      await songStorage.deleteSong(song.slug);
      console.log(`Removed: ${song.slug}`);
    }
    
    console.log('Done! Refresh the page.');
  };

  window.removeBySlug = async (slug) => {
    const { songStorage } = await import('/src/utils/storage/songStorage.js');
    await songStorage.deleteSong(slug);
    console.log(`Removed: ${slug}`);
  };

  window.removeFirst = async (count = 5) => {
    const { songStorage } = await import('/src/utils/storage/songStorage.js');
    const toRemove = songs.slice(0, count);
    
    for (const song of toRemove) {
      await songStorage.deleteSong(song.slug);
      console.log(`Removed: ${song.slug}`);
    }
    
    console.log(`Removed first ${count} songs. Refresh the page.`);
  };

  console.log('\n📌 Commands:');
  console.log('removeAllEmpty() - Remove all empty songs');
  console.log('removeBySlug("slug-name") - Remove specific song');
  console.log('removeFirst(5) - Remove first 5 songs');
  
  db.close();
};

inspectAndClean();
