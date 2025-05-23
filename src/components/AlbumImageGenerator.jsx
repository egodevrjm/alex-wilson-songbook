import React, { useState } from 'react';
import ImagenService from '../services/imagenService';

export default function AlbumImageGenerator({ 
  albumData, 
  onImageGenerated, 
  onClose, 
  isOpen 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatorOptions, setGeneratorOptions] = useState({
    style: '',
    colours: '',
    additionalDetails: ''
  });
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const handleOptionChange = (key, value) => {
    setGeneratorOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerateImage = async () => {
    if (!albumData) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Album data is required for image generation'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      return;
    }

    setIsGenerating(true);
    try {
      const options = {
        style: generatorOptions.style || 'sophisticated artistic album cover',
        colours: generatorOptions.colours || 'unified and striking',
        additionalDetails: generatorOptions.additionalDetails || '',
        aspectRatio: '1:1',
        numberOfImages: 3 // Generate 3 options for albums
      };

      const result = await ImagenService.generateAlbumImage(
        albumData.title,
        albumData.songs || [],
        albumData.genre || 'contemporary',
        options
      );

      if (result.images && result.images.length > 0) {
        setGeneratedImages(result.images);
        setNotification({
          show: true,
          type: 'success',
          message: `Generated ${result.images.length} album cover option(s)!`
        });
      } else {
        throw new Error('No images were generated');
      }
    } catch (error) {
      console.error('Error generating album image:', error);
      setNotification({
        show: true,
        type: 'error',
        message: `Failed to generate album cover: ${error.message}`
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    }
  };

  const handleSelectImage = async (imageData) => {
    try {
      setSelectedImage(imageData);
      if (onImageGenerated) {
        await onImageGenerated(imageData);
      }
      setNotification({
        show: true,
        type: 'success',
        message: 'Album cover selected successfully!'
      });
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error('Error selecting image:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to select album cover'
      });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    }
  };

  const resetGenerator = () => {
    setGeneratedImages([]);
    setSelectedImage(null);
    setGeneratorOptions({
      style: '',
      colours: '',
      additionalDetails: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 bg-green-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Generate Album Cover - {albumData?.title || 'Untitled Album'}
          </h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
            disabled={isGenerating}
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

        <div className="p-6">
          {/* Album Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Album Information</h4>
            <p className="text-sm text-gray-600">
              <strong>Title:</strong> {albumData?.title || 'Untitled Album'}
            </p>
            {albumData?.genre && (
              <p className="text-sm text-gray-600">
                <strong>Genre:</strong> {albumData.genre}
              </p>
            )}
            {albumData?.songs && albumData.songs.length > 0 && (
              <p className="text-sm text-gray-600">
                <strong>Tracks:</strong> {albumData.songs.length} songs
                {albumData.songs.length <= 5 && (
                  <span className="ml-2">
                    ({albumData.songs.map(song => song.title).join(', ')})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Generation Options */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-700">Customisation Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Art Style
                </label>
                <select
                  value={generatorOptions.style}
                  onChange={(e) => handleOptionChange('style', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  disabled={isGenerating}
                >
                  <option value="">Choose a style...</option>
                  <option value="sophisticated artistic album cover">Sophisticated Artistic</option>
                  <option value="minimalist modern">Minimalist Modern</option>
                  <option value="vintage classic album cover">Vintage Classic</option>
                  <option value="abstract contemporary">Abstract Contemporary</option>
                  <option value="photorealistic conceptual">Photorealistic Conceptual</option>
                  <option value="illustrated hand-drawn">Illustrated Hand-drawn</option>
                  <option value="digital art collage">Digital Art Collage</option>
                  <option value="typography-focused">Typography-focused</option>
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
                  disabled={isGenerating}
                >
                  <option value="">Choose colours...</option>
                  <option value="unified and striking">Unified & Striking</option>
                  <option value="monochromatic elegant">Monochromatic Elegant</option>
                  <option value="bold contrasting">Bold Contrasting</option>
                  <option value="warm earthy tones">Warm Earthy Tones</option>
                  <option value="cool blues and greys">Cool Blues & Greys</option>
                  <option value="vintage sepia and cream">Vintage Sepia & Cream</option>
                  <option value="vibrant and energetic">Vibrant & Energetic</option>
                  <option value="pastel and soft">Pastel & Soft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={generatorOptions.additionalDetails}
                onChange={(e) => handleOptionChange('additionalDetails', e.target.value)}
                placeholder="Describe any specific elements, themes, or concepts you'd like to include in the album cover..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                rows="3"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: "Include musical instruments", "Nature landscape", "Urban cityscape", etc.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={resetGenerator}
                disabled={isGenerating}
                className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Reset Options
              </button>
              
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Album Cover...
                  </span>
                ) : (
                  'Generate Album Cover'
                )}
              </button>
            </div>
          </div>

          {/* Generated Images Display */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Generated Album Covers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((imageData, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg ${
                      selectedImage === imageData ? 'ring-2 ring-green-500 ring-offset-2' : ''
                    }`}
                  >
                    <img
                      src={imageData}
                      alt={`Album cover option ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-3">
                      <button
                        onClick={() => handleSelectImage(imageData)}
                        disabled={isGenerating}
                        className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                          selectedImage === imageData
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : isGenerating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedImage === imageData ? (
                          <span className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Selected
                          </span>
                        ) : (
                          'Select This Cover'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className={`px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors ${
                    isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Generate More Options
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {generatedImages.length === 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">How it works</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Choose an art style and colour palette that matches your album's vibe</li>
                <li>• Add any specific details or themes you want included</li>
                <li>• Click "Generate Album Cover" to create multiple options</li>
                <li>• Select your favourite to use as your album cover</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
