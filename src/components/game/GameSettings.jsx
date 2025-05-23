import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const GameSettings = ({ onClose }) => {
  const { theme } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing API key
    const existingKey = localStorage.getItem('geminiApiKey');
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your API key?')) {
      localStorage.removeItem('geminiApiKey');
      setApiKey('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6 max-w-md w-full mx-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Gemini API Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The narrative game uses Google's Gemini API for dynamic storytelling. 
              Your API key is stored locally in your browser.
            </p>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 border rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                className={`flex-1 ${theme.components.button.primary} py-2 rounded transition-colors`}
              >
                {saved ? '✓ Saved' : 'Save API Key'}
              </button>
              {apiKey && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Don't have an API key?</p>
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get one from Google AI Studio →
              </a>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Game Rules</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Your choices affect Alex's meters and career trajectory</li>
              <li>• Alex is unaware of social media activity around him</li>
              <li>• Creative choices often lead to viral moments</li>
              <li>• Safe choices protect you but limit growth</li>
              <li>• Custom actions let you forge your own path</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
