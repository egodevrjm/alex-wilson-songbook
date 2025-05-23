import React, { useState } from 'react';
import GameDashboard from './GameDashboard';
import DiceRoller from './DiceRoller';
import ConnectionsManager from './ConnectionsManager';
import SocialMediaFeed from './SocialMediaFeed';
import GameNarrative from './game/GameNarrative';
import { useGameState } from '../contexts/GameStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { CAREER_MILESTONES } from '../data/gameIntegration';

const GameView = ({ songs }) => {
  const { theme } = useTheme();
  const { gameState, advanceTime, updateMeter, updateWallet, checkMilestones, isGameMode } = useGameState();
  const [selectedTab, setSelectedTab] = useState(isGameMode ? 'narrative' : 'dashboard');
  const [selectedSong, setSelectedSong] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const releasedSongs = songs.filter(song => song.released);
  
  const handleTimeAdvance = (hours) => {
    advanceTime(hours);
    
    // Check for rent due (every Friday)
    const date = new Date(gameState.date);
    if (date.getDay() === 5) {
      addNotification('Rent Due', 'Your $50 rent is due today!', 'warning');
    }
    
    // Add fatigue for working
    if (hours >= 3) {
      addNotification('Fatigue', 'You\'re getting tired from working. Consider resting.', 'info');
    }
  };
  
  const addNotification = (title, message, type = 'info') => {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };
  
  const handleDiceRoll = (result) => {
    // Apply dice results based on outcome
    if (result.modified <= 2) {
      updateMeter('Reputation', -1);
      addNotification('Stumble!', 'Your performance didn\'t go well. -1 Reputation', 'error');
    } else if (result.modified === 5) {
      updateMeter('Reputation', 1);
      addNotification('Stride!', 'Good performance! +1 Reputation', 'success');
    } else if (result.modified >= 6) {
      updateMeter('Reputation', 2);
      addNotification('Spark!', 'Amazing performance! +2 Reputation', 'success');
    }
  };
  
  const tabs = [
    { id: 'narrative', label: 'Story', icon: '📖' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'dice', label: 'Dice', icon: '🎲' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'connections', label: 'Connections', icon: '🤝' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'milestones', label: 'Milestones', icon: '🏆' }
  ];
  
  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-md border-b">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="font-semibold">{notification.title}</div>
            <div className="text-sm">{notification.message}</div>
          </div>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {selectedTab === 'narrative' && (
          <div className="h-full">
            <GameNarrative songs={songs} />
          </div>
        )}
        
        {selectedTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <div className={`${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6`}>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleTimeAdvance(1)}
                    className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <div className="text-2xl mb-1">⏰</div>
                    <div className="text-sm">+1 Hour</div>
                  </button>
                  <button
                    onClick={() => {
                      updateWallet('cash', -10);
                      updateMeter('Hope', 1);
                      addNotification('Meal', 'You bought food. +1 Hope, -$10', 'info');
                    }}
                    className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    <div className="text-2xl mb-1">🍔</div>
                    <div className="text-sm">Buy Food</div>
                  </button>
                  <button
                    onClick={() => {
                      updateMeter('Hope', 2);
                      handleTimeAdvance(8);
                      addNotification('Rest', 'You got some rest. +2 Hope', 'success');
                    }}
                    className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg text-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    <div className="text-2xl mb-1">🛏️</div>
                    <div className="text-sm">Rest</div>
                  </button>
                  <button
                    onClick={() => {
                      updateWallet('cash', 75);
                      handleTimeAdvance(8);
                      addNotification('Work', 'You worked a shift. +$75', 'success');
                    }}
                    className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                  >
                    <div className="text-2xl mb-1">⛏️</div>
                    <div className="text-sm">Work Shift</div>
                  </button>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className={`${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6`}>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start performing songs and building connections to see activity here.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Game Dashboard */}
            <div>
              <GameDashboard />
            </div>
          </div>
        )}
        
        {selectedTab === 'dice' && (
          <div className="max-w-2xl mx-auto">
            <DiceRoller onRoll={handleDiceRoll} />
            
            {/* Roll History */}
            <div className={`mt-6 ${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6`}>
              <h3 className="text-lg font-semibold mb-4">Performance Opportunities</h3>
              <div className="space-y-3">
                <button
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    addNotification('Open Mic', 'Roll for your open mic performance!', 'info');
                  }}
                >
                  <div className="font-medium">Open Mic Night</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Perform at The Hollow's open mic
                  </div>
                </button>
                
                {releasedSongs.length > 0 && (
                  <button
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      addNotification('Song Release', 'Roll for your song release reception!', 'info');
                    }}
                  >
                    <div className="font-medium">Release a Song Online</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Upload to streaming platforms
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === 'social' && (
          <div className="max-w-4xl mx-auto">
            {/* Song selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select a Song</label>
              <select
                value={selectedSong?.slug || ''}
                onChange={(e) => {
                  const song = songs.find(s => s.slug === e.target.value);
                  setSelectedSong(song);
                }}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Choose a song...</option>
                {songs.map(song => (
                  <option key={song.slug} value={song.slug}>
                    {song.title} {song.released ? '(Released)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSong && (
              <div className="space-y-6">
                <SocialMediaFeed song={selectedSong} platform="twitter" />
                <SocialMediaFeed song={selectedSong} platform="tiktok" />
              </div>
            )}
          </div>
        )}
        
        {selectedTab === 'connections' && (
          <div className="max-w-4xl mx-auto">
            <ConnectionsManager />
          </div>
        )}
        
        {selectedTab === 'timeline' && (
          <div className="max-w-4xl mx-auto">
            <div className={`${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6`}>
              <h3 className="text-lg font-semibold mb-4">Game Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold">{gameState.date}</div>
                  <div className="text-xl">{gameState.time}</div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleTimeAdvance(1)}
                    className={`w-full ${theme.components.button.secondary} py-2 rounded`}
                  >
                    Advance 1 Hour
                  </button>
                  <button
                    onClick={() => handleTimeAdvance(8)}
                    className={`w-full ${theme.components.button.secondary} py-2 rounded`}
                  >
                    Advance 8 Hours (Work/Sleep)
                  </button>
                  <button
                    onClick={() => handleTimeAdvance(24)}
                    className={`w-full ${theme.components.button.secondary} py-2 rounded`}
                  >
                    Advance 1 Day
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === 'milestones' && (
          <div className="max-w-4xl mx-auto">
            <div className={`${theme.components.card.background} ${theme.components.card.border} rounded-lg p-6`}>
              <h3 className="text-lg font-semibold mb-4">Career Milestones</h3>
              <div className="space-y-4">
                {CAREER_MILESTONES.map((milestone, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      milestone.listeners && gameState.audience.online * 1000 >= milestone.listeners
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{milestone.event}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {milestone.listeners && `${milestone.listeners.toLocaleString()} listeners`}
                      {milestone.covers && `${milestone.covers} cover${milestone.covers > 1 ? 's' : ''}`}
                      {milestone.songwriterRep && `Songwriter Rep: ${milestone.songwriterRep}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameView;
