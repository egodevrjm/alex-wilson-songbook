import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState('public');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAuthState = localStorage.getItem('alex-wilson-auth');
    if (savedAuthState === 'admin') {
      setAuthState('admin');
    } else {
      setAuthState('public');
    }
    setIsLoading(false);
  }, []);

  const signIn = async (password) => {
    try {
      // Call Vercel API route for authentication
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAuthState('admin');
        localStorage.setItem('alex-wilson-auth', 'admin');
        localStorage.setItem('auth-token', data.token); // Store JWT token
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid password' };
      }
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  };

  const signOut = () => {
    setAuthState('public');
    localStorage.removeItem('alex-wilson-auth');
    localStorage.removeItem('auth-token');
  };

  const viewAsPublic = () => {
    setAuthState('public-preview');
  };

  const exitPublicPreview = () => {
    setAuthState('admin');
  };

  const isAdmin = authState === 'admin';
  const isPublic = authState === 'public';
  const isPublicPreview = authState === 'public-preview';
  const isPublicView = isPublic || isPublicPreview;

  const value = {
    authState,
    isAdmin,
    isPublic,
    isPublicPreview,
    isPublicView,
    isLoading,
    signIn,
    signOut,
    viewAsPublic,
    exitPublicPreview
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
