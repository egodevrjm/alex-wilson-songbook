/*
 * Alex Wilson Songbook Server
 * 
 * Updated to use the correct Imagen 3.0 API format:
 * - Request format: { instances: [{ prompt: "text" }] }
 * - Response format: { predictions: [{ imageBytes: "base64..." }] }
 * 
 * Previous format with parameters object was not working.
 * This simplified format has been tested and confirmed working.
 */

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Log the API key's first few characters to confirm it's loaded (don't log the whole key)
console.log(`API Key loaded (starts with): ${API_KEY.substring(0, 5)}...`);

const genAI = new GoogleGenerativeAI(API_KEY);

// Updated Imagen API configuration for Imagen 3.0
// Using the :predict endpoint as discovered through testing
const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;

// Log the API URL for verification (without the key)
console.log('Imagen API URL configured:', IMAGEN_API_URL.split('?')[0]);

// Configure CORS for handling external API calls
const corsOptions = {
  origin: '*', // In production, you should restrict this to your app's domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Generic error handler
const handleError = (res, error, customMessage, statusCode = 500) => {
  console.error(customMessage || 'Error calling API:', error);
  
  // Try to extract a meaningful error message
  let errorMessage = customMessage || 'Failed to generate content';
  let errorDetails = '';
  
  if (error.message) {
    errorDetails = error.message;
  } else if (typeof error === 'string') {
    errorDetails = error;
  } else {
    try {
      errorDetails = JSON.stringify(error);
    } catch (e) {
      errorDetails = 'Unknown error';
    }
  }
  
  console.log('Sending error response:', { error: errorMessage, details: errorDetails, statusCode });
  
  // Ensure we haven't already sent a response
  if (!res.headersSent) {
    res.status(statusCode).json({ 
      error: errorMessage, 
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
};

// Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, model = 'gemini-1.5-pro', temperature = 0.7, maxOutputTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxOutputTokens || undefined
      }
    });
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    handleError(res, error, 'Failed to call Gemini API');
  }
});

