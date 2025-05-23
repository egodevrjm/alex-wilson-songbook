/**
 * This script provides a function to create a new song from a prompt
 * Users can run this from the browser console
 */

/**
 * Create a new song based on a prompt
 * @param {string} prompt - The prompt for the song
 * @returns {Promise<Object>} - The created song
 * 
 * Example usage:
 * 1. Open the browser console (F12 or Cmd+Option+I on Mac)
 * 2. Run: createSongFromPrompt("A country song about a man finding his way home after being lost")
 */
async function createNewSong(prompt) {
  if (!prompt) {
    console.error('Error: Please provide a prompt for the song');
    return null;
  }
  
  // Check if the global function exists
  if (typeof window.createSongFromPrompt !== 'function') {
    console.error('Error: Song creation function not available. Make sure you\'re on the songbook page.');
    return null;
  }
  
  console.log(`Creating a new song based on prompt: "${prompt}"`);
  
  try {
    const song = await window.createSongFromPrompt(prompt);
    
    if (song) {
      console.log('Song created successfully!', song);
      return song;
    } else {
      console.error('Failed to create song');
      return null;
    }
  } catch (error) {
    console.error('Error creating song:', error);
    return null;
  }
}

// Make the function available globally
window.createNewSong = createNewSong;

// Log a helpful message to the console when this script is loaded
console.log(`
📝 Song Creation Tool Loaded 📝

To create a new song, run:
createNewSong("Your prompt here")

For example:
createNewSong("A country song about lost love and redemption")
`);

export default createNewSong;
