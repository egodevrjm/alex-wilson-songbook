/**
 * Enhanced export utilities with multiple format support
 */

/**
 * Generate Markdown content for all songs
 * @param {Array} songs - The array of song objects to export
 * @returns {string} - Markdown content
 */
export function generateSongsMarkdown(songs) {
  if (!songs || songs.length === 0) {
    return '# Alex Wilson Songbook\n\n*No songs available*';
  }

  let markdown = '# Alex Wilson Songbook\n\n';
  markdown += `*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
  markdown += `Total songs: ${songs.length}\n\n`;
  markdown += '## Table of Contents\n\n';
  
  // Generate table of contents
  songs.forEach((song, index) => {
    markdown += `${index + 1}. [${song.title}](#${song.slug})\n`;
  });
  
  markdown += '\n---\n\n';
  
  // Generate content for each song
  songs.forEach((song) => {
    markdown += `<a id="${song.slug}"></a>\n\n`;
    markdown += `## ${song.title}\n\n`;
    
    // Add lyrics section if available
    if (song.lyrics && song.lyrics.trim()) {
      markdown += '### Lyrics\n\n';
      markdown += '```\n';
      markdown += song.lyrics;
      markdown += '\n```\n\n';
    }
    
    // Add notes section if available
    if (song.notes && song.notes.trim()) {
      markdown += '### Notes\n\n';
      markdown += song.notes;
      markdown += '\n\n';
    }
    
    // Add sounds like section if available
    if (song.soundsLike && song.soundsLike.trim()) {
      markdown += '### Sounds Like\n\n';
      markdown += song.soundsLike;
      markdown += '\n\n';
    }
    
    // Add metadata
    if (song.createdAt || song.updatedAt) {
      markdown += '### Metadata\n\n';
      if (song.createdAt) markdown += `- Created: ${new Date(song.createdAt).toLocaleDateString()}\n`;
      if (song.updatedAt) markdown += `- Updated: ${new Date(song.updatedAt).toLocaleDateString()}\n`;
      markdown += '\n';
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
}

/**
 * Generate JSON content for all songs
 * @param {Array} songs - The array of song objects to export
 * @returns {string} - JSON content
 */
export function generateSongsJSON(songs) {
  const exportData = {
    metadata: {
      title: 'Alex Wilson Songbook',
      exportDate: new Date().toISOString(),
      totalSongs: songs.length,
      version: '2.0'
    },
    songs: songs.map(song => ({
      title: song.title,
      slug: song.slug,
      lyrics: song.lyrics || '',
      notes: song.notes || '',
      soundsLike: song.soundsLike || '',
      hasAudio: !!song.audio,
      hasImage: !!song.image,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate CSV content for all songs
 * @param {Array} songs - The array of song objects to export
 * @returns {string} - CSV content
 */
export function generateSongsCSV(songs) {
  // CSV headers
  const headers = ['Title', 'Slug', 'Has Lyrics', 'Has Notes', 'Has Audio', 'Has Image', 'Created', 'Updated'];
  
  // Escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  
  // Build CSV content
  let csv = headers.join(',') + '\n';
  
  songs.forEach(song => {
    const row = [
      escapeCSV(song.title),
      escapeCSV(song.slug),
      song.lyrics && song.lyrics.trim() ? 'Yes' : 'No',
      song.notes && song.notes.trim() ? 'Yes' : 'No',
      song.audio ? 'Yes' : 'No',
      song.image ? 'Yes' : 'No',
      song.createdAt ? new Date(song.createdAt).toLocaleDateString() : '',
      song.updatedAt ? new Date(song.updatedAt).toLocaleDateString() : ''
    ];
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Generate plain text content for all songs
 * @param {Array} songs - The array of song objects to export
 * @returns {string} - Plain text content
 */
export function generateSongsText(songs) {
  if (!songs || songs.length === 0) {
    return 'ALEX WILSON SONGBOOK\n\nNo songs available';
  }

  let text = 'ALEX WILSON SONGBOOK\n';
  text += '====================\n\n';
  text += `Exported: ${new Date().toLocaleString()}\n`;
  text += `Total songs: ${songs.length}\n\n`;
  text += 'TABLE OF CONTENTS\n';
  text += '-----------------\n\n';
  
  // Table of contents
  songs.forEach((song, index) => {
    text += `${index + 1}. ${song.title}\n`;
  });
  
  text += '\n' + '='.repeat(50) + '\n\n';
  
  // Songs content
  songs.forEach((song, index) => {
    text += `${index + 1}. ${song.title.toUpperCase()}\n`;
    text += '-'.repeat(song.title.length + 3) + '\n\n';
    
    if (song.lyrics && song.lyrics.trim()) {
      text += 'LYRICS:\n\n';
      text += song.lyrics + '\n\n';
    }
    
    if (song.notes && song.notes.trim()) {
      text += 'NOTES:\n\n';
      text += song.notes + '\n\n';
    }
    
    if (song.soundsLike && song.soundsLike.trim()) {
      text += 'SOUNDS LIKE:\n\n';
      text += song.soundsLike + '\n\n';
    }
    
    text += '\n' + '='.repeat(50) + '\n\n';
  });
  
  return text;
}

/**
 * Generate HTML content for all songs
 * @param {Array} songs - The array of song objects to export
 * @returns {string} - HTML content
 */
export function generateSongsHTML(songs) {
  const escapeHTML = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alex Wilson Songbook</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e40af;
            margin-top: 40px;
        }
        h3 {
            color: #3730a3;
        }
        .metadata {
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
        .toc {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .toc ol {
            column-count: 2;
            column-gap: 30px;
        }
        .toc a {
            color: #2563eb;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .song {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .lyrics {
            background: #f8f8f8;
            padding: 15px;
            border-left: 4px solid #2563eb;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
        }
        .notes, .sounds-like {
            margin-top: 15px;
            padding: 10px;
            background: #fafafa;
            border-radius: 4px;
        }
        .song-metadata {
            margin-top: 15px;
            font-size: 0.9em;
            color: #666;
        }
        @media print {
            body {
                background: white;
            }
            .song {
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <h1>Alex Wilson Songbook</h1>
    <div class="metadata">
        <p>Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Total songs: ${songs.length}</p>
    </div>
    
    <div class="toc">
        <h2>Table of Contents</h2>
        <ol>
`;

  // Generate table of contents
  songs.forEach((song) => {
    html += `            <li><a href="#${song.slug}">${escapeHTML(song.title)}</a></li>\n`;
  });

  html += `        </ol>
    </div>
`;

  // Generate songs
  songs.forEach((song) => {
    html += `
    <div class="song" id="${song.slug}">
        <h2>${escapeHTML(song.title)}</h2>
`;

    if (song.lyrics && song.lyrics.trim()) {
      html += `        <h3>Lyrics</h3>
        <div class="lyrics">${escapeHTML(song.lyrics)}</div>
`;
    }

    if (song.notes && song.notes.trim()) {
      html += `        <div class="notes">
            <h3>Notes</h3>
            <p>${escapeHTML(song.notes)}</p>
        </div>
`;
    }

    if (song.soundsLike && song.soundsLike.trim()) {
      html += `        <div class="sounds-like">
            <h3>Sounds Like</h3>
            <p>${escapeHTML(song.soundsLike)}</p>
        </div>
`;
    }

    if (song.createdAt || song.updatedAt) {
      html += `        <div class="song-metadata">`;
      if (song.createdAt) html += `Created: ${new Date(song.createdAt).toLocaleDateString()} `;
      if (song.updatedAt) html += `| Updated: ${new Date(song.updatedAt).toLocaleDateString()}`;
      html += `</div>`;
    }

    html += `    </div>
`;
  });

  html += `</body>
</html>`;

  return html;
}

/**
 * Download content as a file
 * @param {string} content - Content to download
 * @param {string} filename - Name of the file
 * @param {string} contentType - MIME type of the content
 */
export function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export songs to Markdown file
 * @param {Array} songs - The array of song objects to export
 * @param {string} filename - Name of the file
 */
export function exportSongsToMarkdown(songs, filename = 'alex-wilson-songbook.md') {
  const markdown = generateSongsMarkdown(songs);
  downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Export songs to JSON file
 * @param {Array} songs - The array of song objects to export
 * @param {string} filename - Name of the file
 */
export function exportSongsToJSON(songs, filename = 'alex-wilson-songbook.json') {
  const json = generateSongsJSON(songs);
  downloadFile(json, filename, 'application/json');
}

/**
 * Export songs to CSV file
 * @param {Array} songs - The array of song objects to export
 * @param {string} filename - Name of the file
 */
export function exportSongsToCSV(songs, filename = 'alex-wilson-songbook.csv') {
  const csv = generateSongsCSV(songs);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export songs to plain text file
 * @param {Array} songs - The array of song objects to export
 * @param {string} filename - Name of the file
 */
export function exportSongsToText(songs, filename = 'alex-wilson-songbook.txt') {
  const text = generateSongsText(songs);
  downloadFile(text, filename, 'text/plain');
}

/**
 * Export songs to HTML file
 * @param {Array} songs - The array of song objects to export
 * @param {string} filename - Name of the file
 */
export function exportSongsToHTML(songs, filename = 'alex-wilson-songbook.html') {
  const html = generateSongsHTML(songs);
  downloadFile(html, filename, 'text/html');
}

/**
 * Export songs in multiple formats as a ZIP file
 * Requires JSZip library to be loaded
 */
export async function exportSongsToZip(songs, filename = 'alex-wilson-songbook.zip') {
  // Check if JSZip is available
  if (typeof JSZip === 'undefined') {
    // Try to load it dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(script);
    
    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }
  
  const zip = new JSZip();
  
  // Add all formats to the ZIP
  zip.file('songbook.md', generateSongsMarkdown(songs));
  zip.file('songbook.json', generateSongsJSON(songs));
  zip.file('songbook.csv', generateSongsCSV(songs));
  zip.file('songbook.txt', generateSongsText(songs));
  zip.file('songbook.html', generateSongsHTML(songs));
  
  // Add a README
  const readme = `Alex Wilson Songbook Export
============================

This ZIP file contains your songbook in multiple formats:

1. songbook.md - Markdown format (good for GitHub, documentation)
2. songbook.json - JSON format (good for data processing, re-import)
3. songbook.csv - CSV format (good for spreadsheets, basic analysis)
4. songbook.txt - Plain text format (universal compatibility)
5. songbook.html - HTML format (good for viewing in browser, printing)

Exported: ${new Date().toLocaleString()}
Total songs: ${songs.length}

Each format contains the same song data, just formatted differently
for various use cases.
`;
  
  zip.file('README.txt', readme);
  
  // Generate and download the ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
