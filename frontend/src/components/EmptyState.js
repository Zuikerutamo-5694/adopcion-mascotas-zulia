import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { ActionButton } from './ui';

export default function EmptyState({
  title = 'Sin registros disponibles',
  message = 'No se encontraron elementos con los criterios actuales.',
  actionLabel,
  onAction,
}) {
  const { palette, fonts } = useAppTheme();

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Text
          style={[
            styles.code,
            { color: palette.inkSecondary, fontFamily: fonts.mono },
          ]}
        >
          SIN RESULTADOS
        </Text>
        <Text
          style={[
            styles.title,
            { color: palette.ink, fontFamily: fonts.serif },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.message,
            { color: palette.inkSecondary, fontFamily: fonts.sans },
          ]}
        >
          {message}
        </Text>
        {actionLabel && onAction ? (
          <View style={styles.actionWrap}>
            <ActionButton label={actionLabel} onPress={onAction} variant="secondary" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 260,
  },
  sheet: {
    maxWidth: 460,
    width: '100%',
    padding: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  code: {
    fontSize: 11.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
  },
  actionWrap: {
    marginTop: 18,
  },
});
