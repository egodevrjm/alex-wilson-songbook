// Server Data Service - Simplified API client
// Replaces localStorage with Vercel KV storage

class ServerDataService {
  constructor() {
    this.baseUrl = '/api/data';
  }

  getAuthToken() {
    return localStorage.getItem('auth-token');
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // SONGS
  async getSongs() {
    try {
      const response = await fetch(`${this.baseUrl}?action=songs`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  }

  async saveSong(songData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=songs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(songData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving song:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteSong(slug) {
    try {
      const response = await fetch(`${this.baseUrl}?action=songs&id=${slug}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting song:', error);
      return { success: false, error: error.message };
    }
  }

  // ALBUMS
  async getAlbums() {
    try {
      const response = await fetch(`${this.baseUrl}?action=albums`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  async saveAlbum(albumData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=albums`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(albumData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving album:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteAlbum(albumId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=albums&id=${albumId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting album:', error);
      return { success: false, error: error.message };
    }
  }

  // MEDIA
  async uploadMedia(file, type, songSlug) {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      const mediaData = {
        type,
        songSlug,
        data: base64,
        filename: file.name,
        mimeType: file.type
      };

      const response = await fetch(`${this.baseUrl}?action=media`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(mediaData)
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, error: error.message };
    }
  }

  async getMedia(songSlug, type) {
    try {
      const response = await fetch(`${this.baseUrl}?action=media&type=${type}&id=${songSlug}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching media:', error);
      return null;
    }
  }

  // INITIALIZATION
  async initializeSampleData() {
    try {
      const response = await fetch(`${this.baseUrl}?action=initialize`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
}

export const serverDataService = new ServerDataService();
export default serverDataService;
