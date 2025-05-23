import { useMusicPlayer } from '../contexts/MusicPlayerContext';

// Hook to provide simplified music player integration for individual songs
export const useSongPlayer = (song) => {
  const { playSong, currentTrack, isPlaying } = useMusicPlayer();
  
  const isCurrentlyPlaying = () => {
    return currentTrack?.songSlug === song.slug && isPlaying;
  };
  
  const isInPlayer = () => {
    return currentTrack?.songSlug === song.slug;
  };
  
  const playThisSong = () => {
    playSong(song);
  };
  
  return {
    playThisSong,
    isCurrentlyPlaying: isCurrentlyPlaying(),
    isInPlayer: isInPlayer(),
    currentTrack,
    isPlaying
  };
};
