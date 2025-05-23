import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignInModal from './SignInModal';

const PublicNavigation = ({ activeView, setActiveView, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { isPublicPreview, exitPublicPreview } = useAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const publicViews = [
    { id: 'songs', label: 'Songs', icon: '🎵' },
    { id: 'albums', label: 'Albums', icon: '💿' },
    { id: 'setlists', label: 'Setlists', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-800 to-blue-900 border-b border-blue-700 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Alex Wilson</h1>
              <span className="ml-2 text-sm text-blue-200 hidden sm:inline">Songbook</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6 items-center">
              {publicViews.map((view) => (
                <button
                  key={view.id}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === view.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-blue-600'
                  }`}
                  onClick={() => setActiveView(view.id)}
                >
                  <span className="mr-1">{view.icon}</span>
                  {view.label}
                </button>
              ))}
              
              {/* Admin Controls */}
              <div className="ml-6 border-l border-blue-600 pl-6 flex items-center space-x-3">
                {isPublicPreview ? (
                  <button
                    onClick={exitPublicPreview}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  >
                    ← Back to Admin
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Admin
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-800 border-t border-blue-700">
              {publicViews.map((view) => (
                <button
                  key={view.id}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === view.id
                      ? 'bg-blue-900 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-blue-600'
                  }`}
                  onClick={() => {
                    setActiveView(view.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.label}
                </button>
              ))}
              
              {/* Mobile Admin Button */}
              <div className="border-t border-blue-600 pt-3 mt-3">
                {isPublicPreview ? (
                  <button
                    onClick={() => {
                      exitPublicPreview();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    ← Back to Admin View
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowSignInModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Admin Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
    </>
  );
};

export default PublicNavigation;
