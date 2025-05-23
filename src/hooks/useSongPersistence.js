import { useState, useEffect, useCallback } from 'react';

/**
 * Enhanced hook to handle song persistence with advanced filtering and sorting
 * @param {Object} initialSongs - Initial songs data
 * @returns {Object} - Enhanced song management functionality
 */
export function useSongPersistence(initialSongs) {
  const [availableSongs, setAvailableSongs] = useState([]);
  const [deletedSongs, setDeletedSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Initialize available songs from source and localStorage
  useEffect(() => {
    // Get deleted songs from localStorage
    const storedDeletedSongs = localStorage.getItem('deleted-songs');
    const deletedSongsList = storedDeletedSongs ? JSON.parse(storedDeletedSongs) : [];
    setDeletedSongs(deletedSongsList);
    
    // Get custom songs from localStorage
    const customSongsJSON = localStorage.getItem('custom-songs');
    const customSongs = customSongsJSON ? JSON.parse(customSongsJSON) : [];
    
    // Combine initial songs and custom songs, then filter out deleted ones
    const allSongs = [...initialSongs, ...customSongs];
    
    // Remove any duplicates by slug (keep most recently updated)
    const uniqueSongs = removeDuplicates(allSongs);
    
    // For each song, check for stored overrides in localStorage
    const songsWithOverrides = uniqueSongs.map(song => {
      const storedLyrics = localStorage.getItem(`lyrics-${song.slug}`);
      const storedNotes = localStorage.getItem(`notes-${song.slug}`);
      const storedTitle = localStorage.getItem(`title-${song.slug}`);
      const storedSoundsLike = localStorage.getItem(`soundsLike-${song.slug}`);
      const storedImage = localStorage.getItem(`image-${song.slug}`);
      const storedAudio = localStorage.getItem(`audio-${song.slug}`);
      
      return {
        ...song,
        lyrics: storedLyrics || song.lyrics || '',
        notes: storedNotes || song.notes || '',
        title: storedTitle || song.title,
        soundsLike: storedSoundsLike || song.soundsLike || '',
        image: storedImage || song.image || null,
        audio: storedAudio || song.audio || null
      };
    });
    
    const activeSongs = songsWithOverrides.filter(song => !deletedSongsList.includes(song.slug));
    
    // One more de-duplication pass after applying overrides
    const finalSongs = removeDuplicates(activeSongs);
    setAvailableSongs(finalSongs);

    // Load saved filter combinations
    const savedFilterCombos = localStorage.getItem('saved-filter-combos');
    if (savedFilterCombos) {
      setSavedFilterCombos(JSON.parse(savedFilterCombos));
    }
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
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
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
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });
      case 'recently-played':
        // Would need to implement play tracking - for now, use creation date
        return sorted.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  }, [sortOption]);

  // Get filtered and sorted songs
  const filteredSongs = applySorting(applyFilters(availableSongs));

  // Thoroughly delete a song by cleaning all traces from localStorage
  const handleDeleteSong = useCallback((slug) => {
    // Add to deleted songs list
    const newDeletedSongs = [...deletedSongs, slug];
    setDeletedSongs(newDeletedSongs);
    localStorage.setItem('deleted-songs', JSON.stringify(newDeletedSongs));
    
    // Remove from custom songs in localStorage
    try {
      const customSongsJSON = localStorage.getItem('custom-songs');
      if (customSongsJSON) {
        const customSongs = JSON.parse(customSongsJSON);
        const filteredCustomSongs = customSongs.filter(song => song.slug !== slug);
        localStorage.setItem('custom-songs', JSON.stringify(filteredCustomSongs));
      }
    } catch (error) {
      console.error('Error removing from custom songs:', error);
    }
    
    // Remove individual song properties from localStorage
    const propertiesToRemove = [
      `lyrics-${slug}`,
      `notes-${slug}`,
      `title-${slug}`,
      `soundsLike-${slug}`,
      `image-${slug}`,
      `audio-${slug}`
    ];
    
    propertiesToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing ${key}:`, error);
      }
    });
    
    // Update available songs state
    const newAvailableSongs = availableSongs.filter(song => song.slug !== slug);
    setAvailableSongs(newAvailableSongs);
    
    return newAvailableSongs.length;
  }, [availableSongs, deletedSongs]);

  // Remove duplicate songs
  const removeDuplicateSongs = useCallback(() => {
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
    duplicatedSlugs.forEach(slug => {
      const songs = songsBySlug[slug];
      // Sort by updated date (most recent first)
      songs.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Keep the first one, mark others for deletion
      for (let i = 1; i < songs.length; i++) {
        handleDeleteSong(songs[i].slug);
      }
    });
    
    // Get the new total count
    const newTotal = availableSongs.length - duplicatedSlugs.reduce((total, slug) => {
      return total + songsBySlug[slug].length - 1;
    }, 0);
    
    return {
      removed: duplicatedSlugs.reduce((total, slug) => total + songsBySlug[slug].length - 1, 0),
      total: newTotal
    };
  }, [availableSongs, handleDeleteSong]);

  // Handle creating a new song
  const handleSongCreated = useCallback((newSong) => {
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
      
      // Add the new song to custom songs in localStorage
      try {
        const customSongsJSON = localStorage.getItem('custom-songs');
        const customSongs = customSongsJSON ? JSON.parse(customSongsJSON) : [];
        customSongs.push(songWithTimestamps);
        localStorage.setItem('custom-songs', JSON.stringify(customSongs));
        console.log('Updated custom songs in localStorage');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
        // Continue even if localStorage fails
      }
      
      // Add the new song to available songs
      const updatedSongs = [...availableSongs, songWithTimestamps];
      setAvailableSongs(updatedSongs);
      
      console.log('Song successfully added, new index:', updatedSongs.length - 1);
      return updatedSongs.length - 1;
    } catch (error) {
      console.error('Error in handleSongCreated:', error);
      throw error; // Re-throw to be handled by caller
    }
  }, [availableSongs]);

  // Handles saving updates to an existing song
  const handleSongUpdated = useCallback((updatedSong) => {
    // Add updated timestamp
    const songWithTimestamp = {
      ...updatedSong,
      updatedAt: new Date().toISOString()
    };
    
    const updatedSongs = availableSongs.map(song => 
      song.slug === updatedSong.slug ? songWithTimestamp : song
    );
    
    setAvailableSongs(updatedSongs);
    
    // Update in localStorage if it's a custom song
    const customSongsJSON = localStorage.getItem('custom-songs');
    if (customSongsJSON) {
      const customSongs = JSON.parse(customSongsJSON);
      const songIndex = customSongs.findIndex(s => s.slug === updatedSong.slug);
      
      if (songIndex !== -1) {
        customSongs[songIndex] = songWithTimestamp;
        localStorage.setItem('custom-songs', JSON.stringify(customSongs));
      }
    }
    
    // Always update specific properties in localStorage
    localStorage.setItem(`lyrics-${updatedSong.slug}`, updatedSong.lyrics || '');
    localStorage.setItem(`notes-${updatedSong.slug}`, updatedSong.notes || '');
    localStorage.setItem(`title-${updatedSong.slug}`, updatedSong.title);
    localStorage.setItem(`soundsLike-${updatedSong.slug}`, updatedSong.soundsLike || '');
    
    if (updatedSong.image) {
      localStorage.setItem(`image-${updatedSong.slug}`, updatedSong.image);
    }
    
    if (updatedSong.audio) {
      localStorage.setItem(`audio-${updatedSong.slug}`, updatedSong.audio);
    }
  }, [availableSongs]);

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
    removeDuplicateSongs
  };
}
