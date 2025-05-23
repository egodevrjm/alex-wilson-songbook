// Add this to your songs.js file to enable exporting back to markdown

// Function to export all songs back to markdown format
export const exportToMarkdown = () => {
  const timestamp = new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });

  let markdown = `# Alex Wilson Songbook

*Exported on ${timestamp}*

Total songs: ${songs.length}

## Table of Contents

${songs.map((song, index) => 
  `${index + 1}. [${song.title}](#${song.slug})`
).join('\n')}

---

`;

  // Add each song
  songs.forEach(song => {
    markdown += `<a id="${song.slug}"></a>

## ${song.title}

### Lyrics

\`\`\`
${song.lyrics}
\`\`\`

### Notes

${song.notes}

${song.soundsLike ? `### Sounds Like

${song.soundsLike}

` : ''}---

`;
  });

  return markdown;
};

// Function to download the markdown export
export const downloadMarkdownBackup = () => {
  const markdown = exportToMarkdown();
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `alex-wilson-songbook-backup-${new Date().getTime()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};