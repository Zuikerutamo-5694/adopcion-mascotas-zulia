import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export default function LoadingScreen({ message = 'Cargando información...' }) {
  const { palette, fonts } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <ActivityIndicator size="small" color={palette.primary} />
        <Text
          style={[
            styles.text,
            { color: palette.inkSecondary, fontFamily: fonts.sans },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