// Special endpoint for song generation
app.post('/api/gemini/generate-song', async (req, res) => {
  try {
    console.log('Received song generation request:', req.body);
    
    const { 
      title, 
      genre, 
      theme, 
      additionalInstructions,
      model = 'gemini-1.5-pro',
      temperature = 0.8
    } = req.body;
    
    if (!theme) {
      console.warn('Theme is required but was not provided');
      return res.status(400).json({ error: 'Theme is required' });
    }
    
    console.log(`Generating song with theme: "${theme}"`);

    // Alex Wilson's profile information for context
    const alexWilsonProfile = `
Alex Wilson Profile:
- 19-year-old singer-songwriter from Pikeville, Kentucky (coal country)
- Plays guitar, fiddle, piano (self-taught), and sings with a deep, resonant voice with gravelly tones
- Musical influences: Johnny Cash, Waylon Jennings, Chris Stapleton, Tyler Childers, Adele
- Favorite songs: "Hurt" by Johnny Cash, "Cover Me Up" by Jason Isbell, "O Death" by Ralph Stanley
- Most influential album: "Traveller" by Chris Stapleton
- Background: Grew up in harsh poverty in a battered trailer at the edge of forgotten hollers, difficult relationship with abusive father
- At 16, was kicked out and found shelter in another trailer, worked in fields, farms and mines
- Has a broken arm that never healed properly from age 14, still taught himself to play through the pain
- Treasured possession: A rusted guitar he found at age six
- Lives authentically and values truth over fame: "I ain't chasin' fame — just truth. If folks feel what I felt when I wrote it, that's enough."
- Signature style: Often shirtless, worn Wrangler jeans and sun-faded white tees, scuffed leather boots
- Biggest fear: Repeating his father's mistakes
- Known for raw, powerful music emerging from lived experiences, not learned talent
- Writing style is authentic, draws on personal trauma, rural life, hardship, and resilience
`;

    const prompt = `
Generate a complete, original song in the authentic voice of Alex Wilson, using the following specifications:
${title ? `Title: ${title}` : 'Create a unique, engaging title that reflects the theme. Avoid generic titles like "Blackberry Creek Blues" or "Mountain Song".'}
${genre ? `Genre: ${genre}` : 'Genre: Country/Folk with Appalachian influence, similar to Chris Stapleton or Tyler Childers'}
Theme/Topic: ${theme}
${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}

${alexWilsonProfile}

The song should include:
1. Verses (at least 2)
2. A chorus
3. Optionally, a bridge
4. Proper song structure formatting

The lyrics must authentically reflect Alex Wilson's voice, background, and experiences:
- Use imagery from rural Kentucky, mountains, coal country, trailer homes, or hard labor when appropriate to the theme
- Incorporate authentic dialect and speech patterns from Appalachia
- Include references to personal struggles, resilience, or overcoming adversity if relevant to the theme
- Draw on emotions from Alex's difficult upbringing and relationship with his father
- Write with raw honesty and emotional depth, avoiding clichés and generic sentiments
- The tone should have a sense of grit and authenticity, similar to Johnny Cash or Chris Stapleton's work
- Use natural imagery from Appalachia (mountains, creeks, pines, coal, etc.) when appropriate
- For love songs, focus on depth, struggle, and authenticity rather than romanticized clichés
- Create varied emotional arcs - not every song needs to be sad or dark
- Make each song distinct in tone, style, and lyrical approach
- Incorporate unexpected turns, vivid details, and memorable lines
- Be creative with rhyme schemes, verse structures, and narrative approaches

Do not include chords or song composition notes - just the lyrics with proper structure.
`;

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: 1024
      }
    });
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract title if it was generated by Gemini
    let extractedTitle = title;
    if (!extractedTitle) {
      // Try to extract title from the first line if it looks like a title
      const lines = text.split('\n');
      if (lines[0] && !lines[0].toLowerCase().includes('verse') && !lines[0].toLowerCase().includes('chorus')) {
        extractedTitle = lines[0].replace(/[""]/g, '').trim();
      }
    }
    
    // Check for repetitive or generic titles and enhance if needed
    if (extractedTitle) {
      const genericTitlePatterns = [
        /blackberry creek/i,
        /mountain (song|blues|man)/i,
        /country (road|life|boy|girl)/i,
        /coal (mine|miner)/i,
        /holler/i,
        /kentucky/i,
        /appalachian/i,
        /^blues$/i
      ];
      
      const isGeneric = genericTitlePatterns.some(pattern => pattern.test(extractedTitle));
      
      if (isGeneric && theme) {
        // Create a more unique title by incorporating the theme
        const formattedTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
        extractedTitle = `${formattedTheme}: ${extractedTitle}`;
        console.log(`Enhanced generic title with theme: ${extractedTitle}`);
      }
    }

    res.json({ 
      text, 
      title: extractedTitle || 'Untitled Song'
    });
  } catch (error) {
    console.error('Error generating song:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to generate song';
    let errorDetails = '';
    
    if (error.message) {
      errorDetails = error.message;
      
      // Check for specific error types
      if (error.message.includes('API_KEY')) {
        errorMessage = 'API key issue. Check your Gemini API key configuration.';
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        errorMessage = 'Network error. Make sure Gemini API is accessible.';
      }
    }
    
    // Send detailed error response
    res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      prompt: req.body.theme // Echo back the prompt for debugging
    });
  }
});

// Special endpoint for song enhancement
app.post('/api/gemini/enhance-lyrics', async (req, res) => {
  try {
    const { 
      lyrics, 
      instructions = 'Improve and polish these lyrics while maintaining the original meaning and style',
      model = 'gemini-1.5-pro',
      temperature = 0.4
    } = req.body;
    
    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    const prompt = `
I'm providing lyrics that need enhancement. Please follow these instructions:
${instructions}

Original lyrics:
"""
${lyrics}
"""

Return only the enhanced lyrics with proper formatting. Maintain the original structure (verses, chorus, bridge) but improve the content based on the instructions. Don't add explanations or commentary.
`;

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: 1024
      }
    });
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    handleError(res, error, 'Failed to enhance lyrics');
  }
});

// Special endpoint for generating song notes
app.post('/api/gemini/generate-notes', async (req, res) => {
  try {
    const { 
      title,
      lyrics, 
      noteType = 'analysis', // 'analysis', 'background', 'performance'
      model = 'gemini-1.5-pro',
      temperature = 0.6
    } = req.body;
    
    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    let promptTemplate;
    switch(noteType) {
      case 'background':
        promptTemplate = `
Create a fictional backstory/background for this song. Include:
- The fictional inspiration behind the song
- Emotions and themes represented
- Possible personal connections for the songwriter
- Context about when and where it might have been written
`;
        break;
      case 'performance':
        promptTemplate = `
Create performance notes for this song. Include:
- Suggested vocal delivery and style
- Emotional interpretation guidance
- Key moments to emphasize
- Performance tips for connecting with the audience
`;
        break;
      case 'analysis':
      default:
        promptTemplate = `
Analyze this song. Include:
- Main themes and motifs
- Lyrical techniques used
- Emotional journey through the song
- Notable literary devices or songwriting techniques
`;
    }

    const prompt = `
${promptTemplate}

Song title: ${title || 'Untitled'}

Lyrics:
"""
${lyrics}
"""

Write in a concise, insightful style. Format the notes clearly with appropriate sections.
`;

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: 1024
      }
    });
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    handleError(res, error, 'Failed to generate notes');
  }
});

