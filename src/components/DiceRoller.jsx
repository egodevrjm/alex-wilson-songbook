import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { GEAR_LEVELS } from '../data/gameIntegration';

const DiceRoller = ({ onRoll, modifiers = [] }) => {
  const { gameState, rollDice } = useGameState();
  const [lastRoll, setLastRoll] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const handleRoll = (sides = 6) => {
    // Calculate total modifier
    let totalModifier = 0;
    
    // Add gear bonus
    totalModifier += GEAR_LEVELS[gameState.gear].bonus;
    
    // Add any additional modifiers passed in
    modifiers.forEach(mod => {
      totalModifier += mod.value;
    });
    
    const result = rollDice(sides, totalModifier);
    setLastRoll(result);
    setShowResult(true);
    
    if (onRoll) {
      onRoll(result);
    }
    
    // Hide result after 5 seconds
    setTimeout(() => setShowResult(false), 5000);
  };
  
  const getResultColor = (roll) => {
    if (roll <= 2) return 'text-red-600';
    if (roll <= 4) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getResultText = (roll) => {
    if (roll <= 2) return 'Stumble';
    if (roll <= 4) return 'Hold';
    if (roll === 5) return 'Stride';
    return 'Spark!';
  };
  
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Dice Roller</h3>
      
      {/* Roll buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => handleRoll(6)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Roll 1d6
        </button>
        <button
          onClick={() => handleRoll(20)}
          className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Roll 1d20
        </button>
      </div>
      
      {/* Modifiers display */}
      <div className="text-sm space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Gear bonus ({gameState.gear}):</span>
          <span className="font-mono">+{GEAR_LEVELS[gameState.gear].bonus}</span>
        </div>
        {modifiers.map((mod, index) => (
          <div key={index} className="flex justify-between">
            <span>{mod.name}:</span>
            <span className="font-mono">{mod.value >= 0 ? '+' : ''}{mod.value}</span>
          </div>
        ))}
      </div>
      
      {/* Result display */}
      {showResult && lastRoll && (
        <div className="bg-gray-800 p-4 rounded-lg text-center animate-pulse">
          <div className="text-3xl font-bold mb-2">
            <span className={getResultColor(lastRoll.roll)}>
              {lastRoll.roll}
            </span>
            {lastRoll.modifier !== 0 && (
              <span className="text-xl text-gray-400 ml-2">
                {lastRoll.modifier >= 0 ? '+' : ''}{lastRoll.modifier} = {lastRoll.modified}
              </span>
            )}
          </div>
          <div className={`text-lg font-medium ${getResultColor(lastRoll.modified)}`}>
            {getResultText(lastRoll.modified)}
          </div>
        </div>
      )}
      
      {/* Quick reference */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="font-semibold mb-1">Quick Reference:</div>
        <div>1-2: Stumble (-1 Rep)</div>
        <div>3-4: Hold (no change)</div>
        <div>5: Stride (+1 Rep)</div>
        <div>6+: Spark! (+2 Rep)</div>
      </div>
    </div>
  );
};

export default DiceRoller;
