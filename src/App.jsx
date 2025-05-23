import React, { useState, useCallback } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { GameStateProvider, useGameState } from './contexts/GameStateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { generateSongFromPrompt } from './services/SongGenerationService.js';
import { useSongPersistence } from './hooks/useSongPersistenceV2.js';
import { useAlbumPersistence } from './hooks/useAlbumPersistence.js';
import { songs as initialSongs } from './data/songs.js';

// Admin Components
import SongList from './components/SongListV2.jsx';
import SongViewer from './components/SongViewerV2.jsx';
import PlaylistManager from './components/PlaylistManager.jsx';
import SongCreator from './components/SongCreatorV2.jsx';
import ThemeSelector from './components/ThemeSelector.jsx';
import AlbumManager from './components/AlbumManager.jsx';
import SetlistManager from './components/SetlistManager.jsx';
import SongRelationshipManager from './components/SongRelationshipManager.jsx';
import Profile from './components/Profile.jsx';
import PersistentMusicPlayer from './components/PersistentMusicPlayer.jsx';
import PersistenceDebugger from './components/PersistenceDebugger.jsx';
import DuplicateChecker from './components/DuplicateChecker.jsx';
import GameView from './components/GameView.jsx';
import EmptySongCleaner from './components/EmptySongCleaner.jsx';
import ExportManager from './components/ExportManager.jsx';
import ImportManager from './components/ImportManager.jsx';
import SidebarWidthToggle from './components/SidebarWidthToggle.jsx';

// Public Components
import PublicNavigation from './components/PublicNavigation.jsx';
import PublicSongViewer from './components/PublicSongViewer.jsx';

import { generateSlug } from './utils/helpers.js';
import { initializeSampleData } from './utils/dataInitializer.js';

// Loading Component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Alex Wilson Songbook...</p>
    </div>
  </div>
);

