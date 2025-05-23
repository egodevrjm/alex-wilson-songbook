// Base API URL - Using Vite's proxy to avoid CORS issues
const API_URL = '/api';

/**
 * Generic function to call the Gemini API with better error handling
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} data - The data to send to the API
 * @param {string} model - The model to use (default: gemini-1.5-pro)
 * @param {number} temperature - The temperature to use (default: 0.7)
 * @returns {Promise<Object>} - The response from the API
 */
const callGeminiAPI = async (endpoint, data, model = 'gemini-1.5-pro', temperature = 0.7) => {
  try {
    console.log(`Calling API: ${API_URL}${endpoint}`);
    console.log('Request data:', { ...data, model, temperature });
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        model,
        temperature
      }),
    });

    // Get the content type from headers
    const contentType = response.headers.get('content-type');
    
    // Clone the response before reading it, so we can read it again if needed
    const responseClone = response.clone();
    
    if (!response.ok) {
      // Try to get the error as JSON first
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.error || `Error calling Gemini API: ${response.status}`;
      } catch (e) {
        // If it's not JSON, get the text from the cloned response
        errorText = await responseClone.text();
        console.error('Raw error response:', errorText);
        errorText = `Error calling Gemini API: ${response.status}. Raw response: ${errorText.substring(0, 100)}...`;
      }
      throw new Error(errorText);
    }

    // If response is OK, check if it's JSON and parse it
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Expected JSON response but got:', contentType, text.substring(0, 200));
      throw new Error(`API returned non-JSON response: ${contentType || 'unknown'}`);
    }
    
    const jsonData = await responseClone.json();
    console.log('API response:', jsonData);
    return jsonData;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Generic function to call the Gemini API
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} model - The model to use (default: gemini-1.5-pro)
 * @param {number} temperature - The temperature to use (default: 0.7)
 * @param {number} maxOutputTokens - Optional max tokens for the response
 * @returns {Promise<{text: string}>} - The generated text
 */
export const generateContent = async (prompt, model = 'gemini-1.5-pro', temperature = 0.7, maxOutputTokens) => {
  return callGeminiAPI('/gemini', { prompt, maxOutputTokens }, model, temperature);
};

/**
 * Generate a new song with Gemini
 * @param {Object} options - Song generation options
 * @param {string} options.title - Optional title for the song
 * @param {string} options.genre - Optional genre
 * @param {string} options.theme - Required theme/topic
 * @param {string} options.additionalInstructions - Optional additional instructions
 * @param {string} options.model - Optional model to use (default: gemini-1.5-pro)
 * @param {number} options.temperature - Optional temperature (default: 0.8)
 * @returns {Promise<{text: string, title: string}>} - The generated song and title
 */
export const generateSong = async ({ 
  title, 
  genre, 
  theme, 
  additionalInstructions,
  model = 'gemini-1.5-pro',
  temperature = 0.8
}) => {
  return callGeminiAPI(
    '/gemini/generate-song', 
    { title, genre, theme, additionalInstructions },
    model,
    temperature
  );
};

/**
 * Enhance/clean up existing lyrics
 * @param {string} lyrics - The original lyrics
 * @param {string} instructions - Instructions for enhancement
 * @param {string} model - Optional model to use (default: gemini-1.5-pro)
 * @param {number} temperature - Optional temperature (default: 0.4)
 * @returns {Promise<{text: string}>} - The enhanced lyrics
 */
export const enhanceLyrics = async (lyrics, instructions, model = 'gemini-1.5-pro', temperature = 0.4) => {
  return callGeminiAPI('/gemini/enhance-lyrics', { lyrics, instructions }, model, temperature);
};

/**
 * Generate notes for a song
 * @param {string} title - The song title
 * @param {string} lyrics - The song lyrics
 * @param {string} noteType - Type of notes to generate (analysis, background, performance)
 * @param {string} model - Optional model to use (default: gemini-1.5-pro)
 * @param {number} temperature - Optional temperature (default: 0.6)
 * @returns {Promise<{text: string}>} - The generated notes
 */
export const generateNotes = async (title, lyrics, noteType = 'analysis', model = 'gemini-1.5-pro', temperature = 0.6) => {
  return callGeminiAPI('/gemini/generate-notes', { title, lyrics, noteType }, model, temperature);
};

