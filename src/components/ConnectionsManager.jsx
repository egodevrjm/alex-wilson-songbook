import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { CONNECTION_TYPES } from '../data/gameIntegration';
import { useTheme } from '../contexts/ThemeContext';

const ConnectionsManager = () => {
  const { theme } = useTheme();
  const { gameState, addConnection, updateConnection } = useGameState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  
  const handleAddConnection = (formData) => {
    addConnection({
      name: formData.name,
      type: formData.type,
      influence: CONNECTION_TYPES[formData.type].influence,
      notes: formData.notes,
      reputation: parseInt(formData.reputation) || 1
    });
    setShowAddForm(false);
  };
  
  const handleUpdateRelationship = (connectionId, delta) => {
    const connection = gameState.connections.find(c => c.id === connectionId);
    if (connection) {
      const newLevel = Math.max(1, Math.min(5, connection.relationshipLevel + delta));
      updateConnection(connectionId, { 
        relationshipLevel: newLevel,
        lastInteraction: gameState.date
      });
    }
  };
  
  const getRelationshipStars = (level) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };
  
  const getConnectionColor = (type) => {
    const colors = {
      VENUE_OWNER: 'text-purple-600',
      PRODUCER: 'text-blue-600',
      ARTIST: 'text-green-600',
      EXECUTIVE: 'text-red-600',
      MEDIA: 'text-yellow-600'
    };
    return colors[type] || 'text-gray-600';
  };
  
  return (
    <div className={`${theme.components.card.background} ${theme.components.card.border} ${theme.layout.borderRadius} p-6 shadow-lg`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Industry Connections</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className={`${theme.components.button.primary} px-4 py-2 rounded-lg`}
        >
          Add Connection
        </button>
      </div>
      
      {/* Connection List */}
      {gameState.connections.length > 0 ? (
        <div className="space-y-4">
          {gameState.connections.map(connection => (
            <div
              key={connection.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                selectedConnection?.id === connection.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedConnection(connection)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{connection.name}</h3>
                  <p className={`text-sm font-medium ${getConnectionColor(connection.type)}`}>
                    {connection.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Influence: {connection.influence} • Rep: {connection.reputation}
                  </p>
                  {connection.notes && (
                    <p className="text-sm text-gray-500 mt-1">{connection.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-yellow-500 text-lg mb-1">
                    {getRelationshipStars(connection.relationshipLevel)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Last: {connection.lastInteraction}
                  </p>
                </div>
              </div>
              
              {/* Opportunities */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Opportunities:
                </p>
                <div className="flex flex-wrap gap-2">
                  {CONNECTION_TYPES[connection.type].opportunities.map(opp => (
                    <span
                      key={opp}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                    >
                      {opp}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Relationship Actions */}
              {selectedConnection?.id === connection.id && (
                <div className="mt-4 pt-4 border-t flex justify-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateRelationship(connection.id, -1);
                    }}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  >
                    Damage (-1)
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateRelationship(connection.id, 1);
                    }}
                    className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm"
                  >
                    Strengthen (+1)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No connections yet</p>
          <p className="text-sm">Build your network as your career grows!</p>
        </div>
      )}
      
      {/* Add Connection Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.components.card.background} rounded-lg p-6 max-w-md w-full`}>
            <h3 className="text-lg font-semibold mb-4">Add New Connection</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddConnection({
                  name: formData.get('name'),
                  type: formData.get('type'),
                  notes: formData.get('notes'),
                  reputation: formData.get('reputation')
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Tyler Jenkins"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(CONNECTION_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {key.replace(/_/g, ' ')} ({value.influence})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Their Reputation (1-10)
                  </label>
                  <input
                    type="number"
                    name="reputation"
                    min="1"
                    max="10"
                    defaultValue="3"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Met at The Hollow open mic..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`${theme.components.button.secondary} px-4 py-2 rounded-lg`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${theme.components.button.primary} px-4 py-2 rounded-lg`}
                >
                  Add Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsManager;
