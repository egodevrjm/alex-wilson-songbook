import { sampleSongs, sampleAlbums } from '../data/sampleData.js';

export const initializeSampleData = () => {
  // Check if we already have songs
  const existingSongs = localStorage.getItem('songs');
  const existingAlbums = localStorage.getItem('albums');
  
  // Only add sample data if completely empty
  if (!existingSongs || JSON.parse(existingSongs).length === 0) {
    console.log('🎵 Initializing with sample songs...');
    localStorage.setItem('songs', JSON.stringify(sampleSongs));
  }
  
  if (!existingAlbums || JSON.parse(existingAlbums).length === 0) {
    console.log('💿 Initializing with sample albums...');
    localStorage.setItem('albums', JSON.stringify(sampleAlbums));
  }
};

export const hasExistingData = () => {
  const songs = localStorage.getItem('songs');
  const albums = localStorage.getItem('albums');
  
  return (songs && JSON.parse(songs).length > 0) || 
         (albums && JSON.parse(albums).length > 0);
};
