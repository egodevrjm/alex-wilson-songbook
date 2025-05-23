import React, { useState, useEffect } from 'react';

export default function GeminiConfig({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    // Load saved API key if available
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      // Save the API key to localStorage
      localStorage.setItem('gemini-api-key', apiKey);
      
      setIsSaving(false);
      setNotification({
        show: true,
        message: 'API key saved successfully',
        type: 'success'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
        if (onClose) onClose();
      }, 2000);
    }, 500);
  };

  const handleTestConnection = async () => {
    setIsSaving(true);
    
    try {
      // Import dynamically to avoid circular dependencies
      const { generateContent } = await import('../services/GeminiService');
      
      // Simple test prompt
      const testPrompt = "Hello, this is a test prompt to verify the API connection.";
      
      // Temporarily override the API key for this request
      const originalFetch = window.fetch;
      window.fetch = (url, options) => {
        // Replace the key in the URL
        if (url.includes('generativelanguage.googleapis.com')) {
          url = url.replace(/key=([^&]+)/, `key=${apiKey}`);
        }
        return originalFetch(url, options);
      };
      
      // Try to get a response
      await generateContent(testPrompt, { maxTokens: 10 });
      
      // Restore original fetch
      window.fetch = originalFetch;
      
      // Show success notification
      setNotification({
        show: true,
        message: 'API connection successful',
        type: 'success'
      });
      
    } catch (error) {
      // Show error notification
      setNotification({
        show: true,
        message: `API error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
      
      // Reset notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gemini AI Configuration</h2>
        <button 
          className="text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Gemini API Key
        </label>
        <input
          type="password"
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API key"
        />
        <p className="text-sm text-gray-500 mt-1">
          Your API key is stored locally in your browser and never sent to our servers.
        </p>
      </div>
      
      <div className="mb-4">
        <div className="flex space-x-4">
          <a
            href="https://ai.google.dev/tutorials/setup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to get an API key
          </a>
          
          <a
            href="https://ai.google.dev/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Pricing information
          </a>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          className={`px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleTestConnection}
          disabled={isSaving || !apiKey}
        >
          Test Connection
        </button>
        
        <button
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSave}
          disabled={isSaving || !apiKey}
        >
          Save API Key
        </button>
      </div>
    </div>
  );
}
