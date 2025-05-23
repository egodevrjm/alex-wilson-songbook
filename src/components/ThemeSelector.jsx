import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeSelector() {
  const { currentTheme, availableThemes, changeTheme } = useTheme();
  
  return (
    <div className="relative">
      <div className="mb-2 text-sm font-medium text-gray-700">
        Theme
      </div>
      <div className="grid grid-cols-1 gap-2">
        {availableThemes.map((themeOption) => (
          <button
            key={themeOption.key}
            onClick={() => changeTheme(themeOption.key)}
            className={`
              w-full p-3 text-left border rounded-lg transition-all duration-200
              ${currentTheme === themeOption.key
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {themeOption.name}
                </div>
                <div className="text-sm text-gray-600">
                  {themeOption.description}
                </div>
              </div>
              
              {/* Theme preview dots */}
              <div className="flex space-x-1">
                {/* Primary color dot */}
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{
                    backgroundColor: 
                      themeOption.key === 'classic' ? '#0284c7' :
                      themeOption.key === 'modern' ? '#6366f1' :
                      themeOption.key === 'dashboard' ? '#334155' :
                      themeOption.key === 'minimal' ? '#8b8b98' :
                      themeOption.key === 'dark' ? '#a1a1aa' :
                      themeOption.key === 'vibrant' ? '#ea580c' : '#0284c7'
                  }}
                />
                {/* Accent color dot */}
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{
                    backgroundColor: 
                      themeOption.key === 'classic' ? '#16a34a' :
                      themeOption.key === 'modern' ? '#d946ef' :
                      themeOption.key === 'dashboard' ? '#3b82f6' :
                      themeOption.key === 'minimal' ? '#14b8a6' :
                      themeOption.key === 'dark' ? '#8b5cf6' :
                      themeOption.key === 'vibrant' ? '#0ea5e9' : '#16a34a'
                  }}
                />
                {/* Gray color dot */}
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{
                    backgroundColor: 
                      themeOption.key === 'classic' ? '#6b7280' :
                      themeOption.key === 'modern' ? '#71717a' :
                      themeOption.key === 'dashboard' ? '#64748b' :
                      themeOption.key === 'minimal' ? '#e4e4e4' :
                      themeOption.key === 'dark' ? '#404040' :
                      themeOption.key === 'vibrant' ? '#d1d1d1' : '#6b7280'
                  }}
                />
              </div>
            </div>
            
            {currentTheme === themeOption.key && (
              <div className="mt-2 flex items-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
