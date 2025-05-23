import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getAudio, getMetadata } from '../utils/indexedDBHelper';
import { formatFileSize } from '../utils/helpers';

const ProfileMediaPlayer = ({ songs = [] }) => {
  const { theme } = useTheme();
  const { loadPlaylistFromSongs, playSong, currentTrack: globalCurrentTrack, isPlaying: globalIsPlaying } = useMusicPlayer();
  const [audioFiles, setAudioFiles] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  
  const audioRef = useRef(null);

  // Load all audio files from IndexedDB
  useEffect(() => {
    loadAllAudioFiles();
    // Also load the persistent player playlist
    if (songs && songs.length > 0) {
      loadPlaylistFromSongs(songs);
    }
  }, [songs, loadPlaylistFromSongs]); // Re-run when songs change

  const loadAllAudioFiles = async () => {
    try {
      setIsLoading(true);
      
      // Use the songs passed as props instead of loading from localStorage
      if (!songs || songs.length === 0) {
        console.log('No songs provided to ProfileMediaPlayer');
        return;
      }
      
      const audioFiles = [];
      
      for (const song of songs) {
        try {
          const songSlug = song.slug || song.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          const audioData = await getAudio(songSlug);
          const metadata = await getMetadata(songSlug);
          
          if (audioData) {
            audioFiles.push({
              songSlug,
              title: song.title,
              artist: song.artist || 'Alex Wilson',
              album: song.album || 'Unknown Album',
              audioData,
              metadata,
              duration: null,
              songData: song
            });
          }
        } catch (error) {
          console.log(`No audio found for ${song.title}`);
        }
      }
      
      setAudioFiles(audioFiles);
      
      if (audioFiles.length > 0 && !currentTrack) {
        setCurrentTrack(audioFiles[0]);
        setCurrentTrackIndex(0);
      }
    } catch (error) {
      console.error('Error loading audio files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time in MM:SS format
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Handle track selection
  const selectTrack = (track, index) => {
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Handle previous track
  const previousTrack = () => {
    if (audioFiles.length === 0) return;
    
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : audioFiles.length - 1;
    selectTrack(audioFiles[newIndex], newIndex);
  };

  // Handle next track
  const nextTrack = () => {
    if (audioFiles.length === 0) return;
    
    let newIndex;
    if (isShuffled) {
      newIndex = Math.floor(Math.random() * audioFiles.length);
    } else {
      newIndex = currentTrackIndex < audioFiles.length - 1 ? currentTrackIndex + 1 : 0;
    }
    selectTrack(audioFiles[newIndex], newIndex);
  };

  // Handle audio events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeating) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      nextTrack();
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">Loading audio files...</span>
        </div>
      </div>
    );
  }

  if (audioFiles.length === 0) {
    return (
      <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
        <h2 className="text-2xl font-semibold mb-4">Audio Collection</h2>
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-gray-600 text-lg">No audio files uploaded yet</p>
          <p className="text-gray-500 text-sm">Upload MP3 files to songs to enjoy Alex's music here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
      <h2 className="text-2xl font-semibold mb-6">Audio Collection</h2>
      
      {/* Hidden audio element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.audioData}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          volume={isMuted ? 0 : volume}
        />
      )}

      {/* Current track display */}
      {currentTrack && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-medium text-gray-900">{currentTrack.title}</h3>
              <p className="text-gray-600">{currentTrack.artist}</p>
              <p className="text-sm text-gray-500">{currentTrack.album}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Track {currentTrackIndex + 1} of {audioFiles.length}
              </div>
              {currentTrack.metadata && (
                <div className="text-xs text-gray-400 mt-1">
                  {formatFileSize(currentTrack.metadata.fileSize)}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg appearance-none bg-gray-200 cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%)`
              }}
            />
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            {/* Shuffle */}
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-full hover:bg-white/50 transition-colors ${
                isShuffled ? 'text-blue-600 bg-white/30' : 'text-gray-600'
              }`}
              title="Shuffle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5l2 5h9M4 20h5l2-5h9m-9-4l4-4m0 0l4 4m-4-4v8" />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              className="p-2 rounded-full hover:bg-white/50 text-gray-600 transition-colors"
              title="Previous track"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="p-2 rounded-full hover:bg-white/50 text-gray-600 transition-colors"
              title="Next track"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={() => setIsRepeating(!isRepeating)}
              className={`p-2 rounded-full hover:bg-white/50 transition-colors ${
                isRepeating ? 'text-blue-600 bg-white/30' : 'text-gray-600'
              }`}
              title="Repeat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M4.582 9A10.956 10.956 0 0115 3.416M20 20v-5h-.582M19.418 15A10.956 10.956 0 019 20.584" />
              </svg>
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume < 0.5 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 rounded-lg appearance-none bg-gray-200 cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%)`
              }}
            />
          </div>
        </div>
      )}

      {/* Track listing */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium mb-3">All Tracks ({audioFiles.length})</h3>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {audioFiles.map((track, index) => (
            <div
              key={track.songSlug}
              className={`p-3 rounded-lg border transition-colors ${
                globalCurrentTrack?.songSlug === track.songSlug
                  ? 'bg-blue-100 border-blue-300'
                  : currentTrack?.songSlug === track.songSlug
                  ? 'bg-purple-100 border-purple-300'
                  : 'bg-gray-50 hover:bg-gray-100 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    globalCurrentTrack?.songSlug === track.songSlug 
                      ? 'text-blue-900' 
                      : currentTrack?.songSlug === track.songSlug
                      ? 'text-purple-900'
                      : 'text-gray-900'
                  }`}>
                    {track.title}
                  </h4>
                  <p className={`text-sm ${
                    globalCurrentTrack?.songSlug === track.songSlug 
                      ? 'text-blue-700' 
                      : currentTrack?.songSlug === track.songSlug
                      ? 'text-purple-700'
                      : 'text-gray-600'
                  }`}>
                    {track.artist} • {track.album}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {track.metadata && (
                    <span className="text-xs text-gray-500">
                      {formatFileSize(track.metadata.fileSize)}
                    </span>
                  )}
                  <button
                    onClick={() => playSong(track.songData)}
                    className={`p-2 rounded-full transition-colors ${
                      globalCurrentTrack?.songSlug === track.songSlug && globalIsPlaying
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title="Play in persistent player"
                  >
                    {globalCurrentTrack?.songSlug === track.songSlug && globalIsPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => selectTrack(track, index)}
                    className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    title="Play locally"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2.118a3 3 0 00-.879-2.121L7 11.69A3 3 0 016.879 9.57L6 8.118V6a3 3 0 113 3v2.118a3 3 0 00.879 2.121L11 14.31a3 3 0 01.879 2.118V18a3 3 0 01-3 3v0a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileMediaPlayer;
