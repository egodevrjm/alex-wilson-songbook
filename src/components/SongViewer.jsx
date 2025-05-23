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

export default function SongViewer({ song, onDelete, onUpdate, onNavigateToAlbum, albums = [] }) {
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
  const [geminiMode, setGeminiMode] = useState('generate'); // 'generate', 'clean', 'create'
  
  // Media states
  const [songImage, setSongImage] = useState(null);
  const [songAudio, setSongAudio] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showMediaManager, setShowMediaManager] = useState(false);

  const textareaRef = useRef(null);
  const audioPlayerRef = useRef(null);

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
      setContentType('lyrics'); // Default to lyrics
    }
    
    // Load playlists
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists));
    }
    
    // Try to load media from IndexedDB first, falling back to localStorage
    const loadMedia = async () => {
      try {
        // Import the indexedDBHelper dynamically to avoid circular dependencies
        const { getImage, getAudio, getMetadata } = await import('../utils/indexedDBHelper');
        
        console.log(`Loading media for song: ${song.slug}`);
        
        // Try to get image from IndexedDB
        try {
          const savedImage = await getImage(song.slug);
          if (savedImage) {
            console.log(`Found image in IndexedDB for song: ${song.slug}`);
            setSongImage(savedImage);
          } else {
            // Fallback to localStorage
            const localStorageImage = localStorage.getItem(`image-${song.slug}`);
            if (localStorageImage) {
              console.log(`Found image in localStorage for song: ${song.slug}`);
              setSongImage(localStorageImage);
            }
          }
        } catch (e) {
          console.warn('Error loading image:', e);
        }
        
        // Try to get audio from IndexedDB
        try {
          const savedAudio = await getAudio(song.slug);
          if (savedAudio) {
            console.log(`Found audio in IndexedDB for song: ${song.slug}`);
            setSongAudio(savedAudio);
          } else {
            // Fallback to localStorage
            const localStorageAudio = localStorage.getItem(`audio-${song.slug}`);
            if (localStorageAudio) {
              console.log(`Found audio in localStorage for song: ${song.slug}`);
              setSongAudio(localStorageAudio);
            }
          }
        } catch (e) {
          console.warn('Error loading audio:', e);
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
  
  // Update audio progress
  useEffect(() => {
    if (!audioPlayerRef.current) return;
    
    const updateProgress = () => {
      const { currentTime, duration } = audioPlayerRef.current;
      setAudioProgress(currentTime);
      setAudioDuration(duration);
    };
    
    const handlePlay = () => setIsAudioPlaying(true);
    const handlePause = () => setIsAudioPlaying(false);
    
    audioPlayerRef.current.addEventListener('timeupdate', updateProgress);
    audioPlayerRef.current.addEventListener('play', handlePlay);
    audioPlayerRef.current.addEventListener('pause', handlePause);
    
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.removeEventListener('timeupdate', updateProgress);
        audioPlayerRef.current.removeEventListener('play', handlePlay);
        audioPlayerRef.current.removeEventListener('pause', handlePause);
      }
    };
  }, [songAudio]);

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
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    } else if (type === 'notes') {
      setEditMode(false);
      setEditingNotes(true);
      setEditingTitle(false);
      setEditingSoundsLike(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    } else if (type === 'title') {
      setEditMode(false);
      setEditingNotes(false);
      setEditingTitle(true);
      setEditingSoundsLike(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    } else if (type === 'soundsLike') {
      setEditMode(false);
      setEditingNotes(false);
      setEditingTitle(false);
      setEditingSoundsLike(true);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
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
    
    // Show notification
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
    } else if (type === 'audio') {
      setSongAudio(value);
    }
  };
  
  // Format audio time
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  // Toggle audio playback
  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    
    if (isAudioPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
  };
  
  // Seek audio position
  const handleAudioSeek = (e) => {
    if (!audioPlayerRef.current) return;
    
    const seekTime = e.target.value;
    audioPlayerRef.current.currentTime = seekTime;
    setAudioProgress(seekTime);
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
        // Create updated song with current state plus new soundsLike
        const updatedSong = {
          ...song,
          soundsLike: data.text,
          updatedAt: new Date().toISOString(),
          version: (song.version || 0) + 1
        };
        
        // Update the JSON database
        updateSongSoundsLike(song.slug, data.text);
        
        // Update React state through parent callback
        if (onUpdate) {
          onUpdate(updatedSong);
        }
        
        // Update local state
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
      // Update notes
      setEditedNotes(content);
      setEditingNotes(true);
      setTimeout(() => handleSave(), 100);
    } else if (geminiMode === 'clean') {
      // Update lyrics with completely rewritten content
      setEditedText(content);
      setEditMode(true);
      setTimeout(() => handleSave(), 100);
    } else if (geminiMode === 'format') {
      // Update lyrics with markdown-formatted content (preserving original content)
      setEditedText(content);
      setEditMode(true);
      setTimeout(() => handleSave(), 100);
    } else if (geminiMode === 'create') {
      // Update lyrics for a new song
      setEditedText(content);
      setEditMode(true);
      setTimeout(() => handleSave(), 100);
    }
    
    setShowGeminiHelper(false);
    setNotification({ 
      show: true, 
      type: 'success', 
      message: geminiMode === 'format' ? 'Lyrics formatted!' : 'AI-generated content applied successfully!' 
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
    const markdown = exportToMarkdown();
    
    // Create a simple export with just this song
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
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen shadow-sm">
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-md flex items-center z-50 animate-fadeInOut ${
          notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          {notification.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : notification.type === 'copy' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ) : notification.type === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
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

      <div className="mb-6">
        {/* Title Row */}
        <div className="mb-4">
          {editingTitle ? (
            <div className="w-full mb-4">
              <input
                ref={textareaRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={() => {
                  if (editedTitle.trim() !== '') {
                    const updatedSong = updateSong(song.slug, { title: editedTitle });
                    if (updatedSong && onUpdate) {
                      onUpdate(updatedSong);
                    }
                    setEditingTitle(false);
                    setNotification({ 
                      show: true, 
                      type: 'success', 
                      message: 'Title updated successfully!' 
                    });
                    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
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
            </div>
          ) : (
            <div className="flex items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{song.title}</h1>
              <button
                className="ml-3 text-gray-500 hover:text-blue-600"
                onClick={() => handleEdit('title')}
                title="Edit title"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              
              {/* Metadata display */}
              {song.version && (
                <div className="ml-auto flex items-center space-x-4 text-sm text-gray-500">
                  <span>v{song.version}</span>
                  {song.updatedAt && (
                    <span>Updated: {new Date(song.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Song image (if available) */}
          {songImage && (
            <div className="mb-4 relative group">
              <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md">
                <img 
                  src={songImage} 
                  alt={song.title} 
                  className="w-full h-48 md:h-64 object-contain" 
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <button
                  onClick={() => setShowMediaManager(true)}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-opacity duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Audio player (if available) */}
          {songAudio && (
            <div className="mb-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => playSong(song)}
                      className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-200 ${
                        currentTrack?.songSlug === song.slug && isPlaying
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      }`}
                      title="Play with persistent player"
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleAudioPlayback}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                      title="Play locally"
                    >
                      {isAudioPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setShowMediaManager(true)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors"
                      title="Manage audio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Hidden audio element for local playback */}
                <audio 
                  ref={audioPlayerRef} 
                  src={songAudio} 
                  className="hidden"
                  controlsList="nodownload"
                />
                
                {/* Local playback controls (only shown when local audio is playing) */}
                {isAudioPlaying && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-gray-700">{formatTime(audioProgress)}</span>
                      <span className="text-gray-500">{formatTime(audioDuration)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={audioDuration || 100}
                      value={audioProgress}
                      onChange={handleAudioSeek}
                      className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 ${(audioProgress / audioDuration) * 100}%, #e5e7eb ${(audioProgress / audioDuration) * 100}%)`
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">Local playback controls</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action buttons in a more compact layout */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Left side - Content and media buttons */}
            <div className="flex items-center gap-2">
              {/* Content Type Selector */}
              <div className="relative inline-block">
                <button
                  type="button"
                  className={`inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium ${theme.layout.borderRadius} text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  id="content-type-menu"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => document.getElementById('content-type-dropdown').classList.toggle('hidden')}
                >
                  {contentType === 'lyrics' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Lyrics
                    </>
                  ) : contentType === 'tracklist' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      Tracklist
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      Other
                    </>
                  )}
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div
                  id="content-type-dropdown"
                  className="hidden origin-top-left absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="content-type-menu"
                >
                  <div className="py-1" role="none">
                    <button
                      className={`${contentType === 'lyrics' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      role="menuitem"
                      onClick={() => {
                        handleContentTypeChange('lyrics');
                        document.getElementById('content-type-dropdown').classList.add('hidden');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Lyrics
                    </button>
                    <button
                      className={`${contentType === 'tracklist' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      role="menuitem"
                      onClick={() => {
                        handleContentTypeChange('tracklist');
                        document.getElementById('content-type-dropdown').classList.add('hidden');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      Tracklist
                    </button>
                    <button
                      className={`${contentType === 'other' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      role="menuitem"
                      onClick={() => {
                        handleContentTypeChange('other');
                        document.getElementById('content-type-dropdown').classList.add('hidden');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      Other
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Media button */}
              <button
                className={`inline-flex justify-center items-center px-3 py-1.5 ${getThemeClasses(theme, 'button', 'accent')} text-sm font-medium ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                onClick={() => setShowMediaManager(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {!songImage && !songAudio ? 'Add Media + AI Images' : 'Media & AI'}
              </button>
            </div>
            
            {/* Center - Action buttons */}
            <div className="flex items-center gap-2">
              {/* Add to Playlist button */}
              <button
                className={`inline-flex justify-center items-center px-3 py-1.5 ${getThemeClasses(theme, 'button', 'primary')} text-sm font-medium ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                onClick={() => setShowAddToPlaylist(!showAddToPlaylist)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Playlist
              </button>
              
              {/* Export button */}
              <button
                className={`inline-flex justify-center items-center px-3 py-1.5 ${getThemeClasses(theme, 'button', 'secondary')} text-sm font-medium ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                onClick={() => {
                  exportSongToMarkdown();
                  setNotification({
                    show: true,
                    type: 'success',
                    message: `"${song.title}" exported to Markdown!`
                  });
                  setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
            
            {/* Right side - AI and Delete */}
            <div className="flex items-center gap-2 ml-auto">
              {/* AI dropdown button */}
              <div className="relative inline-block">
                <button
                  type="button"
                  className="inline-flex justify-center items-center px-3 py-1.5 border border-purple-500 shadow-sm text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  id="ai-menu"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => document.getElementById('ai-dropdown').classList.toggle('hidden')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div
                  id="ai-dropdown"
                  className="hidden origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="ai-menu"
                >
                  <div className="py-1" role="none">
                    <button
                      className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 w-full text-left"
                      role="menuitem"
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
                      role="menuitem"
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
                      role="menuitem"
                      onClick={() => {
                        openGeminiHelper('format');
                        document.getElementById('ai-dropdown').classList.add('hidden');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      <div>
                        <p className="font-medium">Format as Markdown</p>
                        <p className="text-xs text-gray-500">Add Markdown formatting</p>
                      </div>
                    </button>
                    <button
                      className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 w-full text-left"
                      role="menuitem"
                      onClick={() => {
                        openGeminiHelper('create');
                        document.getElementById('ai-dropdown').classList.add('hidden');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <div>
                        <p className="font-medium">Create New Song</p>
                        <p className="text-xs text-gray-500">Generate complete lyrics</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Delete button */}
              <button 
                className={`inline-flex justify-center items-center px-3 py-1.5 ${getThemeClasses(theme, 'button', 'danger')} text-sm font-medium ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete song"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
        
        {/* Add to Playlist dropdown */}
        {showAddToPlaylist && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-800">Add to Playlist</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddToPlaylist(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    className="text-left p-3 bg-white border border-gray-200 rounded hover:bg-blue-50 flex justify-between items-center"
                    onClick={() => handleAddToPlaylist(playlist.id)}
                  >
                    <div>
                      <span className="font-medium text-gray-800">{playlist.name}</span>
                      <p className="text-sm text-gray-500">{playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">
                <p>No playlists available</p>
                <p className="text-sm mt-1">Create a playlist in the Playlists tab first</p>
              </div>
            )}
          </div>
        )}
        
        {/* Sounds Like section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">What it sounds like:</h3>
            {editingSoundsLike ? (
              <div className="flex space-x-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm font-medium"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md flex items-center text-sm font-medium"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                  onClick={() => handleEdit('soundsLike')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
                <button
                  className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium"
                  onClick={generateSoundsLike}
                  disabled={isSaving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {isSaving ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
            )}
          </div>
          
          {editingSoundsLike ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={editedSoundsLike}
                onChange={(e) => setEditedSoundsLike(e.target.value)}
                onKeyDown={(e) => {
                  // Ctrl+S (Cmd+S on Mac) to save
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    handleSave();
                  }
                  // Escape to cancel
                  else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                  }
                }}
                className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm min-h-[100px]"
                spellCheck={false}
                placeholder="Describe the musical style, instrumentation, and atmosphere..."
              />
            </div>
          ) : (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              {song.soundsLike ? (
                <p className="text-gray-700 italic">{song.soundsLike}</p>
              ) : (
                <p className="text-gray-500 italic">No musical description available. Click "Edit" or "AI Generate" to add one.</p>
              )}
            </div>
          )}
        </div>
        
        {/* Album Membership section */}
        {containingAlbums.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Found in Albums:</h3>
            <div className="flex flex-wrap gap-2">
              {containingAlbums.map(album => (
                <button
                  key={album.id}
                  onClick={() => onNavigateToAlbum && onNavigateToAlbum(album.id)}
                  className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors duration-200 cursor-pointer"
                  title={`Go to album: ${album.title}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  {album.title}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Game Attributes section (only shown in game mode) */}
        {isGameMode && (
          <div className="mb-6">
            <SongAttributesEditor 
              song={song} 
              onUpdate={onUpdate}
              gameState={gameState}
            />
          </div>
        )}
        
        <div className="border-b border-gray-200 mb-4"></div>
        
        {/* Navigation buttons for mobile */}
        <div className="md:hidden mb-4 flex">
          <button className="text-blue-600 hover:underline mr-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to songs
          </button>
        </div>
        
        {/* Delete confirmation dialog */}
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

      {/* Lyrics/Content section */}
      <div className="mb-8 song-content">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-700">
            {contentType === 'lyrics' ? 'Lyrics' : contentType === 'tracklist' ? 'Tracklist' : 'Content'}
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full" style={{
              backgroundColor: contentType === 'lyrics' ? '#EFF6FF' : contentType === 'tracklist' ? '#FEF3C7' : '#F3F4F6',
              color: contentType === 'lyrics' ? '#1E40AF' : contentType === 'tracklist' ? '#92400E' : '#4B5563'
            }}>
              {contentType === 'lyrics' ? 'Lyrics' : contentType === 'tracklist' ? 'Tracklist' : 'Other'}
            </span>
          </h2>
          {editMode ? (
            <div className="flex space-x-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm font-medium"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </>
                )}
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md flex items-center text-sm font-medium"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          ) : !editingNotes && (
            <div className="flex space-x-2">
              {song.lyrics && (
                <button
                  className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium"
                  onClick={() => {
                    // Create combined text with title, lyrics, and sounds like
                    let combinedText = song.title;
                    if (song.lyrics) {
                      combinedText += '\n\n' + song.lyrics;
                    }
                    if (song.soundsLike) {
                      combinedText += '\n\nSounds like: ' + song.soundsLike;
                    }
                    
                    navigator.clipboard.writeText(combinedText);
                    setNotification({ 
                      show: true, 
                      type: 'copy', 
                      message: 'Song copied to clipboard!' 
                    });
                    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
                  }}
                  title="Copy title, lyrics and sounds like to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              )}
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                onClick={() => handleEdit('lyrics')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit lyrics
              </button>
              
              {/* Add AI button specifically for lyrics */}
              <button
                className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium"
                onClick={() => openGeminiHelper('clean')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Clean-up
              </button>
            </div>
          )}
        </div>
        
        {editMode ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl+S (Cmd+S on Mac) to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSave();
                }
                // Escape to cancel
                else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              className="w-full p-4 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm min-h-[300px]"
              spellCheck={false}
              placeholder="Enter lyrics here... Natural formatting is preserved."
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <button 
                onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                className="text-blue-500 hover:text-blue-700 bg-white rounded-md px-2 py-1 text-xs flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Markdown Help
              </button>
              <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-md">
                Markdown supported
              </span>
            </div>
            
            {/* Markdown Help Popup */}
            {showMarkdownHelp && (
              <div className="absolute bottom-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Markdown Formatting</h3>
                  <button 
                    onClick={() => setShowMarkdownHelp(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm max-h-60 overflow-y-auto">
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">## Heading</code>
                    <span className="text-gray-600 ml-2">Creates a heading</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">**Bold**</code>
                    <span className="text-gray-600 ml-2">Makes text <strong>bold</strong></span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">*Italic*</code>
                    <span className="text-gray-600 ml-2">Makes text <em>italic</em></span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">[Link](https://example.com)</code>
                    <span className="text-gray-600 ml-2">Creates a link</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">- Item 1</code>
                    <span className="text-gray-600 ml-2">Creates a bullet list</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">1. Item 1</code>
                    <span className="text-gray-600 ml-2">Creates a numbered list</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;!-- Comment --&gt;</code>
                    <span className="text-gray-600 ml-2">Add a comment (not shown)</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">---</code>
                    <span className="text-gray-600 ml-2">Adds a horizontal line</span>
                  </div>
                </div>
              </div>
            )}            
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <LyricsDisplay lyrics={song.lyrics} contentType={contentType} />
          </div>
        )}
      </div>

      {/* Notes section */}
      <div className="mb-8 song-content">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-700">Notes</h2>
          {editingNotes ? (
            <div className="flex space-x-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md flex items-center text-sm font-medium"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </>
                )}
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md flex items-center text-sm font-medium"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          ) : !editMode && (
            <div className="flex space-x-2">
              {song.notes && (
                <button
                  className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium"
                  onClick={() => {
                    navigator.clipboard.writeText(song.notes);
                    setNotification({ 
                      show: true, 
                      type: 'copy', 
                      message: 'Notes copied to clipboard!' 
                    });
                    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
                  }}
                  title="Copy notes to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              )}
              
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                onClick={() => handleEdit('notes')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit notes
              </button>
              
              {/* Add AI button specifically for notes */}
              <button
                className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium"
                onClick={() => openGeminiHelper('generate')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Generate
              </button>
            </div>
          )}
        </div>
        
        {editingNotes ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl+S (Cmd+S on Mac) to save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSave();
                }
                // Escape to cancel
                else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              className="w-full p-4 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm min-h-[200px]"
              spellCheck={false}
              placeholder="Enter notes here... Markdown formatting is supported."
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <button 
                onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                className="text-blue-500 hover:text-blue-700 bg-white rounded-md px-2 py-1 text-xs flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Markdown Help
              </button>
              <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-md">
                Markdown supported
              </span>
            </div>
            
            {/* Markdown Help Popup */}
            {showMarkdownHelp && (
              <div className="absolute bottom-12 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-10">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Markdown Formatting</h3>
                  <button 
                    onClick={() => setShowMarkdownHelp(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm max-h-60 overflow-y-auto">
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">## Heading</code>
                    <span className="text-gray-600 ml-2">Creates a heading</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">**Bold**</code>
                    <span className="text-gray-600 ml-2">Makes text <strong>bold</strong></span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">*Italic*</code>
                    <span className="text-gray-600 ml-2">Makes text <em>italic</em></span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">[Link](https://example.com)</code>
                    <span className="text-gray-600 ml-2">Creates a link</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">- Item 1</code>
                    <span className="text-gray-600 ml-2">Creates a bullet list</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">1. Item 1</code>
                    <span className="text-gray-600 ml-2">Creates a numbered list</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;!-- Comment --&gt;</code>
                    <span className="text-gray-600 ml-2">Add a comment (not shown)</span>
                  </div>
                  <div className="mb-2">
                    <code className="bg-gray-100 px-1 py-0.5 rounded">---</code>
                    <span className="text-gray-600 ml-2">Adds a horizontal line</span>
                  </div>
                </div>
              </div>
            )}            
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {song.notes ? (
              <div className="markdown-content">
                <ReactMarkdown>
                  {song.notes}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No notes available</p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons - only show for editing title since it doesn't have inline buttons */}
      {editingTitle && (
        <div className="flex space-x-4 sticky bottom-4 bg-white p-4 border-t shadow-md rounded-lg">
          <button
            className={`flex-1 ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-3 rounded-lg transition-colors duration-200 flex justify-center items-center font-medium`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg transition-colors duration-200 flex justify-center items-center font-medium"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      )}
      </div>
    </div>
  );
}