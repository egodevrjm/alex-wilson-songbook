import React from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { GEAR_LEVELS } from '../data/gameIntegration';

const GameDashboard = ({ className = '' }) => {
  const { gameState, isGameMode } = useGameState();
  
  if (!isGameMode) return null;
  
  // Defensive check for game state structure
  if (!gameState || !gameState.wallet || !gameState.meters || !gameState.audience) {
    console.error('Invalid game state structure:', gameState);
    return (
      <div className={`bg-gray-900 text-white p-4 rounded-lg shadow-lg ${className}`}>
        <p className="text-red-500">Error: Invalid game state. Please refresh the page.</p>
      </div>
    );
  }
  
  const getDayOfWeek = (dateStr) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };
  
  const getMeterColor = (value) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg shadow-lg ${className}`}>
      {/* Date/Time */}
      <div className="mb-4 text-center">
        <div className="text-xl font-bold">
          {gameState.date} ({getDayOfWeek(gameState.date)})
        </div>
        <div className="text-lg">{gameState.time}</div>
      </div>
      
      {/* Meters */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">METERS</h3>
        <div className="space-y-2">
          {Object.entries(gameState.meters).map(([meter, value]) => (
            <div key={meter}>
              <div className="flex justify-between text-xs mb-1">
                <span>{meter}</span>
                <span>{value}/10</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getMeterColor(value)}`}
                  style={{ width: `${value * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Wallet */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">WALLET</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Cash:</span>
            <span className="font-mono">${gameState.wallet.cash}</span>
          </div>
          <div className="flex justify-between">
            <span>Debt:</span>
            <span className="font-mono text-red-400">${gameState.wallet.debt}</span>
          </div>
          <div className="flex justify-between">
            <span>Royalties:</span>
            <span className="font-mono text-green-400">${gameState.wallet.royalties}/mo</span>
          </div>
          <div className="flex justify-between">
            <span>Streaming:</span>
            <span className="font-mono text-blue-400">${gameState.wallet.streamingRevenue}/mo</span>
          </div>
        </div>
      </div>
      
      {/* Gear */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">GEAR</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm">{gameState.gear}</span>
          <span className="text-xs text-gray-500">
            +{GEAR_LEVELS[gameState.gear].bonus} roll bonus
          </span>
        </div>
      </div>
      
      {/* Audience */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">AUDIENCE REACH</h3>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between">
            <span>Local:</span>
            <span>{gameState.audience.local}/10</span>
          </div>
          <div className="flex justify-between">
            <span>Regional:</span>
            <span>{gameState.audience.regional}/10</span>
          </div>
          <div className="flex justify-between">
            <span>National:</span>
            <span>{gameState.audience.national}/10</span>
          </div>
          <div className="flex justify-between">
            <span>Online:</span>
            <span>{gameState.audience.online}/10</span>
          </div>
        </div>
      </div>
      
      {/* Genre Credibility */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">GENRE CREDIBILITY</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(gameState.audience.genreAudience).map(([genre, value]) => (
            <div key={genre} className="text-xs">
              <span className="capitalize">{genre}:</span>
              <span className={`ml-1 font-bold ${value > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Connections Count */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">CONNECTIONS</h3>
        <div className="text-sm">
          {gameState.connections.length} industry contacts
        </div>
      </div>
      
      {/* Fatigue */}
      {gameState.work.fatigue > 0 && (
        <div className="text-center text-yellow-400 text-sm">
          Fatigue Level: {gameState.work.fatigue}
          {gameState.work.fatigue > 3 && <span className="block text-xs">Rest needed!</span>}
        </div>
      )}
    </div>
  );
};

export default GameDashboard;
