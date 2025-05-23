import React, { useState } from 'react';
import { useTheme, getThemeClasses } from '../contexts/ThemeContext';
import { generateSlug } from '../utils/helpers';
import * as geminiService from '../services/GeminiService';

export default function SongCreator({ onSongCreated, onClose }) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1); // 1: Method selection, 2: Manual input, 3: AI generation
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');
  const [soundsLike, setSoundsLike] = useState('');
  
  // For AI generation
  const [genre, setGenre] = useState('');
  const [songTheme, setSongTheme] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  
  // Helper function to add detail to additional instructions
  const addDetailToInstructions = (detail, prefix = 'Include reference to') => {
    const newInstruction = `${prefix} ${detail}`;
    if (additionalInstructions.length > 0) {
      setAdditionalInstructions(`${additionalInstructions}, ${newInstruction.toLowerCase()}`);
    } else {
      setAdditionalInstructions(newInstruction);
    }
  };

  // Handle method selection
  const selectMethod = (method) => {
    if (method === 'manual') {
      setStep(2);
    } else if (method === 'ai') {
      setStep(3);
    }
  };

  // Handle manual song creation
  const createManualSong = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    try {
      const slug = generateSlug(title);
      console.log('Generated slug:', slug);
      
      // Create the new song
      const newSong = {
        title,
        slug,
        lyrics,
        notes,
        soundsLike,
        image: null, // No image initially
        audio: null, // No audio initially
      };
      
      // Save the song
      localStorage.setItem(`lyrics-${slug}`, lyrics || '');
      localStorage.setItem(`notes-${slug}`, notes || '');
      localStorage.setItem(`title-${slug}`, title);
      localStorage.setItem(`soundsLike-${slug}`, soundsLike || '');
      
      console.log('Song created successfully:', newSong);
      
      // Notify parent component
      onSongCreated(newSong);
    } catch (error) {
      console.error('Error creating song:', error);
      alert('Unable to create song: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle AI song generation
  const generateSong = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAiResult('');
    
    try {
      if (!songTheme) {
        throw new Error('Theme is required for song generation');
      }
      
      const response = await geminiService.generateSong({
        title: title || undefined,
        genre,
        theme: songTheme,
        additionalInstructions
      });
      
      setAiResult(response.text);
      const generatedTitle = response.title || title || 'Untitled Song';
      setAiTitle(generatedTitle);
      
      if (!title) {
        setTitle(generatedTitle);
      }
    } catch (error) {
      setError(error.message || 'Failed to generate song');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate 'sounds like' description
  const generateSoundsLike = async () => {
    if (!lyrics.trim()) {
      alert('Please write some lyrics first');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `Describe what this song sounds like musically. Be direct and confident - no hedging words like "would be" or "possibly". Focus on:
      - Instrumentation (guitar, fiddle, drums, etc.)
      - Musical style and genre
      - Tempo and energy level
      - Atmosphere and mood
      - Production style
      
      Write as if you're hearing the song right now. Keep it concise (1-2 sentences) and evocative. Here are the lyrics:
      
      ${lyrics}`;

      const response = await geminiService.sendPrompt(prompt);
      setSoundsLike(response.text);
    } catch (error) {
      console.error('Error generating sounds like description:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle applying the AI-generated song
  const applyAiSong = () => {
    if (!aiResult) {
      alert('No AI generated lyrics to save');
      return;
    }
    
    try {
      const finalTitle = aiTitle || title;
      if (!finalTitle) {
        alert('Song title is required');
        return;
      }
      
      const slug = generateSlug(finalTitle);
      console.log('Generated slug for AI song:', slug);
      
      // Create the new song
      const newSong = {
        title: finalTitle,
        slug,
        lyrics: aiResult,
        notes: '',
        soundsLike: '',
        image: null, // No image initially
        audio: null, // No audio initially
      };
      
      // Save the song
      localStorage.setItem(`lyrics-${slug}`, aiResult);
      localStorage.setItem(`notes-${slug}`, '');
      localStorage.setItem(`title-${slug}`, finalTitle);
      localStorage.setItem(`soundsLike-${slug}`, '');
      
      console.log('AI Song created successfully:', newSong);
      
      // Notify parent component
      onSongCreated(newSong);
    } catch (error) {
      console.error('Error creating AI song:', error);
      alert('Unable to create song: ' + (error.message || 'Unknown error'));
    }
  };

  // Render method selection screen
  const renderMethodSelection = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a New Song</h2>
      <p className="text-gray-600 mb-6">Choose how you'd like to create your song:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => selectMethod('manual')}
          className={`p-6 ${getThemeClasses(theme, 'song-card')} hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center text-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="font-medium text-lg mb-2">Manual Creation</h3>
          <p className="text-gray-600 text-sm">Create your song lyrics from scratch</p>
        </button>
        
        <button
          onClick={() => selectMethod('ai')}
          className={`p-6 ${getThemeClasses(theme, 'song-card')} hover:shadow-md hover:border-purple-300 transition-all flex flex-col items-center justify-center text-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="font-medium text-lg mb-2">AI Generation</h3>
          <p className="text-gray-600 text-sm">Let AI help you create song lyrics</p>
        </button>
      </div>
    </div>
  );

  // Render manual song creation form
  const renderManualForm = () => (
    <form onSubmit={createManualSong} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a New Song</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Song Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-2 border border-gray-300 ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Enter song title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lyrics
        </label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          className={`w-full p-2 border border-gray-300 ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]`}
          placeholder="Enter song lyrics here..."
        />
        <p className="mt-1 text-xs text-gray-500">Markdown formatting is supported</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`w-full p-2 border border-gray-300 ${theme.layout.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]`}
          placeholder="Enter any notes about the song (optional)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What it sounds like
        </label>
        <div className="flex gap-2">
          <textarea
            value={soundsLike}
            onChange={(e) => setSoundsLike(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            placeholder="Describe the musical style, instrumentation, and atmosphere..."
          />
          <button
            type="button"
            onClick={() => generateSoundsLike()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
            disabled={!lyrics.trim()}
          >
            Generate with AI
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`px-4 py-2 ${getThemeClasses(theme, 'button', 'secondary')} ${theme.layout.borderRadius}`}
        >
          Back
        </button>
        <button
          type="submit"
          className={`px-4 py-2 ${getThemeClasses(theme, 'button', 'primary')} ${theme.layout.borderRadius}`}
        >
          Create Song
        </button>
      </div>
    </form>
  );

  // Render AI song generation form
  const renderAiForm = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a Song with AI</h2>
      
      {!aiResult ? (
        <form onSubmit={generateSong} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Alex Wilson's Voice:</span> The AI will generate lyrics that match Alex's authentic style, drawing from his Kentucky roots, life experiences, and musical influences like Johnny Cash and Chris Stapleton.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Title (optional)
            </label>
            <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a unique title or leave blank for AI to generate"
            />
              <p className="mt-1 text-xs text-gray-500">
                Providing your own title ensures uniqueness and helps guide the song's direction
              </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre (optional)
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default (Country/Folk with Appalachian influence)</option>
              <option value="Country">Country</option>
              <option value="Folk">Folk</option>
              <option value="Country Rock">Country Rock</option>
              <option value="Appalachian Folk">Appalachian Folk</option>
              <option value="Southern Gospel">Southern Gospel</option>
              <option value="Americana">Americana</option>
              <option value="Bluegrass">Bluegrass</option>
              <option value="Southern Blues">Southern Blues</option>
              <option value="Mountain Music">Mountain Music</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Alex typically performs Country, Folk, and Appalachian-influenced music
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme/Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={songTheme}
              onChange={(e) => setSongTheme(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., lost love, redemption, rural life, overcoming hardship"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Instructions (optional)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="E.g., mention the coal mines, include river imagery, make it melancholic, reference relationship with father"
            />
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-green-800">Suggested Details to Include:</h3>
              {additionalInstructions.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setAdditionalInstructions('')}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                'His rusted guitar', 'Coal-stained hands', 'Mountain pines', 'Kentucky hollers', 
                'Trailer home', 'Father\'s shadow', 'Broken arm', 'Mine entrance', 'Creek waters',
                'Campfire light', 'Moonshine jar', 'Wrangler jeans', 'Calloused fingers', 'Railroad tracks'
              ].map((detail, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addDetailToInstructions(detail)}
                  className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200"
                >
                  {detail}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Melancholic tone', 'Hopeful ending', 'References to faith', 'Local landmarks', 
                'Working class pride', 'Sunrise imagery', 'Weather metaphors', 'Family legacy', 
                'Personal struggle', 'Mining references', 'Faded photographs', 'Sunday mornings',
                'Appalachian dialect', 'AABB rhyme scheme'
              ].map((style, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addDetailToInstructions(style, 'Use')}
                  className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h3 className="text-sm font-medium text-purple-800 mb-2">Suggested Themes for Alex's Style:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Mountain life', 'Coal mining struggles', 'Family legacy', 'Broken dreams', 
                'Rural poverty', 'Redemption', 'First love', 'Lost innocence', 'Working hands', 
                'Kentucky hollers', 'Father wounds', 'Mountain wisdom', 'Resilience'
              ].map((suggTheme, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSongTheme(suggTheme)}
                  className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200"
                >
                  {suggTheme}
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || !songTheme}
              className={`px-4 py-2 rounded-md ${
                isLoading || !songTheme
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate Song'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={aiTitle}
              onChange={(e) => setAiTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
              {aiResult}
            </pre>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setAiResult('');
                setError('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Generate Another
            </button>
            <button
              type="button"
              onClick={applyAiSong}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add to Songbook
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Main component render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === 1 ? 'Create New Song' : 
             step === 2 ? 'Manual Song Creation' : 
             'AI Song Generation'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {step === 1 && renderMethodSelection()}
          {step === 2 && renderManualForm()}
          {step === 3 && renderAiForm()}
        </div>
      </div>
    </div>
  );
}