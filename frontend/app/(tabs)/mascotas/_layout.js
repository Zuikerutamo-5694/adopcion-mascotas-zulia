import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '../../../src/contexts/ThemeContext';

export default function MascotasLayout() {
  const { palette, fonts } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.surface,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
        headerShadowVisible: false,
        headerTintColor: palette.ink,
        headerTitleStyle: {
          fontFamily: fonts.serif,
          fontWeight: '600',
          fontSize: 18,
        },
        contentStyle: { backgroundColor: palette.canvas },
      }}
    />
  );
}
