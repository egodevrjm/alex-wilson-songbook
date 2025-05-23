import React, { useState } from 'react';
import { useTheme, getThemeClasses } from '../contexts/ThemeContext';
import {
  exportSongsToMarkdown,
  exportSongsToJSON,
  exportSongsToCSV,
  exportSongsToText,
  exportSongsToHTML,
  exportSongsToZip
} from '../utils/exportUtils';

export default function ExportManager({ songs, onClose }) {
  const { theme } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    {
      id: 'markdown',
      name: 'Markdown',
      extension: '.md',
      description: 'Best for documentation, GitHub, and formatted text',
      icon: '📝',
      exportFunction: exportSongsToMarkdown
    },
    {
      id: 'json',
      name: 'JSON',
      extension: '.json',
      description: 'Best for data processing and re-importing',
      icon: '🔧',
      exportFunction: exportSongsToJSON
    },
    {
      id: 'csv',
      name: 'CSV',
      extension: '.csv',
      description: 'Best for spreadsheets and basic analysis',
      icon: '📊',
      exportFunction: exportSongsToCSV
    },
    {
      id: 'text',
      name: 'Plain Text',
      extension: '.txt',
      description: 'Universal compatibility, simple format',
      icon: '📄',
      exportFunction: exportSongsToText
    },
    {
      id: 'html',
      name: 'HTML',
      extension: '.html',
      description: 'Best for viewing in browser and printing',
      icon: '🌐',
      exportFunction: exportSongsToHTML
    },
    {
      id: 'zip',
      name: 'All Formats (ZIP)',
      extension: '.zip',
      description: 'Download all formats in a single ZIP file',
      icon: '📦',
      exportFunction: exportSongsToZip
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const format = formats.find(f => f.id === selectedFormat);
      if (format) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `alex-wilson-songbook-${timestamp}${format.extension}`;
        
        if (format.id === 'zip') {
          await format.exportFunction(songs, filename);
        } else {
          format.exportFunction(songs, filename);
        }
        
        // Close modal after successful export
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export songs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Songbook
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
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Export your songbook collection of {songs.length} songs in your preferred format.
            </p>
            <p className="text-sm text-gray-500">
              Each export includes all song titles, lyrics, notes, and metadata.
            </p>
          </div>

          <div className="space-y-3">
            {formats.map((format) => (
              <div
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormat === format.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{format.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={() => setSelectedFormat(format.id)}
                        className="mr-2"
                      />
                      <h3 className="font-medium text-gray-900">
                        {format.name}
                        <span className="text-sm text-gray-500 ml-2">{format.extension}</span>
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedFormat === 'json' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> JSON format preserves all song data and can be re-imported later.
                This is the best format for backing up your songbook.
              </p>
            </div>
          )}

          {selectedFormat === 'zip' && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Note:</strong> The ZIP file will contain your songbook in all available formats,
                giving you maximum flexibility for different use cases.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || songs.length === 0}
            className={`px-4 py-2 rounded-md flex items-center ${
              isExporting || songs.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export {formats.find(f => f.id === selectedFormat)?.name}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
