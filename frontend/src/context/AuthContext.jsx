import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = useCallback(async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
