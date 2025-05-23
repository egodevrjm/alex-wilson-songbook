import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_GAME_STATE, CAREER_MILESTONES } from '../data/gameIntegration';

const GameStateContext = createContext();

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export const GameStateProvider = ({ children }) => {
  const [gameState, setGameState] = useState(() => {
    // Load from localStorage if exists
    const saved = localStorage.getItem('alexWilsonGameState');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Merge with initial state to ensure all properties exist
        return {
          ...INITIAL_GAME_STATE,
          ...parsedState,
          // Ensure nested objects are properly merged
          meters: { ...INITIAL_GAME_STATE.meters, ...(parsedState.meters || {}) },
          work: { ...INITIAL_GAME_STATE.work, ...(parsedState.work || {}) },
          wallet: { ...INITIAL_GAME_STATE.wallet, ...(parsedState.wallet || {}) },
          audience: {
            ...INITIAL_GAME_STATE.audience,
            ...(parsedState.audience || {}),
            genreAudience: {
              ...INITIAL_GAME_STATE.audience.genreAudience,
              ...((parsedState.audience && parsedState.audience.genreAudience) || {})
            }
          },
          connections: parsedState.connections || INITIAL_GAME_STATE.connections,
          lastCues: parsedState.lastCues || INITIAL_GAME_STATE.lastCues,
          npcs: parsedState.npcs || INITIAL_GAME_STATE.npcs
        };
      } catch (error) {
        console.error('Error parsing saved game state:', error);
        return INITIAL_GAME_STATE;
      }
    }
    return INITIAL_GAME_STATE;
  });

  const [isGameMode, setIsGameMode] = useState(() => {
    const saved = localStorage.getItem('alexWilsonGameMode');
    return saved === 'true';
  });

  // Save to localStorage whenever gameState changes
  useEffect(() => {
    localStorage.setItem('alexWilsonGameState', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('alexWilsonGameMode', isGameMode.toString());
  }, [isGameMode]);

  // Update meters
  const updateMeter = useCallback((meter, delta) => {
    setGameState(prev => ({
      ...prev,
      meters: {
        ...prev.meters,
        [meter]: Math.max(0, Math.min(10, prev.meters[meter] + delta))
      }
    }));
  }, []);

  // Update wallet
  const updateWallet = useCallback((field, amount) => {
    setGameState(prev => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        [field]: Math.max(0, prev.wallet[field] + amount)
      }
    }));
  }, []);

  // Update audience
  const updateAudience = useCallback((demographic, delta) => {
    setGameState(prev => ({
      ...prev,
      audience: {
        ...prev.audience,
        [demographic]: typeof prev.audience[demographic] === 'number' 
          ? Math.max(0, Math.min(10, prev.audience[demographic] + delta))
          : prev.audience[demographic]
      }
    }));
  }, []);

  // Update genre credibility
  const updateGenreCredibility = useCallback((genre, delta) => {
    setGameState(prev => ({
      ...prev,
      audience: {
        ...prev.audience,
        genreAudience: {
          ...prev.audience.genreAudience,
          [genre]: Math.max(0, Math.min(10, prev.audience.genreAudience[genre] + delta))
        }
      }
    }));
  }, []);

  // Add connection
  const addConnection = useCallback((connection) => {
    setGameState(prev => ({
      ...prev,
      connections: [...prev.connections, {
        ...connection,
        id: Date.now(),
        relationshipLevel: 1,
        lastInteraction: prev.date
      }]
    }));
  }, []);

  // Update connection relationship
  const updateConnection = useCallback((connectionId, updates) => {
    setGameState(prev => ({
      ...prev,
      connections: prev.connections.map(conn => 
        conn.id === connectionId ? { ...conn, ...updates } : conn
      )
    }));
  }, []);

  // Advance time
  const advanceTime = useCallback((hours = 1) => {
    setGameState(prev => {
      const [hour, minute] = prev.time.split(':').map(Number);
      let newHour = hour + hours;
      let newDate = prev.date;
      
      if (newHour >= 24) {
        // Advance to next day
        const date = new Date(prev.date);
        date.setDate(date.getDate() + Math.floor(newHour / 24));
        newDate = date.toISOString().split('T')[0];
        newHour = newHour % 24;
      }
      
      return {
        ...prev,
        date: newDate,
        time: `${String(newHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      };
    });
  }, []);

  // Roll dice
  const rollDice = useCallback((sides = 6, modifier = 0) => {
    const roll = Math.floor(Math.random() * sides) + 1;
    return { roll, modified: roll + modifier, modifier };
  }, []);

  // Check milestones
  const checkMilestones = useCallback((stats) => {
    const reached = [];
    CAREER_MILESTONES.forEach(milestone => {
      if (milestone.listeners && stats.totalListeners >= milestone.listeners) {
        reached.push(milestone);
      }
      if (milestone.covers && stats.totalCovers >= milestone.covers) {
        reached.push(milestone);
      }
      if (milestone.songwriterRep && gameState.meters.SongwriterRep >= milestone.songwriterRep) {
        reached.push(milestone);
      }
    });
    return reached;
  }, [gameState.meters.SongwriterRep]);

  // Update gear
  const upgradeGear = useCallback((newGear) => {
    setGameState(prev => ({
      ...prev,
      gear: newGear
    }));
  }, []);

  // Add fatigue
  const addFatigue = useCallback((amount = 1) => {
    setGameState(prev => ({
      ...prev,
      work: {
        ...prev.work,
        fatigue: prev.work.fatigue + amount
      }
    }));
  }, []);

  // Reset fatigue (after rest)
  const resetFatigue = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      work: {
        ...prev.work,
        fatigue: 0
      }
    }));
  }, []);

  // Generate platform reaction
  const generatePlatformReaction = useCallback((platform, songTitle, reputation) => {
    const reactions = {
      twitter: [
        `This ${songTitle} track from @blackberrysoul is raw talent 🔥`,
        `Finally, authentic country music. ${songTitle} hits different`,
        `Been playing ${songTitle} on repeat all day. This kid's got something`
      ],
      tiktok: [
        `duetting this NOW!! ${songTitle} is everything`,
        `POV: you just discovered ${songTitle} and your life changed`,
        `Using this sound for everything now #${songTitle.replace(/\s+/g, '')}`
      ],
      instagram: [
        `The storytelling in ${songTitle} 😭❤️`,
        `Just found my new favorite artist through ${songTitle}`,
        `This is what country music needs right now`
      ],
      youtube: [
        `The emotion at 2:14 gave me literal chills`,
        `Finally someone telling real stories. ${songTitle} is a masterpiece`,
        `Radio needs to pick this up immediately`
      ]
    };
    
    const platformReactions = reactions[platform] || reactions.twitter;
    return platformReactions[Math.floor(Math.random() * platformReactions.length)];
  }, []);

  const value = {
    gameState,
    isGameMode,
    setIsGameMode,
    updateMeter,
    updateWallet,
    updateAudience,
    updateGenreCredibility,
    addConnection,
    updateConnection,
    advanceTime,
    rollDice,
    checkMilestones,
    upgradeGear,
    addFatigue,
    resetFatigue,
    generatePlatformReaction,
    resetGameState: () => setGameState(INITIAL_GAME_STATE)
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};
