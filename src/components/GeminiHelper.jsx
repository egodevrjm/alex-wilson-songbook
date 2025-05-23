import React, { useState } from 'react';
import * as geminiService from '../services/GeminiService';

export default function GeminiHelper({ 
  isOpen,
  onClose,
  onApplyContent,
  songTitle = '',
  currentLyrics = '',
  currentNotes = '',
  currentContentType = 'lyrics',
  mode = 'create' // 'create', 'clean', 'generate', 'chord', 'full', 'format'
}) {
  // For song creation
  const [title, setTitle] = useState(songTitle || '');
  const [genre, setGenre] = useState('');
  const [theme, setTheme] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // For lyrics enhancement
  const [enhancementInstructions, setEnhancementInstructions] = useState(
    'Improve these lyrics while maintaining the original meaning and emotional impact.'
  );
  
  // For notes generation
  const [noteType, setNoteType] = useState('analysis');
  
  // For chord generation
  const [musicalKey, setMusicalKey] = useState('');
  
  // For full song package
  const [fullSongOptions, setFullSongOptions] = useState({
    includeChords: true,
    includeNotes: true,
    includePerformance: false
  });
  
  // Common states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [resultTitle, setResultTitle] = useState('');
  const [resultChords, setResultChords] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [resultPerformance, setResultPerformance] = useState('');
  const [activeTab, setActiveTab] = useState('lyrics');

  // Handle generating a new song
  const handleGenerateSong = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');
    
    try {
      if (!theme) {
        throw new Error('Theme is required for song generation');
      }
      
      const response = await geminiService.generateSong({
        title,
        genre,
        theme,
        additionalInstructions
      });
      
      setResult(response.text);
      setResultTitle(response.title || title || 'Untitled Song');
    } catch (error) {
      setError(error.message || 'Failed to generate song');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enhancing existing lyrics
  const handleEnhanceLyrics = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');
    
    try {
      if (!currentLyrics) {
        throw new Error('No lyrics found to enhance');
      }
      
      const response = await geminiService.enhanceLyrics(
        currentLyrics,
        enhancementInstructions
      );
      
      setResult(response.text);
    } catch (error) {
      setError(error.message || 'Failed to enhance lyrics');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle formatting existing lyrics without changing content
  const handleFormatLyrics = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');
    
    try {
      if (!currentLyrics) {
        throw new Error('No lyrics found to format');
      }
      
      console.log('Sending lyrics for formatting, length:', currentLyrics.length);
      const response = await geminiService.formatLyrics(currentLyrics);
      console.log('Format response received:', response);
      
      if (!response || !response.text) {
        throw new Error('Invalid response from formatting service');
      }
      
      setResult(response.text);
    } catch (error) {
      console.error('Format lyrics error:', error);
      setError(error.message || 'Failed to format lyrics');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle generating notes for a song
  const handleGenerateNotes = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');
    
    try {
      if (!currentLyrics) {
        throw new Error('No lyrics found to analyze');
      }
      
      const response = await geminiService.generateNotes(
        songTitle,
        currentLyrics,
        noteType
      );
      
      setResult(response.text);
    } catch (error) {
      setError(error.message || 'Failed to generate notes');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving the result
  // Handle generating chord progressions
  const handleGenerateChords = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResultChords('');
    
    try {
      if (!currentLyrics) {
        throw new Error('No lyrics found to add chords');
      }
      
      const response = await geminiService.generateChords(
        currentLyrics,
        genre,
        musicalKey
      );
      
      setResultChords(response.text);
    } catch (error) {
      setError(error.message || 'Failed to generate chord progressions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle generating a full song package
  const handleGenerateFullSong = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');
    setResultTitle('');
    setResultChords('');
    setResultNotes('');
    setResultPerformance('');
    
    try {
      if (!theme) {
        throw new Error('Theme is required for song generation');
      }
      
      // Generate lyrics first
      const songResponse = await geminiService.generateSong({
        title,
        genre,
        theme,
        additionalInstructions
      });
      
      const lyrics = songResponse.text;
      const finalTitle = songResponse.title || title || 'Untitled Song';
      
      setResult(lyrics);
      setResultTitle(finalTitle);
      
      // Generate the other elements in parallel if requested
      const promises = [];
      
      if (fullSongOptions.includeChords) {
        promises.push(
          geminiService.generateChords(lyrics, genre, musicalKey)
            .then(response => setResultChords(response.text))
        );
      }
      
      if (fullSongOptions.includeNotes) {
        promises.push(
          geminiService.generateNotes(finalTitle, lyrics, 'analysis')
            .then(response => setResultNotes(response.text))
        );
      }
      
      if (fullSongOptions.includePerformance) {
        promises.push(
          geminiService.generateNotes(finalTitle, lyrics, 'performance')
            .then(response => setResultPerformance(response.text))
        );
      }
      
      // Wait for all parallel requests to complete
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      // Set the active tab to lyrics by default
      setActiveTab('lyrics');
      
    } catch (error) {
      setError(error.message || 'Failed to generate full song package');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving the result
  const handleApply = () => {
    // Process the content based on the mode and what's being applied
    let content = '';
    
    if (mode === 'create' || mode === 'clean' || mode === 'format') {
      content = result;
    } else if (mode === 'generate') {
      content = result;
    } else if (mode === 'chord') {
      content = resultChords;
    } else if (mode === 'full') {
      // For full mode, we're just passing the lyrics for now
      // The other content (chords, notes) would be handled separately
      content = result;
    }
    
    onApplyContent(content);
    onClose();
  };

  // Determine which form to show
  const renderForm = () => {
    switch (mode) {
      case 'create':
        return renderSongCreationForm();
      case 'clean':
        return renderLyricsEnhancementForm();
      case 'generate':
        return renderNotesGenerationForm();
      case 'chord':
        return renderChordGenerationForm();
      case 'full':
        return renderFullSongForm();
      case 'format':
        return renderFormatLyricsForm();
      default:
        return renderSongCreationForm();
    }
  };
  
  // Render the song creation form
  const renderSongCreationForm = () => (
    <form onSubmit={handleGenerateSong} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Leave blank for AI to generate"
        />
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
          <option value="">Select a genre (optional)</option>
          <option value="Country">Country</option>
          <option value="Folk">Folk</option>
          <option value="Rock">Rock</option>
          <option value="Pop">Pop</option>
          <option value="R&B">R&B</option>
          <option value="Hip-Hop">Hip-Hop</option>
          <option value="Blues">Blues</option>
          <option value="Jazz">Jazz</option>
          <option value="Gospel">Gospel</option>
          <option value="Soul">Soul</option>
          <option value="Alternative">Alternative</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Theme/Topic (required)
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
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
          placeholder="E.g., include river imagery, make it melancholic, follow AABB rhyme scheme"
        />
      </div>
      
      <div className="!mt-6">
        <button
          type="submit"
          disabled={isLoading || !theme}
          className={`w-full py-2 rounded-md font-medium ${
            isLoading || !theme
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Song'}
        </button>
      </div>
    </form>
  );
  
  // Render the lyrics formatting form
  const renderFormatLyricsForm = () => (
    <form onSubmit={handleFormatLyrics} className="space-y-4">
      <div className="bg-gray-100 p-3 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Current Lyrics</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-600 max-h-[400px] overflow-y-auto">
          {currentLyrics || 'No lyrics available'}
        </pre>
      </div>
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          This will add proper markdown formatting to your lyrics without changing any of the words or meaning.
          It will format verses with line breaks, add blank lines between sections, and add bold headings for sections.
        </p>
      </div>
      
      <div className="!mt-6">
        <button
          type="submit"
          disabled={isLoading || !currentLyrics}
          className={`w-full py-2 rounded-md font-medium ${
            isLoading || !currentLyrics
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Formatting...' : 'Format Lyrics'}
        </button>
      </div>
    </form>
  );

  // Render the lyrics enhancement form
  const renderLyricsEnhancementForm = () => (
    <form onSubmit={handleEnhanceLyrics} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enhancement Instructions
        </label>
        <textarea
          value={enhancementInstructions}
          onChange={(e) => setEnhancementInstructions(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          placeholder="Instructions for how to enhance the lyrics"
          required
        />
      </div>
      
      <div className="bg-gray-100 p-3 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Current Lyrics</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-600 max-h-[200px] overflow-y-auto">
          {currentLyrics || 'No lyrics available'}
        </pre>
      </div>
      
      <div className="!mt-6">
        <button
          type="submit"
          disabled={isLoading || !currentLyrics}
          className={`w-full py-2 rounded-md font-medium ${
            isLoading || !currentLyrics
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Enhancing...' : 'Enhance Lyrics'}
        </button>
      </div>
    </form>
  );
  
  // Render the notes generation form
  const renderNotesGenerationForm = () => (
    <form onSubmit={handleGenerateNotes} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type of Notes
        </label>
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="analysis">Song Analysis</option>
          <option value="background">Fictional Background/Story</option>
          <option value="performance">Performance Notes</option>
        </select>
      </div>
      
      <div className="bg-gray-100 p-3 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Current Lyrics</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-600 max-h-[200px] overflow-y-auto">
          {currentLyrics || 'No lyrics available'}
        </pre>
      </div>
      
      <div className="!mt-6">
        <button
          type="submit"
          disabled={isLoading || !currentLyrics}
          className={`w-full py-2 rounded-md font-medium ${
            isLoading || !currentLyrics
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Notes'}
        </button>
      </div>
    </form>
  );
  
  // Render the chord generation form
  const renderChordGenerationForm = () => (
    <form onSubmit={handleGenerateChords} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Genre (optional)
        </label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a genre (optional)</option>
          <option value="Country">Country</option>
          <option value="Folk">Folk</option>
          <option value="Rock">Rock</option>
          <option value="Pop">Pop</option>
          <option value="R&B">R&B</option>
          <option value="Blues">Blues</option>
          <option value="Jazz">Jazz</option>
          <option value="Gospel">Gospel</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Musical Key (optional)
        </label>
        <select
          value={musicalKey}
          onChange={(e) => setMusicalKey(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Auto-determine best key</option>
          <option value="C Major">C Major</option>
          <option value="G Major">G Major</option>
          <option value="D Major">D Major</option>
          <option value="A Major">A Major</option>
          <option value="E Major">E Major</option>
          <option value="F Major">F Major</option>
          <option value="Bb Major">Bb Major</option>
          <option value="A Minor">A Minor</option>
          <option value="E Minor">E Minor</option>
          <option value="D Minor">D Minor</option>
          <option value="G Minor">G Minor</option>
        </select>
      </div>
      
      <div className="bg-gray-100 p-3 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Current Lyrics</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-600 max-h-[200px] overflow-y-auto">
          {currentLyrics || 'No lyrics available'}
        </pre>
      </div>
      
      <div className="!mt-6">
        <button
          type="submit"
          disabled={isLoading || !currentLyrics}
          className={`w-full py-2 rounded-md font-medium ${
            isLoading || !currentLyrics
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Chord Progression'}
        </button>
      </div>
    </form>
  );
  
  // Render the full song creation form
  const renderFullSongForm = () => (
    <form onSubmit={handleGenerateFullSong} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Leave blank for AI to generate"
        />
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
          <option value="">Select a genre (optional)</option>
          <option value="Country">Country</option>
          <option value="Folk">Folk</option>
          <option value="Rock">Rock</option>
          <option value="Pop">Pop</option>
          <option value="R&B">R&B</option>
          <option value="Hip-Hop">Hip-Hop</option>
          <option value="Blues">Blues</option>
          <option value="Jazz">Jazz</option>
          <option value="Gospel">Gospel</option>
          <option value="Soul">Soul</option>
          <option value="Alternative">Alternative</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Theme/Topic (required)
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
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
          placeholder="E.g., include river imagery, make it melancholic, follow AABB rhyme scheme"
        />
      </div>
      
      <div className="bg-gray-100 p-3 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Include</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={fullSongOptions.includeChords}
              onChange={(e) => setFullSongOptions({
                ...fullSongOptions,
                includeChords: e.target.checked
              })}
              className="mr-2"
            />
            Chord Progressions
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={fullSongOptions.includeNotes}
              onChange={(e) => setFullSongOptions({
                ...fullSongOptions,
                includeNotes: e.target.checked
              })}
              className="mr-2"
            />
            Song Analysis Notes
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={fullSongOptions.includePerformance}
              onChange={(e) => setFullSongOptions({
                ...fullSongOptions,
                includePerformance: e.target.checked
              })}
              className="mr-2"
            />
            Performance Notes
          </label>
        </div>
      </div>
      
      <div className="!mt-6">
        <button
          type="submit"
          disabled={isLoading || !theme}
          className={`w-full py-2 rounded-md font-medium ${
            isLoading || !theme
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Full Song Package'}
        </button>
      </div>
    </form>
  );
  
  // Render result tabs for full song mode
  const renderResultTabs = () => {
    const tabs = [
      { id: 'lyrics', label: 'Lyrics', hasContent: !!result },
      { id: 'chords', label: 'Chords', hasContent: !!resultChords },
      { id: 'notes', label: 'Notes', hasContent: !!resultNotes },
      { id: 'performance', label: 'Performance', hasContent: !!resultPerformance }
    ].filter(tab => tab.hasContent);
    
    if (tabs.length <= 1) return null;
    
    return (
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-3 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  };
  
  // Render the active result content
  const renderActiveContent = () => {
    if (mode === 'full') {
      switch (activeTab) {
        case 'lyrics':
          return (
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
              {result}
            </pre>
          );
        case 'chords':
          return (
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
              {resultChords}
            </pre>
          );
        case 'notes':
          return (
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
              {resultNotes}
            </pre>
          );
        case 'performance':
          return (
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
              {resultPerformance}
            </pre>
          );
        default:
          return null;
      }
    } else {
      return (
        <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
          {mode === 'chord' ? resultChords : result}
        </pre>
      );
    }
  };

  // Main component rendering
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Create Song with Gemini AI' : 
             mode === 'clean' ? 'Enhance Lyrics with Gemini AI' : 
             mode === 'generate' ? 'Generate Notes with Gemini AI' :
             mode === 'chord' ? 'Generate Chord Progressions with Gemini AI' :
             mode === 'format' ? 'Format Lyrics with Gemini AI' :
             'Create Full Song Package with Gemini AI'}
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
        
        <div className="p-4 overflow-y-auto flex-grow">
          {/* AI Form */}
          {renderForm()}
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {/* Result Display */}
          {(result || resultChords || resultNotes || resultPerformance) && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  {mode === 'create' 
                    ? 'Generated Song' 
                    : mode === 'clean' 
                      ? 'Enhanced Lyrics' 
                      : mode === 'generate'
                        ? 'Generated Notes'
                        : mode === 'chord'
                          ? 'Chord Progression'
                          : mode === 'format'
                            ? 'Formatted Lyrics'
                            : 'Generated Song Package'}
                </h3>
                {(mode === 'create' || mode === 'full') && result && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Title:</span>
                    <input
                      type="text"
                      value={resultTitle}
                      onChange={(e) => setResultTitle(e.target.value)}
                      className="p-1 border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
              
              {/* Tabs for full song package */}
              {renderResultTabs()}
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-[300px] overflow-y-auto">
                {renderActiveContent()}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={handleApply}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {mode === 'create' 
                    ? 'Add to Songbook' 
                    : mode === 'clean' 
                      ? 'Update Lyrics' 
                      : mode === 'generate'
                        ? 'Save Notes'
                        : mode === 'chord'
                          ? 'Apply Chords'
                          : mode === 'format'
                            ? 'Apply Formatting'
                            : 'Apply Content'}
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
