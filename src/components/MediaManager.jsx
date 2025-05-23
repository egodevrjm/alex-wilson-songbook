import React, { useState, useRef, useEffect } from 'react';
import { isAudioFile, isImageFile, formatFileSize } from '../utils/helpers';
import { 
  storeAudio, getAudio, deleteAudio,
  storeImage, getImage, deleteImage,
  storeMetadata, getMetadata, deleteMetadata
} from '../utils/indexedDBHelper';
import ImagenService from '../services/imagenService';

export default function MediaManager({ 
  isOpen, 
  onClose, 
  songSlug, 
  onMediaUpdate,
  initialImage,
  initialAudio,
  songData // Added to access song title, lyrics, etc.
}) {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'audio'
  const [songImage, setSongImage] = useState(initialImage);
  const [songAudio, setSongAudio] = useState(initialAudio);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentSongSlug, setCurrentSongSlug] = useState(songSlug);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState(null);
  
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const audioPlayerRef = useRef(null);
  
  // Reset state when song changes
  useEffect(() => {
    if (songSlug !== currentSongSlug) {
      console.log('Song changed, resetting media state', { from: currentSongSlug, to: songSlug });
      setCurrentSongSlug(songSlug);
      setSongImage(null);
      setSongAudio(null);
      setAudioProgress(0);
      setAudioDuration(0);
      setIsAudioPlaying(false);
      setGeneratedImages([]);
      setSelectedGeneratedImage(null);
      setShowImageGenerator(false);
      
      // Load data for the new song
      loadSongMedia(songSlug);
    }
  }, [songSlug, currentSongSlug]);
  
  // Load data when component mounts or songSlug changes
  useEffect(() => {
    if (songSlug) {
      loadSongMedia(songSlug);
    }
  }, [songSlug]);
  
  // Helper function to load media for a specific song
  const loadSongMedia = async (slug) => {
    if (!slug) return;
    
    try {
      console.log(`Loading media for song: ${slug}`);
      // Try to get media from IndexedDB first
      const savedImage = await getImage(slug);
      if (savedImage && !initialImage) {
        console.log('Found image in IndexedDB');
        setSongImage(savedImage);
      } else if (initialImage) {
        console.log('Using initialImage from props');
        setSongImage(initialImage);
      }
      
      const savedAudio = await getAudio(slug);
      if (savedAudio && !initialAudio) {
        console.log('Found audio in IndexedDB');
        setSongAudio(savedAudio);
      } else if (initialAudio) {
        console.log('Using initialAudio from props');
        setSongAudio(initialAudio);
      }
      
      const savedMetadata = await getMetadata(slug);
      if (savedMetadata) {
        console.log('Found metadata in IndexedDB');
        setAudioMetadata(savedMetadata);
      }
    } catch (error) {
      console.error(`Error loading media for song ${slug}:`, error);
      
      // Fall back to localStorage for backward compatibility
      try {
        const localStorageImage = localStorage.getItem(`image-${slug}`);
        if (localStorageImage && !initialImage) {
          console.log('Found image in localStorage');
          setSongImage(localStorageImage);
          // Migrate to IndexedDB
          await storeImage(slug, localStorageImage);
        }
        
        const localStorageAudio = localStorage.getItem(`audio-${slug}`);
        if (localStorageAudio && !initialAudio) {
          console.log('Found audio in localStorage');
          setSongAudio(localStorageAudio);
          // Migrate to IndexedDB
          await storeAudio(slug, localStorageAudio);
        }
        
        const localStorageMetadata = localStorage.getItem(`audio-metadata-${slug}`);
        if (localStorageMetadata) {
          console.log('Found metadata in localStorage');
          try {
            const parsedMetadata = JSON.parse(localStorageMetadata);
            setAudioMetadata(parsedMetadata);
            // Migrate to IndexedDB
            await storeMetadata(slug, parsedMetadata);
          } catch (e) {
            console.warn('Error parsing metadata:', e);
          }
        }
      } catch (e) {
        console.error('Error migrating from localStorage:', e);
      }
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!isImageFile(file.name)) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please select a valid image file (JPG, PNG, GIF)'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      return;
    }
    
    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Image file size must be less than 5MB'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Read the file as data URL
      const imageDataUrl = await readFileAsDataURL(file);
      setSongImage(imageDataUrl);
      
      // Store in IndexedDB with the current songSlug
      await storeImage(songSlug, imageDataUrl);
      console.log(`Stored image for song: ${songSlug}`);
      
      // Also update localStorage for backward compatibility (if it's small enough)
      try {
        if (imageDataUrl.length < 2 * 1024 * 1024) { // Try to store if less than ~2MB
          localStorage.setItem(`image-${songSlug}`, imageDataUrl);
        }
      } catch (e) {
        console.warn('Could not store image in localStorage (probably too large)');
      }
      
      // Notify parent component about the update
      if (onMediaUpdate) {
        onMediaUpdate('image', imageDataUrl);
      }
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Image added successfully!'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error handling image upload:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to process image'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image generation
  const handleGenerateImage = async (options = {}) => {
    if (!songData) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Song data is required for image generation'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const generationOptions = {
        style: options.style || 'modern artistic album cover',
        colours: options.colours || 'evocative and mood-matching',
        additionalDetails: options.additionalDetails || '',
        aspectRatio: '1:1', // Square for album covers
        numberOfImages: 1
      };

      console.log('Generating image with options:', generationOptions);
      console.log('Song data:', { title: songData.title, genre: songData.genre });

      const result = await ImagenService.generateSongImage(
        songData.title,
        songData.lyrics,
        songData.genre || 'contemporary',
        generationOptions
      );

      console.log('Image generation result:', result);

      if (result.images && result.images.length > 0) {
        setGeneratedImages(result.images);
        setNotification({
          show: true,
          type: 'success',
          message: `Generated ${result.images.length} image${result.images.length > 1 ? 's' : ''} successfully!`
        });
      } else {
        throw new Error('No images were generated. Please try again with a different prompt.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Determine user-friendly error message
      let userMessage = 'Failed to generate image';
      
      if (error.message.includes('Rate limit') || error.message.includes('rate limit')) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('Authentication') || error.message.includes('API key')) {
        userMessage = 'API configuration issue. Please check the settings.';
      } else if (error.message.includes('Invalid request') || error.message.includes('400')) {
        userMessage = 'Invalid prompt. Please try rephrasing your request.';
      } else if (error.message.includes('Server error') || error.status >= 500) {
        userMessage = 'Server error. Please try again in a few moments.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      setNotification({
        show: true,
        type: 'error',
        message: userMessage
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000); // Show error longer
    }
  };

  // Handle selecting a generated image
  const handleSelectGeneratedImage = async (imageData) => {
    setIsLoading(true);
    try {
      // Convert the image data to a data URL if needed
      let imageDataUrl = imageData;
      if (imageData.startsWith('blob:') || imageData instanceof Blob) {
        imageDataUrl = await ImagenService.blobToDataURL(imageData);
      }

      setSongImage(imageDataUrl);
      setSelectedGeneratedImage(imageDataUrl);
      
      // Store in IndexedDB
      await storeImage(songSlug, imageDataUrl);
      console.log(`Stored generated image for song: ${songSlug}`);
      
      // Notify parent component
      if (onMediaUpdate) {
        onMediaUpdate('image', imageDataUrl);
      }
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Generated image selected successfully!'
      });
      
      // Hide the generator after selection
      setShowImageGenerator(false);
    } catch (error) {
      console.error('Error selecting generated image:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to select generated image'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    }
  };
  
  // Handle audio upload
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!isAudioFile(file.name)) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please select a valid audio file (MP3, WAV, OGG)'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      return;
    }
    
    // File size validation (max 50MB for IndexedDB)
    if (file.size > 50 * 1024 * 1024) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Audio file size must be less than 50MB'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Read the file as data URL
      const audioDataUrl = await readFileAsDataURL(file);
      setSongAudio(audioDataUrl);
      
      // Create metadata
      const audioMetadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        dateAdded: new Date().toISOString()
      };
      
      // Store audio in IndexedDB with the current songSlug
      await storeAudio(songSlug, audioDataUrl);
      await storeMetadata(songSlug, audioMetadata);
      setAudioMetadata(audioMetadata);
      console.log(`Stored audio for song: ${songSlug}`);
      
      // Try localStorage for backward compatibility (if it's small enough)
      try {
        localStorage.setItem(`audio-metadata-${songSlug}`, JSON.stringify(audioMetadata));
        
        // Only try to store the audio in localStorage if it's small (which it likely isn't)
        if (audioDataUrl.length < 2 * 1024 * 1024) { // ~2MB limit for safety
          localStorage.setItem(`audio-${songSlug}`, audioDataUrl);
        }
      } catch (e) {
        console.warn('Could not store audio in localStorage (probably too large)', e);
        // This is expected for large files, so we don't need to show an error
      }
      
      // Notify parent component about the update
      if (onMediaUpdate) {
        onMediaUpdate('audio', audioDataUrl, audioMetadata);
      }
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Audio added successfully!'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error handling audio upload:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to process audio'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to read file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Load audio metadata if available
  const [audioMetadata, setAudioMetadata] = useState(null);
  
  // Remove image
  const handleRemoveImage = async () => {
    try {
      setSongImage(null);
      setSelectedGeneratedImage(null);
      setGeneratedImages([]);
      
      // Remove from IndexedDB
      await deleteImage(songSlug);
      console.log(`Removed image for song: ${songSlug}`);
      
      // Also remove from localStorage for backward compatibility
      localStorage.removeItem(`image-${songSlug}`);
      
      // IMPORTANT: Notify parent component about the removal with null value
      if (onMediaUpdate) {
        onMediaUpdate('image', null);
      }
      
      setNotification({
        show: true,
        type: 'info',
        message: 'Image removed'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
    } catch (error) {
      console.error('Error removing image:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to remove image'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    }
  };
  
  // Remove audio
  const handleRemoveAudio = async () => {
    try {
      // Stop audio playback if it's playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      
      setSongAudio(null);
      setAudioMetadata(null);
      
      // Remove from IndexedDB
      await deleteAudio(songSlug);
      await deleteMetadata(songSlug);
      console.log(`Removed audio for song: ${songSlug}`);
      
      // Also remove from localStorage for backward compatibility
      localStorage.removeItem(`audio-${songSlug}`);
      localStorage.removeItem(`audio-metadata-${songSlug}`);
      
      // Notify parent component about the update
      if (onMediaUpdate) {
        onMediaUpdate('audio', null, null);
      }
      
      setNotification({
        show: true,
        type: 'info',
        message: 'Audio removed'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 2000);
    } catch (error) {
      console.error('Error removing audio:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to remove audio'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    }
  };
  
  // Control audio playback
  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    
    if (isAudioPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
  };
  
  // Format audio time
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  // Handle audio progress
  const handleAudioProgress = () => {
    if (audioPlayerRef.current) {
      setAudioProgress(audioPlayerRef.current.currentTime);
      setAudioDuration(audioPlayerRef.current.duration);
    }
  };
  
  // Seek audio position
  const handleAudioSeek = (e) => {
    if (!audioPlayerRef.current) return;
    
    const seekTime = e.target.value;
    audioPlayerRef.current.currentTime = seekTime;
    setAudioProgress(seekTime);
  };

  // Image Generator Component
  const ImageGenerator = () => {
    const [generatorOptions, setGeneratorOptions] = useState({
      style: '',
      colours: '',
      additionalDetails: ''
    });

    const handleOptionChange = (key, value) => {
      setGeneratorOptions(prev => ({
        ...prev,
        [key]: value
      }));
    };

    return (
      <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-gray-700">🎨 AI Image Generator</h5>
          <button
            onClick={() => setShowImageGenerator(false)}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          {songData && (
            <p>
              Generating AI artwork for "<strong>{songData.title}</strong>"
              {songData.genre && ` (${songData.genre})`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Art Style
            </label>
            <select
              value={generatorOptions.style}
              onChange={(e) => handleOptionChange('style', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={isLoading}
            >
              <option value="">Choose a style...</option>
              <option value="modern artistic album cover">Modern Artistic</option>
              <option value="minimalist contemporary">Minimalist</option>
              <option value="vintage retro">Vintage/Retro</option>
              <option value="abstract expressionist">Abstract</option>
              <option value="photorealistic">Photorealistic</option>
              <option value="watercolor painting">Watercolor</option>
              <option value="digital art illustration">Digital Illustration</option>
              <option value="folk art hand-drawn">Folk Art</option>
              <option value="geometric modern">Geometric</option>
              <option value="surreal dreamlike">Surreal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colour Palette
            </label>
            <select
              value={generatorOptions.colours}
              onChange={(e) => handleOptionChange('colours', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={isLoading}
            >
              <option value="">Choose colours...</option>
              <option value="warm and vibrant">Warm & Vibrant</option>
              <option value="cool and calming">Cool & Calming</option>
              <option value="monochromatic">Monochromatic</option>
              <option value="high contrast">High Contrast</option>
              <option value="earth tones">Earth Tones</option>
              <option value="neon and electric">Neon & Electric</option>
              <option value="pastel and soft">Pastel & Soft</option>
              <option value="deep rich colours">Deep & Rich</option>
              <option value="sepia vintage">Sepia/Vintage</option>
              <option value="black and white">Black & White</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              value={generatorOptions.additionalDetails}
              onChange={(e) => handleOptionChange('additionalDetails', e.target.value)}
              placeholder="Describe any specific elements you'd like to include... 
e.g., 'guitar silhouette', 'mountain landscape', 'city lights', 'abstract swirls'"
              className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
              rows="3"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={() => handleGenerateImage(generatorOptions)}
            disabled={isLoading || !songData}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isLoading || !songData
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : !songData ? (
              'Song data required'
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Image with AI
              </>
            )}
          </button>
        </div>

        {/* Generated Images Display */}
        {generatedImages.length > 0 && (
          <div className="mt-4">
            <h6 className="font-medium text-gray-700 mb-2">Generated Images</h6>
            <div className="grid grid-cols-1 gap-3">
              {generatedImages.map((imageData, index) => (
                <div key={index} className="border rounded-lg overflow-hidden bg-white">
                  <img
                    src={imageData}
                    alt={`Generated option ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-2">
                    <button
                      onClick={() => handleSelectGeneratedImage(imageData)}
                      disabled={isLoading}
                      className={`w-full py-1 px-3 rounded text-sm font-medium transition-colors ${
                        selectedGeneratedImage === imageData
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : isLoading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedGeneratedImage === imageData ? '✓ Selected' : 'Select This Image'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center sticky top-0">
          <h3 className="text-lg font-semibold">Media Manager - {songData?.title || 'Song'}</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Notifications */}
        {notification.show && (
          <div className={`absolute top-16 right-4 px-4 py-3 rounded shadow-md flex items-center z-50 transition-opacity duration-300 ${
            notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
            notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            {notification.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('image')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'image' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'audio' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Audio
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'image' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Song Image</h4>
                {songData && (
                  <button
                    onClick={() => setShowImageGenerator(!showImageGenerator)}
                    disabled={isLoading}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center ${
                      showImageGenerator
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {showImageGenerator ? 'Hide AI Generator' : 'Generate with AI'}
                  </button>
                )}
              </div>

              {/* Image Generator */}
              {showImageGenerator && <ImageGenerator />}
              
              {songImage ? (
                <div className="space-y-3">
                  <div className="border rounded-lg overflow-hidden w-full">
                    <img 
                      src={songImage} 
                      alt="Song cover" 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {!showImageGenerator && songData && (
                        <button
                          onClick={() => setShowImageGenerator(true)}
                          disabled={isLoading}
                          className={`px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Another
                        </button>
                      )}
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isLoading}
                        className={`px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload New
                      </button>
                    </div>
                    <button
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      className={`px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              ) : !showImageGenerator ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">
                    Add an image for this song
                  </p>
                  <div className="space-x-3">
                    <button
                      onClick={() => imageInputRef.current.click()}
                      disabled={isLoading}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Upload Image
                    </button>
                    {songData && (
                      <button
                        onClick={() => setShowImageGenerator(true)}
                        disabled={isLoading}
                        className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Generate with AI
                      </button>
                    )}
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-4">
                    Upload: JPG, PNG, GIF (max 5MB)<br />
                    {songData && 'Generate: AI-powered based on song content'}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Song Audio</h4>
              
              {songAudio ? (
              <div className="space-y-3">
              <div className="border rounded-lg p-4">
              {/* Audio metadata display */}
              {audioMetadata && (
              <div className="mb-3 bg-gray-50 p-2 rounded text-sm">
                <p className="font-medium text-gray-700">{audioMetadata.fileName}</p>
                <p className="text-gray-500">{formatFileSize(audioMetadata.fileSize)}</p>
              </div>
              )}
              
              {/* Audio player preview */}
              <audio 
                ref={audioPlayerRef} 
                src={songAudio} 
                className="hidden"
                controlsList="nodownload"
                onTimeUpdate={handleAudioProgress}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onLoadedMetadata={handleAudioProgress}
              />
              <div className="flex items-center mb-3">
              <button
                onClick={toggleAudioPlayback}
                className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 mr-3"
                title={isAudioPlaying ? "Pause" : "Play"}
              >
              {isAudioPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              )}
              </button>
              <div className="flex-1">
              <div className="flex justify-between mb-1 text-sm">
              <span className="text-gray-700">{formatTime(audioProgress)}</span>
              <span className="text-gray-500">{formatTime(audioDuration)}</span>
              </div>
              <input
                type="range"
                  min="0"
                    max={audioDuration || 100}
                      value={audioProgress}
                      onChange={handleAudioSeek}
                    className="w-full h-2 rounded-full appearance-none bg-gray-200 cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${(audioProgress / audioDuration) * 100}%, #e5e7eb ${(audioProgress / audioDuration) * 100}%)`
                    }}
                />
              </div>
              </div>
              
              {/* Audio controls */}
                <div className="flex justify-center mt-2 space-x-3">
                    <button 
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        onClick={() => {
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.currentTime -= 10; // Rewind 10 seconds
                          }
                        }}
                        title="Rewind 10 seconds"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                        </svg>
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        onClick={() => {
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.playbackRate = Math.max(0.5, audioPlayerRef.current.playbackRate - 0.25);
                          }
                        }}
                        title="Decrease speed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        onClick={() => {
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.playbackRate = 1.0; // Reset to normal speed
                          }
                        }}
                        title="Normal speed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        onClick={() => {
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.playbackRate = Math.min(2, audioPlayerRef.current.playbackRate + 0.25);
                          }
                        }}
                        title="Increase speed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        onClick={() => {
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.currentTime += 10; // Forward 10 seconds
                          }
                        }}
                        title="Forward 10 seconds"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleRemoveAudio}
                      disabled={isLoading}
                      className={`px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="text-gray-600 mb-4">
                    Add audio for this song
                  </p>
                  <button
                    onClick={() => audioInputRef.current.click()}
                    disabled={isLoading}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Select Audio
                  </button>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-4">
                    Supported formats: MP3, WAV, OGG<br />
                    Maximum size: 50MB
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
