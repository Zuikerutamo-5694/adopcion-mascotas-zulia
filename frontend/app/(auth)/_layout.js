import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '../../src/contexts/ThemeContext';

export default function AuthLayout() {
  const { palette } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.canvas },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
