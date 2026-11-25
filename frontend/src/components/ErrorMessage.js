import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { ActionButton } from './ui';

export default function ErrorMessage({
  message = 'No se pudo completar la consulta. Intenta nuevamente.',
  onRetry,
}) {
  const { palette, fonts } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.status.danger.bg,
          borderColor: palette.status.danger.border,
        },
      ]}
    >
      <View style={styles.copy}>
        <Text
          style={[
            styles.code,
            { color: palette.status.danger.fg, fontFamily: fonts.mono },
          ]}
        >
          AVISO DE CONEXIÓN
        </Text>
        <Text
          style={[
            styles.text,
            { color: palette.status.danger.fg, fontFamily: fonts.sans },
          ]}
        >
          {message}
        </Text>
      </View>
      {onRetry ? (
        <ActionButton
          label="Reintentar"
          onPress={onRetry}
          variant="dangerOutline"
          compact
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 12,
    gap: 12,
    maxWidth: 1160,
    alignSelf: 'center',
    width: '94%',
  },
  copy: {
    flex: 1,
    minWidth: 200,
  },
  code: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
});
