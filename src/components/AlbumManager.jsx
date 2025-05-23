import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { generateSlug } from '../utils/helpers';
import AlbumImageGenerator from './AlbumImageGenerator';

const AlbumManager = ({ 
  songs, 
  albums = [],
  albumsLoaded = false,
  onSongUpdate, 
  onAlbumCreated, 
  onAlbumUpdated, 
  onAlbumDeleted,
  onAddSongToAlbum,
  onRemoveSongFromAlbum,
  onReorderSongs,
  onNavigateToSong
}) => {
  const { theme } = useTheme();
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [albumForImageGeneration, setAlbumForImageGeneration] = useState(null);
  const [albumForm, setAlbumForm] = useState({
    title: '',
    description: '',
    releaseDate: '',
    coverArt: null,
    coverArtPreview: null,
    type: 'standard' // 'standard', 'compilation', 'various'
  });

  // Add loading state check
  if (!albumsLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading albums...</p>
        </div>
      </div>
    );
  }

  // Handle cover art upload
  const handleCoverArtUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAlbumForm(prev => ({
          ...prev,
          coverArt: e.target.result,
          coverArtPreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Create new album
  const createAlbum = () => {
    if (!albumForm.title.trim()) return;

    const albumData = {
      title: albumForm.title.trim(),
      description: albumForm.description.trim(),
      releaseDate: albumForm.releaseDate,
      coverArt: albumForm.coverArt,
      type: albumForm.type
    };

    console.log('Creating new album:', albumData);
    
    // Use the parent handler
    onAlbumCreated(albumData);
    
    // Reset form
    setAlbumForm({
      title: '',
      description: '',
      releaseDate: '',
      coverArt: null,
      coverArtPreview: null,
      type: 'standard'
    });
    setShowCreateAlbum(false);
  };

  // Delete album
  const deleteAlbum = (albumId) => {
    onAlbumDeleted(albumId);
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum(null);
    }
  };

  // These functions now just call the parent handlers
  const addSongToAlbum = onAddSongToAlbum;
  const removeSongFromAlbum = onRemoveSongFromAlbum;
  const reorderSongs = onReorderSongs;

  // Handle album image generation
  const handleOpenImageGenerator = (album) => {
    const albumData = {
      ...album,
      songs: album.songs.map(albumSong => {
        const fullSong = songs.find(s => s.slug === albumSong.slug);
        return fullSong ? { ...fullSong, trackNumber: albumSong.trackNumber } : null;
      }).filter(Boolean)
    };
    setAlbumForImageGeneration(albumData);
    setShowImageGenerator(true);
  };

  const handleImageGenerated = async (imageData) => {
    if (albumForImageGeneration) {
      const updatedAlbum = {
        ...albumForImageGeneration,
        coverArt: imageData
      };
      await onAlbumUpdated(albumForImageGeneration.id, { coverArt: imageData });
      setAlbumForImageGeneration(null);
      setShowImageGenerator(false);
    }
  };

  // Export album to markdown
  const exportAlbumToMarkdown = (album) => {
    const albumSongs = album.songs.map(albumSong => 
      songs.find(song => song.slug === albumSong.slug)
    ).filter(Boolean);

    let markdown = `# ${album.title}\n\n`;
    
    if (album.description) {
      markdown += `${album.description}\n\n`;
    }
    
    if (album.releaseDate) {
      markdown += `**Release Date:** ${new Date(album.releaseDate).toLocaleDateString('en-GB')}\n\n`;
    }

    markdown += `**Total Songs:** ${albumSongs.length}\n\n`;
    
    markdown += `## Tracklist\n\n`;
    
    albumSongs.forEach((song, index) => {
      markdown += `${index + 1}. ${song.title}\n`;
    });
    
    markdown += `\n---\n\n`;
    
    // Add full song content
    albumSongs.forEach((song, index) => {
      markdown += `## ${index + 1}. ${song.title}\n\n`;
      
      if (song.lyrics) {
        markdown += `### Lyrics\n\n\`\`\`\n${song.lyrics}\n\`\`\`\n\n`;
      }
      
      if (song.notes) {
        markdown += `### Notes\n\n${song.notes}\n\n`;
      }
      
      if (song.soundsLike) {
        markdown += `### Sounds Like\n\n${song.soundsLike}\n\n`;
      }
      
      markdown += `---\n\n`;
    });

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generateSlug(album.title)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAlbumStats = (album) => {
    const albumSongs = album.songs.map(albumSong => 
      songs.find(song => song.slug === albumSong.slug)
    ).filter(Boolean);

    return {
      totalSongs: albumSongs.length,
      songsWithLyrics: albumSongs.filter(song => song.lyrics).length,
      songsWithNotes: albumSongs.filter(song => song.notes).length,
      songsWithAudio: albumSongs.filter(song => song.audio).length,
      dateRange: albumSongs.reduce((range, song) => {
        const songDate = new Date(song.createdAt || song.updatedAt);
        return {
          earliest: !range.earliest || songDate < range.earliest ? songDate : range.earliest,
          latest: !range.latest || songDate > range.latest ? songDate : range.latest
        };
      }, {})
    };
  };

  const getUnassignedSongs = () => {
    const assignedSlugs = new Set();
    albums.forEach(album => {
      album.songs.forEach(song => assignedSlugs.add(song.slug));
    });
    return songs.filter(song => !assignedSlugs.has(song.slug));
  };

  // Auto-generate album with AI
  const autoGenerateAlbum = async (prompt, selectedSongSlugs) => {
    try {
      // Prepare song data for AI
      const selectedSongs = selectedSongSlugs.map(slug => 
        songs.find(song => song.slug === slug)
      ).filter(Boolean);
      
      const songSummaries = selectedSongs.map(song => ({
        title: song.title,
        lyrics: song.lyrics ? song.lyrics.substring(0, 200) + '...' : 'No lyrics',
        soundsLike: song.soundsLike || 'No description',
        hasAudio: !!song.audio,
        hasNotes: !!song.notes
      }));

      const aiPrompt = `Based on this theme/prompt and these specific songs, create an album concept. Respond with JSON in this exact format:

{
  "albumTitle": "Album Name",
  "description": "Brief description of the album concept and theme",
  "type": "standard"
}

Theme/Prompt: ${prompt}

Selected songs:
${songSummaries.map((song, index) => `${index + 1}. "${song.title}" (slug: "${selectedSongSlugs[index]}")
   Sounds like: ${song.soundsLike}
   ${song.lyrics.substring(0, 100)}...`).join('\n')}

Create a cohesive album concept that ties these songs together thematically.`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await response.json();
      
      if (data.text) {
        try {
          // Clean up the response to extract JSON
          let jsonText = data.text.trim();
          
          // Remove markdown code blocks if present
          jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
          
          // Find the JSON object
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          
          const albumConcept = JSON.parse(jsonText);
          
          // Validate the generated data
          if (!albumConcept.albumTitle) {
            throw new Error('Invalid album concept generated');
          }

          // Create the album with the selected songs
          const albumData = {
            title: albumConcept.albumTitle,
            description: albumConcept.description || '',
            releaseDate: '',
            coverArt: null,
            type: albumConcept.type || 'standard',
            songs: selectedSongSlugs.map((slug, index) => ({
              slug,
              trackNumber: index + 1,
              addedAt: new Date().toISOString()
            }))
          };

          onAlbumCreated(albumData);
          
          alert(`Successfully created album "${albumConcept.albumTitle}" with ${selectedSongSlugs.length} songs!`);
          
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          alert('Failed to generate album. AI response was not in the expected format.');
        }
      } else {
        alert('Failed to generate album concept. Please try again.');
      }
    } catch (error) {
      console.error('Error auto-generating album:', error);
      alert('Failed to connect to AI service. Please check your connection and try again.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Album Management</h2>
          <p className="text-gray-600 mt-1">Organise your songs into albums</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className={`px-3 py-1 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button
            onClick={() => setShowAutoGenerate(true)}
            className={`px-4 py-2 ${theme.components.button.accent} ${theme.layout.borderRadius} transition-colors flex items-center`}
            title="Auto-generate album with AI"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto Generate
          </button>
          <button
            onClick={() => setShowCreateAlbum(true)}
            className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors flex items-center`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Album
          </button>
        </div>
      </div>

      {/* Albums Grid/List */}
      <div className="flex-1 overflow-auto p-6">

        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr' 
          : 'space-y-4'
        }>
          {albums.map(album => {
            const stats = getAlbumStats(album);
            
            return (
              <div
                key={album.id}
                className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-4 cursor-pointer hover:shadow-lg transition-shadow h-fit`}
                onClick={() => setSelectedAlbum(album)}
              >
                <div className={viewMode === 'grid' ? 'space-y-3' : 'flex gap-4'}>
                  {/* Cover Art */}
                  <div className={viewMode === 'grid' ? 'aspect-square' : 'w-24 h-24 flex-shrink-0'}>
                    {album.coverArt ? (
                      <img
                        src={album.coverArt}
                        alt={`${album.title} cover`}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{album.title}</h3>
                    {album.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mt-1">{album.description}</p>
                    )}
                    
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>{stats.totalSongs} songs</span>
                        <span className="uppercase text-xs font-medium bg-gray-100 px-2 py-1 rounded">{album.type}</span>
                      </div>
                      {album.releaseDate && (
                        <div>Released: {new Date(album.releaseDate).toLocaleDateString('en-GB')}</div>
                      )}
                      {stats.dateRange.earliest && (
                        <div>
                          Created: {stats.dateRange.earliest.toLocaleDateString('en-GB')}
                          {stats.dateRange.latest && stats.dateRange.latest !== stats.dateRange.earliest && 
                            ` - ${stats.dateRange.latest.toLocaleDateString('en-GB')}`
                          }
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenImageGenerator(album);
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.accent} ${theme.layout.borderRadius} transition-colors flex items-center`}
                        title="Generate AI Cover Art"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Cover
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportAlbumToMarkdown(album);
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
                        title="Export to Markdown"
                      >
                        Export
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${album.title}"?`)) {
                            deleteAlbum(album.id);
                          }
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.secondary} text-red-600 hover:bg-red-50 ${theme.layout.borderRadius} transition-colors`}
                        title="Delete Album"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {albums.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No albums yet</h3>
              <p className="text-center max-w-md mb-4">Create your first album to get started organising your songs</p>
              <button
                onClick={() => setShowCreateAlbum(true)}
                className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
              >
                Create Album
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Album Modal */}
      {showCreateAlbum && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme.components.modal?.background || 'bg-white'} ${theme.layout.borderRadius} p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto`}>
            <h3 className="text-lg font-semibold mb-4">Create New Album</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Album Title</label>
                <input
                  type="text"
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter album title..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  rows={3}
                  placeholder="Album description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Album Type</label>
                <select
                  value={albumForm.type}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, type: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="standard">Standard Album</option>
                  <option value="compilation">Compilation</option>
                  <option value="various">Various Artists</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Release Date</label>
                <input
                  type="date"
                  value={albumForm.releaseDate}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Art</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {albumForm.coverArtPreview ? (
                      <img
                        src={albumForm.coverArtPreview}
                        alt="Cover art preview"
                        className="mx-auto h-32 w-32 object-cover rounded"
                      />
                    ) : (
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload cover art</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={handleCoverArtUpload} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateAlbum(false);
                  setAlbumForm({
                    title: '',
                    description: '',
                    releaseDate: '',
                    coverArt: null,
                    coverArtPreview: null,
                    type: 'standard'
                  });
                }}
                className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={createAlbum}
                disabled={!albumForm.title.trim()}
                className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Create Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Generate Album Modal */}
      {showAutoGenerate && (
        <AutoGenerateModal
          onClose={() => setShowAutoGenerate(false)}
          songs={getUnassignedSongs()}
          onGenerate={autoGenerateAlbum}
          theme={theme}
        />
      )}

      {/* Album Detail Modal */}
      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          songs={songs}
          unassignedSongs={getUnassignedSongs()}
          onAddSong={addSongToAlbum}
          onRemoveSong={removeSongFromAlbum}
          onReorderSongs={reorderSongs}
          onUpdateAlbum={onAlbumUpdated}
          onExportAlbum={exportAlbumToMarkdown}
          onNavigateToSong={onNavigateToSong}
          theme={theme}
        />
      )}

      {/* Album Image Generator */}
      <AlbumImageGenerator
        isOpen={showImageGenerator}
        onClose={() => {
          setShowImageGenerator(false);
          setAlbumForImageGeneration(null);
        }}
        albumData={albumForImageGeneration}
        onImageGenerated={handleImageGenerated}
      />
    </div>
  );
};

// Auto Generate Album Modal Component
const AutoGenerateModal = ({ onClose, songs, onGenerate, theme }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSongToggle = (songSlug) => {
    setSelectedSongs(prev => 
      prev.includes(songSlug)
        ? prev.filter(slug => slug !== songSlug)
        : [...prev, songSlug]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt/theme for the album.');
      return;
    }
    
    if (selectedSongs.length === 0) {
      alert('Please select at least one song.');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(prompt, selectedSongs);
      onClose();
    } catch (error) {
      console.error('Error generating album:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme.components.modal?.background || 'bg-white'} ${theme.layout.borderRadius} p-6 w-full max-w-2xl max-h-90vh overflow-hidden`}>
        <h3 className="text-lg font-semibold mb-4">Auto Generate Album</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Album Theme/Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              rows={3}
              placeholder="Enter a theme, mood, or concept for the album (e.g., 'melancholic acoustic songs', 'upbeat summer vibes', 'songs about love and loss')..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Songs ({selectedSongs.length} selected)
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
              {songs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No unassigned songs available</p>
              ) : (
                <div className="space-y-1 p-2">
                  {songs.map(song => (
                    <label key={song.slug} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSongs.includes(song.slug)}
                        onChange={() => handleSongToggle(song.slug)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{song.title}</div>
                        {song.soundsLike && (
                          <div className="text-sm text-gray-500">Sounds like: {song.soundsLike}</div>
                        )}
                        <div className="flex gap-1 mt-1">
                          {song.lyrics && <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Lyrics</span>}
                          {song.notes && <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">Notes</span>}
                          {song.audio && <span className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">Audio</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || selectedSongs.length === 0 || isGenerating}
            className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Album
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Album Detail Modal Component
const AlbumDetailModal = ({ 
  album, 
  onClose, 
  songs, 
  unassignedSongs,
  onAddSong, 
  onRemoveSong, 
  onReorderSongs,
  onUpdateAlbum,
  onExportAlbum,
  onNavigateToSong,
  theme 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [coverArtPreview, setCoverArtPreview] = useState(album.coverArt);
  const [editForm, setEditForm] = useState({
    title: album.title,
    description: album.description || '',
    releaseDate: album.releaseDate || '',
    type: album.type || 'standard',
    coverArt: album.coverArt
  });

  const albumSongs = album.songs.map(albumSong => {
    const song = songs.find(s => s.slug === albumSong.slug);
    return song ? { ...song, trackNumber: albumSong.trackNumber } : null;
  }).filter(Boolean).sort((a, b) => a.trackNumber - b.trackNumber);

  // Debug: Log song audio properties
  React.useEffect(() => {
    console.log('Album songs debug:', albumSongs.map(song => ({
      title: song.title,
      slug: song.slug,
      hasAudio: !!song.audio,
      audio: song.audio
    })));
  }, [albumSongs]);

  // Audio playback functionality
  const playTrack = (songSlug) => {
    const song = albumSongs.find(s => s.slug === songSlug);
    if (!song || !song.audio) return;

    // Stop current audio if playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(song.audio);
    audio.addEventListener('ended', () => {
      setCurrentlyPlaying(null);
      setAudioElement(null);
    });
    audio.addEventListener('error', () => {
      console.error('Error playing audio for:', song.title);
      setCurrentlyPlaying(null);
      setAudioElement(null);
    });

    audio.play().then(() => {
      setCurrentlyPlaying(songSlug);
      setAudioElement(audio);
    }).catch(error => {
      console.error('Failed to play audio:', error);
    });
  };

  const pauseTrack = () => {
    if (audioElement) {
      audioElement.pause();
      setCurrentlyPlaying(null);
      setAudioElement(null);
    }
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  // Handle cover art upload for existing album
  const handleCoverArtUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newCoverArt = e.target.result;
        setCoverArtPreview(newCoverArt);
        setEditForm(prev => ({
          ...prev,
          coverArt: newCoverArt
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove cover art
  const handleRemoveCoverArt = () => {
    setCoverArtPreview(null);
    setEditForm(prev => ({
      ...prev,
      coverArt: null
    }));
  };

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
      onReorderSongs(album.id, draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const saveEdit = () => {
    onUpdateAlbum(album.id, editForm);
    setEditMode(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme.components.modal?.background || 'bg-white'} ${theme.layout.borderRadius} w-full max-w-4xl max-h-90vh overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          {editMode ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className={`text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.layout.borderRadius} px-2 py-1`}
            />
          ) : (
            <h2 className="text-2xl font-bold">{album.title}</h2>
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
                  onClick={() => onExportAlbum(album)}
                  className={`px-3 py-1 ${theme.components.button.accent} ${theme.layout.borderRadius} transition-colors`}
                >
                  Export
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
            {/* Album Info */}
            <div className="lg:col-span-1">
              {/* Cover Art */}
              <div className="aspect-square mb-4 relative group">
                {(coverArtPreview || album.coverArt) ? (
                  <>
                    <img
                      src={coverArtPreview || album.coverArt}
                      alt={`${album.title} cover`}
                      className="w-full h-full object-cover rounded"
                    />
                    {editMode && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                          <label className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-opacity duration-200 cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <input type="file" className="sr-only" accept="image/*" onChange={handleCoverArtUpload} />
                          </label>
                          <button
                            onClick={handleRemoveCoverArt}
                            className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-opacity duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                    {editMode ? (
                      <label className="cursor-pointer text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-sm text-gray-500">Add Cover Art</span>
                        </div>
                        <input type="file" className="sr-only" accept="image/*" onChange={handleCoverArtUpload} />
                      </label>
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Album Details */}
              <div className="space-y-3">
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                        className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="standard">Standard Album</option>
                        <option value="compilation">Compilation</option>
                        <option value="various">Various Artists</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Release Date</label>
                      <input
                        type="date"
                        value={editForm.releaseDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                        className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {album.description && (
                      <div>
                        <h4 className="font-medium text-gray-900">Description</h4>
                        <p className="text-gray-600 mt-1">{album.description}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">Type</h4>
                      <p className="text-gray-600 mt-1 capitalize">{album.type}</p>
                    </div>
                    {album.releaseDate && (
                      <div>
                        <h4 className="font-medium text-gray-900">Release Date</h4>
                        <p className="text-gray-600 mt-1">{new Date(album.releaseDate).toLocaleDateString('en-GB')}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">Statistics</h4>
                      <ul className="text-gray-600 mt-1 space-y-1 text-sm">
                        <li>{albumSongs.length} songs</li>
                        <li>{albumSongs.filter(s => s.lyrics).length} with lyrics</li>
                        <li>{albumSongs.filter(s => s.notes).length} with notes</li>
                        <li>{albumSongs.filter(s => s.audio).length} with audio</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tracklist */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tracklist</h3>
                <button
                  onClick={() => setShowAddSongs(true)}
                  className={`px-3 py-1 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                >
                  Add Songs
                </button>
              </div>

              {albumSongs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No songs in this album yet</p>
                  <button
                    onClick={() => setShowAddSongs(true)}
                    className={`mt-2 px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                  >
                    Add First Song
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {albumSongs.map((song, index) => (
                    <div
                      key={song.slug}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center p-3 ${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} cursor-move hover:shadow-md transition-shadow ${
                        draggedIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <span className="w-8 text-center font-medium text-gray-500">{song.trackNumber}</span>
                        
                        {/* Play button */}
                        {song.audio && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentlyPlaying === song.slug) {
                                pauseTrack();
                              } else {
                                playTrack(song.slug);
                              }
                            }}
                            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                            title={currentlyPlaying === song.slug ? 'Pause' : 'Play'}
                          >
                            {currentlyPlaying === song.slug ? (
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-600 hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        <div className="flex-1 ml-3">
                          <h4 
                            className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              if (onNavigateToSong) {
                                // Find the song index in the main songs array
                                const songIndex = songs.findIndex(s => s.slug === song.slug);
                                if (songIndex !== -1) {
                                  onNavigateToSong(songIndex);
                                  onClose(); // Close the album modal
                                }
                              }
                            }}
                            title="Click to view song details"
                          >
                            {song.title}
                          </h4>
                          {song.soundsLike && (
                            <p className="text-sm text-gray-500">Sounds like: {song.soundsLike}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-3">
                          {song.lyrics && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Lyrics</span>}
                          {song.notes && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Notes</span>}
                          {song.audio && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Audio</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveSong(album.id, song.slug)}
                        className="ml-3 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove from album"
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
            <div className={`${theme.components.modal?.background || 'bg-white'} ${theme.layout.borderRadius} w-96 max-h-96 overflow-hidden`}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Add Songs to Album</h3>
              </div>
              <div className="p-4 overflow-y-auto max-h-64">
                {unassignedSongs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">All songs are already assigned to albums</p>
                ) : (
                  <div className="space-y-2">
                    {unassignedSongs.map(song => (
                      <div key={song.slug} className={`flex items-center justify-between p-2 ${theme.components.card?.background || 'bg-white'} ${theme.layout.borderRadius} border border-gray-200`}>
                        <span className="font-medium">{song.title}</span>
                        <button
                          onClick={() => {
                            onAddSong(album.id, song.slug);
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

export default AlbumManager;
