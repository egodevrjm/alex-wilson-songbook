/**
 * Service for generating songs using various methods
 */

/**
 * Generate a song from a prompt
 * @param {string} prompt - The prompt to generate a song from
 * @returns {Promise<Object>} - The generated song object
 */
export async function generateSongFromPrompt(prompt) {
  try {
    console.log('Generating song from prompt:', prompt);
    
    // First, try to use the Gemini API through our backend
    try {
      const response = await fetch('/api/gemini/generate-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: prompt,
          additionalInstructions: 'Make it authentic country style'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully generated song using API:', data);
        return {
          title: data.title || 'Untitled Song',
          lyrics: data.text || '',
          notes: `Generated from prompt: "${prompt}"`
        };
      } else {
        console.warn('API request failed, falling back to local generation:', await response.text());
        // Fall back to local generation if the API fails
      }
    } catch (apiError) {
      console.warn('Error calling API, falling back to local generation:', apiError);
      // Fall back to local generation if there's an API error
    }
    
    // Fallback: generate locally
    console.log('Using fallback local generation');
    const title = generateTitleFromPrompt(prompt);
    const lyrics = generateLyricsFromPrompt(prompt);
    const notes = generateNotesFromPrompt(prompt);
    
    return {
      title,
      lyrics,
      notes
    };
  } catch (error) {
    console.error('Error generating song:', error);
    throw new Error(`Failed to generate song: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate a title from a prompt
 * @param {string} prompt - The prompt to generate a title from
 * @returns {string} - The generated title
 */
function generateTitleFromPrompt(prompt) {
  // Extract key words from the prompt
  const words = prompt.split(/\s+/);
  const keyWords = words.filter(word => 
    word.length > 3 && 
    !['from', 'with', 'that', 'this', 'these', 'those', 'about', 'would', 'could', 'should'].includes(word.toLowerCase())
  );
  
  // If we have at least 2 key words, use them to generate a title
  if (keyWords.length >= 2) {
    // Pick 2-3 random key words
    const selectedWords = [];
    const numWords = Math.min(keyWords.length, Math.floor(Math.random() * 2) + 2);
    
    for (let i = 0; i < numWords; i++) {
      const randomIndex = Math.floor(Math.random() * keyWords.length);
      selectedWords.push(keyWords[randomIndex]);
      keyWords.splice(randomIndex, 1); // Remove the selected word
    }
    
    // Generate a title based on the selected words
    return selectedWords.join(' ');
  }
  
  // If we don't have enough key words, use the prompt as the title
  return prompt;
}

/**
 * Generate lyrics from a prompt
 * @param {string} prompt - The prompt to generate lyrics from
 * @returns {string} - The generated lyrics
 */
function generateLyricsFromPrompt(prompt) {
  // Generate a simple structure for the lyrics
  const lyrics = `Verse 1
This song is inspired by: "${prompt}"
These words turned to music, flowing through my mind,
Stories and emotions, leaving tracks behind.

Pre-Chorus
Melodies and rhythms, dancing in the air,
Creating something special, something rare.

Chorus
From your words to this song, a journey unfolds,
A musical story waiting to be told.
Verses and choruses, bridging our souls,
This creation from your prompt now takes hold.

Verse 2
Inspiration strikes from the simplest phrase,
Guiding my fingers through melodic maze.
Your idea sparks fire in creative space,
Setting tempo and rhythm at perfect pace.

Pre-Chorus
Harmonies weaving, patterns emerge,
As words and music beautifully merge.

Chorus
From your words to this song, a journey unfolds,
A musical story waiting to be told.
Verses and choruses, bridging our souls,
This creation from your prompt now takes hold.

Bridge
Every prompt is a seed that can grow,
Into melodies and rhythms that flow.
From simple beginnings to something profound,
Your words have become this musical sound.

Chorus
From your words to this song, a journey unfolds,
A musical story waiting to be told.
Verses and choruses, bridging our souls,
This creation from your prompt now takes hold.

Outro
Thank you for the spark that lit this flame,
A song from your words, no two quite the same.`;

  return lyrics;
}

/**
 * Generate notes from a prompt
 * @param {string} prompt - The prompt to generate notes from
 * @returns {string} - The generated notes
 */
function generateNotesFromPrompt(prompt) {
  const notes = `This song was created from the prompt: "${prompt}"

It features a classic country structure with verses, pre-choruses, choruses, a bridge, and an outro. The melody follows a traditional pattern that would work well with acoustic guitar and perhaps a touch of fiddle.

Performance notes:
- Tempo: Medium, approximately 85-90 BPM
- Key suggestion: G major
- Style: Acoustic country with folk influences`;

  return notes;
}