// New endpoint for formatting lyrics
app.post('/api/gemini/format-lyrics', async (req, res) => {
  try {
    const { 
      lyrics, 
      model = 'gemini-1.5-pro',
      temperature = 0.1
    } = req.body;
    
    console.log('Format lyrics endpoint called with:', { lyrics: lyrics?.substring(0, 50) + '...', model, temperature });
    
    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    // Use a direct prompt approach with the standard endpoint
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

    console.log('Using model:', model);
    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: 1024
      }
    });
    
    console.log('Calling Gemini API for formatting...');
    const result = await geminiModel.generateContent(prompt);
    console.log('Gemini API response received');
    
    const response = result.response;
    const text = response.text();
    
    console.log('Formatting complete, returning JSON response');
    res.json({ text });
  } catch (error) {
    console.error('Error in format-lyrics endpoint:', error);
    handleError(res, error, 'Failed to format lyrics');
  }
});

// New endpoint for generating chord progressions
app.post('/api/gemini/generate-chords', async (req, res) => {
  try {
    const { 
      lyrics, 
      genre = 'country',
      key = '',
      model = 'gemini-1.5-pro'
    } = req.body;
    
    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    const prompt = `
I need chord progressions for the following song lyrics:
"""
${lyrics}
"""

Genre: ${genre}
${key ? `Musical key: ${key}` : 'Choose an appropriate key for the song'}

Please provide chord progressions that would fit well with these lyrics. Format your response as follows:
1. First, suggest the best musical key for the song if not specified
2. Then add chord suggestions for each section (verse, chorus, bridge)
3. Write the chord progressions above the corresponding lyrics lines
4. Use standard chord notation (e.g., G, Am7, F, C/E)
5. Keep the original song structure intact

Focus on creating musical chord progressions that match the emotional tone and flow of the lyrics.
`;

    const geminiModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024
      }
    });
    
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    handleError(res, error, 'Failed to generate chord progressions');
  }
});

// Imagen API endpoints

