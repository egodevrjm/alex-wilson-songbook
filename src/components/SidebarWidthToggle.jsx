import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function SidebarWidthToggle() {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Store the expanded state in localStorage
  React.useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState === 'true') {
      setIsExpanded(true);
    }
  }, []);
  
  const toggleWidth = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', newState.toString());
    
    // Update the sidebar width dynamically
    const sidebar = document.querySelector('.fixed-sidebar');
    if (sidebar) {
      if (newState) {
        // Expanded widths
        sidebar.classList.remove('w-72', 'w-80', 'w-96');
        sidebar.classList.add('w-[480px]'); // 30rem
      } else {
        // Normal widths
        sidebar.classList.remove('w-[480px]');
        sidebar.classList.add(theme.layout.sidebarWidth);
      }
      
      // Update main content margin
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        if (newState) {
          mainContent.classList.remove('md:ml-72', 'md:ml-80', 'md:ml-96');
          mainContent.classList.add('md:ml-[480px]');
        } else {
          mainContent.classList.remove('md:ml-[480px]');
          mainContent.classList.add(
            theme.layout.sidebarWidth === 'w-96' ? 'md:ml-96' :
            theme.layout.sidebarWidth === 'w-80' ? 'md:ml-80' :
            theme.layout.sidebarWidth === 'w-72' ? 'md:ml-72' :
            'md:ml-80'
          );
        }
      }
    }
  };
  
  return (
    <button
      onClick={toggleWidth}
      className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
