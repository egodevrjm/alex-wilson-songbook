import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getAudio, getMetadata } from '../utils/indexedDBHelper';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};

export const MusicPlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1); // Store volume before muting
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(false);
  
  const audioRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    // Audio event handlers
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      if (isRepeating) {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, [isRepeating]);

  // Update audio source when current track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioData;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [currentTrack, volume, isMuted]);

  // Load full playlist from songs with audio
  const loadPlaylistFromSongs = async (songs) => {
    try {
      setIsLoading(true);
      const audioTracks = [];
      
      for (const song of songs) {
        try {
          const songSlug = song.slug || song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          const audioData = await getAudio(songSlug);
          const metadata = await getMetadata(songSlug);
          
          if (audioData) {
            audioTracks.push({
              songSlug,
              title: song.title,
              artist: song.artist || 'Alex Wilson',
              album: song.album || 'Unknown Album',
              audioData,
              metadata,
              songData: song
            });
          }
        } catch (error) {
          console.log(`No audio found for ${song.title}`);
        }
      }
      
      setPlaylist(audioTracks);
      
      // If no current track and we have tracks, set the first one
      if (audioTracks.length > 0 && !currentTrack) {
        setCurrentTrack(audioTracks[0]);
        setCurrentTrackIndex(0);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Play a specific song or toggle play/pause if it's the current song
  const playSong = async (song, allSongs = null) => {
    try {
      const songSlug = song.slug || song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      
      // If this is the current track, just toggle play/pause
      if (currentTrack && currentTrack.songSlug === songSlug) {
        togglePlayPause();
        return;
      }
      
      setIsLoading(true);
      
      // Try to get audio from the song object first
      let audioData = song.audio;
      let metadata = song.audioMetadata;
      
      // Fall back to IndexedDB if not in song object
      if (!audioData) {
        audioData = await getAudio(songSlug);
        metadata = await getMetadata(songSlug);
      }
      
      if (audioData) {
        const track = {
          songSlug,
          title: song.title,
          artist: song.artist || 'Alex Wilson',
          album: song.album || 'Unknown Album',
          audioData,
          metadata,
          songData: song
        };
        
        // If allSongs is provided, build a playlist from songs with audio
        if (allSongs) {
          const audioTracks = [];
          
          for (const s of allSongs) {
            const slug = s.slug || s.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            
            // Check if song has audio
            let hasAudio = false;
            if (s.audio) {
              hasAudio = true;
            } else {
              try {
                const testAudio = await getAudio(slug);
                if (testAudio) hasAudio = true;
              } catch (e) {
                // No audio
              }
            }
            
            if (hasAudio) {
              audioTracks.push({
                songSlug: slug,
                title: s.title,
                artist: s.artist || 'Alex Wilson',
                album: s.album || 'Unknown Album',
                audioData: s.audio || null, // Will be loaded when needed
                metadata: s.audioMetadata || null,
                songData: s
              });
            }
          }
          
          setPlaylist(audioTracks);
          
          // Find the current song's index
          const trackIndex = audioTracks.findIndex(t => t.songSlug === songSlug);
          if (trackIndex !== -1) {
            setCurrentTrackIndex(trackIndex);
          }
        } else {
          // Find index in current playlist or add to playlist
          let trackIndex = playlist.findIndex(t => t.songSlug === songSlug);
          
          if (trackIndex === -1) {
            // Add to playlist if not already there
            setPlaylist(prev => [...prev, track]);
            trackIndex = playlist.length;
          }
          
          setCurrentTrackIndex(trackIndex);
        }
        
        setCurrentTrack(track);
        setPlayerVisible(true);
        
        // Start playing after a short delay to allow audio to load
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              console.error('Error playing audio:', error);
            });
          }
        }, 100);
      } else {
        console.log('No audio found for this song');
      }
    } catch (error) {
      console.error('Error playing song:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  // Go to previous track
  const previousTrack = () => {
    if (playlist.length === 0) return;
    
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1;
    setCurrentTrack(playlist[newIndex]);
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
  };

  // Go to next track
  const nextTrack = async () => {
    if (playlist.length === 0) return;
    
    let newIndex;
    if (isShuffled) {
      newIndex = Math.floor(Math.random() * playlist.length);
    } else {
      newIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0;
    }
    
    const nextTrackData = playlist[newIndex];
    
    // Load audio data if not already loaded
    if (!nextTrackData.audioData && nextTrackData.songData) {
      try {
        const audioData = nextTrackData.songData.audio || await getAudio(nextTrackData.songSlug);
        const metadata = nextTrackData.songData.audioMetadata || await getMetadata(nextTrackData.songSlug);
        
        if (audioData) {
          nextTrackData.audioData = audioData;
          nextTrackData.metadata = metadata;
        }
      } catch (error) {
        console.error('Error loading next track audio:', error);
        // Skip to next track if this one fails
        setCurrentTrackIndex(newIndex);
        nextTrack();
        return;
      }
    }
    
    setCurrentTrack(nextTrackData);
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    
    // Auto-play the next track
    setTimeout(() => {
      if (audioRef.current && nextTrackData.audioData) {
        audioRef.current.play().catch(error => {
          console.error('Error playing next track:', error);
        });
      }
    }, 100);
  };

  // Seek to specific time
  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Set volume
  const setPlayerVolume = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    // If user sets volume to 0, mute it
    if (newVolume === 0) {
      if (!isMuted) {
        setPreviousVolume(volume > 0 ? volume : 0.5); // Store previous volume
      }
      setIsMuted(true);
    } else {
      // If user increases volume while muted, unmute
      if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        // Unmute: restore previous volume or default to 0.5
        const volumeToRestore = previousVolume > 0 ? previousVolume : 0.5;
        setVolume(volumeToRestore);
        audioRef.current.volume = volumeToRestore;
        setIsMuted(false);
      } else {
        // Mute: store current volume and set to 0
        setPreviousVolume(volume);
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  // Toggle repeat
  const toggleRepeat = () => {
    setIsRepeating(!isRepeating);
  };

  // Format time in MM:SS format
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Hide player
  const hidePlayer = () => {
    setPlayerVisible(false);
  };

  // Show player
  const showPlayer = () => {
    setPlayerVisible(true);
  };

  const value = {
    // State
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    isRepeating,
    isLoading,
    playerVisible,
    
    // Actions
    loadPlaylistFromSongs,
    playSong,
    togglePlayPause,
    previousTrack,
    nextTrack,
    seekTo,
    setPlayerVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    formatTime,
    hidePlayer,
    showPlayer,
    
    // Helper
    setCurrentTrack,
    setCurrentTrackIndex
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
