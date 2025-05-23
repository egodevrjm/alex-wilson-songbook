import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SongSelector = ({ songs, onSelectSong, onClose }) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState(songs);

  useEffect(() => {
    const filtered = songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.soundsLike && song.soundsLike.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSongs(filtered);
  }, [searchTerm, songs]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select a Song to Perform</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
          autoFocus
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredSongs.map(song => (
            <button
              key={song.slug}
              onClick={() => onSelectSong(song)}
              className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-semibold">{song.title}</div>
              {song.soundsLike && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Sounds like: {song.soundsLike}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {song.album} • {song.year}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SongSelector;
