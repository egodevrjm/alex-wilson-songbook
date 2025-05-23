// Test localStorage functionality for albums, setlists, and playlists
const testLocalStoragePersistence = () => {
  console.group('Testing localStorage persistence...');
  
  const testData = {
    albums: [{ id: 'test-album', title: 'Test Album', songs: [] }],
    setlists: [{ id: 'test-setlist', name: 'Test Setlist', songs: [] }],
    playlists: [{ id: 'test-playlist', name: 'Test Playlist', songs: [] }]
  };
  
  try {
    // Test saving
    localStorage.setItem('songbook-albums', JSON.stringify(testData.albums));
    localStorage.setItem('songbook-setlists', JSON.stringify(testData.setlists));
    localStorage.setItem('playlists', JSON.stringify(testData.playlists));
    
    // Test loading
    const loadedAlbums = JSON.parse(localStorage.getItem('songbook-albums'));
    const loadedSetlists = JSON.parse(localStorage.getItem('songbook-setlists'));
    const loadedPlaylists = JSON.parse(localStorage.getItem('playlists'));
    
    console.log('Albums test:', loadedAlbums);
    console.log('Setlists test:', loadedSetlists);
    console.log('Playlists test:', loadedPlaylists);
    
    // Cleanup
    localStorage.removeItem('songbook-albums');
    localStorage.removeItem('songbook-setlists');
    localStorage.removeItem('playlists');
    
    console.log('localStorage persistence test completed successfully!');
  } catch (error) {
    console.error('localStorage test failed:', error);
  }
  
  console.groupEnd();
};

// Run test when this module is imported
if (typeof window !== 'undefined') {
  testLocalStoragePersistence();
}

export default testLocalStoragePersistence;
