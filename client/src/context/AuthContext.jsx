import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { setAccessToken, clearAccessToken } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Pre-hydrate from localStorage on initial render to prevent flash of unauthenticated state
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('khetisetu_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on page mount by attempting silent refresh with cookie + fallback storage token
  const initializeAuth = useCallback(async () => {
    const storedUser = localStorage.getItem('khetisetu_user');
    const storedRefreshToken = localStorage.getItem('khetisetu_refresh_token');

    // If there is no stored session whatsoever, finish loading immediately
    if (!storedUser && !storedRefreshToken) {
      setUser(null);
      clearAccessToken();
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post(
        '/auth/refresh',
        { refreshToken: storedRefreshToken },
        { timeout: 20000 }
      );
      const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data?.data || {};
      if (accessToken && userData) {
        setAccessToken(accessToken);
        setUser(userData);
        localStorage.setItem('khetisetu_user', JSON.stringify(userData));
        if (newRefreshToken) {
          localStorage.setItem('khetisetu_refresh_token', newRefreshToken);
        }
      }
    } catch (err) {
      // Only clear if server explicitly rejected the token (401/403)
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUser(null);
        clearAccessToken();
        localStorage.removeItem('khetisetu_user');
        localStorage.removeItem('khetisetu_refresh_token');
      } else {
        // Cold start or network timeout: retain hydrated session
        console.warn('Silent refresh delayed or server waking up, retaining hydrated session:', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(userData);
    localStorage.setItem('khetisetu_user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('khetisetu_refresh_token', refreshToken);
    }
    return userData;
  };

  const register = async (formData) => {
    const response = await apiClient.post('/auth/register', formData);
    const { user: userData, accessToken, refreshToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(userData);
    localStorage.setItem('khetisetu_user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('khetisetu_refresh_token', refreshToken);
    }
    return userData;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore logout request failures
    } finally {
      clearAccessToken();
      localStorage.removeItem('khetisetu_user');
      localStorage.removeItem('khetisetu_refresh_token');
      setUser(null);
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('khetisetu_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
        updateUser,
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
