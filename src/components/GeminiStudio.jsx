import React, { useState, useEffect, useRef } from 'react';
import GeminiConfig from './GeminiConfig';
import { generateContent, generateSongLyrics, enhanceLyrics, generateSongNotes } from '../services/GeminiService';

export default function GeminiStudio({ song, onSaveContent, onClose }) {
  const [mode, setMode] = useState('new-song'); // 'new-song', 'enhance-lyrics', 'generate-notes'
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Form inputs for new song generation
  const [songParams, setSongParams] = useState({
    title: '',
    genre: 'country',
    theme: '',
    mood: 'reflective',
    styleLike: ''
  });
  
  // For enhancing lyrics
  const [enhanceInstructions, setEnhanceInstructions] = useState('');
  
  // For generating notes
  const [notesType, setNotesType] = useState('general');
  
  const textareaRef = useRef(null);
  
  useEffect(() => {
    // Check if API key exists
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      setApiKeyMissing(true);
      setShowConfig(true);
    }
    
    // Initialize form with song data if editing
    if (song) {
      setSongParams(prev => ({
        ...prev,
        title: song.title || ''
      }));
      
      if (song.lyrics) {
        setMode('enhance-lyrics');
      }
    }
  }, [song]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [generatedContent]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSongParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      setApiKeyMissing(true);
      setShowConfig(true);
      return;
    }
    
    setIsGenerating(true);
    setNotification({ show: true, message: 'Generating content...', type: 'info' });
    
    try {
      // Override fetch to use the stored API key
      const originalFetch = window.fetch;
      window.fetch = (url, options) => {
        if (url.includes('generativelanguage.googleapis.com')) {
          url = url.replace(/key=([^&]+)/, `key=${apiKey}`);
        }
        return originalFetch(url, options);
      };
      
      let result = '';
      
      switch (mode) {
        case 'new-song':
          result = await generateSongLyrics(songParams);
          break;
        case 'enhance-lyrics':
          result = await enhanceLyrics(song.lyrics, enhanceInstructions);
          break;
        case 'generate-notes':
          result = await generateSongNotes(song.lyrics, notesType);
          break;
        default:
          throw new Error('Invalid mode');
      }
      
      // Restore original fetch
      window.fetch = originalFetch;
      
      setGeneratedContent(result);
      setNotification({ show: true, message: 'Content generated successfully', type: 'success' });
      
    } catch (error) {
      console.error('Generation error:', error);
      setNotification({ 
        show: true, 
        message: `Error generating content: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsGenerating(false);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({
          ...prev,
          show: false
        }));
      }, 3000);
    }
  };
  
  const handleSave = () => {
    if (!generatedContent) return;
    
    if (mode === 'new-song') {
      // Create a new song with extracted title if possible
      let title = songParams.title;
      
      // Try to extract title from generated content if not provided
      if (!title) {
        const titleMatch = generatedContent.match(/Title:\s*([^\n]+)/i) || 
                          generatedContent.match(/^#\s*([^\n]+)/im);
        if (titleMatch) {
          title = titleMatch[1].trim();
        } else {
          title = "New Generated Song";
        }
      }
      
      onSaveContent({
        type: 'new-song',
        content: generatedContent,
        title: title
      });
    } else if (mode === 'enhance-lyrics') {
      onSaveContent({
        type: 'lyrics',
        content: generatedContent
      });
    } else if (mode === 'generate-notes') {
      onSaveContent({
        type: 'notes',
        content: generatedContent
      });
    }
    
    setNotification({ show: true, message: 'Content saved', type: 'success' });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
      if (onClose) onClose();
    }, 1500);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto p-6 max-h-[90vh] overflow-y-auto">
      {showConfig ? (
        <GeminiConfig onClose={() => {
          setShowConfig(false);
          setApiKeyMissing(false);
        }} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gemini AI Studio</h2>
            <div className="flex space-x-3">
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                onClick={() => setShowConfig(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                API Settings
              </button>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={onClose}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {notification.show && (
            <div className={`p-3 mb-4 rounded ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' : 
              notification.type === 'error' ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {notification.message}
            </div>
          )}
          
          {/* Mode selection tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-1">
              <button
                className={`px-4 py-2 font-medium rounded-t-lg ${
                  mode === 'new-song' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setMode('new-song')}
              >
                Create New Song
              </button>
              {song && song.lyrics && (
                <button
                  className={`px-4 py-2 font-medium rounded-t-lg ${
                    mode === 'enhance-lyrics' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMode('enhance-lyrics')}
                >
                  Enhance Lyrics
                </button>
              )}
              {song && song.lyrics && (
                <button
                  className={`px-4 py-2 font-medium rounded-t-lg ${
                    mode === 'generate-notes' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMode('generate-notes')}
                >
                  Generate Notes
                </button>
              )}
            </div>
          </div>
          
          {/* Form for current mode */}
          <div className="mb-6">
            {mode === 'new-song' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={songParams.title}
                    onChange={handleInputChange}
                    placeholder="Leave blank for AI to create a title"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Genre
                  </label>
                  <select
                    name="genre"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={songParams.genre}
                    onChange={handleInputChange}
                  >
                    <option value="country">Country</option>
                    <option value="folk">Folk</option>
                    <option value="country-rock">Country Rock</option>
                    <option value="americana">Americana</option>
                    <option value="bluegrass">Bluegrass</option>
                    <option value="southern-rock">Southern Rock</option>
                    <option value="country-pop">Country Pop</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Theme/Topic
                  </label>
                  <input
                    type="text"
                    name="theme"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={songParams.theme}
                    onChange={handleInputChange}
                    placeholder="e.g., heartbreak, small town life, resilience"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Mood
                  </label>
                  <select
                    name="mood"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={songParams.mood}
                    onChange={handleInputChange}
                  >
                    <option value="reflective">Reflective</option>
                    <option value="upbeat">Upbeat</option>
                    <option value="melancholic">Melancholic</option>
                    <option value="defiant">Defiant</option>
                    <option value="nostalgic">Nostalgic</option>
                    <option value="hopeful">Hopeful</option>
                    <option value="angry">Angry</option>
                    <option value="celebratory">Celebratory</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Style Inspiration (optional)
                  </label>
                  <input
                    type="text"
                    name="styleLike"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={songParams.styleLike}
                    onChange={handleInputChange}
                    placeholder="e.g., Johnny Cash, Chris Stapleton, Dolly Parton"
                  />
                </div>
              </div>
            )}
            
            {mode === 'enhance-lyrics' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Enhancement Instructions
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  value={enhanceInstructions}
                  onChange={(e) => setEnhanceInstructions(e.target.value)}
                  placeholder="Describe how you'd like to improve the lyrics. e.g., make the imagery more vivid, fix awkward phrasing, make it more conversational, etc."
                ></textarea>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Current Lyrics</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-600">{song?.lyrics || 'No lyrics available'}</pre>
                </div>
              </div>
            )}
            
            {mode === 'generate-notes' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Note Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <button
                    className={`p-3 border rounded-lg ${notesType === 'general' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setNotesType('general')}
                  >
                    <div className="font-medium text-gray-800">General Analysis</div>
                    <div className="text-sm text-gray-500">Comprehensive notes about the song's meaning, structure, and impact</div>
                  </button>
                  
                  <button
                    className={`p-3 border rounded-lg ${notesType === 'meaning' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setNotesType('meaning')}
                  >
                    <div className="font-medium text-gray-800">Meaning & Themes</div>
                    <div className="text-sm text-gray-500">Interpretation of deeper meaning, symbolism, and emotional resonance</div>
                  </button>
                  
                  <button
                    className={`p-3 border rounded-lg ${notesType === 'structure' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setNotesType('structure')}
                  >
                    <div className="font-medium text-gray-800">Structure & Technique</div>
                    <div className="text-sm text-gray-500">Analysis of verse patterns, rhyme schemes, and composition techniques</div>
                  </button>
                  
                  <button
                    className={`p-3 border rounded-lg ${notesType === 'background' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setNotesType('background')}
                  >
                    <div className="font-medium text-gray-800">Fictional Backstory</div>
                    <div className="text-sm text-gray-500">Creative backstory about the song's inspiration and context</div>
                  </button>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Source Lyrics</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 max-h-[200px] overflow-y-auto">{song?.lyrics || 'No lyrics available'}</pre>
                </div>
              </div>
            )}
          </div>
          
          {/* Generate button */}
          <div className="mb-6">
            <button
              className={`w-full py-3 rounded-lg flex justify-center items-center font-medium ${
                isGenerating 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {mode === 'new-song' ? 'Generate Song' : 
                   mode === 'enhance-lyrics' ? 'Enhance Lyrics' : 
                   'Generate Notes'}
                </>
              )}
            </button>
          </div>
          
          {/* Generated content */}
          {generatedContent && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Generated Content</h3>
                <button
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    setNotification({ 
                      show: true, 
                      message: 'Content copied to clipboard', 
                      type: 'success' 
                    });
                    setTimeout(() => {
                      setNotification({ show: false, message: '', type: '' });
                    }, 2000);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm min-h-[300px]"
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
              ></textarea>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-4">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            
            <button
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                !generatedContent ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleSave}
              disabled={!generatedContent}
            >
              {mode === 'new-song' ? 'Save as New Song' : 
               mode === 'enhance-lyrics' ? 'Update Lyrics' : 
               'Save to Notes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