// Admin App Content
function AdminAppContent() {
  const { theme } = useTheme();
  const { isGameMode, setIsGameMode } = useGameState();
  const { isPublicPreview, viewAsPublic } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('songs');
  const [showSongCreator, setShowSongCreator] = useState(false);
  const [showEmptySongCleaner, setShowEmptySongCleaner] = useState(false);
  const [showExportManager, setShowExportManager] = useState(false);
  const [showImportManager, setShowImportManager] = useState(false);
  
  // Use the song persistence hook
  const {
    availableSongs,
    filteredSongs, 
    deletedSongs,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortOption,
    setSortOption,
    savedFilterCombos,
    saveFilterCombo,
    loadFilterCombo,
    handleDeleteSong: hookDeleteSong,
    handleSongCreated: hookSongCreated,
    handleSongUpdated,
    removeDuplicateSongs
  } = useSongPersistence(initialSongs);
  
  // Use the album persistence hook
  const {
    albums,
    isLoaded: albumsLoaded,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addSongToAlbum,
    removeSongFromAlbum,
    reorderSongs
  } = useAlbumPersistence();
  
  // Get the selected song
  const selectedSong = availableSongs.length > 0 && selectedIndex >= 0 ? 
    (selectedIndex < availableSongs.length ? availableSongs[selectedIndex] : availableSongs[0]) : 
    null;

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Handle song deletion with index adjustment
  const handleDeleteSong = useCallback((slug) => {
    const newSongsCount = hookDeleteSong(slug);
    
    if (newSongsCount > 0) {
      if (availableSongs[selectedIndex]?.slug === slug) {
        setSelectedIndex(0);
      } else if (selectedIndex >= newSongsCount) {
        setSelectedIndex(newSongsCount - 1);
      }
    }
  }, [availableSongs, selectedIndex, hookDeleteSong]);
  
  // Global function to create a song from a prompt
  const createSongFromPrompt = useCallback(async (prompt) => {
    try {
      const generatedSong = await generateSongFromPrompt(prompt);
      
      const newSong = {
        title: generatedSong.title,
        slug: generateSlug(generatedSong.title),
        lyrics: generatedSong.lyrics,
        notes: generatedSong.notes || '',
        image: null,
        audio: null
      };
      
      const newIndex = hookSongCreated(newSong);
      setSelectedIndex(newIndex);
      setActiveView('songs');
      
      return newSong;
    } catch (error) {
      console.error('Error creating song from prompt:', error);
      return null;
    }
  }, [hookSongCreated]);

  // Handle creating a new song
  const handleSongCreated = useCallback((newSong) => {
    try {
      console.log('App handling new song creation:', newSong);
      
      if (!newSong || !newSong.slug || !newSong.title) {
        console.error('Invalid song object received:', newSong);
        throw new Error('Invalid song data');
      }
      
      const newIndex = hookSongCreated(newSong);
      console.log('New song added at index:', newIndex);
      
      setSelectedIndex(newIndex);
      setShowSongCreator(false);
      setActiveView('songs');
    } catch (error) {
      console.error('Error creating song in App component:', error);
      alert('Failed to create song: ' + (error.message || 'Unknown error'));
    }
  }, [hookSongCreated]);

  // Expose the createSongFromPrompt function globally
  window.createSongFromPrompt = async (prompt) => {
    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt provided. Please provide a valid string prompt.');
      return null;
    }

    try {
      console.log(`Creating song from prompt: "${prompt}"`);
      return await createSongFromPrompt(prompt);
    } catch (error) {
      console.error(`Failed to create song from prompt "${prompt}": ${error.message}`);
      alert(`Failed to generate song: ${error.message}`);
      return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Admin Preview Banner */}
      {isPublicPreview && (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm">
          <span className="font-medium">👁️ Public Preview Mode</span>
          <span className="mx-2">•</span>
          <span>This is how visitors see your songbook</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className={`${theme.components.sidebar.header} border-b border-gray-200 sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Alex Wilson Songbook</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8 items-center">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'songs'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('songs')}
              >
                Songs
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'albums'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('albums')}
              >
                Albums
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'setlists'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('setlists')}
              >
                Setlists
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'playlists'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('playlists')}
              >
                Playlists
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'relationships'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('relationships')}
              >
                Relationships
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'profile'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('profile')}
              >
                Profile
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'settings'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setActiveView('settings')}
              >
                Settings
              </button>
              {isGameMode && (
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    activeView === 'game'
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-blue-600'
                  }`}
                  onClick={() => setActiveView('game')}
                >
                  Game
                </button>
              )}
              
              {/* Admin Controls */}
              <div className="ml-4 border-l border-blue-600 pl-4 flex items-center space-x-3">
                <button
                  onClick={viewAsPublic}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  👁️ Public View
                </button>
                <button
                  onClick={() => setShowSongCreator(true)}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Song
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white"
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-700">
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'songs'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('songs');
                  setSelectedIndex(-1);
                  setIsMobileMenuOpen(false);
                }}
              >
                Songs
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'albums'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('albums');
                  setIsMobileMenuOpen(false);
                }}
              >
                Albums
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'setlists'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('setlists');
                  setIsMobileMenuOpen(false);
                }}
              >
                Setlists
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'playlists'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('playlists');
                  setIsMobileMenuOpen(false);
                }}
              >
                Playlists
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'relationships'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('relationships');
                  setIsMobileMenuOpen(false);
                }}
              >
                Relationships
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'profile'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('profile');
                  setIsMobileMenuOpen(false);
                }}
              >
                Profile
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'settings'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => {
                  setActiveView('settings');
                  setIsMobileMenuOpen(false);
                }}
              >
                Settings
              </button>
              {isGameMode && (
                <button
                  className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                    activeView === 'game'
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-blue-600'
                  }`}
                  onClick={() => {
                    setActiveView('game');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Game
                </button>
              )}
              
              {/* Mobile Admin Controls */}
              <div className="border-t border-blue-600 pt-3 mt-3 space-y-2">
                <button
                  onClick={() => {
                    viewAsPublic();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                >
                  👁️ View as Public
                </button>
                <button
                  onClick={() => {
                    setShowSongCreator(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Song
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Rest of the admin interface remains the same */}
      <div className="flex flex-1 overflow-hidden relative fixed-sidebar-layout">
        {/* Fixed Sidebar for Songs view only */}
        {activeView === 'songs' && (
          <aside className={`${theme.layout.sidebarWidth} ${theme.components.sidebar.background} ${theme.components.sidebar.border} shadow-lg fixed left-0 top-16 bottom-0 flex-col z-10 hidden md:flex fixed-sidebar transition-all duration-300`}>
            <SidebarWidthToggle />
            <div className="flex-1 overflow-y-auto">
              <SongList 
                songs={filteredSongs} 
                allSongs={availableSongs}
                selectedIndex={selectedIndex} 
                onSelect={(idx) => {
                  setSelectedIndex(idx);
                  setIsMobileMenuOpen(false);
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                sortOption={sortOption}
                setSortOption={setSortOption}
                savedFilterCombos={savedFilterCombos}
                onSaveFilterCombo={saveFilterCombo}
                onLoadFilterCombo={loadFilterCombo}
                albums={albums}
              />
            </div>
          </aside>
        )}

        {/* Main content - keeping all the existing admin interface */}
        <main className={`flex-1 overflow-y-auto main-content ${activeView === 'songs' ? (
          'md:' + (
            theme.layout.sidebarWidth === 'w-96' ? 'ml-96' :
            theme.layout.sidebarWidth === 'w-80' ? 'ml-80' :
            theme.layout.sidebarWidth === 'w-72' ? 'ml-72' :
            'ml-80'
          )
        ) : ''} pb-24`}>
          
          {/* All the existing views remain the same */}
          {activeView === 'songs' && (
            <div className="md:hidden">
              {(selectedIndex < 0 || !selectedSong || availableSongs.length === 0) ? (
                <div className="h-full p-4">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Songs</h2>
                    <p className="text-gray-600">Select a song to view details</p>
                  </div>
                  <SongList 
                    songs={filteredSongs} 
                    allSongs={availableSongs}
                    selectedIndex={selectedIndex} 
                    onSelect={(idx) => {
                      setSelectedIndex(idx);
                      setIsMobileMenuOpen(false);
                    }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    setFilters={setFilters}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    savedFilterCombos={savedFilterCombos}
                    onSaveFilterCombo={saveFilterCombo}
                    onLoadFilterCombo={loadFilterCombo}
                    albums={albums}
                  />
                  
                  <div className="fixed bottom-20 right-4 z-20">
                    <button
                      onClick={() => setShowSongCreator(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
                    <button
                      onClick={() => setSelectedIndex(-1)}
                      className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Songs
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 truncate">{selectedSong.title}</h1>
                  </div>
                  <SongViewer 
                    song={selectedSong} 
                    onDelete={handleDeleteSong}
                    onUpdate={handleSongUpdated}
                    onNavigateToAlbum={(albumId) => {
                      setActiveView('albums');
                    }}
                    albums={albums}
                    allSongs={availableSongs}
                    isMobile={true}
                  />
                </div>
              )}
            </div>
          )}
          
          {activeView === 'songs' && (
            <div className="hidden md:block">
              {selectedSong ? (
                <SongViewer 
                  song={selectedSong} 
                  onDelete={handleDeleteSong}
                  onUpdate={handleSongUpdated}
                  onNavigateToAlbum={(albumId) => {
                    setActiveView('albums');
                  }}
                  albums={albums}
                  allSongs={availableSongs}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">No Songs Available</h2>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    {availableSongs.length === 0 && deletedSongs.length > 0 
                      ? "You've deleted all songs from your collection. Refresh the page to restore them."
                      : "There are no songs available. Use the 'Create New Song' button in the header to get started."}
                  </p>
                  <div className="space-x-4">
                    {availableSongs.length === 0 && deletedSongs.length > 0 && (
                      <button
                        className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors duration-200`}
                        onClick={() => {
                          localStorage.removeItem('deleted-songs');
                          window.location.reload();
                        }}
                      >
                        Restore All Songs
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* All other admin views remain exactly the same */}
          {activeView === 'albums' && (
            <div className="h-full overflow-auto">
              <AlbumManager 
                songs={availableSongs}
                albums={albums}
                albumsLoaded={albumsLoaded}
                onSongUpdate={handleSongUpdated}
                onAlbumCreated={createAlbum}
                onAlbumUpdated={updateAlbum}
                onAlbumDeleted={deleteAlbum}
                onAddSongToAlbum={addSongToAlbum}
                onRemoveSongFromAlbum={removeSongFromAlbum}
                onReorderSongs={reorderSongs}
                onNavigateToSong={(index) => {
                  setSelectedIndex(index);
                  setActiveView('songs');
                }}
              />
            </div>
          )}
          
          {activeView === 'setlists' && (
            <div className="h-full overflow-auto">
              <SetlistManager 
                songs={availableSongs}
                onSetlistCreated={(setlist) => {
                  console.log('Setlist created:', setlist);
                }}
                onSetlistUpdated={(setlistId, updates) => {
                  console.log('Setlist updated:', setlistId, updates);
                }}
                onSetlistDeleted={(setlistId) => {
                  console.log('Setlist deleted:', setlistId);
                }}
              />
            </div>
          )}
          
          {activeView === 'relationships' && (
            <div className="h-full overflow-auto">
              <SongRelationshipManager 
                songs={availableSongs}
                onSongUpdate={handleSongUpdated}
                onNavigateToSong={(index) => {
                  setSelectedIndex(index);
                  setActiveView('songs');
                }}
              />
            </div>
          )}
          
          {activeView === 'playlists' && (
            <div className="h-full overflow-auto">
              <PlaylistManager 
                songs={availableSongs} 
                onSelectSong={(idx) => {
                  setSelectedIndex(idx);
                  setIsMobileMenuOpen(false);
                  setActiveView('songs');
                }} 
              />
            </div>
          )}
          
          {activeView === 'profile' && (
            <div className="h-full overflow-auto">
              <Profile songs={availableSongs} />
            </div>
          )}
          
          {activeView === 'game' && (
            <GameView songs={availableSongs} />
          )}
          
          {activeView === 'settings' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Game Mode</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enable Game Mode to access roleplay features for the Alex Wilson Story game,
                      including song attributes, dice rolling, social media simulation, and career progression.
                    </p>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isGameMode}
                        onChange={(e) => setIsGameMode(e.target.checked)}
                        className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-medium">Enable Game Mode</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Theme Settings</h3>
                  <ThemeSelector />
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Export & Data Management</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Import songs, images, and audio from a previously exported file.
                      </p>
                      <button
                        onClick={() => setShowImportManager(true)}
                        className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white ${theme.layout.borderRadius} flex items-center transition-colors duration-200`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import Songs
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-3">
                        Export all songs to various formats for backup or sharing.
                      </p>
                      <button
                        onClick={() => setShowExportManager(true)}
                        className={`px-4 py-2 ${theme.components.button.accent} ${theme.layout.borderRadius} flex items-center transition-colors duration-200`}
                        disabled={availableSongs.length === 0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Songs
                        {availableSongs.length > 0 && (
                          <span className="ml-2 text-sm opacity-75">({availableSongs.length} songs)</span>
                        )}
                      </button>
                      {availableSongs.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">No songs available to export.</p>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-3">
                        Automatically identify and remove duplicate songs in your collection.
                      </p>
                      <button
                        onClick={() => {
                          if (confirm('This will scan your entire collection and permanently remove any duplicate songs, keeping only the most recently updated version. This action cannot be undone. Continue?')) {
                            const result = removeDuplicateSongs();
                            alert(`Complete! Removed ${result.removed} duplicate songs. Your collection now has ${result.total} songs.`);
                          }
                        }}
                        className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} flex items-center transition-colors duration-200`}
                        disabled={availableSongs.length === 0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove All Duplicates
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-3">
                        Remove empty songs that may have been created during data migration.
                      </p>
                      <button
                        onClick={() => setShowEmptySongCleaner(true)}
                        className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} flex items-center transition-colors duration-200`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Clean Empty Songs
                      </button>
                    </div>
                  </div>
                </div>
                
                <DuplicateChecker 
                  songs={availableSongs}
                  onNavigateToSong={(songSlug) => {
                    const songIndex = availableSongs.findIndex(song => song.slug === songSlug);
                    if (songIndex !== -1) {
                      setSelectedIndex(songIndex);
                      setActiveView('songs');
                    }
                  }}
                  onSongDeleted={handleDeleteSong}
                />
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">About</h3>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Alex Wilson Songbook v2.0</p>
                    <p className="text-xs">Theme system with Classic, Modern, and Dashboard designs</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* All the modals remain the same */}
      {showSongCreator && (
        <SongCreator 
          onSongCreated={handleSongCreated}
          onClose={() => setShowSongCreator(false)}
        />
      )}
      
      <PersistentMusicPlayer />
      
      {showEmptySongCleaner && (
        <EmptySongCleaner 
          onClose={() => setShowEmptySongCleaner(false)}
          onSongsRemoved={(removedSlugs) => {
            window.location.reload();
          }}
        />
      )}
      
      {showExportManager && (
        <ExportManager 
          songs={availableSongs}
          onClose={() => setShowExportManager(false)}
        />
      )}
      
      {/* Import Manager Modal */}
      {showImportManager && (
        <ImportManager 
          onClose={() => setShowImportManager(false)}
          onImportComplete={() => {
            setShowImportManager(false);
            // The ImportManager will reload the page automatically
          }}
        />
      )}
    </div>
  );
}

// Public App Content
function PublicAppContent() {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('songs');
  
  // Use the same song persistence hook for consistency
  const {
    availableSongs,
    filteredSongs, 
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortOption,
    setSortOption,
    savedFilterCombos,
    saveFilterCombo,
    loadFilterCombo
  } = useSongPersistence(initialSongs);
  
  // Use the album persistence hook
  const {
    albums,
    isLoaded: albumsLoaded
  } = useAlbumPersistence();
  
  // Get the selected song
  const selectedSong = availableSongs.length > 0 && selectedIndex >= 0 ? 
    (selectedIndex < availableSongs.length ? availableSongs[selectedIndex] : availableSongs[0]) : 
    null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PublicNavigation 
        activeView={activeView}
        setActiveView={setActiveView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Public Sidebar for Songs view only */}
        {activeView === 'songs' && (
          <aside className="w-80 bg-white border-r border-gray-200 shadow-lg fixed left-0 top-16 bottom-0 flex-col z-10 hidden md:flex">
            <div className="flex-1 overflow-y-auto">
              <SongList 
                songs={filteredSongs} 
                allSongs={availableSongs}
                selectedIndex={selectedIndex} 
                onSelect={(idx) => {
                  setSelectedIndex(idx);
                  setIsMobileMenuOpen(false);
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                sortOption={sortOption}
                setSortOption={setSortOption}
                savedFilterCombos={savedFilterCombos}
                onSaveFilterCombo={saveFilterCombo}
                onLoadFilterCombo={loadFilterCombo}
                albums={albums}
              />
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto ${activeView === 'songs' ? 'md:ml-80' : ''} pb-24`}>
          
          {/* Mobile Songs View */}
          {activeView === 'songs' && (
            <div className="md:hidden">
              {(selectedIndex < 0 || !selectedSong || availableSongs.length === 0) ? (
                <div className="h-full p-4">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Songs</h2>
                    <p className="text-gray-600">Select a song to view details</p>
                  </div>
                  <SongList 
                    songs={filteredSongs} 
                    allSongs={availableSongs}
                    selectedIndex={selectedIndex} 
                    onSelect={(idx) => {
                      setSelectedIndex(idx);
                      setIsMobileMenuOpen(false);
                    }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    setFilters={setFilters}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    savedFilterCombos={savedFilterCombos}
                    onSaveFilterCombo={saveFilterCombo}
                    onLoadFilterCombo={loadFilterCombo}
                    albums={albums}
                  />
                </div>
              ) : (
                <div className="h-full">
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
                    <button
                      onClick={() => setSelectedIndex(-1)}
                      className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Songs
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 truncate">{selectedSong.title}</h1>
                  </div>
                  <PublicSongViewer 
                    song={selectedSong} 
                    allSongs={availableSongs}
                    onNavigateToAlbum={(albumId) => {
                      setActiveView('albums');
                    }}
                    albums={albums}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Desktop Songs View */}
          {activeView === 'songs' && (
            <div className="hidden md:block">
              <PublicSongViewer 
                song={selectedSong} 
                allSongs={availableSongs}
                onNavigateToAlbum={(albumId) => {
                  setActiveView('albums');
                }}
                albums={albums}
              />
            </div>
          )}
          
          {/* Public Albums View */}
          {activeView === 'albums' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Albums</h1>
                {albums.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {albums.map(album => (
                      <div key={album.id} className="bg-white rounded-lg shadow-sm p-6">
                        {album.coverImage && (
                          <img 
                            src={album.coverImage} 
                            alt={album.title}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                        )}
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{album.title}</h3>
                        {album.description && (
                          <p className="text-gray-600 text-sm mb-4">{album.description}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          {album.songs?.length || 0} songs
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No albums available yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Public Setlists View */}
          {activeView === 'setlists' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Setlists</h1>
                <div className="text-center py-12">
                  <p className="text-gray-500">Setlist information coming soon.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Public Profile View */}
          {activeView === 'profile' && (
            <div className="h-full overflow-auto">
              <Profile songs={availableSongs} />
            </div>
          )}
        </main>
      </div>

      <PersistentMusicPlayer />
    </div>
  );
}

// Main App Container
function AppContainer() {
  const { isAdmin, isPublicView, isLoading } = useAuth();

  // Initialize sample data on first load
  React.useEffect(() => {
    initializeSampleData();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAdmin) {
    return <AdminAppContent />;
  } else {
    return <PublicAppContent />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GameStateProvider>
          <MusicPlayerProvider>
            <AppContainer />
          </MusicPlayerProvider>
        </GameStateProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
