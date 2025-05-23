import React, { useState } from 'react';
import { useTheme, getThemeClasses } from '../contexts/ThemeContext';
import SearchFilters from './SearchFilters';

export default function SongList({ 
  songs, 
  allSongs, 
  selectedIndex, 
  onSelect, 
  searchQuery, 
  setSearchQuery,
  filters,
  setFilters,
  sortOption,
  setSortOption,
  savedFilterCombos,
  onSaveFilterCombo,
  onLoadFilterCombo,
  albums = []
}) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState('compact'); // 'compact', 'detailed', 'grid'
  
  // Calculate the original index of a song in the allSongs array
  const getOriginalIndex = (song) => {
    return allSongs.findIndex(s => s.slug === song.slug);
  };

  // Find which albums contain a song
  const getContainingAlbums = (song) => {
    return albums.filter(album => 
      album.songs && album.songs.some(albumSong => albumSong.slug === song.slug)
    );
  };

  // Get content type label for a song
  const getContentTypeLabel = (slug) => {
    const contentType = localStorage.getItem('contentType-' + slug);
    return contentType === 'tracklist' ? 'Tracklist' : 
           contentType === 'other' ? 'Other' : 'Lyrics';
  };

  // Get CSS classes for content type styling
  const getContentTypeStyles = (slug) => {
    const contentType = localStorage.getItem('contentType-' + slug);
    switch(contentType) {
      case 'tracklist':
        return 'bg-yellow-100 text-yellow-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Get the content preview for a song
  const getContentPreview = (song) => {
    if (song.lyrics) {
      const preview = song.lyrics.split('\n').filter(line => line.trim()).join(' ');
      const maxLength = viewMode === 'detailed' ? 200 : 80;
      return preview.substring(0, maxLength) + (preview.length > maxLength ? '...' : '');
    } else if (song.notes) {
      const maxLength = viewMode === 'detailed' ? 200 : 80;
      return song.notes.substring(0, maxLength) + (song.notes.length > maxLength ? '...' : '');
    } else if (song.soundsLike) {
      return `Sounds like: ${song.soundsLike}`;
    }
    return 'No content available';
  };

  // Get song metadata badges
  const getSongBadges = (song) => {
    const badges = [];
    
    // Add album badges
    const containingAlbums = getContainingAlbums(song);
    if (containingAlbums.length > 0) {
      if (containingAlbums.length === 1) {
        badges.push({
          label: `♪ ${containingAlbums[0].title}`,
          className: 'bg-violet-100 text-violet-800',
          title: `Part of album: ${containingAlbums[0].title}`
        });
      } else {
        badges.push({
          label: `♪ ${containingAlbums.length} albums`,
          className: 'bg-violet-100 text-violet-800',
          title: `Part of ${containingAlbums.length} albums: ${containingAlbums.map(a => a.title).join(', ')}`
        });
      }
    }
    
    if (song.lyrics) {
      badges.push({
        label: getContentTypeLabel(song.slug),
        className: getContentTypeStyles(song.slug)
      });
    }
    
    if (song.notes) {
      badges.push({
        label: 'Notes',
        className: 'bg-green-100 text-green-800'
      });
    }
    
    if (song.soundsLike) {
      badges.push({
        label: 'Sounds Like',
        className: 'bg-purple-100 text-purple-800'
      });
    }
    
    if (song.audio) {
      badges.push({
        label: 'Audio',
        className: 'bg-blue-100 text-blue-800'
      });
    }
    
    if (song.image) {
      badges.push({
        label: 'Image',
        className: 'bg-indigo-100 text-indigo-800'
      });
    }
    
    // Recently modified badge
    if (song.updatedAt) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(song.updatedAt) > weekAgo) {
        badges.push({
          label: 'Recent',
          className: 'bg-orange-100 text-orange-800'
        });
      }
    }
    
    return badges;
  };

  // Render song card based on view mode
  const renderSongCard = (song) => {
    const originalIndex = getOriginalIndex(song);
    const isSelected = originalIndex === selectedIndex;
    const badges = getSongBadges(song);
    
    if (viewMode === 'detailed') {
      return (
        <div
          key={`${song.slug}-${song.id || originalIndex}`}
          className={`${getThemeClasses(theme, 'song-card')} ${
            isSelected 
              ? getThemeClasses(theme, 'song-card-selected')
              : getThemeClasses(theme, 'song-card-hover')
          } cursor-pointer transform transition-all duration-200 ${
            isSelected ? 'scale-102 shadow-lg' : 'hover:shadow-md'
          }`}
          onClick={() => onSelect(originalIndex)}
        >
          <div className={`flex ${theme.layout.spacing}`}>
            {/* Image section */}
            {song.image && (
              <div className="flex-shrink-0 mr-4">
                <img 
                  src={song.image} 
                  alt={song.title}
                  className="w-24 h-24 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Content section */}
            <div className="flex-1 space-y-3">
              {/* Song title with date */}
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-lg ${isSelected ? 'text-blue-700' : 'text-gray-800'} flex-1 mr-2`}>
                  {song.title}
                </h3>
                {song.createdAt && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(song.createdAt).toLocaleDateString('en-GB')}
                  </span>
                )}
              </div>
              
              {/* Content preview - more detailed */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {getContentPreview(song)}
              </p>
              
              {/* Metadata badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {badges.map((badge, index) => (
                    <span 
                      key={index}
                      className={`${badge.className} px-2 py-1 rounded text-xs font-medium`}
                      title={badge.title || badge.label}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Additional metadata row */}
              {(song.updatedAt || song.version || song.soundsLike) && (
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  {song.soundsLike && (
                    <p className="italic mb-1">{song.soundsLike}</p>
                  )}
                  <div className="flex justify-between items-center">
                    {song.updatedAt && (
                      <span>
                        Updated: {new Date(song.updatedAt).toLocaleDateString('en-GB')}
                      </span>
                    )}
                    {song.version && (
                      <span>v{song.version}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (viewMode === 'grid') {
      return (
        <div
          key={`${song.slug}-${song.id || originalIndex}`}
          className={`${getThemeClasses(theme, 'song-card')} ${
            isSelected 
              ? getThemeClasses(theme, 'song-card-selected')
              : getThemeClasses(theme, 'song-card-hover')
          } cursor-pointer transform transition-all duration-200 ${
            isSelected ? 'scale-102 shadow-lg' : 'hover:shadow-md'
          } h-full flex flex-col`}
          onClick={() => onSelect(originalIndex)}
        >
          {/* Image or placeholder */}
          <div className="relative h-32 bg-gray-100 rounded-t-lg overflow-hidden">
            {song.image ? (
              <img 
                src={song.image} 
                alt={song.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'} mb-2`}>
              {song.title}
            </h3>
            
            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {badges.slice(0, 3).map((badge, index) => (
                  <span 
                    key={index}
                    className={`${badge.className} px-2 py-1 rounded text-xs font-medium`}
                    title={badge.title || badge.label}
                  >
                    {badge.label}
                  </span>
                ))}
                {badges.length > 3 && (
                  <span className="text-xs text-gray-500">+{badges.length - 3}</span>
                )}
              </div>
            )}
            
            {/* Date */}
            <div className="mt-auto text-xs text-gray-400">
              {song.createdAt && new Date(song.createdAt).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
      );
    } else {
      // Compact view (default)
      return (
        <div
          key={`${song.slug}-${song.id || originalIndex}`}
          className={`${getThemeClasses(theme, 'song-card')} ${
            isSelected 
              ? getThemeClasses(theme, 'song-card-selected')
              : getThemeClasses(theme, 'song-card-hover')
          } cursor-pointer transform transition-all duration-200 ${
            isSelected ? 'scale-102 shadow-md' : 'hover:shadow-sm'
          }`}
          onClick={() => onSelect(originalIndex)}
        >
          <div className={`flex ${theme.layout.spacing}`}>
            {/* Image thumbnail for compact view */}
            {song.image && (
              <div className="flex-shrink-0 mr-3">
                <img 
                  src={song.image} 
                  alt={song.title}
                  className="w-16 h-16 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Content section */}
            <div className="flex-1 space-y-3">
              {/* Song title with date */}
              <div className="flex justify-between items-start">
                <h3 className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'} flex-1 mr-2`}>
                  {song.title}
                </h3>
                {song.createdAt && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(song.createdAt).toLocaleDateString('en-GB')}
                  </span>
                )}
              </div>
              
              {/* Content preview */}
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {getContentPreview(song)}
              </p>
              
              {/* Metadata badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {badges.map((badge, index) => (
                    <span 
                      key={index}
                      className={`${badge.className} px-2 py-1 rounded text-xs font-medium`}
                      title={badge.title || badge.label}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Search and Filters */}
      <div className={`sticky top-0 ${theme.components.sidebar.background} ${theme.layout.spacing} border-b border-gray-200 z-10`}>
        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          sortOptions={sortOption}
          setSortOption={setSortOption}
          onSaveFilterCombo={onSaveFilterCombo}
          savedFilterCombos={savedFilterCombos}
          onLoadFilterCombo={onLoadFilterCombo}
        />
        
        <div className="mt-2 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {songs.length} song{songs.length !== 1 ? 's' : ''}
            {songs.length !== allSongs.length && ` of ${allSongs.length}`} found
          </div>
          
          {/* View mode selector */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1 rounded ${viewMode === 'compact' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              title="Compact view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`p-1 rounded ${viewMode === 'detailed' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              title="Detailed view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Songs list with enhanced cards */}
      <div className={`flex-1 overflow-y-auto ${theme.layout.spacing}`}>
        {songs.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 gap-4'
              : `grid grid-cols-1 ${theme.layout.cardSpacing}`
          }>
            {songs.map(song => renderSongCard(song))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-center">
              {searchQuery 
                ? `No songs found matching "${searchQuery}"` 
                : 'No songs match the current filters'
              }
            </p>
            <button 
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  contentType: 'all',
                  searchWithin: 'all',
                  dateRange: {},
                  hasAudio: undefined,
                  hasImage: undefined,
                  hasNotes: undefined,
                  hasSoundsLike: undefined,
                  recentlyModified: undefined
                });
              }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
