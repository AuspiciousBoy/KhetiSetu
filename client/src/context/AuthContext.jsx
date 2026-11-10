import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { setAccessToken, clearAccessToken } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on page mount by attempting silent refresh with the HttpOnly cookie
  const initializeAuth = useCallback(async () => {
    try {
      const response = await apiClient.post('/auth/refresh', {}, { timeout: 3000 });
      const { user: userData, accessToken } = response.data?.data || {};
      if (accessToken && userData) {
        setAccessToken(accessToken);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      // User is unauthenticated / no active refresh cookie
      setUser(null);
      clearAccessToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user: userData, accessToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const response = await apiClient.post('/auth/register', formData);
    const { user: userData, accessToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore logout request failures
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSession: initializeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
