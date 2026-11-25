import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth.service';
import { setUnauthorizedHandler } from '../services/api';

const SEED_ACCOUNTS = {
  adoptante: { email: 'juan.adoptante@gmail.com', password: 'Password123!' },
  rescatista: { email: 'maria.rescatista@fundacionhuellas.org', password: 'Password123!' },
  veterinario: { email: 'vet.carlos@veterinariazulia.com', password: 'Password123!' },
  administrador: { email: 'admin@adopcionzulia.org', password: 'Password123!' },
};

export const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginDemo: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSessionState = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSessionState);
    loadStoredAuth();
    return () => setUnauthorizedHandler(null);
  }, [clearSessionState]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (!storedToken || storedToken.startsWith('demo-') || storedToken.startsWith('offline-')) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
        return;
      }

      setToken(storedToken);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      try {
        const result = await authService.getMe();
        if (result.success && result.data) {
          setUser(result.data);
          await AsyncStorage.setItem('user_data', JSON.stringify(result.data));
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.warn('Error cargando sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success && result.data) {
      const { token: newToken, user: userObj, usuario } = result.data;
      const currentUser = userObj || usuario;
      if (newToken) {
        await AsyncStorage.setItem('auth_token', newToken);
        setToken(newToken);
      }
      if (currentUser) {
        await AsyncStorage.setItem('user_data', JSON.stringify(currentUser));
        setUser(currentUser);
      }
    }
    return result;
  }, []);

  // Inicia sesión REAL contra Supabase usando las cuentas semilla oficiales
  const loginDemo = useCallback(
    async (rol = 'adoptante') => {
      const creds = SEED_ACCOUNTS[rol] || SEED_ACCOUNTS.adoptante;
      return login(creds.email, creds.password);
    },
    [login]
  );

  const register = useCallback(async (userData) => {
    const result = await authService.register(userData);
    if (result.success && result.data) {
      const { token: newToken, user: userObj, usuario } = result.data;
      const currentUser = userObj || usuario;
      if (newToken) {
        await AsyncStorage.setItem('auth_token', newToken);
        setToken(newToken);
      }
      if (currentUser) {
        await AsyncStorage.setItem('user_data', JSON.stringify(currentUser));
        setUser(currentUser);
      }
    }
    return result;
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const result = await authService.updateMe(profileData);
    if (result.success && result.data) {
      setUser(result.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(result.data));
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const result = await authService.getMe();
    if (result.success && result.data) {
      setUser(result.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(result.data));
    }
    return result;
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    loginDemo,
    register,
    updateProfile,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
