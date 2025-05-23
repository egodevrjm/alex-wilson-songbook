import React, { useState } from 'react';

const ImportManager = ({ onClose, onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileImport = async (file) => {
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.songs && Array.isArray(data.songs)) {
        // Import songs to localStorage
        const existingSongs = JSON.parse(localStorage.getItem('songs') || '[]');
        const importedCount = data.songs.length;
        
        // Merge or replace songs
        const allSongs = [...existingSongs, ...data.songs];
        localStorage.setItem('songs', JSON.stringify(allSongs));
        
        // Import images and audio if present
        if (data.images) {
          // Store images in IndexedDB
          const imagePromises = Object.entries(data.images).map(async ([key, imageData]) => {
            try {
              const request = indexedDB.open('SongbookDB', 1);
              return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                  const db = event.target.result;
                  const transaction = db.transaction(['images'], 'readwrite');
                  const store = transaction.objectStore('images');
                  store.put(imageData, key);
                  resolve();
                };
                request.onerror = reject;
              });
            } catch (error) {
              console.error('Error storing image:', error);
            }
          });
          await Promise.all(imagePromises);
        }
        
        if (data.audio) {
          // Store audio in IndexedDB
          const audioPromises = Object.entries(data.audio).map(async ([key, audioData]) => {
            try {
              const request = indexedDB.open('SongbookDB', 1);
              return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                  const db = event.target.result;
                  const transaction = db.transaction(['audio'], 'readwrite');
                  const store = transaction.objectStore('audio');
                  store.put(audioData, key);
                  resolve();
                };
                request.onerror = reject;
              });
            } catch (error) {
              console.error('Error storing audio:', error);
            }
          });
          await Promise.all(audioPromises);
        }
        
        setImportResults({
          success: true,
          songsImported: importedCount,
          imagesImported: data.images ? Object.keys(data.images).length : 0,
          audioImported: data.audio ? Object.keys(data.audio).length : 0
        });
        
        // Reload the page to show imported content
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        throw new Error('Invalid export file format');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Import Songs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!importResults ? (
          <div>
            <p className="text-gray-600 mb-4">
              Import songs, images, and audio from an exported JSON file.
            </p>

            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your export file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-block"
              >
                Choose File
              </label>
            </div>

            {isImporting && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Importing your content...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {importResults.success ? (
              <div>
                <div className="text-green-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Import Successful!</h3>
                <div className="text-gray-600 space-y-1">
                  <p>✅ {importResults.songsImported} songs imported</p>
                  <p>✅ {importResults.imagesImported} images imported</p>
                  <p>✅ {importResults.audioImported} audio files imported</p>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Page will reload automatically to show your content...
                </p>
              </div>
            ) : (
              <div>
                <div className="text-red-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Import Failed</h3>
                <p className="text-red-600">{importResults.error}</p>
                <button
                  onClick={() => setImportResults(null)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportManager;
