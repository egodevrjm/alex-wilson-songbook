import React from 'react';
import { getStartingScenes } from '../../data/gameScenes';

const SceneSelector = ({ onSceneSelect }) => {
  const scenes = getStartingScenes();

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
        Choose Your Starting Point
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenes.map(scene => (
          <button
            key={scene.id}
            onClick={() => onSceneSelect(scene.id)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-600 rounded-lg p-4 text-left transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{scene.title}</h3>
              <span className="text-xs text-gray-400">Day {scene.day}</span>
            </div>
            
            <div className="text-sm text-gray-400 mb-2">
              {scene.date} • {scene.timeOfDay}
            </div>
            
            <p className="text-sm text-gray-300 line-clamp-2">
              {scene.narrative.substring(0, 100)}...
            </p>
            
            {scene.cues && scene.cues.length > 0 && (
              <div className="mt-2 flex gap-2">
                {scene.cues.slice(0, 3).map((cue, i) => (
                  <span key={i} className="text-lg" title={cue.text}>
                    {cue.icon}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Each starting point offers a unique perspective on Alex's journey.</p>
        <p>Your choices will shape his story and musical career.</p>
      </div>
    </div>
  );
};

export default SceneSelector;
