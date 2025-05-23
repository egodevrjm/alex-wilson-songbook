import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function PlaylistManager({ songs, onSelectSong }) {
  const { theme } = useTheme();
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });

  // Load playlists on initial render
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem('playlists');
      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(savedPlaylists);
        console.log('Playlists loaded from localStorage:', parsedPlaylists);
        setPlaylists(parsedPlaylists);
      }
    } catch (error) {
      console.error('Error loading playlists from localStorage:', error);
    }
  }, []);

  // Save playlists whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('playlists', JSON.stringify(playlists));
      console.log('Playlists saved to localStorage:', playlists);
    } catch (error) {
      console.error('Error saving playlists to localStorage:', error);
    }
  }, [playlists]);

  // Handle playlist creation
  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() === '') {
      return;
    }

    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      songs: [],
      createdAt: new Date().toISOString(),
      description: ''
    };

    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
    setActivePlaylist(newPlaylist);
    
    showNotification(`Playlist "${newPlaylistName}" created`);
  };

  // Handle playlist deletion
  const handleDeletePlaylist = (playlistId) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
      setPlaylists(updatedPlaylists);
      
      if (activePlaylist && activePlaylist.id === playlistId) {
        setActivePlaylist(null);
      }
      
      showNotification('Playlist deleted');
    }
  };

  // Handle playlist editing
  const handleEditPlaylist = (playlistId, updates) => {
    const updatedPlaylists = playlists.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, ...updates, updatedAt: new Date().toISOString() }
        : playlist
    );
    setPlaylists(updatedPlaylists);
    
    if (activePlaylist && activePlaylist.id === playlistId) {
      setActivePlaylist(updatedPlaylists.find(p => p.id === playlistId));
    }
  };

  // Search for songs to add to playlist
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const results = songs.filter(song => 
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      (song.lyrics && song.lyrics.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(results);
  };

  // Add song to active playlist
  const handleAddToPlaylist = (song) => {
    if (!activePlaylist) return;
    
    // Check if song is already in playlist
    if (activePlaylist.songs.some(s => s.slug === song.slug)) {
      showNotification(`"${song.title}" is already in this playlist`);
      return;
    }
    
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === activePlaylist.id) {
        return {
          ...playlist,
          songs: [...playlist.songs, { 
            slug: song.slug, 
            title: song.title, 
            addedAt: new Date().toISOString() 
          }]
        };
      }
      return playlist;
    });
    
    setPlaylists(updatedPlaylists);
    setActivePlaylist(updatedPlaylists.find(p => p.id === activePlaylist.id));
    setSearchQuery('');
    setSearchResults([]);
    
    showNotification(`"${song.title}" added to playlist`);
  };

  // Remove song from playlist
  const handleRemoveFromPlaylist = (songSlug) => {
    if (!activePlaylist) return;
    
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === activePlaylist.id) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.slug !== songSlug)
        };
      }
      return playlist;
    });
    
    setPlaylists(updatedPlaylists);
    setActivePlaylist(updatedPlaylists.find(p => p.id === activePlaylist.id));
    
    showNotification('Song removed from playlist');
  };

  // Get playlist statistics
  const getPlaylistStats = (playlist) => {
    const playlistSongs = playlist.songs.map(playlistSong => 
      songs.find(song => song.slug === playlistSong.slug)
    ).filter(Boolean);

    return {
      totalSongs: playlist.songs.length,
      songsWithLyrics: playlistSongs.filter(song => song.lyrics).length,
      songsWithNotes: playlistSongs.filter(song => song.notes).length,
      estimatedDuration: Math.round(playlistSongs.length * 3.5), // 3.5 min average
      createdDate: new Date(playlist.createdAt).toLocaleDateString('en-GB')
    };
  };

  // Export playlist
  const exportPlaylist = (playlist) => {
    const playlistSongs = playlist.songs.map(playlistSong => 
      songs.find(song => song.slug === playlistSong.slug)
    ).filter(Boolean);

    let content = `# ${playlist.name}\n\n`;
    
    if (playlist.description) {
      content += `${playlist.description}\n\n`;
    }
    
    content += `**Created:** ${new Date(playlist.createdAt).toLocaleDateString('en-GB')}\n`;
    content += `**Total Songs:** ${playlist.songs.length}\n\n`;
    
    content += `## Songs\n\n`;
    
    playlistSongs.forEach((song, index) => {
      content += `${index + 1}. ${song.title}\n`;
    });
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Show notification
  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Playlists</h2>
        <p className="text-sm text-gray-500 mt-1">Create and manage your song collections</p>
      </div>
      
      <div className="flex-1 overflow-hidden flex">
        {/* Playlists sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Create playlist button */}
          <div className="p-4 border-b border-gray-100">
            {isCreatingPlaylist ? (
              <div className="space-y-2">
                <input
                  type="text"
                  className={`w-full p-2 ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-3 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                  >
                    Create
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                    onClick={() => {
                      setIsCreatingPlaylist(false);
                      setNewPlaylistName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={`w-full py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors flex items-center justify-center gap-2`}
                onClick={() => setIsCreatingPlaylist(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Playlist
              </button>
            )}
          </div>
          
          {/* Playlist list */}
          <div className="flex-1 overflow-y-auto">
            {playlists.length > 0 ? (
              <div className="space-y-1 p-2">
                {playlists.map((playlist) => {
                  const stats = getPlaylistStats(playlist);
                  return (
                    <div
                      key={playlist.id}
                      className={`p-3 cursor-pointer ${theme.layout.borderRadius} transition-colors ${
                        activePlaylist && activePlaylist.id === playlist.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => setActivePlaylist(playlist)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{playlist.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {stats.totalSongs} songs • {Math.floor(stats.estimatedDuration / 60)}:{String(stats.estimatedDuration % 60).padStart(2, '0')}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created {stats.createdDate}
                          </p>
                        </div>
                        <button
                          className="text-red-500 hover:text-red-700 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlaylist(playlist.id);
                          }}
                          title="Delete playlist"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-center">No playlists created yet</p>
                <p className="mt-2 text-sm text-center">Click the button above to create your first playlist</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Active playlist content */}
        <div className="flex-1 flex flex-col">
          {activePlaylist ? (
            <>
              {/* Playlist header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{activePlaylist.name}</h3>
                    {activePlaylist.description && (
                      <p className="text-gray-600 mt-1">{activePlaylist.description}</p>
                    )}
                    <div className="mt-2 text-sm text-gray-500">
                      <span>{activePlaylist.songs.length} songs</span>
                      <span className="mx-2">•</span>
                      <span>{Math.floor(getPlaylistStats(activePlaylist).estimatedDuration / 60)}:{String(getPlaylistStats(activePlaylist).estimatedDuration % 60).padStart(2, '0')}</span>
                      <span className="mx-2">•</span>
                      <span>Created {getPlaylistStats(activePlaylist).createdDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => exportPlaylist(activePlaylist)}
                      className={`px-3 py-1 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors text-sm`}
                      title="Export playlist"
                    >
                      Export
                    </button>
                    <button
                      className={`px-3 py-1 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors text-sm flex items-center gap-1`}
                      onClick={() => setIsAddingSong(!isAddingSong)}
                    >
                      {isAddingSong ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Done
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Songs
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Song search */}
                {isAddingSong && (
                  <div className="mt-4">
                    <input
                      type="text"
                      className={`w-full p-2 ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Search for songs to add..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm">
                        {searchResults.map(song => (
                          <div
                            key={song.slug}
                            className="p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center"
                          >
                            <span className="text-gray-800">{song.title}</span>
                            <button
                              className={`px-2 py-1 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors text-sm`}
                              onClick={() => handleAddToPlaylist(song)}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchQuery && searchResults.length === 0 && (
                      <div className="mt-2 p-4 bg-gray-100 rounded-md text-gray-500 text-center">
                        No songs found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Songs in playlist */}
              <div className="flex-1 overflow-y-auto">
                {activePlaylist.songs.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {activePlaylist.songs.map((song, index) => {
                      const fullSong = songs.find(s => s.slug === song.slug);
                      return (
                        <div
                          key={song.slug}
                          className="p-4 flex justify-between items-center hover:bg-gray-50 group"
                        >
                          <div className="flex items-center flex-1">
                            <span className="w-8 text-gray-400 text-sm">{index + 1}</span>
                            <div className="ml-3 flex-1">
                              <div 
                                className="text-gray-900 cursor-pointer hover:text-blue-600 font-medium"
                                onClick={() => {
                                  // Find the song in the original songs array to get the correct index
                                  const songIndex = songs.findIndex(s => s.slug === song.slug);
                                  if (songIndex !== -1) {
                                    onSelectSong(songIndex);
                                  }
                                }}
                                title="Click to view song"
                              >
                                {song.title}
                              </div>
                              {fullSong && (
                                <div className="flex gap-2 mt-1">
                                  {fullSong.lyrics && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Lyrics</span>}
                                  {fullSong.notes && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Notes</span>}
                                  {fullSong.audio && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Audio</span>}
                                </div>
                              )}
                              {song.addedAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Added {new Date(song.addedAt).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveFromPlaylist(song.slug)}
                            title="Remove from playlist"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p>No songs in this playlist</p>
                    <p className="mt-2 text-sm">Click "Add Songs" to start building your playlist</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a playlist</h3>
              <p className="text-center max-w-md">
                Choose a playlist from the sidebar to view and manage its songs
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Notification toast */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fadeInOut">
          {notification.message}
        </div>
      )}
    </div>
  );
}
