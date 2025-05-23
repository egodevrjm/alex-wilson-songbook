/**
 * Remove songs that appear at the top of the list
 * This targets the empty songs that are showing up first
 */

// Quick function to remove the first N songs that appear empty
window.removeTopEmptySongs = async (count = 10) => {
  console.log(`🎯 Targeting first ${count} songs for inspection...\n`);
  
  try {
    // Import storage
    const { songStorage } = await import('/src/utils/storage/songStorage.js');
    
    // Get all songs
    const allSongs = await songStorage.getAllSongs();
    console.log(`Total songs in database: ${allSongs.length}`);
    
    // Check first N songs
    const topSongs = allSongs.slice(0, count);
    const toRemove = [];
    
    console.log('\nInspecting top songs:');
    topSongs.forEach((song, i) => {
      const isEmpty = (
        (!song.title || song.title === song.slug || song.title.trim() === '') &&
        (!song.lyrics || song.lyrics.trim() === '') &&
        (!song.notes || song.notes.trim() === '')
      );
      
      console.log(`${i + 1}. ${song.slug}`);
      console.log(`   Title: "${song.title || '(none)'}"`);
      console.log(`   Has lyrics: ${song.lyrics && song.lyrics.trim() ? 'Yes' : 'No'}`);
      console.log(`   Empty: ${isEmpty ? '⚠️ YES' : 'No'}\n`);
      
      if (isEmpty) {
        toRemove.push(song);
      }
    });
    
    if (toRemove.length === 0) {
      console.log('✅ No empty songs found in the top songs!');
      return;
    }
    
    console.log(`\n🗑️ Found ${toRemove.length} empty songs to remove`);
    
    if (confirm(`Remove ${toRemove.length} empty songs?`)) {
      for (const song of toRemove) {
        await songStorage.deleteSong(song.slug);
        console.log(`✓ Removed: ${song.slug}`);
      }
      console.log('\n✅ Done! Refresh the page to see changes.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Also create a function to just remove specific indices
window.removeSongsByIndex = async (indices) => {
  console.log(`🎯 Removing songs at indices: ${indices.join(', ')}`);
  
  try {
    const { songStorage } = await import('/src/utils/storage/songStorage.js');
    const allSongs = await songStorage.getAllSongs();
    
    for (const index of indices) {
      if (index < allSongs.length) {
        const song = allSongs[index];
        await songStorage.deleteSong(song.slug);
        console.log(`✓ Removed song at index ${index}: ${song.slug}`);
      }
    }
    
    console.log('\n✅ Done! Refresh the page.');
  } catch (error) {
    console.error('Error:', error);
  }
};

console.log('🧹 Empty Song Removal Tool Loaded\n');
console.log('Commands:');
console.log('- removeTopEmptySongs(10) - Check and remove empty songs from top 10');
console.log('- removeSongsByIndex([0,1,2]) - Remove songs at specific indices');
console.log('\nExample: removeTopEmptySongs(5) will check the first 5 songs');