// Main image generation endpoint
app.post('/api/imagen/generate', async (req, res) => {
  try {
    const { 
      prompt, 
      aspectRatio = '1:1',
      numberOfImages = 1,
      safetyFilterLevel = 'block_most',
      personGeneration = 'allow_adult'
    } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating image with prompt:', prompt.substring(0, 100) + '...');

    // Use the correct format for Imagen 3.0 :predict endpoint
    // Based on successful testing: instances array with prompt only
    const requestBody = {
      instances: [
        {
          prompt: prompt
        }
      ]
      // Note: parameters like numberOfImages, aspectRatio may not be supported
      // in this endpoint format. Keep the request simple for now.
    };

    console.log('Making request to Imagen 3.0 API...');
    const response = await fetch(IMAGEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error response:', errorText);
      const errorMessage = `Imagen API error: ${response.status} ${response.statusText}`;
      
      // Try to parse error details if possible
      let errorDetails = errorText;
      try {
        const errorData = JSON.parse(errorText);
        errorDetails = errorData.error?.message || errorData.message || errorText;
      } catch (e) {
        // Keep original error text if parsing fails
      }
      
      return handleError(res, new Error(errorDetails), errorMessage, response.status);
    }

    const data = await response.json();
    console.log('Imagen API response received successfully');
    console.log('Response structure:', Object.keys(data));
    
    // Log detailed response structure for debugging
    if (data.predictions) {
      console.log('Found predictions array with length:', data.predictions.length);
      if (data.predictions.length > 0) {
        console.log('First prediction structure:', Object.keys(data.predictions[0]));
      }
    } else {
      console.log('No predictions array found. Available keys:', Object.keys(data));
    }
    
    // Handle Imagen 3.0 :predict response format
    // The response should have a 'predictions' array
    if (data.predictions && data.predictions.length > 0) {
      console.log(`Found ${data.predictions.length} prediction(s) in response`);
      
      // Convert the generated images to base64 data URLs  
      const images = data.predictions.map((prediction, index) => {
        try {
          // Based on testing, the prediction structure may vary
          // Try to find the image bytes in different possible locations
          let imageBytes = null;
          
          // Check various possible structures for image data
          if (prediction.imageBytes) {
            // Direct imageBytes property
            imageBytes = prediction.imageBytes;
          } else if (prediction.generatedImage && prediction.generatedImage.imageBytes) {
            // Nested in generatedImage object
            imageBytes = prediction.generatedImage.imageBytes;
          } else if (prediction.image && prediction.image.imageBytes) {
            // Nested in image object
            imageBytes = prediction.image.imageBytes;
          } else if (prediction.bytesBase64Encoded) {
            // Alternative property name
            imageBytes = prediction.bytesBase64Encoded;
          } else if (prediction.base64) {
            // Another possible property name
            imageBytes = prediction.base64;
          }
          
          if (imageBytes) {
            // Ensure proper base64 data URL format
            const imageData = imageBytes.startsWith('data:') 
              ? imageBytes 
              : `data:image/png;base64,${imageBytes}`;
            console.log(`Successfully processed prediction ${index + 1}`);
            return imageData;
          } else {
            console.warn(`Prediction ${index + 1} structure:`, Object.keys(prediction));
            console.warn(`Prediction ${index + 1} content sample:`, JSON.stringify(prediction, null, 2).substring(0, 500) + '...');
            return null;
          }
        } catch (err) {
          console.error(`Error processing prediction ${index + 1}:`, err);
          return null;
        }
      }).filter(Boolean);

      if (images.length > 0) {
        console.log(`Successfully generated ${images.length} image(s)`);
        res.json({ 
          images: images,
          count: images.length,
          prompt: prompt,
          success: true
        });
      } else {
        console.log('Predictions found but no images could be extracted');
        console.log('Full predictions sample:', JSON.stringify(data.predictions, null, 2).substring(0, 1000) + '...');
        throw new Error('Generated images could not be processed - check response structure');
      }
    } else {
      console.error('No predictions found in response:', data);
      console.error('Response structure:', Object.keys(data));
      console.error('Full response sample:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      throw new Error('No predictions returned from Imagen API - check request format');
    }
  } catch (error) {
    console.error('Error calling Imagen API:', error);
    
    let errorMessage = 'Failed to generate image';
    let statusCode = 500;
    
    // Better error classification
    if (error.message && error.message.includes('400')) {
      errorMessage = 'Invalid request parameters. Check your prompt and settings.';
      statusCode = 400;
    } else if (error.message && error.message.includes('401')) {
      errorMessage = 'Authentication failed. Please check your API key.';
      statusCode = 401;
    } else if (error.message && error.message.includes('403')) {
      errorMessage = 'Access denied. Please check your API key permissions.';
      statusCode = 403;
    } else if (error.message && error.message.includes('429')) {
      errorMessage = 'Rate limit or quota exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message && error.message.includes('404')) {
      errorMessage = 'Imagen service not found. The API endpoint may have changed.';
      statusCode = 404;
    }
    
    handleError(res, error, errorMessage, statusCode);
  }
});

// Health check endpoint for Imagen service
app.get('/api/imagen/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'imagen-api',
    version: '3.0',
    model: 'imagen-3.0-generate-002',
    endpoint: ':predict',
    requestFormat: 'instances array',
    responseFormat: 'predictions array',
    timestamp: new Date().toISOString(),
    apiUrl: IMAGEN_API_URL.split('?')[0] // Don't expose the API key
  });
});

