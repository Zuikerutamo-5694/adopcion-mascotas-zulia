import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import expedientesService from '../../../src/services/expedientes.service';
import { resolveImageUrl } from '../../../src/constants/api';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import EmptyState from '../../../src/components/EmptyState';
import ErrorMessage from '../../../src/components/ErrorMessage';
import {
  PageHeader,
  StatusStamp,
  FolioCode,
  ActionButton,
} from '../../../src/components/ui';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=300&q=80';

export default function ExpedientesIndexScreen() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async (search = '') => {
    try {
      setError('');
      const res = await expedientesService.listarResumen(search ? { search } : {});
      if (res.success) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || 'No se pudo cargar la bandeja clínica.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consultar historias clínicas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOverview(searchQuery);
    }, [fetchOverview, searchQuery])
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Cargando bandeja médica veterinaria..." />
      </>
    );
  }

  const headerNode = (
    <View>
      <PageHeader
        eyebrow="CONTROL SANITARIO · COLEGIATURA VETERINARIA"
        title="Bandeja de historias clínicas"
        subtitle="Pacientes registrados en la red con estado de apertura clínica, signos vitales y esquema de vacunación."
        maxWidth={960}
      />
      <View style={styles.searchOuter}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: palette.surface,
              borderColor: searchFocused ? palette.primary : palette.borderStrong,
              borderWidth: searchFocused ? 2 : 1,
            },
          ]}
        >
          <TextInput
            placeholder="Filtrar paciente por nombre o raza..."
            placeholderTextColor={palette.inkSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={[
              styles.searchInput,
              { color: palette.ink, fontFamily: fonts.sans },
              Platform.OS === 'web' && { outlineStyle: 'none' },
            ]}
          />
        </View>
      </View>
      {error ? <ErrorMessage message={error} onRetry={() => fetchOverview(searchQuery)} /> : null}
    </View>
  );

  const renderItem = ({ item }) => {
    const tieneExpediente = Boolean(item.id_expediente);
    const foto = resolveImageUrl(item.foto_principal) || PLACEHOLDER;
    const vacunasCount = Array.isArray(item.vacunas) ? item.vacunas.length : 0;

    return (
      <View style={styles.itemOuter}>
        <View
          style={[
            styles.rowSheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Image
            source={{ uri: foto }}
            style={[styles.avatar, { backgroundColor: palette.surfaceSubtle }]}
          />

          <View style={styles.rowBody}>
            <View style={styles.topLine}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => router.push(`/(tabs)/expedientes/${item.id_mascota}`)}
                  accessibilityRole="link"
                >
                  <Text
                    style={{
                      color: palette.ink,
                      fontFamily: fonts.serif,
                      fontSize: 20,
                      fontWeight: '600',
                    }}
                  >
                    {item.nombre}
                  </Text>
                </Pressable>
                <FolioCode prefix="PACIENTE" id={item.id_mascota} />
              </View>
              <StatusStamp
                status={tieneExpediente ? 'con_expediente' : 'sin_evaluacion'}
              />
            </View>

            <Text
              style={{
                color: palette.inkSecondary,
                fontFamily: fonts.sans,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {(item.especie || 'Animal').toUpperCase()} · {item.raza || 'Mestizo'} ·{' '}
              {item.edad_aprox || 'Edad por precisar'}
            </Text>

            {tieneExpediente ? (
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{ color: palette.ink, fontFamily: fonts.sans, fontSize: 13.5 }}
                  numberOfLines={2}
                >
                  Diagnóstico: {item.diagnostico}
                </Text>
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.mono,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {item.peso ? `${item.peso} kg · ` : ''}
                  {item.temperatura ? `${item.temperatura} °C · ` : ''}
                  {vacunasCount} dosis · Dr(a). {item.veterinario_nombre || 'Veterinario'}
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  color: palette.inkSecondary,
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Sin evaluación inicial cargada. Haz clic para abrir su historia médica.
              </Text>
            )}

            <View style={styles.actionLine}>
              <ActionButton
                label={tieneExpediente ? 'Revisar o actualizar historia' : 'Abrir historia médica'}
                variant={tieneExpediente ? 'secondary' : 'primary'}
                compact
                onPress={() => router.push(`/(tabs)/expedientes/${item.id_mascota}`)}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {items.length === 0 && !error ? (
        <View style={{ flex: 1 }}>
          {headerNode}
          <EmptyState
            title="Sin pacientes para mostrar"
            message="No hay fichas animales que coincidan con el término buscado."
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id_mascota)}
          ListHeaderComponent={headerNode}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOverview(searchQuery);
              }}
              colors={[palette.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchOuter: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchBox: {
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
  },
  searchInput: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: { paddingBottom: 40 },
  itemOuter: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  rowSheet: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 4,
  },
  rowBody: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionLine: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});
