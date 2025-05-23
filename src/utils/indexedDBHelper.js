/**
 * IndexedDB Storage Helper
 * This utility provides functions to store and retrieve large media files in IndexedDB
 * which is more suitable for audio/video content than localStorage
 */

// Database configuration
const DB_NAME = 'SongbookMediaDB';
const DB_VERSION = 1;
const AUDIO_STORE = 'audioFiles';
const IMAGE_STORE = 'imageFiles';
const METADATA_STORE = 'metadata';

// Initialize the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening database');
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
      
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
      
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE);
      }
    };
  });
};

// Store audio file
export const storeAudio = async (songSlug, audioData) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.put(audioData, songSlug);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error storing audio:', event.target.error);
        reject('Failed to store audio');
      };
    });
  } catch (error) {
    console.error('IndexedDB audio storage error:', error);
    throw error;
  }
};

// Retrieve audio file
export const getAudio = async (songSlug) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.get(songSlug);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving audio:', event.target.error);
        reject('Failed to retrieve audio');
      };
    });
  } catch (error) {
    console.error('IndexedDB audio retrieval error:', error);
    throw error;
  }
};

// Store image file
export const storeImage = async (songSlug, imageData) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGE_STORE);
      
      const request = store.put(imageData, songSlug);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error storing image:', event.target.error);
        reject('Failed to store image');
      };
    });
  } catch (error) {
    console.error('IndexedDB image storage error:', error);
    throw error;
  }
};

// Retrieve image file
export const getImage = async (songSlug) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], 'readonly');
      const store = transaction.objectStore(IMAGE_STORE);
      
      const request = store.get(songSlug);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving image:', event.target.error);
        reject('Failed to retrieve image');
      };
    });
  } catch (error) {
    console.error('IndexedDB image retrieval error:', error);
    throw error;
  }
};

// Store metadata
export const storeMetadata = async (songSlug, metadata) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      
      const request = store.put(metadata, songSlug);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error storing metadata:', event.target.error);
        reject('Failed to store metadata');
      };
    });
  } catch (error) {
    console.error('IndexedDB metadata storage error:', error);
    throw error;
  }
};

// Retrieve metadata
export const getMetadata = async (songSlug) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      
      const request = store.get(songSlug);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving metadata:', event.target.error);
        reject('Failed to retrieve metadata');
      };
    });
  } catch (error) {
    console.error('IndexedDB metadata retrieval error:', error);
    throw error;
  }
};

// Delete audio file
export const deleteAudio = async (songSlug) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.delete(songSlug);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting audio:', event.target.error);
        reject('Failed to delete audio');
      };
    });
  } catch (error) {
    console.error('IndexedDB audio deletion error:', error);
    throw error;
  }
};

// Delete image file
export const deleteImage = async (songSlug) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGE_STORE);
      
      const request = store.delete(songSlug);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting image:', event.target.error);
        reject('Failed to delete image');
      };
    });
  } catch (error) {
    console.error('IndexedDB image deletion error:', error);
    throw error;
  }
};

// Delete metadata
export const deleteMetadata = async (songSlug) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      
      const request = store.delete(songSlug);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting metadata:', event.target.error);
        reject('Failed to delete metadata');
      };
    });
  } catch (error) {
    console.error('IndexedDB metadata deletion error:', error);
    throw error;
  }
};