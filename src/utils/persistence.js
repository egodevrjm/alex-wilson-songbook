// Client-side persistence utility for songs database
// Handles saving/loading to localStorage and syncing with server

class SongsPersistence {
  constructor() {
    this.storageKey = 'alex-wilson-songbook';
    this.autoSaveDelay = 1000; // 1 second
    this.saveTimeout = null;
  }

  // Save database to localStorage
  saveToStorage(database) {
    try {
      const serialized = JSON.stringify(database);
      localStorage.setItem(this.storageKey, serialized);
      localStorage.setItem(`${this.storageKey}-backup`, serialized); // Keep a backup
      console.log('✅ Database saved to local storage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      return false;
    }
  }

  // Load database from localStorage
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
      // Try backup
      try {
        const backup = localStorage.getItem(`${this.storageKey}-backup`);
        if (backup) {
          console.log('🔄 Recovered from backup');
          return JSON.parse(backup);
        }
      } catch (backupError) {
        console.error('❌ Backup also corrupted:', backupError);
      }
      return null;
    }
  }

  // Auto-save with debouncing
  autoSave(database) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveToStorage(database);
      // Also trigger server sync if available
      this.syncToServer(database);
    }, this.autoSaveDelay);
  }

  // Sync to server (optional - for future implementation)
  async syncToServer(database) {
    // This could send the database to a server endpoint
    // For now, just log that we'd sync
    console.log('📡 Would sync to server:', {
      totalSongs: database.metadata.totalSongs,
      lastModified: database.metadata.lastModified
    });
  }

  // Export database as downloadable file
  downloadBackup(database, format = 'json') {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `alex-wilson-songbook-${timestamp}.${format}`;
    
    let content, mimeType;
    
    if (format === 'json') {
      content = JSON.stringify(database, null, 2);
      mimeType = 'application/json';
    } else if (format === 'markdown') {
      // Convert to markdown (implement this based on your needs)
      content = this.convertToMarkdown(database);
      mimeType = 'text/markdown';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Downloaded backup: ${filename}`);
  }

  // Convert database to markdown format
  convertToMarkdown(database) {
    const { metadata, songs, songOrder } = database;
    const timestamp = new Date().toLocaleString();

    let markdown = `# ${metadata.title}

*Exported on ${timestamp}*

Total songs: ${metadata.totalSongs}
Last modified: ${metadata.lastModified}

## Table of Contents

${songOrder.map((slug, index) => {
  const song = songs[slug];
  return `${index + 1}. [${song.title}](#${slug})`;
}).join('\n')}

---

`;

    // Add each song
    songOrder.forEach(slug => {
      const song = songs[slug];
      markdown += `<a id="${slug}"></a>

## ${song.title}

### Lyrics

\`\`\`
${song.lyrics}
\`\`\`

### Notes

${song.notes}

${song.soundsLike ? `### Sounds Like

${song.soundsLike}

` : ''}### Metadata
- Created: ${song.createdAt}
- Modified: ${song.updatedAt}
- Version: ${song.version}

---

`;
    });

    return markdown;
  }

  // Clear all stored data
  clearStorage() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(`${this.storageKey}-backup`);
    console.log('🗑️ Cleared all stored data');
  }

  // Get storage statistics
  getStorageStats() {
    const main = localStorage.getItem(this.storageKey);
    const backup = localStorage.getItem(`${this.storageKey}-backup`);
    
    return {
      mainSize: main ? new Blob([main]).size : 0,
      backupSize: backup ? new Blob([backup]).size : 0,
      totalSize: (main ? new Blob([main]).size : 0) + (backup ? new Blob([backup]).size : 0),
      hasMain: !!main,
      hasBackup: !!backup
    };
  }
}

// Export singleton instance
export const persistence = new SongsPersistence();

// Utility functions for React components
export const usePersistence = () => {
  const save = (database) => persistence.autoSave(database);
  const load = () => persistence.loadFromStorage();
  const downloadBackup = (database, format) => persistence.downloadBackup(database, format);
  const getStats = () => persistence.getStorageStats();
  
  return { save, load, downloadBackup, getStats };
};
