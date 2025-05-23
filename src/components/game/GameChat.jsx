import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { getScene } from '../../data/gameScenes';
import SongSelector from './SongSelector';
import SongPerformance from './SongPerformance';

const GameChat = ({ initialSceneId, onSceneComplete, llmService, songs = [] }) => {
  const [messages, setMessages] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingCustomInput, setAwaitingCustomInput] = useState(false);
  const [choicesHidden, setChoicesHidden] = useState(false);
  const [sceneTurns, setSceneTurns] = useState(0); // Track turns within scene
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [performingSong, setPerformingSong] = useState(null);
  const messagesEndRef = useRef(null);
  const mountedRef = useRef(false);
  const { gameState, updateMeter, advanceTime } = useGameState();

  const formatStatus = () => {
    const { meters } = gameState;
    return `⏰ ${gameState.time} | 💵 $${gameState.wallet.cash} | 📉 Debt $${gameState.wallet.debt} | 🔧 Gear: ${gameState.gear} | 💭 Hope ${meters.Hope} / Rage ${meters.Rage} / Auth ${meters.Authenticity || meters.Auth} / Rep ${meters.Reputation || meters.Rep}`;
  };

  const handleSongSelect = (song) => {
    setShowSongSelector(false);
    setAwaitingCustomInput(false);
    setChoicesHidden(true);
    
    // Add performance intro
    const introId = `song-intro-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: introId,
      content: <div className="text-right">
        <div className="inline-block bg-green-900/50 rounded-lg p-3 max-w-md">
          <p className="font-semibold">🎤 Perform Song</p>
          <p className="text-sm text-gray-300">I pick up my guitar and start playing "{song.title}"</p>
        </div>
      </div>,
      type: 'player',
      timestamp: new Date()
    }]);
    
    // Show song performance
    setTimeout(() => {
      setPerformingSong(song);
    }, 1000);
  };
  
  const handleSongComplete = () => {
    const songTitle = performingSong.title;
    setPerformingSong(null);
    
    // Update meters
    updateMeter('Authenticity', 2);
    updateMeter('Hope', 1);
    
    // Generate response about the performance
    const performanceResponse = {
      type: 'performance',
      description: `Performed "${songTitle}"`,
      songTitle: songTitle,
      soundsLike: performingSong.soundsLike
    };
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      generateResponse(performanceResponse);
    }, 1500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChoice = async (choice) => {
    if (choice.type === 'custom') {
      setAwaitingCustomInput(true);
      const messageId = `prompt-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: messageId,
        content: <div className="text-purple-400 italic">
          <p>What do you do? Type your action below...</p>
        </div>,
        type: 'prompt',
        timestamp: new Date()
      }]);
      return;
    }

    // Hide choices and show player's choice
    setChoicesHidden(true);
    setAwaitingCustomInput(false);
    
    // Increment scene turns
    setSceneTurns(prev => prev + 1);
    
    // Add player's choice to chat
    const choiceId = `player-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: choiceId,
      content: <div className="text-right">
        <div className="inline-block bg-blue-900/50 rounded-lg p-3 max-w-md">
          <p className="font-semibold">{choice.icon} {choice.label}</p>
          <p className="text-sm text-gray-300">{choice.description}</p>
        </div>
      </div>,
      type: 'player',
      timestamp: new Date()
    }]);

    // Process choice effects
    processChoiceEffects(choice);

    // Simulate LLM response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      generateResponse(choice);
    }, 2000);
  };

  const handleCustomInput = () => {
    if (!inputValue.trim()) return;

    // Check for song trigger
    if (inputValue.startsWith('**') || inputValue.startsWith('/')) {
      setShowSongSelector(true);
      setInputValue('');
      return;
    }

    // Hide choices and input
    setChoicesHidden(true);
    setAwaitingCustomInput(false);
    
    // Increment scene turns
    setSceneTurns(prev => prev + 1);
    
    // Add player's custom action to chat
    const actionId = `custom-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: actionId,
      content: <div className="text-right">
        <div className="inline-block bg-purple-900/50 rounded-lg p-3 max-w-md">
          <p className="font-semibold">❓ Custom Action</p>
          <p className="text-sm text-gray-300">{inputValue}</p>
        </div>
      </div>,
      type: 'player',
      timestamp: new Date()
    }]);

    const customAction = inputValue;
    setInputValue('');

    // Simulate LLM response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      generateResponse({ type: 'custom', description: customAction });
    }, 2000);
  };

  const processChoiceEffects = (choice) => {
    // Update meters based on choice type
    switch (choice.type) {
      case 'safe':
        updateMeter('Hope', -1);
        break;
      case 'risky':
        updateMeter('Authenticity', 1);
        break;
      case 'creative':
        updateMeter('Authenticity', 2);
        updateMeter('Hope', 1);
        break;
    }
    
    // Advance time
    advanceTime(1);
  };

  const generateResponse = async (choice) => {
    try {
      // Get LLM response
      const response = await llmService.generateResponse(
        currentScene,
        { ...choice, customText: choice.type === 'custom' ? choice.description : null },
        gameState,
        sceneTurns
      );

      // Display the narrative response
      const responseId = `response-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: responseId,
        content: <div className="prose prose-invert max-w-none">
          {response.text.split('\n').map((paragraph, i) => (
            paragraph.trim() && <p key={i} className="text-gray-200 mb-2">{paragraph}</p>
          ))}
        </div>,
        type: 'assistant',
        timestamp: new Date()
      }]);

      // Apply meter changes
      if (response.meterChanges) {
        Object.entries(response.meterChanges).forEach(([meter, change]) => {
          updateMeter(meter, change);
        });
        
        // Show meter changes
        if (Object.keys(response.meterChanges).length > 0) {
          setTimeout(() => {
            const meterId = `meter-${Date.now()}`;
            setMessages(prev => [...prev, {
              id: meterId,
              content: <div className="text-center text-sm text-yellow-400">
                {Object.entries(response.meterChanges).map(([meter, change]) => (
                  <span key={meter} className="mx-2">
                    {meter} {change > 0 ? '+' : ''}{change}
                  </span>
                ))}
              </div>,
              type: 'meter-change',
              timestamp: new Date()
            }]);
          }, 500);
        }
      }

      // Check if response indicates scene completion or presents new choices
      if (response.sceneComplete || response.nextScene) {
        // Add button to move to next scene
        setTimeout(() => {
          const buttonId = `next-scene-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: buttonId,
            content: <div className="text-center mt-4">
              <button
                onClick={() => onSceneComplete(currentScene.id)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continue to Next Scene →
              </button>
            </div>,
            type: 'action',
            timestamp: new Date()
          }]);
        }, 1500);
      } else if (response.choices) {
        // Present new choices within the same scene
        setTimeout(() => {
          const newChoicesId = `new-choices-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: newChoicesId,
            content: <div className="space-y-3 my-6">
              {response.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-102 ${
                    choice.type === 'safe' ? 'border-blue-600 hover:bg-blue-900/30' :
                    choice.type === 'risky' ? 'border-yellow-600 hover:bg-yellow-900/30' :
                    choice.type === 'creative' ? 'border-green-600 hover:bg-green-900/30' :
                    'border-purple-600 hover:bg-purple-900/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{choice.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{choice.label}</p>
                      <p className="text-sm text-gray-300 mt-1">{choice.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>,
            type: 'choices',
            timestamp: new Date()
          }]);
          setChoicesHidden(false); // Reset to show new choices
        }, 1500);
      } else {
        // Default: continue narrative with a prompt for what to do next
        setTimeout(() => {
          const promptId = `prompt-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: promptId,
            content: <div className="text-purple-400 italic text-center mt-4">
              <p>What do you do next?</p>
              <button
                onClick={() => {
                  setAwaitingCustomInput(true);
                  setChoicesHidden(true);
                }}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Type your action
              </button>
            </div>,
            type: 'prompt',
            timestamp: new Date()
          }]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      // Fallback response
      const fallbackId = `fallback-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: fallbackId,
        content: <div className="prose prose-invert max-w-none">
          <p className="text-gray-200">{llmService.getFallbackResponse(currentScene, choice).text}</p>
        </div>,
        type: 'assistant',
        timestamp: new Date()
      }]);

      // Add a way to continue
      setTimeout(() => {
        const promptId = `fallback-prompt-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: promptId,
          content: <div className="text-center mt-4">
            <button
              onClick={() => {
                setAwaitingCustomInput(true);
                setChoicesHidden(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              What do you do?
            </button>
          </div>,
          type: 'action',
          timestamp: new Date()
        }]);
      }, 1000);
    }
  };

  const displayScene = (sceneId) => {
    const scene = getScene(sceneId);
    if (!scene) return;

    setCurrentScene(scene);
    setMessages([]); // Clear previous messages
    setChoicesHidden(false); // Reset choices visibility
    setAwaitingCustomInput(false); // Reset input state
    setSceneTurns(0); // Reset turn counter
    
    const sceneMessages = [];

    // Scene header
    sceneMessages.push({
      id: `header-${scene.id}`,
      content: <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-yellow-400">{scene.title} (Day {scene.day})</h2>
        <p className="text-gray-400">{scene.date} ({scene.dayName}) — 🕖 {scene.timeOfDay}</p>
      </div>,
      type: 'scene-header',
      timestamp: new Date()
    });

    // Location if present
    if (scene.location) {
      sceneMessages.push({
        id: `location-${scene.id}`,
        content: <p className="text-gray-500 italic text-center">{scene.location}</p>,
        type: 'location',
        timestamp: new Date()
      });
    }

    // Dynamic cue if present
    if (scene.dynamicCue && Math.random() < scene.dynamicCue.chance) {
      sceneMessages.push({
        id: `dynamic-${scene.id}`,
        content: <p className="text-blue-400 italic">🌧️ {scene.dynamicCue.text}</p>,
        type: 'dynamic-cue',
        timestamp: new Date()
      });
    }

    // Cues
    if (scene.cues) {
      scene.cues.forEach((cue, index) => {
        sceneMessages.push({
          id: `cue-${scene.id}-${index}`,
          content: <p className="text-gray-300">{cue.icon} {cue.text}</p>,
          type: 'cue',
          timestamp: new Date()
        });
      });
    }

    // Lock screen for shattering scene
    if (scene.lockScreen) {
      sceneMessages.push({
        id: `lockscreen-${scene.id}`,
        content: <div className="bg-black rounded-lg p-4 max-w-xs mx-auto border border-gray-700">
          <div className="text-center space-y-2">
            <p className="text-white text-xl">🕛 {scene.lockScreen.time}</p>
            <p className="text-gray-400 text-sm">🔋 {scene.lockScreen.battery}% 📶 signal: {scene.lockScreen.signal}</p>
            <div className="border-t border-gray-700 pt-2">
              <p className="text-gray-300">Notifications:</p>
              {scene.lockScreen.notifications.map((notif, i) => (
                <p key={i} className="text-blue-400">👻 {notif.app} — {notif.sender} · {notif.time}</p>
              ))}
            </div>
          </div>
        </div>,
        type: 'lockscreen',
        timestamp: new Date()
      });
    }

    // Message content for shattering scene
    if (scene.messageContent) {
      sceneMessages.push({
        id: `message-${scene.id}`,
        content: <div className="bg-gray-900 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-gray-400 text-sm">[Unlocking phone...]</p>
          <div className="mt-2 space-y-2">
            <p className="text-blue-400">👻 {scene.messageContent.sender} — {scene.messageContent.time}</p>
            <p className="text-gray-300 italic">{scene.messageContent.content}</p>
            {scene.messageContent.note && (
              <p className="text-gray-500 text-xs">&lt;{scene.messageContent.note}&gt;</p>
            )}
          </div>
        </div>,
        type: 'message',
        timestamp: new Date()
      });
    }

    // Main narrative
    sceneMessages.push({
      id: `narrative-${scene.id}`,
      content: <div className="prose prose-invert max-w-none">
        {scene.narrative.split('\n').map((paragraph, i) => (
          paragraph.trim() && <p key={i} className="text-gray-200 mb-2">{paragraph}</p>
        ))}
      </div>,
      type: 'narrative',
      timestamp: new Date()
    });

    // Environment details
    if (scene.environmentDetails) {
      scene.environmentDetails.forEach((detail, index) => {
        sceneMessages.push({
          id: `env-${scene.id}-${index}`,
          content: <p className="text-amber-400">📍 {detail}</p>,
          type: 'environment',
          timestamp: new Date()
        });
      });
    }

    // Hidden meter updates
    if (scene.hiddenMeterUpdates) {
      sceneMessages.push({
        id: `meters-${scene.id}`,
        content: <div className="text-center text-gray-500 text-sm">
          <p className="font-semibold">Hidden meters update:</p>
          {Object.entries(scene.hiddenMeterUpdates).map(([meter, change]) => (
            <p key={meter}>{meter} {change.from} → {change.to}</p>
          ))}
        </div>,
        type: 'meter-update',
        timestamp: new Date()
      });
    }

    // Epilogue
    if (scene.epilogue) {
      sceneMessages.push({
        id: `epilogue-${scene.id}`,
        content: <p className="text-yellow-400 italic text-center mt-4">{scene.epilogue}</p>,
        type: 'epilogue',
        timestamp: new Date()
      });
    }

    // Dialogue
    if (scene.dialogue) {
      sceneMessages.push({
        id: `dialogue-${scene.id}`,
        content: <div className="my-4">
          <p className="text-green-400 font-semibold">{scene.dialogue.character}: "{scene.dialogue.text}"</p>
          {scene.dialogue.action && <p className="text-gray-500 italic">{scene.dialogue.action}</p>}
        </div>,
        type: 'dialogue',
        timestamp: new Date()
      });
    }

    // Choices
    if (scene.choices) {
      sceneMessages.push({
        id: `choices-${scene.id}`,
        content: <div className="space-y-3 my-6" data-choices="true">
          {scene.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-102 ${
                choice.type === 'safe' ? 'border-blue-600 hover:bg-blue-900/30' :
                choice.type === 'risky' ? 'border-yellow-600 hover:bg-yellow-900/30' :
                choice.type === 'creative' ? 'border-green-600 hover:bg-green-900/30' :
                'border-purple-600 hover:bg-purple-900/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{choice.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{choice.label}</p>
                  <p className="text-sm text-gray-300 mt-1">{choice.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>,
        type: 'choices',
        timestamp: new Date()
      });
    }

    // Status bar
    const { meters } = gameState;
    const statusText = `⏰ ${gameState.time} | 💵 $${gameState.wallet.cash} | 📉 Debt $${gameState.wallet.debt} | 🔧 Gear: ${gameState.gear} | 💭 Hope ${meters.Hope} / Rage ${meters.Rage} / Auth ${meters.Authenticity || meters.Auth} / Rep ${meters.Reputation || meters.Rep}`;
    
    sceneMessages.push({
      id: `status-${scene.id}`,
      content: <div className="text-center text-xs text-gray-500 mt-6 p-2 bg-gray-900/50 rounded">
        — STATUS — {statusText}
      </div>,
      type: 'status',
      timestamp: new Date()
    });

    // Add all messages with delays
    let delay = 0;
    const delayIncrement = 500;
    
    sceneMessages.forEach((message, index) => {
      setTimeout(() => {
        if (mountedRef.current) {
          setMessages(prev => [...prev, message]);
        }
      }, delay);
      delay += delayIncrement * (message.type === 'cue' ? 0.7 : 1);
    });
  };

  // Initialize scene on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (initialSceneId) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        displayScene(initialSceneId);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
      };
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg relative">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 game-chat-scroll">
        {messages.map((msg) => {
          // Hide choices if they've been acted upon
          if (msg.type === 'choices' && choicesHidden) return null;
          
          return (
            <div key={msg.id} className={`animate-fadeIn ${
              msg.type === 'player' ? 'text-right' : ''
            }`}>
              {msg.content}
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm">Alex's story continues...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {awaitingCustomInput && (
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={(e) => { e.preventDefault(); handleCustomInput(); }} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your action... (e.g., 'I pick up my guitar and play a soft melody')"
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Be creative! Describe what Alex does, says, or thinks. Type ** or / to perform a song.
          </p>
        </div>
      )}
      
      {/* Song Selector */}
      {showSongSelector && (
        <SongSelector
          songs={songs}
          onSelectSong={handleSongSelect}
          onClose={() => setShowSongSelector(false)}
        />
      )}
      
      {/* Song Performance */}
      {performingSong && (
        <div className="absolute inset-0 bg-gray-900 overflow-y-auto p-4">
          <SongPerformance
            song={performingSong}
            onComplete={handleSongComplete}
          />
        </div>
      )}
    </div>
  );
};

export default GameChat;