// Image generation endpoint specifically for songs
app.post('/api/imagen/generate-song-image', async (req, res) => {
  try {
    const { 
      songTitle, 
      lyrics, 
      genre,
      style = 'modern artistic',
      colours = 'evocative and mood-matching',
      additionalDetails = '',
      aspectRatio = '1:1'
    } = req.body;
    
    if (!songTitle) {
      return res.status(400).json({ error: 'Song title is required' });
    }

    // Create a comprehensive prompt for song image generation
    let prompt = `Create an artistic image for a ${genre || 'contemporary'} song titled "${songTitle}".`;
    
    if (lyrics) {
      // Extract themes from lyrics (simple keyword analysis)
      const lyricsLower = lyrics.toLowerCase();
      const themes = [];
      
      if (lyricsLower.includes('love') || lyricsLower.includes('heart')) themes.push('love');
      if (lyricsLower.includes('nature') || lyricsLower.includes('sky') || lyricsLower.includes('ocean')) themes.push('nature');
      if (lyricsLower.includes('city') || lyricsLower.includes('street') || lyricsLower.includes('lights')) themes.push('urban');
      if (lyricsLower.includes('night') || lyricsLower.includes('dark') || lyricsLower.includes('moon')) themes.push('nighttime');
      if (lyricsLower.includes('sun') || lyricsLower.includes('day') || lyricsLower.includes('bright')) themes.push('daylight');
      if (lyricsLower.includes('rain') || lyricsLower.includes('storm') || lyricsLower.includes('weather')) themes.push('weather');
      
      if (themes.length > 0) {
        prompt += ` The song's themes include: ${themes.join(', ')}.`;
      }
    }
    
    prompt += ` Art style: ${style}. Colour palette: ${colours}.`;
    
    if (additionalDetails) {
      prompt += ` Additional details: ${additionalDetails}.`;
    }
    
    prompt += ` The image should be high quality, visually striking, and suitable for an album cover or song artwork. Avoid any text or typography in the image.`;

    console.log('Generated song image prompt:', prompt);

    // Forward to the main generation endpoint
    const generationResponse = await fetch(`http://localhost:${PORT}/api/imagen/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        aspectRatio: aspectRatio,
        numberOfImages: 1
      })
    });

    const generationData = await generationResponse.json();
    
    if (generationResponse.ok) {
      res.json(generationData);
    } else {
      throw new Error(generationData.error || 'Image generation failed');
    }
  } catch (error) {
    console.error('Error generating song image:', error);
    res.status(500).json({ 
      error: 'Failed to generate song image',
      details: error.message
    });
  }
});

// Image generation endpoint specifically for albums
app.post('/api/imagen/generate-album-image', async (req, res) => {
  try {
    const { 
      albumTitle, 
      trackList = [],
      genre,
      style = 'sophisticated artistic',
      colours = 'unified and striking',
      additionalDetails = '',
      aspectRatio = '1:1'
    } = req.body;
    
    if (!albumTitle) {
      return res.status(400).json({ error: 'Album title is required' });
    }

    // Create a comprehensive prompt for album cover generation
    let prompt = `Create an artistic album cover for "${albumTitle}", a ${genre || 'contemporary'} album.`;
    
    if (trackList.length > 0) {
      const trackTitles = trackList.slice(0, 5).map(track => track.title || track).join(', ');
      prompt += ` The album includes tracks like: ${trackTitles}.`;
    }
    
    prompt += ` The image should be a cohesive album cover that represents the overall theme of the collection.`;
    prompt += ` Art style: ${style}. Colour palette: ${colours}.`;
    
    if (additionalDetails) {
      prompt += ` Additional details: ${additionalDetails}.`;
    }
    
    prompt += ` The image should be high quality, suitable for both digital and physical album covers. Avoid any text or typography in the image.`;

    console.log('Generated album image prompt:', prompt);

    // Forward to the main generation endpoint
    const generationResponse = await fetch(`http://localhost:${PORT}/api/imagen/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        aspectRatio: aspectRatio,
        numberOfImages: 3 // Generate 3 options for albums
      })
    });

    const generationData = await generationResponse.json();
    
    if (generationResponse.ok) {
      res.json(generationData);
    } else {
      throw new Error(generationData.error || 'Album image generation failed');
    }
  } catch (error) {
    console.error('Error generating album image:', error);
    res.status(500).json({ 
      error: 'Failed to generate album image',
      details: error.message
    });
  }
});

// Test endpoint to verify Imagen integration
app.post('/api/imagen/test', async (req, res) => {
  try {
    const testPrompt = 'A beautiful sunset over mountains, artistic style, warm colours';
    
    const response = await fetch(`http://localhost:${PORT}/api/imagen/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: testPrompt,
        numberOfImages: 1
      })
    });

    const data = await response.json();
    
    res.json({
      success: response.ok,
      message: response.ok ? 'Imagen API is working correctly!' : 'Imagen API test failed',
      data: data
    });
  } catch (error) {
    console.error('Error testing Imagen API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Imagen API',
      error: error.message
    });
  }
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Imagen API integration ready at /api/imagen/*`);
});
