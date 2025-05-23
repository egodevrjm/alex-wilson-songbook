import React, { useState, useEffect } from 'react';
import GameChat from './GameChat';
import SceneSelector from './SceneSelector';
import GameSettings from './GameSettings';
import GameSummary from './GameSummary';
import { useGameState } from '../../contexts/GameStateContext';
import { getNextScene } from '../../data/gameScenes';
import GameLLMService from '../../services/gameLLMService';

const GameNarrative = ({ songs }) => {
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [llmService] = useState(() => new GameLLMService());
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { resetGameState } = useGameState();

  useEffect(() => {
    // Check if API key is configured
    const apiKey = localStorage.getItem('geminiApiKey');
    setApiKeyConfigured(!!apiKey);
  }, []);

  const handleStartGame = (sceneId) => {
    resetGameState(); // Start fresh
    setCurrentSceneId(sceneId);
    setGameStarted(true);
  };

  const handleSceneComplete = (completedSceneId) => {
    const nextScene = getNextScene(completedSceneId);
    if (nextScene) {
      setCurrentSceneId(nextScene.id);
    } else {
      // Game complete or move to dynamic scenes
      handleGameComplete();
    }
  };

  const handleGameComplete = () => {
    // Show completion screen
    setShowSummary(true);
  };
  
  const handleContinuePlaying = () => {
    setShowSummary(false);
    // Continue with sandbox mode - could load additional scenes or free play
    setGameStarted(false);
  };
  
  const handleNewStory = () => {
    setShowSummary(false);
    setGameStarted(false);
    setCurrentSceneId(null);
    resetGameState();
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    // Re-check if API key is configured
    const apiKey = localStorage.getItem('geminiApiKey');
    setApiKeyConfigured(!!apiKey);
  };

  if (!apiKeyConfigured) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          Welcome to The Alex Wilson Story
        </h2>
        <p className="text-gray-300 mb-6">
          An interactive narrative game powered by AI storytelling.
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Configure Game
        </button>
        <p className="text-sm text-gray-500 mt-4">
          You'll need a Gemini API key to play. It's free and takes just a minute to set up.
        </p>
        {showSettings && <GameSettings onClose={handleSettingsClose} />}
      </div>
    );
  }

  if (!gameStarted) {
    return showSummary ? (
      <GameSummary 
        onContinue={handleContinuePlaying}
        onNewGame={handleNewStory}
      />
    ) : (
      <SceneSelector onSceneSelect={handleStartGame} />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-yellow-400">
            The Alex Wilson Story
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => {
                if (confirm('Start a new game? Current progress will be lost.')) {
                  setGameStarted(false);
                  setCurrentSceneId(null);
                  resetGameState();
                }
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              🔄 New Game
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <GameChat 
          key={currentSceneId}
          initialSceneId={currentSceneId}
          onSceneComplete={handleSceneComplete}
          llmService={llmService}
          songs={songs}
        />
      </div>
      
      {showSettings && <GameSettings onClose={handleSettingsClose} />}
    </div>
  );
};

export default GameNarrative;
