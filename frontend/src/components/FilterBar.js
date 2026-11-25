import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { ActionButton } from './ui';

const ESPECIES = [
  { key: '', label: 'Todas las especies' },
  { key: 'perro', label: 'Perros' },
  { key: 'gato', label: 'Gatos' },
  { key: 'ave', label: 'Aves' },
  { key: 'conejo', label: 'Conejos' },
  { key: 'otro', label: 'Otros' },
];

const ESTADOS = [
  { key: '', label: 'Todos los estados' },
  { key: 'en_adopcion', label: 'En adopción' },
  { key: 'en_proceso', label: 'En evaluación' },
  { key: 'en_tratamiento', label: 'En tratamiento' },
  { key: 'en_rescate', label: 'En resguardo' },
  { key: 'adoptada', label: 'Adoptadas' },
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  especieFilter,
  onEspecieChange,
  estadoFilter,
  onEstadoChange,
  totalShown,
}) {
  const { palette, fonts } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const hasFilters = Boolean(searchQuery || especieFilter || estadoFilter);

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: palette.canvas,
                borderColor: focused ? palette.primary : palette.borderStrong,
                borderWidth: focused ? 2 : 1,
              },
            ]}
          >
            <TextInput
              placeholder="Buscar por nombre, raza, municipio o temperamento..."
              placeholderTextColor={palette.inkSecondary}
              value={searchQuery}
              onChangeText={onSearchChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[
                styles.searchInput,
                { color: palette.ink, fontFamily: fonts.sans },
                Platform.OS === 'web' && { outlineStyle: 'none' },
              ]}
            />
          </View>

          {hasFilters ? (
            <ActionButton
              label="Limpiar filtros"
              variant="secondary"
              compact
              onPress={() => {
                onSearchChange('');
                onEspecieChange('');
                onEstadoChange('');
              }}
            />
          ) : null}

          {typeof totalShown === 'number' ? (
            <Text
              style={{
                color: palette.inkSecondary,
                fontFamily: fonts.mono,
                fontSize: 12,
              }}
            >
              {totalShown} {totalShown === 1 ? 'ficha' : 'fichas'}
            </Text>
          ) : null}
        </View>

        <View style={[styles.filterGroup, { borderTopColor: palette.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollRow}
          >
            {ESPECIES.map((esp) => {
              const active = especieFilter === esp.key;
              return (
                <Pressable
                  key={`esp-${esp.key || 'all'}`}
                  onPress={() => onEspecieChange(esp.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: active ? palette.primary : 'transparent',
                      borderColor: active ? palette.primary : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? palette.onPrimary : palette.ink,
                      fontFamily: fonts.sans,
                      fontSize: 13,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {esp.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollRow}
          >
            {ESTADOS.map((est) => {
              const active = estadoFilter === est.key;
              return (
                <Pressable
                  key={`est-${est.key || 'all'}`}
                  onPress={() => onEstadoChange(est.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: active ? palette.surfaceSubtle : 'transparent',
                      borderColor: active ? palette.borderStrong : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? palette.ink : palette.inkSecondary,
                      fontFamily: fonts.sans,
                      fontSize: 12.5,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {est.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  panel: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    minWidth: 220,
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  filterGroup: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