/**
 * Generate chord progressions for lyrics
 * @param {string} lyrics - The song lyrics
 * @param {string} genre - Optional genre to influence chord style
 * @param {string} key - Optional musical key
 * @param {string} model - Optional model to use (default: gemini-1.5-pro)
 * @param {number} temperature - Optional temperature (default: 0.5)
 * @returns {Promise<{text: string}>} - The chord progression
 */
export const generateChords = async (lyrics, genre = 'country', key = '', model = 'gemini-1.5-pro', temperature = 0.5) => {
  return callGeminiAPI('/gemini/generate-chords', { lyrics, genre, key }, model, temperature);
};

/**
 * Generate a full song package (lyrics, chords, notes)
 * @param {Object} options - Song generation options
 * @returns {Promise<{lyrics: string, title: string, chords: string, notes: string, performance: string}>} - Complete song package
 */
export const generateFullSong = async (options) => {
  try {
    // Step 1: Generate the song lyrics
    const songResponse = await generateSong(options);
    const { text: lyrics, title } = songResponse;
    
    // Step 2: Generate chords for the lyrics (if requested)
    const chordsPromise = options.includeChords ? 
      generateChords(lyrics, options.genre, options.key) : 
      Promise.resolve({ text: '' });
    
    // Step 3: Generate notes for the song (if requested)
    const notesPromise = options.includeNotes ? 
      generateNotes(title, lyrics, 'analysis') : 
      Promise.resolve({ text: '' });
    
    // Step 4: Generate performance notes (if requested)
    const performancePromise = options.includePerformance ? 
      generateNotes(title, lyrics, 'performance') : 
      Promise.resolve({ text: '' });
    
    // Wait for all requests to complete
    const [chordsResponse, notesResponse, performanceResponse] = 
      await Promise.all([chordsPromise, notesPromise, performancePromise]);
    
    // Return the complete package
    return {
      title,
      lyrics,
      chords: chordsResponse.text,
      notes: notesResponse.text,
      performance: performanceResponse.text
    };
  } catch (error) {
    console.error('Error generating full song package:', error);
    throw error;
  }
};

/**
 * Format existing lyrics without changing any content
 * @param {string} lyrics - The original lyrics to format
 * @param {string} model - Optional model to use (default: gemini-1.5-pro)
 * @param {number} temperature - Optional temperature (default: 0.1)
 * @returns {Promise<{text: string}>} - The formatted lyrics
 */
export const formatLyrics = async (lyrics, model = 'gemini-1.5-pro', temperature = 0.1) => {
  console.log('formatLyrics called with:', { lyrics: lyrics?.substring(0, 50) + '...', model, temperature });
  try {
    // First, try the dedicated format-lyrics endpoint
    return await callGeminiAPI('/gemini/format-lyrics', { lyrics }, model, temperature);
  } catch (error) {
    console.error('Error using format-lyrics endpoint, falling back to direct prompt:', error);
    
    // Fallback to generic prompt if the specific endpoint fails
    const prompt = `
      I'm providing song lyrics that need proper markdown formatting. Please follow these instructions:

      1. DO NOT change any words or the meaning of the lyrics
      2. ONLY add proper formatting with markdown
      3. Format verses with line breaks
      4. Add blank lines between verses and chorus sections
      5. Use bold for section headings (like "Chorus", "Verse", "Bridge", etc.)
      6. Preserve all original words EXACTLY as written

      Original lyrics:
      """
      ${lyrics}
      """

      Return only the formatted lyrics without any explanations or commentary.
    `;
    
    return await generateContent(prompt, model, temperature);
  }
};

/**
 * Create a variation of existing lyrics
 * @param {string} lyrics - The original lyrics
 * @param {string} instructions - Instructions for the variation
 * @param {string} model - Optional model to use (default: gemini-1.5-pro)
 * @param {number} temperature - Optional temperature (default: 0.7)
 * @returns {Promise<{text: string}>} - The variation
 */
export const createLyricsVariation = async (lyrics, instructions, model = 'gemini-1.5-pro', temperature = 0.7) => {
  const prompt = `
    I have the following song lyrics:
    """
    ${lyrics}
    """
    
    Please create a variation of these lyrics with these instructions: ${instructions}
    
    Return only the new variation of the lyrics with proper formatting.
  `;
  
  return generateContent(prompt, model, temperature);
};

// Export all functions at the end of the file after they've been defined
export default {
  generateContent,
  generateSong,
  enhanceLyrics,
  generateNotes,
  generateChords,
  generateFullSong,
  createLyricsVariation,
  formatLyrics
};
