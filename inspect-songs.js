/**
 * Debug script to inspect songs and find the empty ones
 * Run this in the browser console to see what's actually in your songs
 */

const inspectSongs = async () => {
  console.log('🔍 Inspecting all songs in detail...\n');
  
  try {
    // Get songs directly from IndexedDB
    const dbRequest = indexedDB.open('AlexWilsonSongbookDB', 2);
    
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = (event) => resolve(event.target.result);
      dbRequest.onerror = reject;
    });
    
    const transaction = db.transaction(['songs'], 'readonly');
    const store = transaction.objectStore('songs');
    const getAllRequest = store.getAll();
    
    const allSongs = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = (event) => resolve(event.target.result);
      getAllRequest.onerror = reject;
    });
    
    console.log(`Total songs in database: ${allSongs.length}\n`);
    
    // Analyze each song
    const analysis = allSongs.map(song => {
      const titleInfo = {
        hasTitle: !!song.title,
        title: song.title || '(none)',
        titleLength: song.title ? song.title.length : 0,
        titleIsSlug: song.title === song.slug,
        titleIsEmpty: !song.title || song.title.trim() === ''
      };
      
      const contentInfo = {
        hasLyrics: !!song.lyrics && song.lyrics.trim().length > 0,
        lyricsLength: song.lyrics ? song.lyrics.trim().length : 0,
        hasNotes: !!song.notes && song.notes.trim().length > 0,
        notesLength: song.notes ? song.notes.trim().length : 0,
        hasSoundsLike: !!song.soundsLike && song.soundsLike.trim().length > 0,
        hasAudio: !!song.audio,
        hasImage: !!song.image
      };
      
      const isEmpty = (
        (!titleInfo.hasTitle || titleInfo.titleIsSlug || titleInfo.titleIsEmpty) &&
        !contentInfo.hasLyrics &&
        !contentInfo.hasNotes &&
        !contentInfo.hasSoundsLike &&
        !contentInfo.hasAudio &&
        !contentInfo.hasImage
      );
      
      return {
        slug: song.slug,
        ...titleInfo,
        ...contentInfo,
        isEmpty,
        song
      };
    });
    
    // Show empty songs
    const emptySongs = analysis.filter(a => a.isEmpty);
    console.log(`\n🗑️ Empty songs found: ${emptySongs.length}`);
    
    if (emptySongs.length > 0) {
      console.log('\nEmpty songs details:');
      emptySongs.forEach(s => {
        console.log(`\n- Slug: ${s.slug}`);
        console.log(`  Title: "${s.title}"`);
        console.log(`  Title is slug: ${s.titleIsSlug}`);
        console.log(`  Has content: Lyrics(${s.hasLyrics}), Notes(${s.hasNotes}), Audio(${s.hasAudio}), Image(${s.hasImage})`);
      });
    }
    
    // Show songs that look suspicious but aren't technically empty
    const suspicious = analysis.filter(a => 
      !a.isEmpty && (
        a.titleIsSlug || 
        a.titleLength < 3 ||
        (!a.hasLyrics && !a.hasNotes && !a.hasSoundsLike)
      )
    );
    
    if (suspicious.length > 0) {
      console.log(`\n⚠️ Suspicious songs (not empty but minimal): ${suspicious.length}`);
      suspicious.slice(0, 5).forEach(s => {
        console.log(`\n- Slug: ${s.slug}`);
        console.log(`  Title: "${s.title}" (length: ${s.titleLength})`);
        console.log(`  Content: Lyrics(${s.lyricsLength} chars), Notes(${s.notesLength} chars)`);
      });
    }
    
    // Provide removal function
    window.removeEmptySongs = async () => {
      console.log('\n🗑️ Removing empty songs...');
      const { songStorage } = await import('/src/utils/storage/songStorage.js');
      
      for (const empty of emptySongs) {
        try {
          await songStorage.deleteSong(empty.slug);
          console.log(`✓ Removed: ${empty.slug}`);
        } catch (error) {
          console.error(`✗ Failed to remove ${empty.slug}:`, error);
        }
      }
      
      console.log('\n✅ Done! Refresh the page.');
    };
    
    window.removeSong = async (slug) => {
      const { songStorage } = await import('/src/utils/storage/songStorage.js');
      await songStorage.deleteSong(slug);
      console.log(`Removed: ${slug}`);
    };
    
    if (emptySongs.length > 0) {
      console.log('\n💡 To remove all empty songs, run: removeEmptySongs()');
      console.log('💡 To remove a specific song, run: removeSong("slug-name")');
    }
    
    db.close();
    
    return { total: allSongs.length, empty: emptySongs.length, analysis };
    
  } catch (error) {
    console.error('Error inspecting songs:', error);
  }
};

// Run the inspection
inspectSongs();
