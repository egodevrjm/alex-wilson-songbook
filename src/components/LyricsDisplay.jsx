import React from 'react';

const LyricsDisplay = ({ lyrics, contentType = 'lyrics' }) => {
  if (!lyrics || !lyrics.trim()) {
    return (
      <p className="text-gray-500 italic">
        {contentType === 'lyrics' ? 'No lyrics available' : 
         contentType === 'tracklist' ? 'No tracklist available' : 
         'No content available'}
      </p>
    );
  }

  // Split lyrics into lines and preserve formatting
  const lines = lyrics.split('\n');
  
  return (
    <div className="lyrics-display font-mono text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Empty lines for spacing
        if (!trimmedLine) {
          return <br key={index} />;
        }
        
        // Section headers (lines that start with [ or ** or are all caps)
        const isSectionHeader = 
          trimmedLine.startsWith('[') && trimmedLine.endsWith(']') ||
          trimmedLine.startsWith('**') && trimmedLine.endsWith('**') ||
          (trimmedLine.length > 2 && trimmedLine === trimmedLine.toUpperCase() && /^[A-Z\s\d:]+$/.test(trimmedLine));
        
        if (isSectionHeader) {
          // Clean up section headers
          let cleanHeader = trimmedLine;
          if (cleanHeader.startsWith('[') && cleanHeader.endsWith(']')) {
            cleanHeader = cleanHeader.slice(1, -1);
          }
          if (cleanHeader.startsWith('**') && cleanHeader.endsWith('**')) {
            cleanHeader = cleanHeader.slice(2, -2);
          }
          
          return (
            <div key={index} className="mt-6 mb-3 first:mt-0">
              <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">
                {cleanHeader}
              </h3>
            </div>
          );
        }
        
        // Chorus lines (often indented or repeated)
        const isChorus = trimmedLine.startsWith('  ') || 
                        line.startsWith('    ') ||
                        trimmedLine.toLowerCase().includes('chorus:');
        
        // Bridge lines
        const isBridge = trimmedLine.toLowerCase().includes('bridge:') ||
                        trimmedLine.toLowerCase().includes('outro:') ||
                        trimmedLine.toLowerCase().includes('pre-chorus:');
        
        // Regular verse lines
        return (
          <div 
            key={index} 
            className={`mb-1 ${
              isChorus ? 'ml-6 text-blue-800 font-medium' : 
              isBridge ? 'ml-4 text-purple-700 italic' : 
              'text-gray-800'
            }`}
          >
            {trimmedLine}
          </div>
        );
      })}
    </div>
  );
};

export default LyricsDisplay;
