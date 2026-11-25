import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { AppThemeProvider, useAppTheme } from '../src/contexts/ThemeContext';

const WEB_GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

a, button, [role="button"], input, textarea, select {
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}

a:focus-visible,
button:focus-visible,
[role="button"]:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid #A83814 !important;
  outline-offset: 2px !important;
}

html[data-theme="dark"] a:focus-visible,
html[data-theme="dark"] button:focus-visible,
html[data-theme="dark"] [role="button"]:focus-visible,
html[data-theme="dark"] [tabindex]:focus-visible {
  outline: 2px solid #F59E56 !important;
  outline-offset: 2px !important;
}
`;

function ThemedShell() {
  const { paperTheme, palette, isDark } = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let styleTag = document.getElementById('zulia-editorial-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'zulia-editorial-styles';
        styleTag.textContent = WEB_GLOBAL_CSS;
        document.head.appendChild(styleTag);
      }
    }
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={palette.canvas} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.canvas },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <ThemedShell />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
