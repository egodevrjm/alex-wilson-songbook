/**
 * Enhanced Song Storage Manager
 * Handles storage of song data using IndexedDB to avoid localStorage quota limitations
 * Provides automatic migration from localStorage to IndexedDB
 */

// Database configuration
const DB_NAME = 'AlexWilsonSongbookDB';
const DB_VERSION = 2; // Increment version to trigger migration
const SONGS_STORE = 'songs';
const CUSTOM_SONGS_STORE = 'customSongs';
const DELETED_SONGS_STORE = 'deletedSongs';
const SETTINGS_STORE = 'settings';

class SongStorageManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the database
   */
  async init() {
    if (this.isInitialized) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initDB();
    this.db = await this.initPromise;
    this.isInitialized = true;
    
    // Run migration if needed
    await this._migrateFromLocalStorage();
    
    return this.db;
  }

  /**
   * Initialize IndexedDB
   */
  _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(new Error('Failed to open database'));
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(SONGS_STORE)) {
          const songsStore = db.createObjectStore(SONGS_STORE, { keyPath: 'slug' });
          songsStore.createIndex('title', 'title', { unique: false });
          songsStore.createIndex('createdAt', 'createdAt', { unique: false });
          songsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(CUSTOM_SONGS_STORE)) {
          db.createObjectStore(CUSTOM_SONGS_STORE, { keyPath: 'slug' });
        }
        
        if (!db.objectStoreNames.contains(DELETED_SONGS_STORE)) {
          db.createObjectStore(DELETED_SONGS_STORE);
        }
        
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      };
    });
  }

  /**
   * Migrate data from localStorage to IndexedDB
   */
  async _migrateFromLocalStorage() {
    try {
      // Check if migration completed using IndexedDB instead of localStorage
      const migrated = await this._isMigrationComplete();
      
      if (migrated) {
        return; // Migration already completed
      }

      console.log('Starting localStorage to IndexedDB migration...');
      
      // Migrate custom songs
      const customSongsJSON = localStorage.getItem('custom-songs');
      if (customSongsJSON) {
        const customSongs = JSON.parse(customSongsJSON);
        for (const song of customSongs) {
          await this.saveSong(song);
        }
      }

      // Migrate deleted songs
      const deletedSongsJSON = localStorage.getItem('deleted-songs');
      if (deletedSongsJSON) {
        const deletedSongs = JSON.parse(deletedSongsJSON);
        await this.setDeletedSongs(deletedSongs);
      }

      // Migrate individual song properties
      const keys = Object.keys(localStorage);
      const songDataKeys = keys.filter(key => 
        key.startsWith('lyrics-') || 
        key.startsWith('notes-') || 
        key.startsWith('title-') || 
        key.startsWith('soundsLike-') ||
        key.startsWith('image-') ||
        key.startsWith('audio-')
      );

      // Group by slug
      const songsBySlug = {};
      for (const key of songDataKeys) {
        const [property, ...slugParts] = key.split('-');
        const slug = slugParts.join('-');
        
        if (!songsBySlug[slug]) {
          songsBySlug[slug] = { slug };
        }
        
        songsBySlug[slug][property] = localStorage.getItem(key);
      }

      // Save each song - but only if it has meaningful content
      for (const slug in songsBySlug) {
        const songData = songsBySlug[slug];
        
        // Check if song has any meaningful content
        const hasTitle = songData.title && songData.title.trim() && songData.title !== slug;
        const hasLyrics = songData.lyrics && songData.lyrics.trim();
        const hasNotes = songData.notes && songData.notes.trim();
        const hasSoundsLike = songData.soundsLike && songData.soundsLike.trim();
        const hasImage = songData.image;
        const hasAudio = songData.audio;
        
        // Only save if song has at least a proper title or some content
        if (hasTitle || hasLyrics || hasNotes || hasSoundsLike || hasImage || hasAudio) {
          // If it only has content but no proper title, try to create one
          if (!hasTitle && (hasLyrics || hasNotes)) {
            const content = hasLyrics ? songData.lyrics : songData.notes;
            const firstLine = content.trim().split('\n')[0].substring(0, 50);
            songData.title = firstLine || slug;
          }
          
          await this.updateSongProperties(slug, songData);
        } else {
          console.log(`Skipping empty song during migration: ${slug}`);
        }
      }

      // Mark migration as completed - use IndexedDB instead of localStorage
      // since localStorage might be full
      await this._setMigrationComplete();
      
      // Clean up localStorage (optional - can be done later)
      // this._cleanupLocalStorage();
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration error:', error);
      // Don't throw - allow app to continue even if migration fails
    }
  }

  /**
   * Clean up localStorage after successful migration
   */
  _cleanupLocalStorage() {
    const keysToRemove = [];
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (
        key.startsWith('lyrics-') || 
        key.startsWith('notes-') || 
        key.startsWith('title-') || 
        key.startsWith('soundsLike-') ||
        key.startsWith('image-') ||
        key.startsWith('audio-') ||
        key === 'custom-songs' ||
        key === 'deleted-songs'
      ) {
        keysToRemove.push(key);
      }
    }

    // Remove keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing ${key}:`, error);
      }
    });

    console.log(`Cleaned up ${keysToRemove.length} localStorage entries`);
  }

  /**
   * Save a complete song
   */
  async saveSong(song) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SONGS_STORE, CUSTOM_SONGS_STORE], 'readwrite');
      const songsStore = transaction.objectStore(SONGS_STORE);
      const customStore = transaction.objectStore(CUSTOM_SONGS_STORE);
      
      // Add timestamps if not present
      const songWithTimestamps = {
        ...song,
        createdAt: song.createdAt || new Date().toISOString(),
        updatedAt: song.updatedAt || new Date().toISOString()
      };
      
      // Save to songs store
      const songRequest = songsStore.put(songWithTimestamps);
      
      // Also mark as custom song
      const customRequest = customStore.put({ slug: song.slug, isCustom: true });
      
      transaction.oncomplete = () => {
        resolve(songWithTimestamps);
      };
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', event.target.error);
        reject(new Error('Failed to save song'));
      };
    });
  }

  /**
   * Get a song by slug
   */
  async getSong(slug) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SONGS_STORE], 'readonly');
      const store = transaction.objectStore(SONGS_STORE);
      const request = store.get(slug);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting song:', event.target.error);
        reject(new Error('Failed to get song'));
      };
    });
  }

  /**
   * Get all songs
   */
  async getAllSongs() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SONGS_STORE], 'readonly');
      const store = transaction.objectStore(SONGS_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };
      
      request.onerror = (event) => {
        console.error('Error getting all songs:', event.target.error);
        reject(new Error('Failed to get songs'));
      };
    });
  }

  /**
   * Get custom songs
   */
  async getCustomSongs() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CUSTOM_SONGS_STORE, SONGS_STORE], 'readonly');
      const customStore = transaction.objectStore(CUSTOM_SONGS_STORE);
      const songsStore = transaction.objectStore(SONGS_STORE);
      
      const customSongs = [];
      
      const cursorRequest = customStore.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // Get the actual song data
          const songRequest = songsStore.get(cursor.value.slug);
          songRequest.onsuccess = (songEvent) => {
            if (songEvent.target.result) {
              customSongs.push(songEvent.target.result);
            }
          };
          cursor.continue();
        } else {
          // All cursors processed
          setTimeout(() => resolve(customSongs), 100); // Small delay to ensure all gets complete
        }
      };
      
      cursorRequest.onerror = (event) => {
        console.error('Error getting custom songs:', event.target.error);
        reject(new Error('Failed to get custom songs'));
      };
    });
  }

  /**
   * Update specific properties of a song
   */
  async updateSongProperties(slug, properties) {
    await this.init();
    
    // Get existing song
    const existingSong = await this.getSong(slug);
    
    const updatedSong = {
      ...existingSong,
      ...properties,
      slug, // Ensure slug doesn't change
      updatedAt: new Date().toISOString()
    };
    
    return this.saveSong(updatedSong);
  }

  /**
   * Delete a song
   */
  async deleteSong(slug) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SONGS_STORE, CUSTOM_SONGS_STORE, DELETED_SONGS_STORE], 'readwrite');
      
      // Remove from songs store
      const songsStore = transaction.objectStore(SONGS_STORE);
      songsStore.delete(slug);
      
      // Remove from custom songs
      const customStore = transaction.objectStore(CUSTOM_SONGS_STORE);
      customStore.delete(slug);
      
      // Add to deleted songs
      const deletedStore = transaction.objectStore(DELETED_SONGS_STORE);
      deletedStore.put(true, slug);
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Error deleting song:', event.target.error);
        reject(new Error('Failed to delete song'));
      };
    });
  }

  /**
   * Get deleted songs list
   */
  async getDeletedSongs() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DELETED_SONGS_STORE], 'readonly');
      const store = transaction.objectStore(DELETED_SONGS_STORE);
      const request = store.getAllKeys();
      
      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };
      
      request.onerror = (event) => {
        console.error('Error getting deleted songs:', event.target.error);
        reject(new Error('Failed to get deleted songs'));
      };
    });
  }

  /**
   * Set the complete deleted songs list
   */
  async setDeletedSongs(slugs) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DELETED_SONGS_STORE], 'readwrite');
      const store = transaction.objectStore(DELETED_SONGS_STORE);
      
      // Clear existing
      store.clear();
      
      // Add new ones
      slugs.forEach(slug => {
        store.put(true, slug);
      });
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Error setting deleted songs:', event.target.error);
        reject(new Error('Failed to set deleted songs'));
      };
    });
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAllData() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SONGS_STORE, CUSTOM_SONGS_STORE, DELETED_SONGS_STORE, SETTINGS_STORE], 'readwrite');
      
      transaction.objectStore(SONGS_STORE).clear();
      transaction.objectStore(CUSTOM_SONGS_STORE).clear();
      transaction.objectStore(DELETED_SONGS_STORE).clear();
      transaction.objectStore(SETTINGS_STORE).clear();
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Error clearing data:', event.target.error);
        reject(new Error('Failed to clear data'));
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    await this.init();
    
    const stats = {
      totalSongs: 0,
      customSongs: 0,
      deletedSongs: 0,
      estimatedSize: 0
    };
    
    try {
      // Get counts
      const allSongs = await this.getAllSongs();
      stats.totalSongs = allSongs.length;
      
      const customSongs = await this.getCustomSongs();
      stats.customSongs = customSongs.length;
      
      const deletedSongs = await this.getDeletedSongs();
      stats.deletedSongs = deletedSongs.length;
      
      // Estimate storage size
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        stats.estimatedSize = estimate.usage || 0;
        stats.quota = estimate.quota || 0;
      }
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }
    
    return stats;
  }

  /**
   * Check if migration is complete using IndexedDB
   */
  async _isMigrationComplete() {
    try {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('migration-completed');
        
        request.onsuccess = (event) => {
          resolve(event.target.result === true);
        };
        
        request.onerror = () => {
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Set migration complete flag in IndexedDB
   */
  async _setMigrationComplete() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put(true, 'migration-completed');
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error setting migration complete:', event.target.error);
        reject(new Error('Failed to set migration complete'));
      };
    });
  }
  /**
   * Reset migration flag - useful for fixing migration issues
   */
  async resetMigration() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.delete('migration-completed');
      
      request.onsuccess = () => {
        console.log('Migration flag reset');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error resetting migration:', event.target.error);
        reject(new Error('Failed to reset migration'));
      };
    });
  }
}

// Export singleton instance
export const songStorage = new SongStorageManager();

// Convenience functions for backward compatibility
export const storeSong = (song) => songStorage.saveSong(song);
export const getSong = (slug) => songStorage.getSong(slug);
export const getAllSongs = () => songStorage.getAllSongs();
export const updateSong = (slug, properties) => songStorage.updateSongProperties(slug, properties);
export const deleteSong = (slug) => songStorage.deleteSong(slug);
export const getStorageStats = () => songStorage.getStorageStats();
