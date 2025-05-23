import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SongRelationshipManager = ({ songs, onSongUpdate, onNavigateToSong }) => {
  const { theme } = useTheme();
  const [relationships, setRelationships] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [relationshipForm, setRelationshipForm] = useState({
    type: 'cover', // 'cover', 'original', 'version', 'inspired-by', 'same-melody', 'sequel'
    targetSong: '',
    description: '',
    direction: 'outgoing' // 'outgoing' or 'incoming'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list', 'graph', 'tree'
  const [filterType, setFilterType] = useState('all');

  // Relationship types with descriptions
  const relationshipTypes = [
    { 
      value: 'cover', 
      label: 'Cover Of', 
      description: 'This song is a cover version of another song',
      icon: '🎵'
    },
    { 
      value: 'original', 
      label: 'Original Of', 
      description: 'This song is the original that was covered',
      icon: '🎼'
    },
    { 
      value: 'version', 
      label: 'Alternative Version', 
      description: 'Different version of the same song (demo, live, remix)',
      icon: '🔄'
    },
    { 
      value: 'inspired-by', 
      label: 'Inspired By', 
      description: 'This song was inspired by another song',
      icon: '💡'
    },
    { 
      value: 'same-melody', 
      label: 'Same Melody', 
      description: 'Songs that share the same melody but different lyrics',
      icon: '🎶'
    },
    { 
      value: 'sequel', 
      label: 'Sequel/Prequel', 
      description: 'Story continuation or part of a song series',
      icon: '📖'
    },
    { 
      value: 'response', 
      label: 'Response Song', 
      description: 'A song written as a response to another',
      icon: '💬'
    },
    { 
      value: 'medley', 
      label: 'Part of Medley', 
      description: 'Songs that are performed together in a medley',
      icon: '🎭'
    }
  ];

  // Load relationships from localStorage on component mount
  useEffect(() => {
    const savedRelationships = localStorage.getItem('songbook-relationships');
    if (savedRelationships) {
      setRelationships(JSON.parse(savedRelationships));
    }
  }, []);

  // Save relationships to localStorage whenever relationships change
  useEffect(() => {
    localStorage.setItem('songbook-relationships', JSON.stringify(relationships));
  }, [relationships]);

  // Create new relationship
  const createRelationship = () => {
    if (!selectedSong || !relationshipForm.targetSong || !relationshipForm.type) return;

    const newRelationship = {
      id: `rel-${Date.now()}`,
      source: selectedSong.slug,
      target: relationshipForm.targetSong,
      type: relationshipForm.type,
      description: relationshipForm.description.trim(),
      createdAt: new Date().toISOString()
    };

    setRelationships(prev => [...prev, newRelationship]);
    
    // Reset form
    setRelationshipForm({
      type: 'cover',
      targetSong: '',
      description: '',
      direction: 'outgoing'
    });
    setShowRelationshipModal(false);
  };

  // Delete relationship
  const deleteRelationship = (relationshipId) => {
    setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
  };

  // Get relationships for a specific song
  const getSongRelationships = (songSlug) => {
    return relationships.filter(rel => 
      rel.source === songSlug || rel.target === songSlug
    ).map(rel => {
      const isOutgoing = rel.source === songSlug;
      const relatedSongSlug = isOutgoing ? rel.target : rel.source;
      const relatedSong = songs.find(s => s.slug === relatedSongSlug);
      
      return {
        ...rel,
        isOutgoing,
        relatedSong,
        direction: isOutgoing ? 'outgoing' : 'incoming'
      };
    });
  };

  // Get all songs related to a song (direct and indirect)
  const getAllRelatedSongs = (songSlug, visited = new Set()) => {
    if (visited.has(songSlug)) return [];
    
    visited.add(songSlug);
    const directRelations = getSongRelationships(songSlug);
    let allRelated = [...directRelations];
    
    // Recursively get relationships of related songs
    directRelations.forEach(relation => {
      if (relation.relatedSong) {
        const indirectRelations = getAllRelatedSongs(relation.relatedSong.slug, visited);
        allRelated = [...allRelated, ...indirectRelations];
      }
    });
    
    return allRelated;
  };

  // Get songs that have no relationships
  const getOrphanSongs = () => {
    const relatedSlugs = new Set();
    relationships.forEach(rel => {
      relatedSlugs.add(rel.source);
      relatedSlugs.add(rel.target);
    });
    return songs.filter(song => !relatedSlugs.has(song.slug));
  };

  // Get relationship statistics
  const getRelationshipStats = () => {
    const stats = {
      totalRelationships: relationships.length,
      songsWithRelationships: new Set([
        ...relationships.map(r => r.source),
        ...relationships.map(r => r.target)
      ]).size,
      orphanSongs: getOrphanSongs().length,
      typeBreakdown: {}
    };

    relationshipTypes.forEach(type => {
      stats.typeBreakdown[type.value] = relationships.filter(r => r.type === type.value).length;
    });

    return stats;
  };

  // Filter songs based on relationship filter
  const getFilteredSongs = () => {
    if (filterType === 'all') return songs;
    if (filterType === 'orphans') return getOrphanSongs();
    if (filterType === 'connected') {
      const connectedSlugs = new Set([
        ...relationships.map(r => r.source),
        ...relationships.map(r => r.target)
      ]);
      return songs.filter(song => connectedSlugs.has(song.slug));
    }
    return songs.filter(song => {
      const songRelationships = getSongRelationships(song.slug);
      return songRelationships.some(rel => rel.type === filterType);
    });
  };

  // Get available target songs (excluding the selected song and already related songs)
  const getAvailableTargetSongs = () => {
    if (!selectedSong) return [];
    
    const relatedSlugs = new Set(
      getSongRelationships(selectedSong.slug).map(rel => rel.relatedSong?.slug)
    );
    relatedSlugs.add(selectedSong.slug); // Exclude self
    
    return songs.filter(song => !relatedSlugs.has(song.slug));
  };

  const stats = getRelationshipStats();
  const filteredSongs = getFilteredSongs();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Song Relationships</h2>
          <p className="text-gray-600 mt-1">
            Track connections between covers, versions, and related songs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
            className={`px-3 py-1 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
          >
            {viewMode === 'graph' ? 'List View' : 'Graph View'}
          </button>
        </div>
      </div>

      {/* Content area with proper overflow */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Statistics */}
        <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-4`}>
          <h3 className="text-lg font-semibold mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRelationships}</div>
              <div className="text-sm text-gray-600">Total Relationships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.songsWithRelationships}</div>
              <div className="text-sm text-gray-600">Connected Songs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.orphanSongs}</div>
              <div className="text-sm text-gray-600">Unconnected Songs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((stats.songsWithRelationships / songs.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Coverage</div>
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Relationship Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {relationshipTypes.map(type => (
                <div key={type.value} className="flex items-center justify-between text-sm">
                  <span>{type.icon} {type.label}:</span>
                  <span className="font-medium">{stats.typeBreakdown[type.value] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Songs</option>
            <option value="connected">Connected Songs</option>
            <option value="orphans">Unconnected Songs</option>
            {relationshipTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} ({stats.typeBreakdown[type.value] || 0})
              </option>
            ))}
          </select>
        </div>

        {viewMode === 'list' ? (
          /* List View with improved grid layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
            {filteredSongs.map(song => {
              const songRelationships = getSongRelationships(song.slug);
              
              return (
                <div
                  key={song.slug}
                  className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-4 h-fit`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{song.title}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedSong(song);
                          setShowRelationshipModal(true);
                        }}
                        className={`px-2 py-1 text-xs ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors`}
                        title="Add Relationship"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {songRelationships.length === 0 ? (
                    <p className="text-gray-500 text-sm">No relationships</p>
                  ) : (
                    <div className="space-y-2">
                      {songRelationships.map(relation => {
                        const relationshipType = relationshipTypes.find(t => t.value === relation.type);
                        
                        return (
                          <div key={relation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span>{relationshipType?.icon}</span>
                              <div>
                                <div className="font-medium text-sm">
                                  {relation.isOutgoing ? relationshipType?.label : `${relationshipType?.label} of`}:
                                  <span 
                                    className="text-blue-600 ml-1 cursor-pointer hover:text-blue-800 hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (relation.relatedSong && onNavigateToSong) {
                                        // Find the song index in the main songs array
                                        const songIndex = songs.findIndex(s => s.slug === relation.relatedSong.slug);
                                        if (songIndex !== -1) {
                                          onNavigateToSong(songIndex);
                                        }
                                      }
                                    }}
                                    title="Click to view song"
                                  >
                                    {relation.relatedSong?.title || 'Unknown Song'}
                                  </span>
                                </div>
                                {relation.description && (
                                  <div className="text-xs text-gray-600">{relation.description}</div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteRelationship(relation.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete Relationship"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSongs.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>No songs match the current filter</p>
              </div>
            )}
          </div>
        ) : (
          /* Graph View */
          <RelationshipGraph
            songs={songs}
            relationships={relationships}
            onSongSelect={setSelectedSong}
            onDeleteRelationship={deleteRelationship}
            onNavigateToSong={onNavigateToSong}
            theme={theme}
          />
        )}
      </div>

      {/* Add Relationship Modal */}
      {showRelationshipModal && selectedSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme.components.modal?.background || 'bg-white'} ${theme.layout.borderRadius} p-6 w-96 max-w-90vw`}>
            <h3 className="text-lg font-semibold mb-4">Add Relationship</h3>
            <p className="text-sm text-gray-600 mb-4">
              Creating relationship for: <strong>{selectedSong.title}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type</label>
                <select
                  value={relationshipForm.type}
                  onChange={(e) => setRelationshipForm(prev => ({ ...prev, type: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  {relationshipTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {relationshipTypes.find(t => t.value === relationshipForm.type)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Song</label>
                <select
                  value={relationshipForm.targetSong}
                  onChange={(e) => setRelationshipForm(prev => ({ ...prev, targetSong: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select a song...</option>
                  {getAvailableTargetSongs().map(song => (
                    <option key={song.slug} value={song.slug}>{song.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={relationshipForm.description}
                  onChange={(e) => setRelationshipForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full ${theme.components.input?.background || 'bg-white'} ${theme.components.input?.border || 'border border-gray-300'} ${theme.layout.borderRadius} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  rows={3}
                  placeholder="Additional details about this relationship..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRelationshipModal(false);
                  setRelationshipForm({
                    type: 'cover',
                    targetSong: '',
                    description: '',
                    direction: 'outgoing'
                  });
                }}
                className={`px-4 py-2 ${theme.components.button.secondary} ${theme.layout.borderRadius} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={createRelationship}
                disabled={!relationshipForm.targetSong}
                className={`px-4 py-2 ${theme.components.button.primary} ${theme.layout.borderRadius} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Add Relationship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Relationship Graph Component (simplified SVG-based graph)
const RelationshipGraph = ({ 
  songs, 
  relationships, 
  onSongSelect, 
  onDeleteRelationship,
  onNavigateToSong,
  theme 
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Create nodes and edges for the graph
  const nodes = songs.map((song, index) => ({
    id: song.slug,
    title: song.title,
    x: 100 + (index % 6) * 120,
    y: 100 + Math.floor(index / 6) * 100,
    connected: relationships.some(r => r.source === song.slug || r.target === song.slug)
  }));

  const edges = relationships.map(rel => {
    const sourceNode = nodes.find(n => n.id === rel.source);
    const targetNode = nodes.find(n => n.id === rel.target);
    return {
      ...rel,
      sourceNode,
      targetNode
    };
  }).filter(edge => edge.sourceNode && edge.targetNode);

  return (
    <div className={`${theme.components.card?.background || 'bg-white'} ${theme.components.card?.border || 'border border-gray-200'} ${theme.layout.borderRadius} p-4 overflow-auto h-full`}>
      <div className="w-full h-96 overflow-auto">
        <svg width="800" height="600" className="border border-gray-200 rounded">
          {/* Edges */}
          {edges.map(edge => (
            <g key={edge.id}>
              <line
                x1={edge.sourceNode.x}
                y1={edge.sourceNode.y}
                x2={edge.targetNode.x}
                y2={edge.targetNode.y}
                stroke="#3B82F6"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(edge.sourceNode.x + edge.targetNode.x) / 2}
                y={(edge.sourceNode.y + edge.targetNode.y) / 2}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {edge.type}
              </text>
            </g>
          ))}

          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={node.connected ? '#3B82F6' : '#6B7280'}
                stroke={selectedNode === node.id ? '#EF4444' : '#374151'}
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80"
                onClick={() => {
                  setSelectedNode(node.id);
                  onSongSelect(songs.find(s => s.slug === node.id));
                }}
                onDoubleClick={() => {
                  if (onNavigateToSong) {
                    const songIndex = songs.findIndex(s => s.slug === node.id);
                    if (songIndex !== -1) {
                      onNavigateToSong(songIndex);
                    }
                  }
                }}
              />
              <text
                x={node.x}
                y={node.y - 30}
                textAnchor="middle"
                className="text-xs fill-gray-700 pointer-events-none max-w-[100px] overflow-hidden"
              >
                {node.title.length > 15 ? `${node.title.substring(0, 12)}...` : node.title}
              </text>
            </g>
          ))}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#3B82F6"
              />
            </marker>
          </defs>
        </svg>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Click on a song to view and manage its relationships</p>
        <p>🔍 Double-click to navigate to the song</p>
        <p>🔵 Blue circles have relationships • ⚫ Grey circles have no relationships</p>
      </div>
    </div>
  );
};

export default SongRelationshipManager;
