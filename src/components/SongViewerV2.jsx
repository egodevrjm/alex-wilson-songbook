import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme, getThemeClasses } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useGameState } from '../contexts/GameStateContext';
import GeminiHelper from './GeminiHelper';
import MediaManager from './MediaManager';
import LyricsDisplay from './LyricsDisplay';
import { exportToMarkdown, updateSong, updateSongSoundsLike } from '../data/songs.js';
import { persistence } from '../utils/persistence.js';
import SongAttributesEditor from './SongAttributesEditor';

export default function SongViewer({ song, onDelete, onUpdate, onNavigateToAlbum, albums = [], allSongs = [] }) {
  const { theme } = useTheme();
  const { playSong, currentTrack, isPlaying } = useMusicPlayer();
  const { isGameMode, gameState } = useGameState();
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingSoundsLike, setEditingSoundsLike] = useState(false);
  const [editedSoundsLike, setEditedSoundsLike] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [contentType, setContentType] = useState('lyrics');
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  
  // Gemini AI states
  const [showGeminiHelper, setShowGeminiHelper] = useState(false);
  const [geminiMode, setGeminiMode] = useState('generate');
  
  // Media states
  const [songImage, setSongImage] = useState(null);
  const [songAudio, setSongAudio] = useState(null);
  const [showMediaManager, setShowMediaManager] = useState(false);

  const textareaRef = useRef(null);

  // Load saved data, playlists, and media
  useEffect(() => {
    // Reset media states when song changes
    setSongImage(null);
    setSongAudio(null);
    
    // Load content type if available
    const savedContentType = localStorage.getItem('contentType-' + song.slug);
    if (savedContentType) {
      setContentType(savedContentType);
    } else {
      setContentType('lyrics');
    }
    
    // Load playlists
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists));
    }
    
    // Try to load media from IndexedDB first, falling back to localStorage
    const loadMedia = async () => {
      try {
        const { getImage, getAudio } = await import('../utils/indexedDBHelper');
        
        // First check if the song object has an image property
        if (song.image) {
          setSongImage(song.image);
        } else {
          // Try to get image from IndexedDB
          try {
            const savedImage = await getImage(song.slug);
            if (savedImage) {
              setSongImage(savedImage);
            } else {
              // Fallback to localStorage
              const localStorageImage = localStorage.getItem(`image-${song.slug}`);
              if (localStorageImage) {
                setSongImage(localStorageImage);
              }
            }
          } catch (e) {
            console.warn('Error loading image:', e);
          }
        }
        
        // First check if the song object has an audio property
        if (song.audio) {
          setSongAudio(song.audio);
        } else {
          // Try to get audio from IndexedDB
          try {
            const savedAudio = await getAudio(song.slug);
            if (savedAudio) {
              setSongAudio(savedAudio);
            } else {
              // Fallback to localStorage
              const localStorageAudio = localStorage.getItem(`audio-${song.slug}`);
              if (localStorageAudio) {
                setSongAudio(localStorageAudio);
              }
            }
          } catch (e) {
            console.warn('Error loading audio:', e);
          }
        }
      } catch (e) {
        console.error('Error importing IndexedDB helpers:', e);
        
        // Fallback completely to localStorage
        const savedImage = localStorage.getItem('image-' + song.slug);
        if (savedImage) {
          setSongImage(savedImage);
        }
        
        const savedAudio = localStorage.getItem('audio-' + song.slug);
        if (savedAudio) {
          setSongAudio(savedAudio);
        }
      }
    };
    
    loadMedia();
    
    setEditedText(song.lyrics || '');
    setEditedNotes(song.notes || '');
    setEditedTitle(song.title || '');
    setEditedSoundsLike(song.soundsLike || '');
    setEditMode(false);
    setEditingNotes(false);
    setEditingTitle(false);
    setEditingSoundsLike(false);
  }, [song]);

  // Find albums containing this song
  const containingAlbums = albums.filter(album => 
    album.songs.some(albumSong => albumSong.slug === song.slug)
  );

  useEffect(() => {
    if (textareaRef.current && editMode) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedText, editMode]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const updates = {};
      
      if (editMode) {
        updates.lyrics = editedText;
      } else if (editingNotes) {
        updates.notes = editedNotes;
      } else if (editingTitle) {
        updates.title = editedTitle;
      } else if (editingSoundsLike) {
        updates.soundsLike = editedSoundsLike;
      }
      
      // Create the complete updated song with current state plus new updates
      const updatedSong = {
        ...song,
        ...updates,
        updatedAt: new Date().toISOString(),
        version: (song.version || 0) + 1
      };
      
      // Update song in database
      updateSong(song.slug, updates);
      
      // Update React state through parent callback
      if (onUpdate) {
        onUpdate(updatedSong);
      }
      
      // Save content type if it's changed
      localStorage.setItem('contentType-' + song.slug, contentType);
      
      setEditMode(false);
      setEditingNotes(false);
      setEditingTitle(false);
      setEditingSoundsLike(false);
      
      setNotification({ 
        show: true, 
        type: 'success', 
        message: 'Changes saved successfully!' 
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      setNotification({ 
        show: true, 
        type: 'error', 
        message: 'Failed to save changes. Please try again.' 
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (type) => {
    if (type === 'lyrics') {
      setEditMode(true);
      setEditingNotes(false);
      setEditingTitle(false);
      setEditingSoundsLike(false);
    } else if (type === 'notes') {
      setEditMode(false);
      setEditingNotes(true);
      setEditingTitle(false);
      setEditingSoundsLike(false);
    } else if (type === 'title') {
      setEditMode(false);
      setEditingNotes(false);
      setEditingTitle(true);
      setEditingSoundsLike(false);
    } else if (type === 'soundsLike') {
      setEditMode(false);
      setEditingNotes(false);
      setEditingTitle(false);
      setEditingSoundsLike(true);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditingNotes(false);
    setEditingTitle(false);
    setEditingSoundsLike(false);
    setEditedText(song.lyrics || '');
    setEditedNotes(song.notes || '');
    setEditedTitle(song.title || '');
    setEditedSoundsLike(song.soundsLike || '');
  };
  
  const handleContentTypeChange = (type) => {
    setContentType(type);
    localStorage.setItem('contentType-' + song.slug, type);
    
    setNotification({ 
      show: true, 
      type: 'info', 
      message: `Content type changed to ${type}` 
    });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
  };
  
  // Handle media updates from MediaManager
  const handleMediaUpdate = (type, value, metadata) => {
    if (type === 'image') {
      setSongImage(value);
      // Update the song object with the new image (or null for removal)
      const updatedSong = {
        ...song,
        image: value,
        updatedAt: new Date().toISOString(),
        version: (song.version || 0) + 1
      };
      
      // Remove the image property if value is null
      if (value === null) {
        delete updatedSong.image;
      }
      
      // Update song in database
      updateSong(song.slug, { image: value });
      
      // Update React state through parent callback
      if (onUpdate) {
        onUpdate(updatedSong);
      }
    } else if (type === 'audio') {
      setSongAudio(value);
      // Update the song object with the new audio
      const updatedSong = {
        ...song,
        audio: value,
        audioMetadata: metadata,
        updatedAt: new Date().toISOString(),
        version: (song.version || 0) + 1
      };
      
      // Update song in database
      updateSong(song.slug, { audio: value, audioMetadata: metadata });
      
      // Update React state through parent callback
      if (onUpdate) {
        onUpdate(updatedSong);
      }
    }
  };
  
  // Add song to playlist
  const handleAddToPlaylist = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    // Check if song is already in playlist
    if (playlist.songs.some(s => s.slug === song.slug)) {
      setNotification({ 
        show: true, 
        type: 'info', 
        message: `"${song.title}" is already in "${playlist.name}"`
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
      return;
    }
    
    // Add song to playlist
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          songs: [...p.songs, { slug: song.slug, title: song.title }]
        };
      }
      return p;
    });
    
    setPlaylists(updatedPlaylists);
    localStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
    
    setNotification({ 
      show: true, 
      type: 'success', 
      message: `Added "${song.title}" to "${playlist.name}"`
    });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
    
    setShowAddToPlaylist(false);
  };
  
  // Generate 'sounds like' description
  const generateSoundsLike = async () => {
    if (!song.lyrics || !song.lyrics.trim()) {
      alert('Please add some lyrics first');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Describe what this song sounds like musically. Be direct and confident - no hedging words like "would be" or "possibly". Focus on:
          - Instrumentation (guitar, fiddle, drums, etc.)
          - Musical style and genre
          - Tempo and energy level
          - Atmosphere and mood
          - Production style
          
          Write as if you're hearing the song right now. Keep it concise (1-2 sentences) and evocative. Here are the lyrics:
          
          ${song.lyrics}`
        })
      });

      const data = await response.json();
      if (data.text) {
        const updatedSong = {
          ...song,
          soundsLike: data.text,
          updatedAt: new Date().toISOString(),
          version: (song.version || 0) + 1
        };
        
        updateSongSoundsLike(song.slug, data.text);
        
        if (onUpdate) {
          onUpdate(updatedSong);
        }
        
        setEditedSoundsLike(data.text);
        
        setNotification({ 
          show: true, 
          type: 'success', 
          message: 'Musical description generated successfully!' 
        });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      } else {
        console.error('Failed to generate sounds like description:', data.error);
        alert('Failed to generate description. Please try again.');
      }
    } catch (error) {
      console.error('Error generating sounds like description:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Gemini generated content
  const handleApplyGeminiContent = (content) => {
    if (geminiMode === 'generate') {
      setEditedNotes(content);
      setEditingNotes(true);
      setTimeout(() => handleSave(), 100);
    } else if (geminiMode === 'clean' || geminiMode === 'format' || geminiMode === 'create') {
      setEditedText(content);
      setEditMode(true);
      setTimeout(() => handleSave(), 100);
    }
    
    setShowGeminiHelper(false);
    setNotification({ 
      show: true, 
      type: 'success', 
      message: 'AI-generated content applied successfully!' 
    });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  // Open Gemini helper with specific mode
  const openGeminiHelper = (mode) => {
    setGeminiMode(mode);
    setShowGeminiHelper(true);
  };

  // Export this song to markdown
  const exportSongToMarkdown = () => {
    const singleSongMarkdown = `# ${song.title}

## Lyrics

\`\`\`
${song.lyrics || 'No lyrics available'}
\`\`\`

## Notes

${song.notes || 'No notes available'}

${song.soundsLike ? `## Sounds Like

${song.soundsLike}

` : ''}## Metadata
- Created: ${song.createdAt || 'N/A'}
- Modified: ${song.updatedAt || 'N/A'}
- Version: ${song.version || 1}
`;

    const blob = new Blob([singleSongMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Notifications */}
        {notification.show && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-md flex items-center z-50 animate-fadeInOut ${
            notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
            notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            <span>{notification.message}</span>
          </div>
        )}
        
        {/* Gemini AI helper dialog */}
        <GeminiHelper
          isOpen={showGeminiHelper}
          onClose={() => setShowGeminiHelper(false)}
          onApplyContent={handleApplyGeminiContent}
          songTitle={song.title}
          currentLyrics={song.lyrics}
          currentNotes={song.notes}
          currentContentType={contentType}
          mode={geminiMode}
        />
        
        {/* Media Manager */}
        <MediaManager 
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          songSlug={song.slug}
          onMediaUpdate={handleMediaUpdate}
          initialImage={songImage}
          initialAudio={songAudio}
          songData={song}
        />

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Title and Version */}
          <div className="mb-4">
            {editingTitle ? (
              <input
                ref={textareaRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={() => {
                  if (editedTitle.trim() !== '') {
                    handleSave();
                  } else {
                    setEditedTitle(song.title);
                    setEditingTitle(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                  } else if (e.key === 'Escape') {
                    setEditedTitle(song.title);
                    setEditingTitle(false);
                  }
                }}
                className="w-full p-2 text-3xl font-bold border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter title..."
                autoFocus
              />
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <h1 className="text-3xl font-bold text-gray-800">{song.title}</h1>
                  <button
                    className="ml-3 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => handleEdit('title')}
                    title="Edit title"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                {/* Version info */}
                <div className="text-sm text-gray-500">
                  {song.version && <span className="mr-3">v{song.version}</span>}
                  {song.updatedAt && (
                    <span>Updated: {new Date(song.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Image Section */}
          {songImage && (
            <div className="mb-6 relative group">
              <div className="relative overflow-hidden rounded-lg shadow-md">
                <img 
                  src={songImage} 
                  alt={song.title} 
                  className="w-full h-64 md:h-96 object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => setShowMediaManager(true)}
                    className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {songAudio && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => playSong(song, allSongs)}
                      className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-200 ${
                        currentTrack?.songSlug === song.slug && isPlaying
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      }`}
                      title={currentTrack?.songSlug === song.slug && isPlaying ? 'Pause' : 'Play'}
                    >
                      {currentTrack?.songSlug === song.slug && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{song.title}</h3>
                      <p className="text-sm text-gray-600">Click to play in persistent player</p>
                      {currentTrack?.songSlug === song.slug && (
                        <p className="text-xs text-green-600 font-medium">Currently playing</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Content Type Selector */}
            <div className="relative">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => document.getElementById('content-type-dropdown').classList.toggle('hidden')}
              >
                {contentType === 'lyrics' ? 'Lyrics' : contentType === 'tracklist' ? 'Tracklist' : 'Other'}
                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div
                id="content-type-dropdown"
                className="hidden origin-top-left absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div className="py-1">
                  <button
                    className={`${contentType === 'lyrics' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                    onClick={() => {
                      handleContentTypeChange('lyrics');
                      document.getElementById('content-type-dropdown').classList.add('hidden');
                    }}
                  >
                    Lyrics
                  </button>
                  <button
                    className={`${contentType === 'tracklist' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                    onClick={() => {
                      handleContentTypeChange('tracklist');
                      document.getElementById('content-type-dropdown').classList.add('hidden');
                    }}
                  >
                    Tracklist
                  </button>
                  <button
                    className={`${contentType === 'other' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                    onClick={() => {
                      handleContentTypeChange('other');
                      document.getElementById('content-type-dropdown').classList.add('hidden');
                    }}
                  >
                    Other
                  </button>
                </div>
              </div>
            </div>

            {/* Media Button */}
            <button
              className="inline-flex justify-center items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setShowMediaManager(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Media
            </button>

            {/* AI Button */}
            <div className="relative">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-purple-500 shadow-sm text-sm font-medium rounded-lg text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                onClick={() => document.getElementById('ai-dropdown').classList.toggle('hidden')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Tools
              </button>
              <div
                id="ai-dropdown"
                className="hidden origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div className="py-1">
                  <button
                    className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 w-full text-left"
                    onClick={() => {
                      openGeminiHelper('generate');
                      document.getElementById('ai-dropdown').classList.add('hidden');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <p className="font-medium">Generate Notes</p>
                      <p className="text-xs text-gray-500">Create notes & analysis</p>
                    </div>
                  </button>
                  <button
                    className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 w-full text-left"
                    onClick={() => {
                      openGeminiHelper('clean');
                      document.getElementById('ai-dropdown').classList.add('hidden');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <div>
                      <p className="font-medium">Clean Up Lyrics</p>
                      <p className="text-xs text-gray-500">Format & improve lyrics</p>
                    </div>
                  </button>
                  <button
                    className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 w-full text-left"
                    onClick={() => {
                      generateSoundsLike();
                      document.getElementById('ai-dropdown').classList.add('hidden');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <div>
                      <p className="font-medium">Generate Sounds Like</p>
                      <p className="text-xs text-gray-500">AI musical description</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* More Actions Button */}
            <div className="relative">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={() => document.getElementById('more-dropdown').classList.toggle('hidden')}
              >
                More
                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div
                id="more-dropdown"
                className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setShowAddToPlaylist(!showAddToPlaylist);
                      document.getElementById('more-dropdown').classList.add('hidden');
                    }}
                  >
                    Add to Playlist
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      exportSongToMarkdown();
                      document.getElementById('more-dropdown').classList.add('hidden');
                    }}
                  >
                    Export to Markdown
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      document.getElementById('more-dropdown').classList.add('hidden');
                    }}
                  >
                    Delete Song
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add to Playlist section */}
          {showAddToPlaylist && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Add to Playlist</h3>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {playlists.map(playlist => (
                    <button
                      key={playlist.id}
                      className="text-left p-3 bg-white border border-gray-200 rounded hover:bg-blue-50"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      <span className="font-medium">{playlist.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({playlist.songs.length} songs)</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No playlists available</p>
              )}
            </div>
          )}
        </div>

        {/* Sounds Like Section */}
        {(song.soundsLike || editingSoundsLike) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">What it sounds like</h3>
              {!editingSoundsLike && (
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => handleEdit('soundsLike')}
                >
                  Edit
                </button>
              )}
            </div>
            
            {editingSoundsLike ? (
              <div>
                <textarea
                  ref={textareaRef}
                  value={editedSoundsLike}
                  onChange={(e) => setEditedSoundsLike(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 italic">{song.soundsLike}</p>
            )}
          </div>
        )}

        {/* Albums Section */}
        {containingAlbums.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Found in Albums</h3>
            <div className="flex flex-wrap gap-2">
              {containingAlbums.map(album => (
                <button
                  key={album.id}
                  onClick={() => onNavigateToAlbum && onNavigateToAlbum(album.id)}
                  className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  {album.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Attributes (if game mode is enabled) */}
        {isGameMode && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <SongAttributesEditor 
              song={song} 
              onUpdate={onUpdate}
              gameState={gameState}
            />
          </div>
        )}

        {/* Lyrics Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {contentType === 'lyrics' ? 'Lyrics' : contentType === 'tracklist' ? 'Tracklist' : 'Content'}
            </h2>
            {!editMode && (
              <div className="flex space-x-2">
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => handleEdit('lyrics')}
                >
                  Edit
                </button>
                {song.lyrics && (
                  <button
                    className="text-green-600 hover:text-green-800 text-sm"
                    onClick={() => {
                      let combinedText = song.title;
                      if (song.lyrics) combinedText += '\n\n' + song.lyrics;
                      if (song.soundsLike) combinedText += '\n\nSounds like: ' + song.soundsLike;
                      
                      navigator.clipboard.writeText(combinedText);
                      setNotification({ 
                        show: true, 
                        type: 'copy', 
                        message: 'Song copied to clipboard!' 
                      });
                      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
                    }}
                  >
                    Copy
                  </button>
                )}
              </div>
            )}
          </div>
          
          {editMode ? (
            <div>
              <textarea
                ref={textareaRef}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows="15"
              />
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <LyricsDisplay lyrics={song.lyrics} contentType={contentType} />
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Notes</h2>
            {!editingNotes && (
              <button
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => handleEdit('notes')}
              >
                Edit
              </button>
            )}
          </div>
          
          {editingNotes ? (
            <div>
              <textarea
                ref={textareaRef}
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="8"
              />
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              {song.notes ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{song.notes}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">No notes available</p>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Delete Song</h3>
              <p className="mb-6 text-gray-600">Are you sure you want to delete "{song.title}"? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => {
                    if (onDelete) {
                      onDelete(song.slug);
                      setShowDeleteConfirm(false);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
