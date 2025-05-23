import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme configurations
const themes = {
  classic: {
    name: 'Classic',
    description: 'Refined professional layout',
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      accent: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      }
    },
    layout: {
      sidebarWidth: 'w-96',
      borderRadius: 'rounded-lg',
      shadow: 'shadow-sm',
      spacing: 'p-4',
      cardSpacing: 'gap-4'
    },
    components: {
    sidebar: {
    background: 'bg-white',
    border: 'border-r border-gray-200',
    header: 'bg-blue-700 text-white'
    },
        card: {
          background: 'bg-white',
          border: 'border border-gray-200'
        },
        input: {
          background: 'bg-white',
          border: 'border border-gray-300'
        },
        modal: {
          background: 'bg-white'
        },
      songCard: {
        background: 'bg-white',
        border: 'border border-gray-200',
        hover: 'hover:bg-gray-50 hover:border-blue-300',
        selected: 'bg-blue-50 border-blue-500',
        shadow: 'shadow-sm hover:shadow-md'
      },
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        accent: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
      }
    }
  },
  
  modern: {
    name: 'Modern',
    description: 'Contemporary card-centric design',
    colors: {
      primary: {
        50: '#f0f4ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
      },
      accent: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75',
      },
      gray: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
      }
    },
    layout: {
      sidebarWidth: 'w-80',
      borderRadius: 'rounded-xl',
      shadow: 'shadow-lg',
      spacing: 'p-6',
      cardSpacing: 'gap-6'
    },
    components: {
    sidebar: {
    background: 'bg-gradient-to-b from-indigo-50 to-white',
    border: 'border-r border-indigo-100',
    header: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
    },
        card: {
          background: 'bg-white',
          border: 'border-0'
        },
        input: {
          background: 'bg-white',
          border: 'border border-gray-300'
        },
        modal: {
          background: 'bg-white'
        },
      songCard: {
        background: 'bg-white',
        border: 'border-0',
        hover: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
        selected: 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50',
        shadow: 'shadow-md'
      },
      button: {
        primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
        accent: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
      }
    }
  },
  
  dashboard: {
    name: 'Dashboard',
    description: 'Professional power-user interface',
    colors: {
      primary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      accent: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      gray: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      }
    },
    layout: {
      sidebarWidth: 'w-72',
      borderRadius: 'rounded-md',
      shadow: 'shadow-sm',
      spacing: 'p-3',
      cardSpacing: 'gap-3'
    },
    components: {
    sidebar: {
    background: 'bg-slate-900',
    border: 'border-r border-slate-700',
    header: 'bg-slate-800 text-slate-100'
    },
        card: {
          background: 'bg-white',
          border: 'border border-slate-200'
        },
        input: {
          background: 'bg-white',
          border: 'border border-gray-300'
        },
        modal: {
          background: 'bg-white'
        },
      songCard: {
        background: 'bg-white dark:bg-slate-800',
        border: 'border border-slate-200 dark:border-slate-600',
        hover: 'hover:bg-slate-50 hover:border-blue-300 dark:hover:bg-slate-700',
        selected: 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 dark:bg-blue-900 dark:border-blue-500',
        shadow: 'shadow-sm'
      },
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100',
        accent: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
      }
    }
  },
  
  minimal: {
    name: 'Minimal',
    description: 'Clean and spacious design',
    colors: {
      primary: {
        50: '#fafafc',
        100: '#f4f4f7',
        200: '#e8e8ee',
        300: '#d1d1db',
        400: '#b0b0be',
        500: '#8b8b98',
        600: '#6e6e7b',
        700: '#5a5a66',
        800: '#4a4a55',
        900: '#3f3f48',
      },
      accent: {
        50: '#f0fdf9',
        100: '#ccfdf7',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      gray: {
        50: '#fdfdfd',
        100: '#fcfcfc',
        200: '#f8f8f8',
        300: '#f3f3f3',
        400: '#ededed',
        500: '#e4e4e4',
        600: '#d2d2d2',
        700: '#9d9d9d',
        800: '#6d6d6d',
        900: '#171717',
      }
    },
    layout: {
      sidebarWidth: 'w-80',
      borderRadius: 'rounded-sm',
      shadow: 'shadow-none',
      spacing: 'p-8',
      cardSpacing: 'gap-8'
    },
    components: {
    sidebar: {
    background: 'bg-white',
    border: 'border-r border-gray-100',
    header: 'bg-gray-50 text-gray-800'
    },
        card: {
          background: 'bg-white',
          border: 'border-0 border-b border-gray-100'
        },
        input: {
          background: 'bg-white',
          border: 'border border-gray-200'
        },
        modal: {
          background: 'bg-white'
        },
      songCard: {
        background: 'bg-white',
        border: 'border-0 border-b border-gray-100',
        hover: 'hover:bg-gray-25 transition-colors duration-300',
        selected: 'bg-teal-25 border-l-2 border-teal-500',
        shadow: 'shadow-none'
      },
      button: {
        primary: 'bg-gray-900 hover:bg-gray-800 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200',
        accent: 'bg-teal-600 hover:bg-teal-700 text-white',
        danger: 'bg-red-500 hover:bg-red-600 text-white'
      }
    }
  },
  
  dark: {
    name: 'Dark',
    description: 'Elegant dark theme',
    colors: {
      primary: {
        50: '#18181b',
        100: '#27272a',
        200: '#3f3f46',
        300: '#52525b',
        400: '#71717a',
        500: '#a1a1aa',
        600: '#d4d4d8',
        700: '#e4e4e7',
        800: '#f4f4f5',
        900: '#fafafa',
      },
      accent: {
        50: '#420a83',
        100: '#581c87',
        200: '#7c3aed',
        300: '#8b5cf6',
        400: '#a78bfa',
        500: '#c4b5fd',
        600: '#ddd6fe',
        700: '#ede9fe',
        800: '#f3f4f6',
        900: '#faf7ff',
      },
      gray: {
        50: '#0a0a0a',
        100: '#171717',
        200: '#262626',
        300: '#404040',
        400: '#525252',
        500: '#737373',
        600: '#a3a3a3',
        700: '#d4d4d4',
        800: '#e5e5e5',
        900: '#f5f5f5',
      }
    },
    layout: {
      sidebarWidth: 'w-80',
      borderRadius: 'rounded-lg',
      shadow: 'shadow-2xl',
      spacing: 'p-4',
      cardSpacing: 'gap-4'
    },
    components: {
    sidebar: {
    background: 'bg-gray-900',
    border: 'border-r border-gray-800',
    header: 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white'
    },
        card: {
          background: 'bg-gray-800',
          border: 'border border-gray-700'
        },
        input: {
          background: 'bg-gray-700',
          border: 'border border-gray-600'
        },
        modal: {
          background: 'bg-gray-800'
        },
      songCard: {
        background: 'bg-gray-800',
        border: 'border border-gray-700',
        hover: 'hover:bg-gray-750 hover:border-purple-500 transition-all duration-200',
        selected: 'bg-purple-900 border-purple-500 ring-1 ring-purple-500',
        shadow: 'shadow-lg'
      },
      button: {
        primary: 'bg-purple-600 hover:bg-purple-700 text-white',
        secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600',
        accent: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
      }
    }
  },
  
  vibrant: {
    name: 'Vibrant',
    description: 'Colorful and energetic design',
    colors: {
      primary: {
        50: '#fef7ee',
        100: '#fdedd3',
        200: '#fbd5a5',
        300: '#f7b267',
        400: '#f18527',
        500: '#ea580c',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      accent: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      gray: {
        50: '#fefefe',
        100: '#fdfdfd',
        200: '#f9f9f9',
        300: '#f4f4f4',
        400: '#e5e5e5',
        500: '#d1d1d1',
        600: '#b5b5b5',
        700: '#8a8a8a',
        800: '#5e5e5e',
        900: '#2d2d2d',
      }
    },
    layout: {
      sidebarWidth: 'w-96',
      borderRadius: 'rounded-2xl',
      shadow: 'shadow-xl',
      spacing: 'p-6',
      cardSpacing: 'gap-6'
    },
    components: {
    sidebar: {
    background: 'bg-gradient-to-b from-orange-50 via-blue-50 to-purple-50',
    border: 'border-r border-orange-200',
    header: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white'
    },
        card: {
          background: 'bg-white',
          border: 'border-0'
        },
        input: {
          background: 'bg-white',
          border: 'border border-gray-300'
        },
        modal: {
          background: 'bg-white'
        },
      songCard: {
        background: 'bg-white',
        border: 'border-0',
        hover: 'hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-gradient-to-br hover:from-white hover:to-blue-50',
        selected: 'shadow-2xl ring-2 ring-orange-400 bg-gradient-to-br from-orange-50 to-pink-50',
        shadow: 'shadow-lg'
      },
      button: {
        primary: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white',
        secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border border-gray-300',
        accent: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white',
        danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
      }
    }
  }
};

// Theme context
const ThemeContext = createContext();

// Theme provider component
export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('classic');
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('songbook-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);
  
  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('songbook-theme', currentTheme);
  }, [currentTheme]);
  
  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };
  
  const value = {
    currentTheme,
    theme: themes[currentTheme],
    changeTheme,
    availableThemes: Object.keys(themes).map(key => ({
      key,
      ...themes[key]
    }))
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility function to get theme-aware classes
export function getThemeClasses(theme, component, variant = 'default') {
  switch (component) {
    case 'sidebar':
      return `${theme.components.sidebar.background} ${theme.components.sidebar.border}`;
    
    case 'sidebar-header':
      return theme.components.sidebar.header;
    
    case 'song-card':
      return `${theme.components.songCard.background} ${theme.components.songCard.border} ${theme.components.songCard.shadow} ${theme.layout.borderRadius} transition-all duration-200`;
    
    case 'song-card-hover':
      return theme.components.songCard.hover;
    
    case 'song-card-selected':
      return theme.components.songCard.selected;
    
    case 'button':
      return `${theme.components.button[variant] || theme.components.button.primary} ${theme.layout.borderRadius} transition-all duration-200`;
    
    case 'layout':
      return variant === 'sidebar' ? theme.layout.sidebarWidth : '';
    
    default:
      return '';
  }
}
