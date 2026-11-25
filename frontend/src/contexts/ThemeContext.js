import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LIGHT_PALETTE,
  DARK_PALETTE,
  FONTS,
  createPaperTheme,
} from '../constants/theme';

const STORAGE_KEY = 'app_theme_mode';

export const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  palette: LIGHT_PALETTE,
  fonts: FONTS,
  paperTheme: createPaperTheme('light'),
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setMode(saved);
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const palette = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.style.backgroundColor = palette.canvas;
      document.documentElement.style.colorScheme = mode;
      if (document.body) {
        document.body.style.backgroundColor = palette.canvas;
        document.body.style.color = palette.ink;
      }
    }
  }, [mode]);

  const setThemeMode = useCallback(async (nextMode) => {
    const valid = nextMode === 'dark' ? 'dark' : 'light';
    setMode(valid);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, valid);
    } catch (_) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const palette = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
    return {
      mode,
      isDark: mode === 'dark',
      palette,
      fonts: FONTS,
      paperTheme: createPaperTheme(mode),
      toggleTheme,
      setThemeMode,
    };
  }, [mode, toggleTheme, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
