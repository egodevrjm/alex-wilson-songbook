import React, { useState, useEffect } from 'react';
import { songStorage } from '../utils/storage/songStorage';

export default function EmptySongCleaner({ onClose, onSongsRemoved }) {
  const [emptySongs, setEmptySongs] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [selectedSongs, setSelectedSongs] = useState(new Set());

  useEffect(() => {
    scanForEmptySongs();
  }, []);

  const scanForEmptySongs = async () => {
    setIsScanning(true);
    try {
      const allSongs = await songStorage.getAllSongs();
      
      // Find songs that are essentially empty - more thorough detection
      const empty = allSongs.filter(song => {
        // Debug log first few songs
        if (allSongs.indexOf(song) < 3) {
          console.log('Checking song:', {
            slug: song.slug,
            title: song.title,
            hasLyrics: !!song.lyrics,
            lyricsLength: song.lyrics ? song.lyrics.trim().length : 0
          });
        }
        
        // Check title
        const titleIsEmpty = !song.title || song.title.trim() === '';
        const titleIsSlug = song.title === song.slug;
        const titleIsShort = song.title && song.title.trim().length < 3;
        const hasProperTitle = song.title && 
                              song.title.trim() && 
                              song.title !== song.slug && 
                              song.title.trim().length >= 3;
        
        // Check content
        const hasLyrics = song.lyrics && song.lyrics.trim().length > 0;
        const hasNotes = song.notes && song.notes.trim().length > 0;
        const hasSoundsLike = song.soundsLike && song.soundsLike.trim().length > 0;
        const hasAudio = !!song.audio;
        const hasImage = !!song.image;
        
        // Has any meaningful content?
        const hasAnyContent = hasLyrics || hasNotes || hasSoundsLike || hasAudio || hasImage;
        
        // Empty if:
        // 1. No title (or title is just the slug) AND no content
        // 2. Only has a very short title and no content
        const isEmpty = (!hasProperTitle && !hasAnyContent) || 
                       (titleIsSlug && !hasAnyContent) ||
                       (titleIsEmpty && !hasAnyContent);
        
        return isEmpty;
      });
      
      setEmptySongs(empty);
      // Select all by default
      setSelectedSongs(new Set(empty.map(s => s.slug)));
    } catch (error) {
      console.error('Error scanning for empty songs:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSong = (slug) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedSongs(newSelected);
  };

  const toggleAll = () => {
    if (selectedSongs.size === emptySongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(emptySongs.map(s => s.slug)));
    }
  };

  const removeSelected = async () => {
    if (selectedSongs.size === 0) return;
    
    if (!confirm(`Are you sure you want to remove ${selectedSongs.size} empty songs? This cannot be undone.`)) {
      return;
    }

    try {
      // Remove each selected song
      for (const slug of selectedSongs) {
        await songStorage.deleteSong(slug);
      }
      
      // Notify parent
      if (onSongsRemoved) {
        onSongsRemoved(Array.from(selectedSongs));
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error removing songs:', error);
      alert('Error removing songs. Check console for details.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-yellow-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Empty Song Cleanup
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {isScanning ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Scanning for empty songs...</p>
            </div>
          ) : emptySongs.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No empty songs found!</h3>
              <p className="mt-2 text-gray-600">Your songbook is clean.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Found {emptySongs.length} empty or nearly empty songs. These appear to be migration artifacts with no meaningful content.
                </p>
                <p className="text-sm text-gray-500">
                  Review the list below and select which ones to remove.
                </p>
              </div>

              <div className="mb-4 flex justify-between items-center">
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedSongs.size === emptySongs.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedSongs.size} of {emptySongs.length} selected
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title/Slug
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emptySongs.map((song) => (
                      <tr key={song.slug} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSongs.has(song.slug)}
                            onChange={() => toggleSong(song.slug)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {song.title || '(No title)'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {song.slug}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {song.lyrics && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Lyrics</span>}
                            {song.notes && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Notes</span>}
                            {song.soundsLike && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Sounds Like</span>}
                            {song.audio && <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Audio</span>}
                            {song.image && <span className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded">Image</span>}
                            {!song.lyrics && !song.notes && !song.soundsLike && !song.audio && !song.image && 
                              <span className="text-xs text-gray-400">No content</span>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {!isScanning && emptySongs.length > 0 && (
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={removeSelected}
              disabled={selectedSongs.size === 0}
              className={`px-4 py-2 rounded-md ${
                selectedSongs.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Remove {selectedSongs.size} Song{selectedSongs.size !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
