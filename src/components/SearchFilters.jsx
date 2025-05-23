import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SearchFilters = ({ 
  searchQuery = '', 
  setSearchQuery, 
  filters = {}, 
  setFilters, 
  sortOptions = 'title-asc', 
  setSortOption,
  onSaveFilterCombo,
  savedFilterCombos = [],
  onLoadFilterCombo 
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const searchInputRef = useRef(null);

  // Ensure filters has default values
  const safeFilters = {
    contentType: 'all',
    searchWithin: 'all',
    dateRange: {},
    hasAudio: undefined,
    hasImage: undefined,
    hasNotes: undefined,
    hasSoundsLike: undefined,
    recentlyModified: undefined,
    ...filters
  };

  // Quick filter presets
  const quickFilters = [
    { 
      label: 'Songs with Audio', 
      filter: { hasAudio: true },
      icon: '🎵'
    },
    { 
      label: 'Songs with Images', 
      filter: { hasImage: true },
      icon: '🖼️'
    },
    { 
      label: 'Recently Modified', 
      filter: { recentlyModified: true },
      icon: '🕒'
    },
    { 
      label: 'Has Notes', 
      filter: { hasNotes: true },
      icon: '📝'
    },
    { 
      label: 'Has "Sounds Like"', 
      filter: { hasSoundsLike: true },
      icon: '🎸'
    }
  ];

  // Sort options
  const sortOptionsList = [
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'newest-first', label: 'Newest First' },
    { value: 'oldest-first', label: 'Oldest First' },
    { value: 'recently-modified', label: 'Recently Modified' },
    { value: 'recently-played', label: 'Recently Played' }
  ];

  // Content type options
  const contentTypes = [
    { value: 'all', label: 'All Content' },
    { value: 'lyrics', label: 'Has Lyrics' },
    { value: 'tracklist', label: 'Tracklist Only' },
    { value: 'other', label: 'Other/Notes Only' }
  ];

  // Search within options
  const searchWithinOptions = [
    { value: 'all', label: 'Search All' },
    { value: 'lyrics', label: 'Lyrics Only' },
    { value: 'notes', label: 'Notes Only' },
    { value: 'sounds-like', label: 'Sounds Like Only' },
    { value: 'title', label: 'Title Only' }
  ];

  // Handle quick filter toggle
  const handleQuickFilter = (filterKey, filterValue) => {
    if (!setFilters) return;
    
    const currentValue = safeFilters[filterKey];
    setFilters(prev => ({
      ...prev,
      [filterKey]: currentValue === filterValue ? undefined : filterValue
    }));
  };

  // Handle date range changes
  const handleDateRangeChange = (field, value) => {
    if (!setFilters) return;
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...(prev.dateRange || {}),
        [field]: value
      }
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    if (!setFilters || !setSearchQuery) return;
    
    setFilters({
      contentType: 'all',
      searchWithin: 'all',
      dateRange: {},
      hasAudio: undefined,
      hasImage: undefined,
      hasNotes: undefined,
      hasSoundsLike: undefined,
      recentlyModified: undefined
    });
    setSearchQuery('');
  };

  // Save current filter combination
  const saveFilterCombo = () => {
    if (!filterName.trim() || !onSaveFilterCombo) return;
    
    onSaveFilterCombo(filterName.trim(), { 
      filters: safeFilters,
      searchQuery,
      sortOption: sortOptions 
    });
    setFilterName('');
    setShowSaveDialog(false);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchQuery ||
      safeFilters.contentType !== 'all' ||
      safeFilters.searchWithin !== 'all' ||
      Object.keys(safeFilters.dateRange || {}).length > 0 ||
      safeFilters.hasAudio ||
      safeFilters.hasImage ||
      safeFilters.hasNotes ||
      safeFilters.hasSoundsLike ||
      safeFilters.recentlyModified
    );
  };

  // Safe setters with fallbacks
  const safeSetSearchQuery = (value) => {
    if (setSearchQuery) {
      setSearchQuery(value);
    }
  };

  const safeSetFilters = (updater) => {
    if (setFilters) {
      setFilters(updater);
    }
  };

  const safeSetSortOption = (value) => {
    if (setSortOption) {
      setSortOption(value);
    }
  };

  return (
    <div className={`${theme?.components?.card?.background || 'bg-white'} ${theme?.components?.card?.border || 'border border-gray-200'} ${theme?.layout?.borderRadius || 'rounded-lg'} ${theme?.layout?.spacing || 'p-4'} mb-4`}>
      {/* Search Bar */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search songs, lyrics, notes, or 'sounds like'..."
          className={`w-full pl-10 pr-12 py-3 ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          value={searchQuery || ''}
          onChange={(e) => safeSetSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute inset-y-0 right-0 pr-3 flex items-center ${hasActiveFilters() ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600 transition-colors`}
          title="Advanced filters"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 20.414V11.414a1 1 0 00-.293-.707L3.293 4.293A1 1 0 013 4z" />
          </svg>
          {hasActiveFilters() && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs leading-none text-blue-600 bg-blue-100 rounded-full">
              •
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Quick Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((quickFilter) => (
                <button
                  key={quickFilter.label}
                  onClick={() => {
                    const filterKey = Object.keys(quickFilter.filter)[0];
                    const filterValue = quickFilter.filter[filterKey];
                    handleQuickFilter(filterKey, filterValue);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    safeFilters[Object.keys(quickFilter.filter)[0]] === quickFilter.filter[Object.keys(quickFilter.filter)[0]]
                      ? 'bg-blue-600 text-white'
                      : `${theme?.components?.button?.secondary || 'bg-gray-100 text-gray-700'} hover:bg-blue-50`
                  }`}
                >
                  <span className="mr-1">{quickFilter.icon}</span>
                  {quickFilter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={safeFilters.contentType || 'all'}
                onChange={(e) => safeSetFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className={`w-full ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {contentTypes.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Within</label>
              <select
                value={safeFilters.searchWithin || 'all'}
                onChange={(e) => safeSetFilters(prev => ({ ...prev, searchWithin: e.target.value }))}
                className={`w-full ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {searchWithinOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Creation Date Range</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={safeFilters.dateRange?.from || ''}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  className={`w-full ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={safeFilters.dateRange?.to || ''}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  className={`w-full ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortOptions || 'title-asc'}
              onChange={(e) => safeSetSortOption(e.target.value)}
              className={`w-full ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {sortOptionsList.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Saved Filter Combinations */}
          {savedFilterCombos && savedFilterCombos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saved Filter Combinations</label>
              <div className="flex flex-wrap gap-2">
                {savedFilterCombos.map((combo, index) => (
                  <button
                    key={index}
                    onClick={() => onLoadFilterCombo && onLoadFilterCombo(combo)}
                    className={`px-3 py-1 rounded-full text-sm ${theme?.components?.button?.secondary || 'bg-gray-100 text-gray-700'} hover:bg-blue-50 transition-colors`}
                  >
                    {combo.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <button
                onClick={clearAllFilters}
                className={`px-4 py-2 text-sm ${theme?.components?.button?.secondary || 'bg-gray-100 text-gray-700'} ${theme?.layout?.borderRadius || 'rounded-lg'} transition-colors ${!hasActiveFilters() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!hasActiveFilters()}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className={`px-4 py-2 text-sm ${theme?.components?.button?.accent || 'bg-blue-100 text-blue-700'} ${theme?.layout?.borderRadius || 'rounded-lg'} transition-colors ${!hasActiveFilters() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!hasActiveFilters()}
              >
                Save Filter
              </button>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className={`px-4 py-2 text-sm ${theme?.components?.button?.primary || 'bg-blue-600 text-white'} ${theme?.layout?.borderRadius || 'rounded-lg'} transition-colors`}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme?.components?.modal?.background || 'bg-white'} ${theme?.layout?.borderRadius || 'rounded-lg'} p-6 w-96 max-w-90vw`}>
            <h3 className="text-lg font-semibold mb-4">Save Filter Combination</h3>
            <input
              type="text"
              placeholder="Enter filter name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className={`w-full ${theme?.components?.input?.background || 'bg-gray-50'} ${theme?.components?.input?.border || 'border border-gray-300'} ${theme?.layout?.borderRadius || 'rounded-lg'} px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className={`px-4 py-2 ${theme?.components?.button?.secondary || 'bg-gray-100 text-gray-700'} ${theme?.layout?.borderRadius || 'rounded-lg'} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={saveFilterCombo}
                disabled={!filterName.trim()}
                className={`px-4 py-2 ${theme?.components?.button?.primary || 'bg-blue-600 text-white'} ${theme?.layout?.borderRadius || 'rounded-lg'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
