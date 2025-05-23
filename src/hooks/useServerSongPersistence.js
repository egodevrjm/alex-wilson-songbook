// Server-based song persistence hook
// Replaces localStorage with Vercel KV storage

import { useState, useEffect, useCallback } from 'react';
import serverDataService from '../services/ServerDataService.js';

export function useServerSongPersistence() {
  const [availableSongs, setAvailableSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load songs from server
  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const songs = await serverDataService.getSongs();
      
      // If no songs exist and we haven't initialized yet, initialize with sample data
      if (songs.length === 0 && !hasInitialized) {
        console.log('No songs found, initializing sample data...');
        const initResult = await serverDataService.initializeSampleData();
        if (initResult.success) {
          const newSongs = await serverDataService.getSongs();
          setAvailableSongs(newSongs);
        } else {
          setAvailableSongs([]);
        }
        setHasInitialized(true);
      } else {
        setAvailableSongs(songs);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
      setAvailableSongs([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasInitialized]);

  // Load songs on mount
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Load saved filter combinations from localStorage (keeping this client-side for now)
  useEffect(() => {
    const saved = localStorage.getItem('saved-filter-combos');
    if (saved) {
      setSavedFilterCombos(JSON.parse(saved));
    }
  }, []);

  // Save filter combinations to localStorage
  useEffect(() => {
    localStorage.setItem('saved-filter-combos', JSON.stringify(savedFilterCombos));
  }, [savedFilterCombos]);

  // Filter songs based on search query and filters
  const filteredSongs = availableSongs.filter(song => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchIn = filters.searchWithin;
      
      if (searchIn === 'title' && !song.title.toLowerCase().includes(query)) return false;
      if (searchIn === 'lyrics' && (!song.lyrics || !song.lyrics.toLowerCase().includes(query))) return false;
      if (searchIn === 'notes' && (!song.notes || !song.notes.toLowerCase().includes(query))) return false;
      if (searchIn === 'sounds-like' && (!song.soundsLike || !song.soundsLike.toLowerCase().includes(query))) return false;
      if (searchIn === 'all') {
        const titleMatch = song.title.toLowerCase().includes(query);
        const lyricsMatch = song.lyrics && song.lyrics.toLowerCase().includes(query);
        const notesMatch = song.notes && song.notes.toLowerCase().includes(query);
        const soundsLikeMatch = song.soundsLike && song.soundsLike.toLowerCase().includes(query);
        if (!titleMatch && !lyricsMatch && !notesMatch && !soundsLikeMatch) return false;
      }
    }

    // Content type filter
    if (filters.contentType !== 'all') {
      switch (filters.contentType) {
        case 'lyrics':
          if (!song.lyrics || !song.lyrics.trim()) return false;
          break;
        case 'tracklist':
          if (song.lyrics && song.lyrics.trim()) return false;
          break;
        case 'other':
          if ((song.lyrics && song.lyrics.trim()) || !(song.notes && song.notes.trim())) return false;
          break;
      }
    }

    // Boolean filters
    if (filters.hasAudio !== undefined && Boolean(song.audio) !== filters.hasAudio) return false;
    if (filters.hasImage !== undefined && Boolean(song.image) !== filters.hasImage) return false;
    if (filters.hasNotes !== undefined && Boolean(song.notes && song.notes.trim()) !== filters.hasNotes) return false;
    if (filters.hasSoundsLike !== undefined && Boolean(song.soundsLike && song.soundsLike.trim()) !== filters.hasSoundsLike) return false;

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const songDate = new Date(song.createdAt || song.updatedAt);
      const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
      const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : null;
      
      if (fromDate && songDate < fromDate) return false;
      if (toDate && songDate > toDate) return false;
    }

    // Recently modified filter
    if (filters.recentlyModified) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const songDate = new Date(song.updatedAt || song.createdAt);
      if (songDate <= weekAgo) return false;
    }

    return true;
  });

  // Sort filtered songs
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortOption) {
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'newest-first':
        return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
      case 'oldest-first':
        return new Date(a.createdAt || a.updatedAt || 0) - new Date(b.createdAt || b.updatedAt || 0);
      case 'recently-modified':
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      case 'recently-played':
        // Would need to implement play tracking - for now, use modification date
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      default:
        return 0;
    }
  });

  // Create song
  const handleSongCreated = useCallback(async (newSong) => {
    try {
      const result = await serverDataService.saveSong(newSong);
      if (result.success) {
        await loadSongs(); // Reload all songs
        const newIndex = availableSongs.length; // Approximate new index
        return newIndex;
      } else {
        throw new Error(result.error || 'Failed to create song');
      }
    } catch (error) {
      console.error('Error creating song:', error);
      throw error;
    }
  }, [availableSongs.length, loadSongs]);

  // Update song
  const handleSongUpdated = useCallback(async (updatedSong) => {
    try {
      const result = await serverDataService.saveSong(updatedSong);
      if (result.success) {
        await loadSongs(); // Reload all songs
      } else {
        throw new Error(result.error || 'Failed to update song');
      }
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  }, [loadSongs]);

  // Delete song
  const handleDeleteSong = useCallback(async (slug) => {
    try {
      const result = await serverDataService.deleteSong(slug);
      if (result.success) {
        await loadSongs(); // Reload all songs
        return result.remainingCount || 0;
      } else {
        throw new Error(result.error || 'Failed to delete song');
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }, [loadSongs]);

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

  const removeDuplicateSongs = useCallback(() => {
    console.log('Duplicate removal not implemented for server storage yet');
    return { removed: 0, total: availableSongs.length };
  }, [availableSongs.length]);

  return {
    availableSongs,
    filteredSongs: sortedSongs,
    deletedSongs: [],
    isLoading,
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
    reloadSongs: loadSongs
  };
}

export default useServerSongPersistence;
