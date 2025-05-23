import { useState, useEffect, useCallback } from 'react';
import serverDataService from '../services/ServerDataService.js';
import { generateSlug } from '../utils/helpers';

/**
 * Server-based album persistence hook
 * Replaces localStorage with Vercel KV storage for shared albums
 */
export function useServerAlbumPersistence() {
  const [albums, setAlbums] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load albums from server
  const loadAlbums = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverAlbums = await serverDataService.getAlbums();
      setAlbums(serverAlbums);
      console.log('Albums loaded from server:', serverAlbums);
    } catch (error) {
      console.error('Error loading albums from server:', error);
      setAlbums([]);
    } finally {
      setIsLoaded(true);
      setIsLoading(false);
    }
  }, []);

  // Load albums on mount
  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  // Create album
  const createAlbum = useCallback(async (albumData) => {
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
    
    try {
      const result = await serverDataService.saveAlbum(newAlbum);
      if (result.success) {
        await loadAlbums(); // Reload all albums
        return newAlbum;
      } else {
        throw new Error(result.error || 'Failed to create album');
      }
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  }, [loadAlbums]);

  // Update album
  const updateAlbum = useCallback(async (albumId, updates) => {
    console.log('Updating album:', albumId, updates);
    
    const album = albums.find(a => a.id === albumId);
    if (!album) {
      throw new Error('Album not found');
    }

    const updatedAlbum = {
      ...album,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      const result = await serverDataService.saveAlbum(updatedAlbum);
      if (result.success) {
        await loadAlbums(); // Reload all albums
      } else {
        throw new Error(result.error || 'Failed to update album');
      }
    } catch (error) {
      console.error('Error updating album:', error);
      throw error;
    }
  }, [albums, loadAlbums]);

  // Delete album
  const deleteAlbum = useCallback(async (albumId) => {
    console.log('Deleting album:', albumId);
    
    try {
      const result = await serverDataService.deleteAlbum(albumId);
      if (result.success) {
        await loadAlbums(); // Reload all albums
      } else {
        throw new Error(result.error || 'Failed to delete album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      throw error;
    }
  }, [loadAlbums]);

  // Add song to album
  const addSongToAlbum = useCallback(async (albumId, songSlug, trackNumber = null) => {
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

    await updateAlbum(albumId, { songs: updatedSongs });
  }, [albums, updateAlbum]);

  // Remove song from album
  const removeSongFromAlbum = useCallback(async (albumId, songSlug) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const updatedSongs = album.songs.filter(s => s.slug !== songSlug);
    // Reorder track numbers
    updatedSongs.forEach((song, index) => {
      song.trackNumber = index + 1;
    });

    await updateAlbum(albumId, { songs: updatedSongs });
  }, [albums, updateAlbum]);

  // Reorder songs in album
  const reorderSongs = useCallback(async (albumId, fromIndex, toIndex) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const updatedSongs = [...album.songs];
    const [movedSong] = updatedSongs.splice(fromIndex, 1);
    updatedSongs.splice(toIndex, 0, movedSong);

    // Update track numbers
    updatedSongs.forEach((song, index) => {
      song.trackNumber = index + 1;
    });

    await updateAlbum(albumId, { songs: updatedSongs });
  }, [albums, updateAlbum]);

  return {
    albums,
    isLoaded,
    isLoading,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addSongToAlbum,
    removeSongFromAlbum,
    reorderSongs,
    reloadAlbums: loadAlbums
  };
}

export default useServerAlbumPersistence;
