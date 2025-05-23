import { useState, useEffect, useCallback } from 'react';
import { songStorage } from '../utils/storage/songStorage';

/**
 * Enhanced hook to handle song persistence using IndexedDB
 * Migrated from localStorage to avoid quota limitations
 * @param {Object} initialSongs - Initial songs data
 * @returns {Object} - Enhanced song management functionality
 */
export function useSongPersistence(initialSongs) {
  const [availableSongs, setAvailableSongs] = useState([]);
  const [deletedSongs, setDeletedSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState(null);
  
  // Enhanced filtering state
  const [filters, setFilters] = useState({
    contentType: 'all',
    searchWithin: 'all',
    dateRange: {},
    hasAudio: undefined,
    hasImage: undefined,
    hasNotes: undefined,
    hasSoundsLike: undefined,
    recentlyModified: undefined
  });
  
  const [sortOption, setSortOption] = useState('title-asc');
  const [savedFilterCombos, setSavedFilterCombos] = useState([]);

  // De-duplicate songs by slug
  const removeDuplicates = useCallback((songs) => {
    const uniqueSongs = {};
    songs.forEach(song => {
      // If song already exists, keep the one with the most recent updatedAt timestamp
      if (uniqueSongs[song.slug]) {
        const existingDate = new Date(uniqueSongs[song.slug].updatedAt || uniqueSongs[song.slug].createdAt || 0);
        const newDate = new Date(song.updatedAt || song.createdAt || 0);
        
        if (newDate > existingDate) {
          uniqueSongs[song.slug] = song;
        }
      } else {
        uniqueSongs[song.slug] = song;
      }
    });
    
    return Object.values(uniqueSongs);
  }, []);

  // Initialize available songs from IndexedDB
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setIsLoading(true);
        setStorageError(null);

        // Get deleted songs from IndexedDB
        const deletedSongsList = await songStorage.getDeletedSongs();
        setDeletedSongs(deletedSongsList);
        
        // Get custom songs from IndexedDB
        const customSongs = await songStorage.getCustomSongs();
        
        // Get all stored songs (including migrated ones)
        const storedSongs = await songStorage.getAllSongs();
        
        // Combine initial songs, custom songs, and stored songs
        const allSongs = [...initialSongs];
        
        // Add custom songs
        customSongs.forEach(customSong => {
          const existsInInitial = initialSongs.some(s => s.slug === customSong.slug);
          if (!existsInInitial) {
            allSongs.push(customSong);
          }
        });
        
        // Update with stored properties
        const songsWithOverrides = allSongs.map(song => {
          const storedSong = storedSongs.find(s => s.slug === song.slug);
          if (storedSong) {
            // Use stored version which may have updated properties
            return {
              ...song,
              ...storedSong,
              // Ensure we don't lose any properties from the initial song
              createdAt: storedSong.createdAt || song.createdAt,
              updatedAt: storedSong.updatedAt || song.updatedAt
            };
          }
          return song;
        });
        
        // Remove duplicates
        const uniqueSongs = removeDuplicates(songsWithOverrides);
        
        // Filter out deleted songs
        const activeSongs = uniqueSongs.filter(song => !deletedSongsList.includes(song.slug));
        
        // Check for any separately stored images and audio
        const songsWithMedia = await Promise.all(activeSongs.map(async (song) => {
          try {
            // Skip if song already has image
            if (song.image) {
              return song;
            }
            
            // Try to load image from IndexedDB if not in song object
            const { getImage, getAudio } = await import('../utils/indexedDBHelper');
            
            let updatedSong = { ...song };
            
            // Check for image
            try {
              const storedImage = await getImage(song.slug);
              if (storedImage) {
                updatedSong.image = storedImage;
                console.log(`Found stored image for ${song.slug}`);
              }
            } catch (e) {
              // Try localStorage fallback
              const localStorageImage = localStorage.getItem(`image-${song.slug}`);
              if (localStorageImage) {
                updatedSong.image = localStorageImage;
                console.log(`Found localStorage image for ${song.slug}`);
              }
            }
            
            // Check for audio if not already present
            if (!song.audio) {
              try {
                const storedAudio = await getAudio(song.slug);
                if (storedAudio) {
                  updatedSong.audio = storedAudio;
                  console.log(`Found stored audio for ${song.slug}`);
                }
              } catch (e) {
                // Try localStorage fallback
                const localStorageAudio = localStorage.getItem(`audio-${song.slug}`);
                if (localStorageAudio) {
                  updatedSong.audio = localStorageAudio;
                  console.log(`Found localStorage audio for ${song.slug}`);
                }
              }
            }
            
            return updatedSong;
          } catch (error) {
            console.error(`Error loading media for song ${song.slug}:`, error);
            return song;
          }
        }));
        
        setAvailableSongs(songsWithMedia);

        // Load saved filter combinations (still using localStorage for settings)
        const savedFilterCombos = localStorage.getItem('saved-filter-combos');
        if (savedFilterCombos) {
          setSavedFilterCombos(JSON.parse(savedFilterCombos));
        }
      } catch (error) {
        console.error('Error loading songs:', error);
        setStorageError('Failed to load songs from storage');
        
        // Fallback to initial songs
        setAvailableSongs(initialSongs);
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, [initialSongs, removeDuplicates]);

  // Save filter combinations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('saved-filter-combos', JSON.stringify(savedFilterCombos));
  }, [savedFilterCombos]);

  // Save filter combination
  const saveFilterCombo = useCallback((name, combo) => {
    const newCombo = {
      id: Date.now(),
      name,
      ...combo,
      createdAt: new Date().toISOString()
    };
    setSavedFilterCombos(prev => [...prev, newCombo]);
  }, []);

  // Load filter combination
  const loadFilterCombo = useCallback((combo) => {
    setFilters(combo.filters || {});
    setSearchQuery(combo.searchQuery || '');
    setSortOption(combo.sortOption || 'title-asc');
  }, []);

  // Enhanced filtering function
  const applyFilters = useCallback((songs) => {
    let filtered = [...songs];

    // Apply content type filter
    if (filters.contentType !== 'all') {
      switch (filters.contentType) {
        case 'lyrics':
          filtered = filtered.filter(song => song.lyrics && song.lyrics.trim());
          break;
        case 'tracklist':
          filtered = filtered.filter(song => !song.lyrics || !song.lyrics.trim());
          break;
        case 'other':
          filtered = filtered.filter(song => 
            (!song.lyrics || !song.lyrics.trim()) && (song.notes && song.notes.trim())
          );
          break;
      }
    }

    // Apply quick filters
    if (filters.hasAudio) {
      filtered = filtered.filter(song => song.audio);
    }
    if (filters.hasImage) {
      filtered = filtered.filter(song => song.image);
    }
    if (filters.hasNotes) {
      filtered = filtered.filter(song => song.notes && song.notes.trim());
    }
    if (filters.hasSoundsLike) {
      filtered = filtered.filter(song => song.soundsLike && song.soundsLike.trim());
    }
    if (filters.recentlyModified) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(song => {
        const songDate = new Date(song.updatedAt || song.createdAt);
        return songDate > weekAgo;
      });
    }

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(song => {
        const songDate = new Date(song.createdAt || song.updatedAt);
        const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
        const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : null;
        
        if (fromDate && songDate < fromDate) return false;
        if (toDate && songDate > toDate) return false;
        return true;
      });
    }

    // Apply search query with search within filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(song => {
        switch (filters.searchWithin) {
          case 'lyrics':
            return song.lyrics && song.lyrics.toLowerCase().includes(query);
          case 'notes':
            return song.notes && song.notes.toLowerCase().includes(query);
          case 'sounds-like':
            return song.soundsLike && song.soundsLike.toLowerCase().includes(query);
          case 'title':
            return song.title.toLowerCase().includes(query);
          default: // 'all'
            return (
              song.title.toLowerCase().includes(query) ||
              (song.lyrics && song.lyrics.toLowerCase().includes(query)) ||
              (song.notes && song.notes.toLowerCase().includes(query)) ||
              (song.soundsLike && song.soundsLike.toLowerCase().includes(query))
            );
        }
      });
    }

    return filtered;
  }, [filters, searchQuery]);

  // Apply sorting
  const applySorting = useCallback((songs) => {
    const sorted = [...songs];
    
    switch (sortOption) {
      case 'title-asc':
        return sorted.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        });
      case 'title-desc':
        return sorted.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleB.localeCompare(titleA);
        });
      case 'newest-first':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt);
          const dateB = new Date(b.createdAt || b.updatedAt);
          return dateB - dateA;
        });
      case 'oldest-first':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt);
          const dateB = new Date(b.createdAt || b.updatedAt);
          return dateA - dateB;
        });
      case 'recently-modified':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || a.createdAt);
          return dateB - dateA;
        });
      case 'recently-played':
        // Would need to implement play tracking - for now, use creation date
        return sorted.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || a.createdAt);
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  }, [sortOption]);

  // Get filtered and sorted songs
  const filteredSongs = applySorting(applyFilters(availableSongs));

  // Delete a song using IndexedDB
  const handleDeleteSong = useCallback(async (slug) => {
    try {
      // Add to deleted songs list in IndexedDB
      await songStorage.deleteSong(slug);
      
      // Update deleted songs state
      const newDeletedSongs = [...deletedSongs, slug];
      setDeletedSongs(newDeletedSongs);
      
      // Update available songs state
      const newAvailableSongs = availableSongs.filter(song => song.slug !== slug);
      setAvailableSongs(newAvailableSongs);
      
      return newAvailableSongs.length;
    } catch (error) {
      console.error('Error deleting song:', error);
      setStorageError('Failed to delete song');
      throw error;
    }
  }, [availableSongs, deletedSongs]);

  // Remove duplicate songs
  const removeDuplicateSongs = useCallback(async () => {
    // Get all slugs and count occurrences
    const songCount = {};
    availableSongs.forEach(song => {
      songCount[song.slug] = (songCount[song.slug] || 0) + 1;
    });
    
    // Find slugs with duplicates
    const duplicatedSlugs = Object.entries(songCount)
      .filter(([_, count]) => count > 1)
      .map(([slug]) => slug);
    
    if (duplicatedSlugs.length === 0) {
      return { removed: 0, total: availableSongs.length };
    }
    
    // Group songs by slug
    const songsBySlug = {};
    availableSongs.forEach(song => {
      if (!songsBySlug[song.slug]) {
        songsBySlug[song.slug] = [];
      }
      songsBySlug[song.slug].push(song);
    });
    
    // For each duplicated slug, keep only the most recently updated version
    let removedCount = 0;
    for (const slug of duplicatedSlugs) {
      const songs = songsBySlug[slug];
      // Sort by updated date (most recent first)
      songs.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Keep the first one, delete others
      for (let i = 1; i < songs.length; i++) {
        await handleDeleteSong(songs[i].slug);
        removedCount++;
      }
    }
    
    return {
      removed: removedCount,
      total: availableSongs.length - removedCount
    };
  }, [availableSongs, handleDeleteSong]);

  // Handle creating a new song using IndexedDB
  const handleSongCreated = useCallback(async (newSong) => {
    try {
      if (!newSong || !newSong.slug) {
        console.error('Invalid song object:', newSong);
        throw new Error('Invalid song data');
      }
      
      console.log('Creating new song:', newSong);
      
      // Add timestamps if not present
      const songWithTimestamps = {
        ...newSong,
        createdAt: newSong.createdAt || new Date().toISOString(),
        updatedAt: newSong.updatedAt || new Date().toISOString()
      };
      
      // Check if this is a duplicate slug
      const existingSong = availableSongs.find(song => song.slug === newSong.slug);
      if (existingSong) {
        console.warn('Duplicate song slug detected:', newSong.slug);
        // Create a unique slug by adding a timestamp suffix
        const timestamp = Date.now();
        songWithTimestamps.slug = `${newSong.slug}-${timestamp}`;
        console.log('Created unique slug:', songWithTimestamps.slug);
      }
      
      // Save to IndexedDB
      await songStorage.saveSong(songWithTimestamps);
      
      // Add the new song to available songs
      const updatedSongs = [...availableSongs, songWithTimestamps];
      setAvailableSongs(updatedSongs);
      
      console.log('Song successfully added, new index:', updatedSongs.length - 1);
      return updatedSongs.length - 1;
    } catch (error) {
      console.error('Error in handleSongCreated:', error);
      setStorageError('Failed to create song');
      throw error;
    }
  }, [availableSongs]);

  // Handle updating an existing song using IndexedDB
  const handleSongUpdated = useCallback(async (updatedSong) => {
    try {
      // Add updated timestamp
      const songWithTimestamp = {
        ...updatedSong,
        updatedAt: new Date().toISOString()
      };
      
      // Save to IndexedDB - this will save ALL properties including image and audio
      await songStorage.saveSong(songWithTimestamp);
      console.log(`Saved updated song with media: ${songWithTimestamp.slug}`, {
        hasImage: !!songWithTimestamp.image,
        hasAudio: !!songWithTimestamp.audio
      });
      
      // Update state
      const updatedSongs = availableSongs.map(song => 
        song.slug === updatedSong.slug ? songWithTimestamp : song
      );
      
      setAvailableSongs(updatedSongs);
    } catch (error) {
      console.error('Error updating song:', error);
      setStorageError('Failed to update song');
      throw error;
    }
  }, [availableSongs]);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    try {
      const stats = await songStorage.getStorageStats();
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalSongs: availableSongs.length,
        customSongs: 0,
        deletedSongs: deletedSongs.length,
        estimatedSize: 0,
        quota: 0
      };
    }
  }, [availableSongs, deletedSongs]);

  return {
    availableSongs,
    setAvailableSongs,
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
    handleDeleteSong,
    handleSongCreated,
    handleSongUpdated,
    removeDuplicateSongs,
    isLoading,
    storageError,
    getStorageStats
  };
}
