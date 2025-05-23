import React from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import { CAREER_MILESTONES } from '../../data/gameIntegration';

const GameSummary = ({ onNewGame, onContinue }) => {
  const { gameState } = useGameState();
  
  // Calculate achievements
  const metersSum = Object.values(gameState.meters).reduce((sum, val) => sum + val, 0);
  const averageMeter = Math.round(metersSum / Object.keys(gameState.meters).length);
  const totalEarnings = gameState.wallet.cash + (gameState.wallet.royalties * 12) + (gameState.wallet.streamingRevenue * 12);
  const reachedMilestones = CAREER_MILESTONES.filter(milestone => {
    if (milestone.listeners && gameState.audience.online * 1000 >= milestone.listeners) return true;
    if (milestone.songwriterRep && gameState.meters.SongwriterRep >= milestone.songwriterRep) return true;
    return false;
  });

  return (
    <div className="bg-gray-900 rounded-lg p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-400 text-center mb-8">
        Story Arc Complete!
      </h1>
      
      <div className="space-y-6">
        {/* Journey Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Journey</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Days Survived:</span>
              <span className="text-white ml-2">{Math.ceil((new Date(gameState.date) - new Date('2025-05-16')) / (1000 * 60 * 60 * 24))}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Earnings:</span>
              <span className="text-green-400 ml-2">${totalEarnings}</span>
            </div>
            <div>
              <span className="text-gray-400">Average Meter:</span>
              <span className="text-yellow-400 ml-2">{averageMeter}/10</span>
            </div>
            <div>
              <span className="text-gray-400">Gear Level:</span>
              <span className="text-blue-400 ml-2">{gameState.gear}</span>
            </div>
          </div>
        </div>

        {/* Character Development */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Character Development</h2>
          <div className="space-y-3">
            {Object.entries(gameState.meters).map(([meter, value]) => (
              <div key={meter}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{meter}</span>
                  <span className="text-white">{value}/10</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      value <= 3 ? 'bg-red-500' :
                      value <= 6 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${value * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Reach */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Audience Reach</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(gameState.audience).filter(([key]) => key !== 'genreAudience').map(([demographic, value]) => (
              <div key={demographic} className="flex justify-between">
                <span className="text-gray-300 capitalize">{demographic}:</span>
                <span className="text-white">{value}/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones Reached */}
        {reachedMilestones.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Milestones Achieved</h2>
            <ul className="space-y-2">
              {reachedMilestones.map((milestone, i) => (
                <li key={i} className="text-green-400 flex items-center gap-2">
                  <span>✓</span>
                  <span>{milestone.event}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Story Summary */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Story</h2>
          <p className="text-gray-300 italic">
            {gameState.meters.Hope > gameState.meters.Rage 
              ? "Through the darkness, you found light. Your music became a beacon of hope, transforming pain into purpose."
              : gameState.meters.Authenticity > 7
              ? "Raw and unfiltered, your truth resonated with thousands. You stayed true to yourself, no matter the cost."
              : "The journey was hard, but you survived. Every struggle shaped the artist you're becoming."
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onContinue}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg transition-colors font-semibold"
          >
            Continue Playing
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors font-semibold"
          >
            New Story
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSummary;
