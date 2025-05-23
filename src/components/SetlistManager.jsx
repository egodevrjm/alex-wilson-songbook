import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { generateSlug } from '../utils/helpers';

const SetlistManager = ({ songs, onSetlistCreated, onSetlistUpdated, onSetlistDeleted }) => {
  const { theme } = useTheme();
  const [setlists, setSetlists] = useState([]);
  const [showCreateSetlist, setShowCreateSetlist] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(3); // seconds per line
  const [setlistForm, setSetlistForm] = useState({
    name: '',
    description: '',
    venue: '',
    date: '',
    type: 'custom', // 'custom', 'acoustic', 'full-band', 'greatest-hits'
    estimatedDuration: 0,
    notes: ''
  });

  // Setlist templates
  const setlistTemplates = [
    {
      id: 'acoustic',
      name: 'Acoustic Set',
      description: 'Intimate acoustic performance',
      suggestedSongs: [] // Will be populated based on songs with acoustic feel
    },
    {
      id: 'full-band',
      name: 'Full Band',
      description: 'High-energy full band performance',
      suggestedSongs: [] // Will be populated based on songs with band arrangement
    },
    {
      id: 'greatest-hits',
      name: 'Greatest Hits',
      description: 'Popular crowd favourites',
      suggestedSongs: [] // Will be populated based on play count or rating
    },
    {
      id: 'storyteller',
      name: 'Storyteller',
      description: 'Narrative-focused performance',
      suggestedSongs: [] // Will be populated based on songs with strong storytelling
    }
  ];

  // Load setlists from localStorage on component mount
  useEffect(() => {
    try {
      const savedSetlists = localStorage.getItem('songbook-setlists');
      if (savedSetlists) {
        const parsedSetlists = JSON.parse(savedSetlists);
        console.log('Setlists loaded from localStorage:', parsedSetlists);
        setSetlists(parsedSetlists);
      }
    } catch (error) {
      console.error('Error loading setlists from localStorage:', error);
    }
  }, []);

  // Save setlists to localStorage whenever setlists change
  useEffect(() => {
    try {
      localStorage.setItem('songbook-setlists', JSON.stringify(setlists));
      console.log('Setlists saved to localStorage:', setlists);
    } catch (error) {
      console.error('Error saving setlists to localStorage:', error);
    }
  }, [setlists]);

  // Auto-scroll functionality for performance mode
  useEffect(() => {
    let interval;
    if (performanceMode && selectedSetlist) {
      const currentSong = getSetlistSongs(selectedSetlist)[currentSongIndex];
      if (currentSong && currentSong.lyrics) {
        const lines = currentSong.lyrics.split('\n');
        let lineIndex = 0;
        
        interval = setInterval(() => {
          if (lineIndex < lines.length - 1) {
            lineIndex++;
            // Auto-scroll to next line (implementation would require DOM manipulation)
          }
        }, autoScrollSpeed * 1000);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [performanceMode, selectedSetlist, currentSongIndex, autoScrollSpeed]);

  // Create new setlist
  const createSetlist = () => {
    if (!setlistForm.name.trim()) return;

    const newSetlist = {
      id: `setlist-${Date.now()}`,
      slug: generateSlug(setlistForm.name),
      name: setlistForm.name.trim(),
      description: setlistForm.description.trim(),
      venue: setlistForm.venue.trim(),
      date: setlistForm.date,
      type: setlistForm.type,
      estimatedDuration: setlistForm.estimatedDuration,
      notes: setlistForm.notes.trim(),
      songs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Apply template if selected
    if (setlistForm.type !== 'custom') {
      const template = setlistTemplates.find(t => t.id === setlistForm.type);
      if (template) {
        newSetlist.songs = getSuggestedSongsForTemplate(template.id);
      }
    }

    setSetlists(prev => [...prev, newSetlist]);
    setSetlistForm({
      name: '',
      description: '',
      venue: '',
      date: '',
      type: 'custom',
      estimatedDuration: 0,
      notes: ''
    });
    setShowCreateSetlist(false);
    
    if (onSetlistCreated) onSetlistCreated(newSetlist);
  };

  // Get suggested songs for template
  const getSuggestedSongsForTemplate = (templateId) => {
    const maxSongs = 12;
    let suggestedSongs = [];

    switch (templateId) {
      case 'acoustic':
        // Prioritize songs that work well acoustically
        suggestedSongs = songs
          .filter(song => 
            song.notes && (
              song.notes.toLowerCase().includes('acoustic') ||
              song.notes.toLowerCase().includes('sparse') ||
              song.notes.toLowerCase().includes('intimate')
            )
          )
          .slice(0, maxSongs);
        break;
      
      case 'full-band':
        // Prioritize high-energy songs
        suggestedSongs = songs
          .filter(song => 
            song.notes && (
              song.notes.toLowerCase().includes('upbeat') ||
              song.notes.toLowerCase().includes('driving') ||
              song.notes.toLowerCase().includes('anthemic')
            )
          )
          .slice(0, maxSongs);
        break;
      
      case 'greatest-hits':
        // Use first songs as "greatest hits" (in real app, would use play counts/ratings)
        suggestedSongs = songs.slice(0, maxSongs);
        break;
      
      case 'storyteller':
        // Prioritize narrative songs
        suggestedSongs = songs
          .filter(song => 
            song.notes && (
              song.notes.toLowerCase().includes('story') ||
              song.notes.toLowerCase().includes('narrative') ||
              song.lyrics && song.lyrics.length > 500
            )
          )
          .slice(0, maxSongs);
        break;
      
      default:
        suggestedSongs = [];
    }

    // Convert to setlist format
    return suggestedSongs.map((song, index) => ({
      slug: song.slug,
      position: index + 1,
      timing: {
        estimatedDuration: 3.5, // Default 3.5 minute estimate
        notes: ''
      },
      addedAt: new Date().toISOString()
    }));
  };

  // Update setlist
  const updateSetlist = (setlistId, updates) => {
    setSetlists(prev => prev.map(setlist => 
      setlist.id === setlistId 
        ? { ...setlist, ...updates, updatedAt: new Date().toISOString() }
        : setlist
    ));
    
    if (onSetlistUpdated) onSetlistUpdated(setlistId, updates);
  };

  // Delete setlist
  const deleteSetlist = (setlistId) => {
    setSetlists(prev => prev.filter(setlist => setlist.id !== setlistId));
    if (selectedSetlist?.id === setlistId) {
      setSelectedSetlist(null);
      setPerformanceMode(false);
    }
    
    if (onSetlistDeleted) onSetlistDeleted(setlistId);
  };

  // Add song to setlist
  const addSongToSetlist = (setlistId, songSlug, position = null) => {
    const setlist = setlists.find(s => s.id === setlistId);
    if (!setlist) return;

    const existingSong = setlist.songs.find(s => s.slug === songSlug);
    if (existingSong) return; // Song already in setlist

    const song = songs.find(s => s.slug === songSlug);
    if (!song) return;

    const newPosition = position || (setlist.songs.length + 1);
    const updatedSongs = [...setlist.songs, {
      slug: songSlug,
      position: newPosition,
      timing: {
        estimatedDuration: 3.5, // Default estimate
        notes: ''
      },
      addedAt: new Date().toISOString()
    }].sort((a, b) => a.position - b.position);

    updateSetlist(setlistId, { songs: updatedSongs });
  };

  // Remove song from setlist
  const removeSongFromSetlist = (setlistId, songSlug) => {
    const setlist = setlists.find(s => s.id === setlistId);
    if (!setlist) return;

    const updatedSongs = setlist.songs.filter(s => s.slug !== songSlug);
    // Reorder positions
    updatedSongs.forEach((song, index) => {
      song.position = index + 1;
    });

    updateSetlist(setlistId, { songs: updatedSongs });
  };

  // Reorder songs in setlist
  const reorderSongs = (setlistId, fromIndex, toIndex) => {
    const setlist = setlists.find(s => s.id === setlistId);
    if (!setlist) return;

    const updatedSongs = [...setlist.songs];
    const [movedSong] = updatedSongs.splice(fromIndex, 1);
    updatedSongs.splice(toIndex, 0, movedSong);

    // Update positions
    updatedSongs.forEach((song, index) => {
      song.position = index + 1;
    });

    updateSetlist(setlistId, { songs: updatedSongs });
  };

  // Get songs for a setlist with full song data
  const getSetlistSongs = (setlist) => {
    return setlist.songs.map(setlistSong => {
      const song = songs.find(s => s.slug === setlistSong.slug);
      return song ? { ...song, ...setlistSong } : null;
    }).filter(Boolean).sort((a, b) => a.position - b.position);
  };

  // Calculate total setlist duration
  const getSetlistDuration = (setlist) => {
    return setlist.songs.reduce((total, song) => {
      return total + (song.timing?.estimatedDuration || 3.5);
    }, 0);
  };

  // Export setlist to various formats
  const exportSetlist = (setlist, format = 'markdown') => {
    const setlistSongs = getSetlistSongs(setlist);
    const totalDuration = getSetlistDuration(setlist);
    
    let content = '';

    switch (format) {
      case 'markdown':
        content = `# ${setlist.name}\n\n`;
        if (setlist.description) content += `${setlist.description}\n\n`;
        if (setlist.venue) content += `**Venue:** ${setlist.venue}\n`;
        if (setlist.date) content += `**Date:** ${new Date(setlist.date).toLocaleDateString('en-GB')}\n`;
        content += `**Total Songs:** ${setlistSongs.length}\n`;
        content += `**Estimated Duration:** ${Math.floor(totalDuration / 60)}:${String(Math.round(totalDuration % 60)).padStart(2, '0')}\n\n`;
        
        content += `## Setlist\n\n`;
        setlistSongs.forEach((song, index) => {
          content += `${index + 1}. ${song.title}`;
          if (song.timing?.estimatedDuration) {
            content += ` (${song.timing.estimatedDuration} min)`;
          }
          if (song.timing?.notes) {
            content += ` - ${song.timing.notes}`;
          }
          content += '\n';
        });

        if (setlist.notes) {
          content += `\n## Notes\n\n${setlist.notes}\n`;
        }
        break;

      case 'text':
        content = `${setlist.name}\n${setlist.name.replace(/./g, '=')}\n\n`;
        setlistSongs.forEach((song, index) => {
          content += `${index + 1}. ${song.title}\n`;
        });
        break;

      case 'json':
        content = JSON.stringify({
          setlist: {
            ...setlist,
            songs: setlistSongs.map(song => ({
              title: song.title,
              position: song.position,
              timing: song.timing
            }))
          }
        }, null, 2);
        break;
    }

    // Download file
    const blob = new Blob([content], { type: getContentType(format) });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generateSlug(setlist.name)}.${getFileExtension(format)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getContentType = (format) => {
    switch (format) {
      case 'markdown': return 'text/markdown';
      case 'text': return 'text/plain';
      case 'json': return 'application/json';
      default: return 'text/plain';
    }
  };

  const getFileExtension = (format) => {
    switch (format) {
      case 'markdown': return 'md';
      case 'text': return 'txt';
      case 'json': return 'json';
      default: return 'txt';
    }
  };

  // Share setlist with band members (simplified - in reality would integrate with email/messaging)
  const shareSetlist = (setlist) => {
    const setlistSongs = getSetlistSongs(setlist);
    const shareText = `${setlist.name}\n\nSetlist:\n${setlistSongs.map((song, index) => `${index + 1}. ${song.title}`).join('\n')}`;
    
    if (navigator.share) {
      navigator.share({
        title: setlist.name,
        text: shareText
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Setlist copied to clipboard!');
      });
    }
  };

  // Performance mode navigation
  const navigateToSong = (index) => {
    setCurrentSongIndex(index);
  };

  const nextSong = () => {
    const setlistSongs = getSetlistSongs(selectedSetlist);
    if (currentSongIndex < setlistSongs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const previousSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {!performanceMode ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Setlist Manager</h2>
            <button
              onClick={() => setShowCreateSetlist(true)}
              className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors flex items-center`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Setlist
            </button>
          </div>

          {/* Setlists Grid */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
            {setlists.map(setlist => {
              const setlistSongs = getSetlistSongs(setlist);
              const duration = getSetlistDuration(setlist);
              
              return (
                <div
                  key={setlist.id}
                  className={`${theme.components.card.background} ${theme.components.card.border} ${theme.layout.borderRadius} p-4 cursor-pointer hover:shadow-lg transition-shadow`}
                  onClick={() => setSelectedSetlist(setlist)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{setlist.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalized">
                        {setlist.type}
                      </span>
                    </div>
                    
                    {setlist.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{setlist.description}</p>
                    )}
                    
                    <div className="space-y-1 text-sm text-gray-500">
                      {setlist.venue && <div>📍 {setlist.venue}</div>}
                      {setlist.date && (
                        <div>📅 {new Date(setlist.date).toLocaleDateString('en-GB')}</div>
                      )}
                      <div>🎵 {setlistSongs.length} songs</div>
                      <div>⏱️ {Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, '0')}</div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSetlist(setlist);
                          setPerformanceMode(true);
                          setCurrentSongIndex(0);
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                        title="Performance Mode"
                      >
                        Perform
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSetlist(setlist);
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                        title="Export"
                      >
                        Export
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareSetlist(setlist);
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                        title="Share"
                      >
                        Share
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${setlist.name}"?`)) {
                            deleteSetlist(setlist.id);
                          }
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.secondary} text-red-600 hover:bg-red-50 ${theme.layout.borderRadius} transition-colors`}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

              {setlists.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No setlists yet</h3>
                  <p className="text-center max-w-md mb-4">Create your first setlist to get started planning your performances</p>
                  <button
                    onClick={() => setShowCreateSetlist(true)}
                    className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                  >
                    Create Setlist
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Create Setlist Modal */}
          {showCreateSetlist && (
            <CreateSetlistModal
              setlistForm={setlistForm}
              setSetlistForm={setSetlistForm}
              setlistTemplates={setlistTemplates}
              onCreateSetlist={createSetlist}
              onClose={() => setShowCreateSetlist(false)}
              theme={theme}
            />
          )}

          {/* Setlist Detail Modal */}
          {selectedSetlist && !performanceMode && (
            <SetlistDetailModal
              setlist={selectedSetlist}
              songs={songs}
              onClose={() => setSelectedSetlist(null)}
              onAddSong={addSongToSetlist}
              onRemoveSong={removeSongFromSetlist}
              onReorderSongs={reorderSongs}
              onUpdateSetlist={updateSetlist}
              onExportSetlist={exportSetlist}
              onShareSetlist={shareSetlist}
              onEnterPerformanceMode={() => {
                setPerformanceMode(true);
                setCurrentSongIndex(0);
              }}
              getSetlistSongs={getSetlistSongs}
              getSetlistDuration={getSetlistDuration}
              theme={theme}
            />
          )}
        </>
      ) : (
        /* Performance Mode */
        <PerformanceMode
          setlist={selectedSetlist}
          setlistSongs={getSetlistSongs(selectedSetlist)}
          currentSongIndex={currentSongIndex}
          onNavigateToSong={navigateToSong}
          onNextSong={nextSong}
          onPreviousSong={previousSong}
          onExitPerformanceMode={() => {
            setPerformanceMode(false);
            setCurrentSongIndex(0);
          }}
          autoScrollSpeed={autoScrollSpeed}
          onAutoScrollSpeedChange={setAutoScrollSpeed}
          theme={theme}
        />
      )}
    </div>
  );
};

// Create Setlist Modal Component
const CreateSetlistModal = ({ 
  setlistForm, 
  setSetlistForm, 
  setlistTemplates, 
  onCreateSetlist, 
  onClose, 
  theme 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme.components.modal.background} ${theme.layout.borderRadius} p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto`}>
        <h3 className="text-lg font-semibold mb-4">Create New Setlist</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setlist Name</label>
            <input
              type="text"
              value={setlistForm.name}
              onChange={(e) => setSetlistForm(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Enter setlist name..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              value={setlistForm.type}
              onChange={(e) => setSetlistForm(prev => ({ ...prev, type: e.target.value }))}
              className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="custom">Custom</option>
              {setlistTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={setlistForm.description}
              onChange={(e) => setSetlistForm(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              rows={3}
              placeholder="Setlist description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                value={setlistForm.venue}
                onChange={(e) => setSetlistForm(prev => ({ ...prev, venue: e.target.value }))}
                className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Venue name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={setlistForm.date}
                onChange={(e) => setSetlistForm(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={setlistForm.notes}
              onChange={(e) => setSetlistForm(prev => ({ ...prev, notes: e.target.value }))}
              className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              rows={2}
              placeholder="Performance notes..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onCreateSetlist}
            disabled={!setlistForm.name.trim()}
            className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Create Setlist
          </button>
        </div>
      </div>
    </div>
  );
};

// Setlist Detail Modal Component (would be similar to Album detail, adapted for setlists)
const SetlistDetailModal = ({ 
  setlist, 
  songs,
  onClose, 
  onAddSong, 
  onRemoveSong, 
  onReorderSongs,
  onUpdateSetlist,
  onExportSetlist,
  onShareSetlist,
  onEnterPerformanceMode,
  getSetlistSongs,
  getSetlistDuration,
  theme 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: setlist.name,
    description: setlist.description || '',
    venue: setlist.venue || '',
    date: setlist.date || '',
    notes: setlist.notes || ''
  });

  const setlistSongs = getSetlistSongs(setlist);
  const duration = getSetlistDuration(setlist);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderSongs(setlist.id, draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const saveEdit = () => {
    onUpdateSetlist(setlist.id, editForm);
    setEditMode(false);
  };

  const getUnusedSongs = () => {
    const usedSlugs = new Set(setlist.songs.map(s => s.slug));
    return songs.filter(song => !usedSlugs.has(song.slug));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme.components.modal.background} ${theme.layout.borderRadius} w-full max-w-4xl max-h-90vh overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          {editMode ? (
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className={`text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.layout.borderRadius} px-2 py-1`}
            />
          ) : (
            <h2 className="text-2xl font-bold">{setlist.name}</h2>
          )}
          
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className={`px-3 py-1 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className={`px-3 py-1 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className={`px-3 py-1 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Edit
                </button>
                <button
                  onClick={onEnterPerformanceMode}
                  className={`px-3 py-1 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Performance Mode
                </button>
                <button
                  onClick={() => onExportSetlist(setlist)}
                  className={`px-3 py-1 ${theme.components.button.accent} ${theme.layout.borderRadius} transition-colors`}
                >
                  Export
                </button>
                <button
                  onClick={() => onShareSetlist(setlist)}
                  className={`px-3 py-1 ${theme.components.button.accent} ${theme.layout.borderRadius} transition-colors`}
                >
                  Share
                </button>
                <button
                  onClick={onClose}
                  className={`px-3 py-1 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Setlist Info */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                      <input
                        type="text"
                        value={editForm.venue}
                        onChange={(e) => setEditForm(prev => ({ ...prev, venue: e.target.value }))}
                        className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        className={`w-full ${theme.components.input.background} ${theme.components.input.border} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {setlist.description && (
                      <div>
                        <h4 className="font-medium text-gray-900">Description</h4>
                        <p className="text-gray-600 mt-1">{setlist.description}</p>
                      </div>
                    )}
                    {setlist.venue && (
                      <div>
                        <h4 className="font-medium text-gray-900">Venue</h4>
                        <p className="text-gray-600 mt-1">{setlist.venue}</p>
                      </div>
                    )}
                    {setlist.date && (
                      <div>
                        <h4 className="font-medium text-gray-900">Date</h4>
                        <p className="text-gray-600 mt-1">{new Date(setlist.date).toLocaleDateString('en-GB')}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">Statistics</h4>
                      <ul className="text-gray-600 mt-1 space-y-1 text-sm">
                        <li>{setlistSongs.length} songs</li>
                        <li>{Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, '0')} total duration</li>
                        <li>~{Math.round(duration / setlistSongs.length || 0)} min/song avg</li>
                      </ul>
                    </div>
                    {setlist.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900">Notes</h4>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{setlist.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Song List */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Songs ({setlistSongs.length})</h3>
                <button
                  onClick={() => setShowAddSongs(true)}
                  className={`px-3 py-1 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Add Songs
                </button>
              </div>

              {setlistSongs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No songs in this setlist yet</p>
                  <button
                    onClick={() => setShowAddSongs(true)}
                    className={`mt-2 px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                  >
                    Add First Song
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {setlistSongs.map((song, index) => (
                    <div
                      key={song.slug}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center p-3 ${theme.components.card.background} ${theme.components.card.border} ${theme.layout.borderRadius} cursor-move hover:shadow-md transition-shadow ${
                        draggedIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <span className="w-8 text-center font-medium text-gray-500">{song.position}</span>
                        <div className="flex-1 ml-3">
                          <h4 className="font-medium">{song.title}</h4>
                          {song.timing?.notes && (
                            <p className="text-sm text-gray-500">{song.timing.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-sm text-gray-500">
                            {song.timing?.estimatedDuration || 3.5} min
                          </span>
                          <div className="flex gap-1">
                            {song.lyrics && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Lyrics</span>}
                            {song.notes && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Notes</span>}
                            {song.audio && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Audio</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveSong(setlist.id, song.slug)}
                        className="ml-3 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove from setlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Songs Modal */}
        {showAddSongs && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className={`${theme.components.modal.background} ${theme.layout.borderRadius} w-96 max-h-96 overflow-hidden`}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Add Songs to Setlist</h3>
              </div>
              <div className="p-4 overflow-y-auto max-h-64">
                {getUnusedSongs().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">All songs are already in this setlist</p>
                ) : (
                  <div className="space-y-2">
                    {getUnusedSongs().map(song => (
                      <div key={song.slug} className={`flex items-center justify-between p-2 ${theme.components.card.background} ${theme.layout.borderRadius}`}>
                        <span className="font-medium">{song.title}</span>
                        <button
                          onClick={() => {
                            onAddSong(setlist.id, song.slug);
                            // Don't close modal so user can add multiple songs
                          }}
                          className={`px-2 py-1 text-sm ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={() => setShowAddSongs(false)}
                  className={`w-full ${theme.components.button.secondary} ${theme.layout.borderRadius} py-2 transition-colors`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Performance Mode Component
const PerformanceMode = ({ 
  setlist, 
  setlistSongs, 
  currentSongIndex, 
  onNavigateToSong,
  onNextSong,
  onPreviousSong,
  onExitPerformanceMode,
  autoScrollSpeed,
  onAutoScrollSpeedChange,
  theme 
}) => {
  const currentSong = setlistSongs[currentSongIndex];
  const [fontSize, setFontSize] = useState(18);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    // Hide controls after inactivity
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 5000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        onNextSong();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPreviousSong();
      } else if (e.key === 'Escape') {
        onExitPerformanceMode();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onNextSong, onPreviousSong, onExitPerformanceMode]);

  if (!currentSong) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">No songs in setlist</h2>
          <button
            onClick={onExitPerformanceMode}
            className="px-4 py-2 bg-white text-black rounded"
          >
            Exit Performance Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{setlist.name}</h1>
              <p className="text-sm opacity-75">
                {currentSongIndex + 1} of {setlistSongs.length}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm">Font Size:</label>
                <input
                  type="range"
                  min="12"
                  max="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm w-8">{fontSize}px</span>
              </div>
              <button
                onClick={onExitPerformanceMode}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Navigation */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex justify-center gap-4">
            <button
              onClick={onPreviousSong}
              disabled={currentSongIndex === 0}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 bg-gray-800 rounded">
              {currentSong.title}
            </span>
            <button
              onClick={onNextSong}
              disabled={currentSongIndex === setlistSongs.length - 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Next →
            </button>
          </div>
          
          {/* Setlist Overview */}
          <div className="mt-4 flex justify-center">
            <div className="flex gap-1 overflow-x-auto max-w-full">
              {setlistSongs.map((song, index) => (
                <button
                  key={song.slug}
                  onClick={() => onNavigateToSong(index)}
                  className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                    index === currentSongIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  } transition-colors`}
                >
                  {index + 1}. {song.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-8 py-16 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          {/* Song Title */}
          <h2 className="text-4xl font-bold text-center mb-8">{currentSong.title}</h2>
          
          {/* Song Content */}
          <div 
            className="space-y-4 leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          >
            {currentSong.lyrics ? (
              <div className="whitespace-pre-line font-mono">
                {currentSong.lyrics}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-lg">No lyrics available</p>
                {currentSong.notes && (
                  <div className="mt-4 text-left">
                    <h3 className="text-xl font-semibold mb-2">Notes:</h3>
                    <div className="whitespace-pre-line">
                      {currentSong.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Song Notes (if lyrics exist) */}
            {currentSong.lyrics && currentSong.notes && (
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Notes:</h3>
                <div className="whitespace-pre-line text-gray-300">
                  {currentSong.notes}
                </div>
              </div>
            )}
            
            {/* Timing Notes */}
            {currentSong.timing?.notes && (
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Performance Notes:</h3>
                <div className="whitespace-pre-line text-yellow-300">
                  {currentSong.timing.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invisible click areas for navigation */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer"
        onClick={onPreviousSong}
        title="Previous song"
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer"
        onClick={onNextSong}
        title="Next song"
      />
    </div>
  );
};

export default SetlistManager;
