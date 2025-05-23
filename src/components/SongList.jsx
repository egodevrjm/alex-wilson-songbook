import React from 'react';
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
      return song.lyrics.split('\n')[0].substring(0, 80) + (song.lyrics.length > 80 ? '...' : '');
    } else if (song.notes) {
      return song.notes.substring(0, 80) + (song.notes.length > 80 ? '...' : '');
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
        
        <div className="mt-2 text-sm text-gray-500">
          {songs.length} song{songs.length !== 1 ? 's' : ''}
          {songs.length !== allSongs.length && ` of ${allSongs.length}`} found
        </div>
      </div>
      
      {/* Songs list with enhanced cards */}
      <div className={`flex-1 overflow-y-auto ${theme.layout.spacing}`}>
        {songs.length > 0 ? (
          <div className={`grid grid-cols-1 ${theme.layout.cardSpacing}`}>
            {songs.map((song) => {
              const originalIndex = getOriginalIndex(song);
              const isSelected = originalIndex === selectedIndex;
              const badges = getSongBadges(song);
              
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
                  <div className={`${theme.layout.spacing} space-y-3`}>
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
                    
                    {/* Additional metadata row */}
                    {(song.updatedAt || song.version) && (
                      <div className="flex justify-between items-center text-xs text-gray-400 pt-1 border-t border-gray-100">
                        {song.updatedAt && (
                          <span>
                            Updated: {new Date(song.updatedAt).toLocaleDateString('en-GB')}
                          </span>
                        )}
                        {song.version && (
                          <span>v{song.version}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
