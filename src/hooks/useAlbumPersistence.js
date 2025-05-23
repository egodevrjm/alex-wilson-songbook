import { useState, useEffect, useCallback } from 'react';
import { generateSlug } from '../utils/helpers';

/**
 * Custom hook to handle album persistence with localStorage
 * This ensures albums persist across component unmounts and remounts
 */
export function useAlbumPersistence() {
  const [albums, setAlbums] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load albums from localStorage on hook initialization
  useEffect(() => {
    const loadAlbums = () => {
      try {
        const savedAlbums = localStorage.getItem('songbook-albums');
        if (savedAlbums) {
          const parsedAlbums = JSON.parse(savedAlbums);
          console.log('Albums loaded from localStorage:', parsedAlbums);
          setAlbums(parsedAlbums);
        }
      } catch (error) {
        console.error('Error loading albums from localStorage:', error);
        setAlbums([]);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAlbums();
  }, []);

  // Save albums to localStorage whenever albums change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('songbook-albums', JSON.stringify(albums));
        console.log('Albums saved to localStorage:', albums);
      } catch (error) {
        console.error('Error saving albums to localStorage:', error);
      }
    }
  }, [albums, isLoaded]);

  // Create album
  const createAlbum = useCallback((albumData) => {
    const newAlbum = {
      id: `album-${Date.now()}`,
      slug: albumData.slug || generateSlug(albumData.title),
      title: albumData.title.trim(),
      description: albumData.description?.trim() || '',
      releaseDate: albumData.releaseDate || '',
      coverArt: albumData.coverArt || null,
      type: albumData.type || 'standard',
      songs: albumData.songs || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating new album:', newAlbum);
    
    setAlbums(prev => {
      const updated = [...prev, newAlbum];
      console.log('Updated albums state:', updated);
      return updated;
    });
    
    return newAlbum;
  }, []);

  // Update album
  const updateAlbum = useCallback((albumId, updates) => {
    console.log('Updating album:', albumId, updates);
    setAlbums(prev => {
      const updated = prev.map(album => 
        album.id === albumId 
          ? { ...album, ...updates, updatedAt: new Date().toISOString() }
          : album
      );
      console.log('Albums after update:', updated);
      return updated;
    });
  }, []);

  // Delete album
  const deleteAlbum = useCallback((albumId) => {
    console.log('Deleting album:', albumId);
    setAlbums(prev => prev.filter(album => album.id !== albumId));
  }, []);

  // Add song to album
  const addSongToAlbum = useCallback((albumId, songSlug, trackNumber = null) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const existingSong = album.songs.find(s => s.slug === songSlug);
    if (existingSong) return; // Song already in album

    const newTrackNumber = trackNumber || (album.songs.length + 1);
    const updatedSongs = [...album.songs, {
      slug: songSlug,
      trackNumber: newTrackNumber,
      addedAt: new Date().toISOString()
    }].sort((a, b) => a.trackNumber - b.trackNumber);

    updateAlbum(albumId, { songs: updatedSongs });
  }, [albums, updateAlbum]);

  // Remove song from album
  const removeSongFromAlbum = useCallback((albumId, songSlug) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const updatedSongs = album.songs.filter(s => s.slug !== songSlug);
    // Reorder track numbers
    updatedSongs.forEach((song, index) => {
      song.trackNumber = index + 1;
    });

    updateAlbum(albumId, { songs: updatedSongs });
  }, [albums, updateAlbum]);

  // Reorder songs in album
  const reorderSongs = useCallback((albumId, fromIndex, toIndex) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const updatedSongs = [...album.songs];
    const [movedSong] = updatedSongs.splice(fromIndex, 1);
    updatedSongs.splice(toIndex, 0, movedSong);

    // Update track numbers
    updatedSongs.forEach((song, index) => {
      song.trackNumber = index + 1;
    });

    updateAlbum(albumId, { songs: updatedSongs });
  }, [albums, updateAlbum]);

  return {
    albums,
    isLoaded,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addSongToAlbum,
    removeSongFromAlbum,
    reorderSongs
  };
}
