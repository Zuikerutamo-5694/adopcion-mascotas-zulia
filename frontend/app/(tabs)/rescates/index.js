import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import rescatesService from '../../../src/services/rescates.service';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import EmptyState from '../../../src/components/EmptyState';
import ErrorMessage from '../../../src/components/ErrorMessage';
import { PageHeader, FolioCode, ActionButton } from '../../../src/components/ui';

export default function RescatesIndex() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();

  const [rescates, setRescates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchRescates = useCallback(async () => {
    try {
      setError('');
      const result = await rescatesService.listar();
      if (result.success) {
        const data = result.data;
        const list = Array.isArray(data) ? data : data.rescates || [];
        setRescates(list);
      } else {
        setError(result.message || 'No se pudo cargar la bitácora.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consultar la bitácora de rescates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRescates();
    }, [fetchRescates])
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Consultando bitácora de rescates..." />
      </>
    );
  }

  const headerNode = (
    <View>
      <PageHeader
        eyebrow="OPERATIVOS DE CAMPO · ZULIA"
        title="Bitácora de rescates"
        subtitle="Registro cronológico de hallazgos, estado físico inicial y animales vinculados a cada intervención."
        actionLabel="Registrar operativo"
        onAction={() => router.push('/(tabs)/rescates/nuevo')}
        maxWidth={960}
      />
      {error ? <ErrorMessage message={error} onRetry={fetchRescates} /> : null}
    </View>
  );

  const renderRescate = ({ item }) => {
    const fechaRaw = item.fecha_rescate || item.fecha;
    const fechaStr = fechaRaw
      ? new Date(fechaRaw).toLocaleDateString('es-VE', { timeZone: 'UTC' })
      : 'Fecha no indicada';
    const vinculadas = Array.isArray(item.mascotas_vinculadas) ? item.mascotas_vinculadas : [];

    return (
      <View style={styles.itemOuter}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={[styles.metaBar, { borderBottomColor: palette.border }]}>
            <FolioCode prefix="RESCATE" id={item.id_rescate} />
            <Text style={{ color: palette.inkSecondary, fontFamily: fonts.mono, fontSize: 12 }}>
              {fechaStr} · {item.rescatista_nombre || 'Rescatista registrado'}
            </Text>
          </View>

          <View style={styles.body}>
            <Text
              style={[
                styles.title,
                { color: palette.ink, fontFamily: fonts.serif },
              ]}
            >
              {item.notas || item.descripcion || `Operativo #${item.id_rescate}`}
            </Text>

            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={[styles.cellLabel, { color: palette.inkSecondary, fontFamily: fonts.sans }]}>
                  Sector o municipio
                </Text>
                <Text style={[styles.cellValue, { color: palette.ink, fontFamily: fonts.sans }]}>
                  {item.ubicacion || 'No especificado'}
                </Text>
              </View>

              {item.condicion_inicial ? (
                <View style={styles.gridCell}>
                  <Text style={[styles.cellLabel, { color: palette.inkSecondary, fontFamily: fonts.sans }]}>
                    Condición física inicial
                  </Text>
                  <Text style={[styles.cellValue, { color: palette.ink, fontFamily: fonts.sans }]}>
                    {item.condicion_inicial}
                  </Text>
                </View>
              ) : null}
            </View>

            {item.observaciones ? (
              <Text
                style={{
                  color: palette.inkSecondary,
                  fontFamily: fonts.sans,
                  fontSize: 13.5,
                  lineHeight: 20,
                  marginTop: 10,
                }}
              >
                Observaciones: {item.observaciones}
              </Text>
            ) : null}

            {vinculadas.length > 0 ? (
              <View style={[styles.linkedWrap, { borderTopColor: palette.border }]}>
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.sans,
                    fontSize: 12.5,
                    marginBottom: 6,
                  }}
                >
                  Animales vinculados a este operativo:
                </Text>
                <View style={styles.linkedList}>
                  {vinculadas.map((m) => (
                    <Pressable
                      key={m.id_mascota}
                      onPress={() => router.push(`/(tabs)/mascotas/${m.id_mascota}`)}
                      accessibilityRole="link"
                      style={[
                        styles.linkedTag,
                        {
                          backgroundColor: palette.surfaceSubtle,
                          borderColor: palette.borderStrong,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: palette.primaryText,
                          fontFamily: fonts.sans,
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        {m.nombre} (ver ficha)
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: palette.border,
                backgroundColor: palette.surfaceSubtle,
              },
            ]}
          >
            <ActionButton
              label="Publicar animal de este operativo"
              variant="secondary"
              compact
              onPress={() =>
                router.push(
                  `/(tabs)/mascotas/nueva?rescateId=${
                    item.id_rescate
                  }&lugarRescate=${encodeURIComponent(
                    item.ubicacion || ''
                  )}&fechaRescate=${encodeURIComponent(String(fechaRaw || '').split('T')[0])}`
                )
              }
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {rescates.length === 0 && !error ? (
        <View style={{ flex: 1 }}>
          {headerNode}
          <EmptyState
            title="Sin operativos registrados"
            message="Documenta el primer operativo de rescate para asociar fichas de animales rescatados."
            actionLabel="Registrar operativo"
            onAction={() => router.push('/(tabs)/rescates/nuevo')}
          />
        </View>
      ) : (
        <FlatList
          data={rescates}
          keyExtractor={(item) => String(item.id_rescate)}
          ListHeaderComponent={headerNode}
          renderItem={renderRescate}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchRescates();
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
  list: { paddingBottom: 40 },
  itemOuter: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sheet: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  body: {
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCell: {
    flex: 1,
    minWidth: 200,
  },
  cellLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkedWrap: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  linkedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkedTag: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
