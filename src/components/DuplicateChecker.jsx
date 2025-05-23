import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { findAllDuplicates, calculateSimilarity } from '../utils/duplicateChecker';

const DuplicateChecker = ({ songs, onNavigateToSong, onSongDeleted }) => {
  const { theme } = useTheme();
  const [isChecking, setIsChecking] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [checkOptions, setCheckOptions] = useState({
    checkExactTitles: true,
    checkSimilarTitles: true,
    checkExactLyrics: true,
    checkSimilarLyrics: false,
    titleSimilarityThreshold: 0.8,
    lyricsSimilarityThreshold: 0.9
  });
  const [expandedSections, setExpandedSections] = useState({
    exactTitles: true,
    similarTitles: true,
    exactLyrics: true,
    similarLyrics: true
  });
  
  // Track which duplicates to remove (keep track of slugs to delete)
  const [selectedForRemoval, setSelectedForRemoval] = useState(new Set());

  const runDuplicateCheck = async () => {
    setIsChecking(true);
    
    // Simulate processing time for large collections
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const results = findAllDuplicates(songs, checkOptions);
      setDuplicates(results);
      // Clear previous selections when new check is run
      setSelectedForRemoval(new Set());
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      alert('An error occurred while checking for duplicates. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTotalDuplicates = () => {
    if (!duplicates) return 0;
    return (
      duplicates.exactTitles.length +
      duplicates.similarTitles.length +
      duplicates.exactLyrics.length +
      duplicates.similarLyrics.length
    );
  };

  const getTotalAffectedSongs = () => {
    if (!duplicates) return 0;
    const allSongs = new Set();
    
    Object.values(duplicates).forEach(groups => {
      groups.forEach(group => {
        group.forEach(song => allSongs.add(song.slug));
      });
    });
    
    return allSongs.size;
  };

  // Auto-select duplicates for removal (prioritises songs with media, then oldest)
  const autoSelectDuplicates = () => {
    const toRemove = new Set();
    
    if (!duplicates) return;
    
    Object.values(duplicates).forEach(groups => {
      groups.forEach(group => {
        if (group.length > 1) {
          // Sort by priority: songs with both audio and image first, then songs with either, then by date
          const sorted = [...group].sort((a, b) => {
            // Calculate media scores
            const scoreA = (a.audio ? 2 : 0) + (a.image ? 1 : 0);
            const scoreB = (b.audio ? 2 : 0) + (b.image ? 1 : 0);
            
            // If media scores are different, prioritise the one with more media
            if (scoreA !== scoreB) {
              return scoreB - scoreA; // Higher score first
            }
            
            // If media scores are equal, sort by creation date (keep oldest)
            const dateA = new Date(a.createdAt || a.updatedAt || '1970-01-01');
            const dateB = new Date(b.createdAt || b.updatedAt || '1970-01-01');
            
            if (dateA.getTime() === dateB.getTime()) {
              // If dates are equal, sort by title
              return a.title.localeCompare(b.title);
            }
            return dateA - dateB;
          });
          
          // Keep the first (highest priority), mark rest for removal
          for (let i = 1; i < sorted.length; i++) {
            toRemove.add(sorted[i].slug);
          }
        }
      });
    });
    
    setSelectedForRemoval(toRemove);
  };

  // Toggle individual song for removal
  const toggleSongForRemoval = (slug) => {
    setSelectedForRemoval(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  // Remove selected duplicates
  const removeSelectedDuplicates = async () => {
    if (selectedForRemoval.size === 0) {
      alert('No duplicates selected for removal.');
      return;
    }

    const confirmMessage = `Are you sure you want to remove ${selectedForRemoval.size} duplicate song${selectedForRemoval.size > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRemoving(true);
    
    try {
      // Remove each selected song
      for (const slug of selectedForRemoval) {
        if (onSongDeleted) {
          onSongDeleted(slug);
        }
      }
      
      // Clear selections and re-run duplicate check on remaining songs
      setSelectedForRemoval(new Set());
      
      // Small delay to allow state updates to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-run duplicate check with updated song list
      await runDuplicateCheck();
      
      alert(`Successfully removed ${selectedForRemoval.size} duplicate songs.`);
    } catch (error) {
      console.error('Error removing duplicates:', error);
      alert('An error occurred while removing duplicates. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const renderDuplicateGroup = (group, type) => {
    const getSimilarityDisplay = (song1, song2, type) => {
      if (type === 'exactTitles' || type === 'exactLyrics') return null;
      
      const text1 = type === 'similarTitles' ? song1.title : song1.lyrics || '';
      const text2 = type === 'similarTitles' ? song2.title : song2.lyrics || '';
      const similarity = calculateSimilarity(text1, text2);
      
      return (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          {(similarity * 100).toFixed(1)}% similar
        </span>
      );
    };

    return (
      <div key={group[0].slug} className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">
            Duplicate Group ({group.length} songs)
          </h4>
          {group.length > 1 && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              {group.length - 1} duplicate{group.length > 2 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {group.map((song, index) => (
            <div key={song.slug} className={`flex items-center justify-between p-3 rounded transition-colors ${
              selectedForRemoval.has(song.slug) 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-gray-50'
            }`}>
              <div className="flex items-center flex-1">
                <label className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={selectedForRemoval.has(song.slug)}
                    onChange={() => toggleSongForRemoval(song.slug)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedForRemoval.has(song.slug) ? 'Remove' : 'Keep'}
                  </span>
                </label>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900">{song.title}</h5>
                    {/* Media flags */}
                    <div className="flex gap-1">
                      {song.audio && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium media-flag-audio">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          MP3
                        </span>
                      )}
                      {song.image && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium media-flag-image">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Image
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>Created: {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    {song.updatedAt && (
                      <span className="ml-3">
                        Updated: {new Date(song.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                    {song.version && (
                      <span className="ml-3">Version: {song.version}</span>
                    )}
                  </div>
                  {(type === 'similarTitles' || type === 'similarLyrics') && index > 0 && (
                    <div className="mt-2">
                      {getSimilarityDisplay(group[0], song, type)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onNavigateToSong && onNavigateToSong(song.slug)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  View Song
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSection = (key, title, description, groups) => {
    const isExpanded = expandedSections[key];
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(key)}
          className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              {title}
              {groups.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                  {groups.length} group{groups.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="p-4 border-t border-gray-200">
            {groups.length === 0 ? (
              <p className="text-gray-500 italic">No duplicates found in this category.</p>
            ) : (
              groups.map(group => renderDuplicateGroup(group, key))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-6`}>
      <h2 className="text-2xl font-semibold mb-4">Duplicate Checker</h2>
      <p className="text-gray-600 mb-6">
        Scan your song collection for potential duplicates. This can help identify songs that may have been 
        added multiple times with slight variations.
      </p>

      {/* Check Options */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Check Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkOptions.checkExactTitles}
              onChange={(e) => setCheckOptions(prev => ({ ...prev, checkExactTitles: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Exact title matches</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkOptions.checkSimilarTitles}
              onChange={(e) => setCheckOptions(prev => ({ ...prev, checkSimilarTitles: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Similar titles (fuzzy match)</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkOptions.checkExactLyrics}
              onChange={(e) => setCheckOptions(prev => ({ ...prev, checkExactLyrics: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Exact lyrics matches</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkOptions.checkSimilarLyrics}
              onChange={(e) => setCheckOptions(prev => ({ ...prev, checkSimilarLyrics: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Similar lyrics (fuzzy match)</span>
          </label>
        </div>

        {/* Similarity Thresholds */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title Similarity Threshold: {(checkOptions.titleSimilarityThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={checkOptions.titleSimilarityThreshold}
              onChange={(e) => setCheckOptions(prev => ({ ...prev, titleSimilarityThreshold: parseFloat(e.target.value) }))}
              className="duplicate-threshold-slider"
              disabled={!checkOptions.checkSimilarTitles}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lyrics Similarity Threshold: {(checkOptions.lyricsSimilarityThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.7"
              max="1"
              step="0.05"
              value={checkOptions.lyricsSimilarityThreshold}
              onChange={(e) => setCheckOptions(prev => ({ ...prev, lyricsSimilarityThreshold: parseFloat(e.target.value) }))}
              className="duplicate-threshold-slider"
              disabled={!checkOptions.checkSimilarLyrics}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={runDuplicateCheck}
          disabled={isChecking || songs.length === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isChecking || songs.length === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isChecking ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking for duplicates...
            </span>
          ) : (
            `Check for Duplicates (${songs.length} songs)`
          )}
        </button>

        {duplicates && getTotalDuplicates() > 0 && (
          <>
            <button
              onClick={autoSelectDuplicates}
              disabled={isRemoving}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                isRemoving
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
              title="Automatically selects duplicates for removal, prioritising songs with media attachments"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Auto-Select Duplicates
            </button>

            <button
              onClick={removeSelectedDuplicates}
              disabled={isRemoving || selectedForRemoval.size === 0}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                isRemoving || selectedForRemoval.size === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isRemoving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing duplicates...
                </span>
              ) : (
                `Remove Selected (${selectedForRemoval.size} songs)`
              )}
            </button>
          </>
        )}
      </div>

      {/* Selection Summary */}
      {duplicates && getTotalDuplicates() > 0 && selectedForRemoval.size > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Removal Summary</h3>
          <p className="text-sm text-yellow-800">
            <strong>{selectedForRemoval.size}</strong> songs selected for removal.
            After removal, you will have <strong>{songs.length - selectedForRemoval.size}</strong> songs remaining.
          </p>
        </div>
      )}

      {/* Results */}
      {duplicates && (
        <div>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Scan Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Songs Scanned:</span>
                <span className="ml-2 text-blue-700">{songs.length}</span>
              </div>
              <div>
                <span className="font-medium">Duplicate Groups Found:</span>
                <span className="ml-2 text-blue-700">{getTotalDuplicates()}</span>
              </div>
              <div>
                <span className="font-medium">Songs Affected:</span>
                <span className="ml-2 text-blue-700">{getTotalAffectedSongs()}</span>
              </div>
            </div>
          </div>

          {getTotalDuplicates() === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Duplicates Found!</h3>
              <p className="text-gray-600">Your song collection appears to be free of duplicates based on the selected criteria.</p>
            </div>
          ) : (
            <div>
              {duplicates.exactTitles.length > 0 && 
                renderSection(
                  'exactTitles',
                  'Exact Title Matches',
                  'Songs with identical titles (case and punctuation insensitive)',
                  duplicates.exactTitles
                )
              }
              
              {duplicates.similarTitles.length > 0 && 
                renderSection(
                  'similarTitles',
                  'Similar Titles',
                  'Songs with titles that are very similar but not identical',
                  duplicates.similarTitles
                )
              }
              
              {duplicates.exactLyrics.length > 0 && 
                renderSection(
                  'exactLyrics',
                  'Exact Lyrics Matches',
                  'Songs with identical lyrics content',
                  duplicates.exactLyrics
                )
              }
              
              {duplicates.similarLyrics.length > 0 && 
                renderSection(
                  'similarLyrics',
                  'Similar Lyrics',
                  'Songs with very similar lyrics content',
                  duplicates.similarLyrics
                )
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DuplicateChecker;