import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { INITIAL_SONG_ATTRIBUTES } from '../data/gameIntegration';

const SongAttributesEditor = ({ song, onUpdate, gameState }) => {
  const { theme } = useTheme();
  const [attributes, setAttributes] = useState(
    song.attributes || INITIAL_SONG_ATTRIBUTES
  );
  const [released, setReleased] = useState(song.released || false);
  const [performances, setPerformances] = useState(song.performances || []);
  const [showAddPerformance, setShowAddPerformance] = useState(false);
  
  const handleAttributeChange = (attr, value) => {
    const newValue = Math.max(1, Math.min(10, parseInt(value) || 1));
    const newAttributes = { ...attributes, [attr]: newValue };
    setAttributes(newAttributes);
    onUpdate({
      ...song,
      attributes: newAttributes
    });
  };
  
  const handleReleaseToggle = () => {
    const newReleased = !released;
    setReleased(newReleased);
    onUpdate({
      ...song,
      released: newReleased,
      releaseDate: newReleased ? new Date().toISOString() : null
    });
  };
  
  const addPerformance = (venue, date, audienceSize) => {
    const newPerformance = {
      id: Date.now(),
      venue,
      date,
      audienceSize: parseInt(audienceSize) || 0,
      timestamp: new Date().toISOString()
    };
    const newPerformances = [...performances, newPerformance];
    setPerformances(newPerformances);
    onUpdate({
      ...song,
      performances: newPerformances
    });
    setShowAddPerformance(false);
  };
  
  const getAttributeColor = (value) => {
    if (value <= 3) return 'text-red-600';
    if (value <= 6) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  return (
    <div className={`${theme.components.card.background} ${theme.components.card.border} ${theme.layout.borderRadius} p-6 shadow-lg`}>
      <h3 className="text-lg font-semibold mb-4">Song Game Attributes</h3>
      
      {/* Release Status */}
      <div className="mb-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={released}
            onChange={handleReleaseToggle}
            className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="font-medium">Released</span>
          {released && song.releaseDate && (
            <span className="text-sm text-gray-500">
              (Released: {new Date(song.releaseDate).toLocaleDateString()})
            </span>
          )}
        </label>
      </div>
      
      {/* Attributes */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Rawness (Emotional Authenticity)
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="10"
              value={attributes.rawness}
              onChange={(e) => handleAttributeChange('rawness', e.target.value)}
              className="flex-1"
            />
            <span className={`font-bold text-lg w-8 text-center ${getAttributeColor(attributes.rawness)}`}>
              {attributes.rawness}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Production Quality
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="10"
              value={attributes.production}
              onChange={(e) => handleAttributeChange('production', e.target.value)}
              className="flex-1"
            />
            <span className={`font-bold text-lg w-8 text-center ${getAttributeColor(attributes.production)}`}>
              {attributes.production}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Crossover Appeal
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="10"
              value={attributes.crossoverAppeal}
              onChange={(e) => handleAttributeChange('crossoverAppeal', e.target.value)}
              className="flex-1"
            />
            <span className={`font-bold text-lg w-8 text-center ${getAttributeColor(attributes.crossoverAppeal)}`}>
              {attributes.crossoverAppeal}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Emotional Impact
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="10"
              value={attributes.emotionalImpact}
              onChange={(e) => handleAttributeChange('emotionalImpact', e.target.value)}
              className="flex-1"
            />
            <span className={`font-bold text-lg w-8 text-center ${getAttributeColor(attributes.emotionalImpact)}`}>
              {attributes.emotionalImpact}
            </span>
          </div>
        </div>
      </div>
      
      {/* Viral Potential */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium mb-2">Viral Potential</h4>
        <div className="text-sm space-y-1">
          <div>Base roll: 1d20</div>
          {attributes.rawness > 7 && <div className="text-green-600">+1 (High rawness)</div>}
          {attributes.emotionalImpact > 7 && <div className="text-green-600">+1 (High emotional impact)</div>}
          {attributes.crossoverAppeal > 7 && <div className="text-green-600">+1 (High crossover appeal)</div>}
          <div className="font-bold mt-2">
            Total modifier: +{
              (attributes.rawness > 7 ? 1 : 0) +
              (attributes.emotionalImpact > 7 ? 1 : 0) +
              (attributes.crossoverAppeal > 7 ? 1 : 0)
            }
          </div>
        </div>
      </div>
      
      {/* Performance History */}
      <div>
        <h4 className="font-medium mb-2">Performance History</h4>
        {performances.length > 0 ? (
          <div className="space-y-2 mb-3">
            {performances.map((perf) => (
              <div key={perf.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium">{perf.venue}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {perf.date} • Audience: {perf.audienceSize}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">No performances recorded</p>
        )}
        
        {showAddPerformance ? (
          <div className="border rounded-lg p-3 space-y-2">
            <input
              type="text"
              placeholder="Venue name"
              className="w-full px-3 py-1 border rounded"
              id="venue"
            />
            <input
              type="date"
              className="w-full px-3 py-1 border rounded"
              id="date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
            <input
              type="number"
              placeholder="Audience size"
              className="w-full px-3 py-1 border rounded"
              id="audience"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const venue = document.getElementById('venue').value;
                  const date = document.getElementById('date').value;
                  const audience = document.getElementById('audience').value;
                  if (venue && date) {
                    addPerformance(venue, date, audience);
                  }
                }}
                className={`px-3 py-1 ${theme.components.button.primary} rounded text-sm`}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddPerformance(false)}
                className={`px-3 py-1 ${theme.components.button.secondary} rounded text-sm`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddPerformance(true)}
            className={`px-3 py-1 ${theme.components.button.secondary} rounded text-sm`}
          >
            Add Performance
          </button>
        )}
      </div>
    </div>
  );
};

export default SongAttributesEditor;
