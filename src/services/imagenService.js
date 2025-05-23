// Service for handling Imagen 3 API calls
const IMAGEN_BASE_URL = 'http://localhost:3001/api/imagen';

export class ImagenService {
  static async generateImage(prompt, options = {}) {
    try {
      const requestBody = {
        prompt,
        aspectRatio: options.aspectRatio || '1:1',
        numberOfImages: Math.min(options.numberOfImages || 1, 4),
        safetyFilterLevel: options.safetyFilterLevel || 'block_most',
        personGeneration: options.personGeneration || 'allow_adult',
        ...options
      };

      console.log('Making Imagen API request:', { 
        prompt: prompt.substring(0, 100) + '...', 
        options: { ...requestBody, prompt: '[truncated]' }
      });

      const response = await fetch(`${IMAGEN_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        const errorDetails = data.details || data.message || 'Unknown error';
        
        console.error('Imagen API error:', { 
          status: response.status, 
          error: errorMessage, 
          details: errorDetails 
        });
        
        // Create a more user-friendly error message
        let userFriendlyMessage = errorMessage;
        if (response.status === 400) {
          userFriendlyMessage = 'Invalid request. Please check your prompt and try again.';
        } else if (response.status === 401) {
          userFriendlyMessage = 'Authentication failed. Please check the API configuration.';
        } else if (response.status === 403) {
          userFriendlyMessage = 'Access denied. The API key may not have permission to generate images.';
        } else if (response.status === 429) {
          userFriendlyMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          userFriendlyMessage = 'Server error. Please try again in a few moments.';
        }
        
        const error = new Error(userFriendlyMessage);
        error.details = errorDetails;
        error.status = response.status;
        throw error;
      }

      // Validate response structure
      if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
        console.error('Invalid response structure:', data);
        throw new Error('No images were generated. Please try again with a different prompt.');
      }

      console.log(`Successfully received ${data.images.length} generated image(s)`);
      return data;
    } catch (error) {
      // Enhanced error logging
      console.error('Error generating image:', {
        message: error.message,
        status: error.status,
        details: error.details,
        stack: error.stack
      });
      
      // Re-throw with preserved error information
      throw error;
    }
  }

  static async generateSongImage(songTitle, lyrics, genre, options = {}) {
    try {
      const prompt = this.generatePromptFromSong(songTitle, lyrics, genre, options);
      console.log('Generated song image prompt:', prompt.substring(0, 200) + '...');
      
      const result = await this.generateImage(prompt, {
        aspectRatio: '1:1', // Default to square for album covers
        numberOfImages: options.numberOfImages || 1,
        ...options
      });
      
      return result;
    } catch (error) {
      console.error('Error generating song image:', error);
      // Add context to the error
      const contextError = new Error(`Failed to generate image for song "${songTitle}": ${error.message}`);
      contextError.originalError = error;
      contextError.status = error.status;
      contextError.details = error.details;
      throw contextError;
    }
  }

  static async generateAlbumImage(albumTitle, trackList, genre, options = {}) {
    try {
      const prompt = this.generatePromptFromAlbum(albumTitle, trackList, genre, options);
      console.log('Generated album image prompt:', prompt.substring(0, 200) + '...');
      
      const result = await this.generateImage(prompt, {
        aspectRatio: '1:1', // Default to square for album covers
        numberOfImages: options.numberOfImages || 3, // Generate multiple options for albums
        ...options
      });
      
      return result;
    } catch (error) {
      console.error('Error generating album image:', error);
      // Add context to the error
      const contextError = new Error(`Failed to generate image for album "${albumTitle}": ${error.message}`);
      contextError.originalError = error;
      contextError.status = error.status;
      contextError.details = error.details;
      throw contextError;
    }
  }

  static generatePromptFromSong(songTitle, lyrics, genre, customInstructions = {}) {
    // Extract key themes and emotions from lyrics
    const lyricsPreview = lyrics ? lyrics.substring(0, 500) : '';
    
    let prompt = `Create an artistic image for a ${genre || 'contemporary'} song titled "${songTitle}".`;
    
    if (lyricsPreview) {
      prompt += ` The song's themes include: ${this.extractThemes(lyricsPreview)}.`;
    }
    
    // Add style instructions
    prompt += ` The image should be visually striking and suitable for an album cover or song artwork.`;
    prompt += ` Art style: ${customInstructions.style || 'modern, artistic, with depth and emotion'}.`;
    prompt += ` Colour palette: ${customInstructions.colours || 'rich and evocative, matching the song\'s mood'}.`;
    
    if (customInstructions.additionalDetails) {
      prompt += ` Additional details: ${customInstructions.additionalDetails}`;
    }
    
    // Add technical specifications
    prompt += ` The image should be high quality, with sharp details and professional composition.`;
    prompt += ` Avoid any text or typography in the image.`;
    
    return prompt;
  }

  static generatePromptFromAlbum(albumTitle, trackList, genre, customInstructions = {}) {
    let prompt = `Create an artistic album cover for "${albumTitle}", a ${genre || 'contemporary'} album.`;
    
    if (trackList && trackList.length > 0) {
      const trackTitles = trackList.slice(0, 5).map(track => track.title).join(', ');
      prompt += ` The album includes tracks like: ${trackTitles}.`;
    }
    
    // Add style instructions
    prompt += ` The image should be a cohesive album cover that represents the overall theme of the collection.`;
    prompt += ` Art style: ${customInstructions.style || 'sophisticated, artistic, and memorable'}.`;
    prompt += ` Colour palette: ${customInstructions.colours || 'unified and striking, suitable for an album cover'}.`;
    
    if (customInstructions.additionalDetails) {
      prompt += ` Additional details: ${customInstructions.additionalDetails}`;
    }
    
    // Add technical specifications
    prompt += ` The image should be high quality, suitable for both digital and physical album covers.`;
    prompt += ` Avoid any text or typography in the image.`;
    
    return prompt;
  }

  static extractThemes(lyrics) {
    // Simple keyword-based theme extraction
    const themes = [];
    const lyricsLower = lyrics.toLowerCase();
    
    // Emotional themes
    if (lyricsLower.includes('love') || lyricsLower.includes('heart')) themes.push('love');
    if (lyricsLower.includes('sad') || lyricsLower.includes('cry') || lyricsLower.includes('tear')) themes.push('melancholy');
    if (lyricsLower.includes('happy') || lyricsLower.includes('joy') || lyricsLower.includes('smile')) themes.push('joy');
    if (lyricsLower.includes('angry') || lyricsLower.includes('rage') || lyricsLower.includes('mad')) themes.push('anger');
    if (lyricsLower.includes('hope') || lyricsLower.includes('dream') || lyricsLower.includes('future')) themes.push('hope');
    
    // Environmental themes
    if (lyricsLower.includes('sun') || lyricsLower.includes('light') || lyricsLower.includes('day')) themes.push('brightness');
    if (lyricsLower.includes('night') || lyricsLower.includes('dark') || lyricsLower.includes('moon')) themes.push('darkness');
    if (lyricsLower.includes('rain') || lyricsLower.includes('storm') || lyricsLower.includes('cloud')) themes.push('weather');
    if (lyricsLower.includes('ocean') || lyricsLower.includes('sea') || lyricsLower.includes('water')) themes.push('water');
    if (lyricsLower.includes('mountain') || lyricsLower.includes('hill') || lyricsLower.includes('valley')) themes.push('landscape');
    
    // Relationship themes
    if (lyricsLower.includes('friend') || lyricsLower.includes('together') || lyricsLower.includes('we')) themes.push('friendship');
    if (lyricsLower.includes('alone') || lyricsLower.includes('lonely') || lyricsLower.includes('solitude')) themes.push('solitude');
    if (lyricsLower.includes('family') || lyricsLower.includes('mother') || lyricsLower.includes('father')) themes.push('family');
    
    return themes.length > 0 ? themes.join(', ') : 'emotional expression and musical storytelling';
  }

  // Helper method to convert blob to data URL for display
  static async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default ImagenService;
