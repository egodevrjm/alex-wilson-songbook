import React from 'react';

const PersistenceDebugger = () => {
  const checkAllStorage = () => {
    console.group('=== Storage Debug Information ===');
    
    // Check albums
    const albums = localStorage.getItem('songbook-albums');
    console.log('Albums:', albums ? JSON.parse(albums) : 'None');
    
    // Check setlists
    const setlists = localStorage.getItem('songbook-setlists');
    console.log('Setlists:', setlists ? JSON.parse(setlists) : 'None');
    
    // Check playlists
    const playlists = localStorage.getItem('playlists');
    console.log('Playlists:', playlists ? JSON.parse(playlists) : 'None');
    
    // Check songs
    const customSongs = localStorage.getItem('custom-songs');
    console.log('Custom Songs:', customSongs ? JSON.parse(customSongs) : 'None');
    
    // Check relationships
    const relationships = localStorage.getItem('songbook-relationships');
    console.log('Relationships:', relationships ? JSON.parse(relationships) : 'None');
    
    console.groupEnd();
  };
  
  const clearAllStorage = () => {
    if (confirm('Are you sure you want to clear all stored data?')) {
      localStorage.removeItem('songbook-albums');
      localStorage.removeItem('songbook-setlists');
      localStorage.removeItem('playlists');
      localStorage.removeItem('custom-songs');
      localStorage.removeItem('songbook-relationships');
      localStorage.removeItem('deleted-songs');
      localStorage.removeItem('saved-filter-combos');
      console.log('All storage cleared');
      window.location.reload();
    }
  };
  
  // Expose functions globally for console access
  window.debugStorage = checkAllStorage;
  window.clearStorage = clearAllStorage;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h4 className="font-medium text-yellow-800 mb-2">Debug Tools</h4>
      <div className="space-x-2">
        <button
          onClick={checkAllStorage}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
        >
          Check Storage
        </button>
        <button
          onClick={clearAllStorage}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Clear All Data
        </button>
      </div>
      <p className="text-xs text-yellow-700 mt-2">
        Console functions: <code>debugStorage()</code> and <code>clearStorage()</code>
      </p>
    </div>
  );
};

export default PersistenceDebugger;
