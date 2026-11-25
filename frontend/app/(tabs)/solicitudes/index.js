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
import solicitudesService from '../../../src/services/solicitudes.service';
import { useAuth } from '../../../src/hooks/useAuth';
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

export default function SolicitudesIndex() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const rol = user?.rol?.toLowerCase() || '';

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSolicitudes = useCallback(async () => {
    try {
      setError('');
      const result = await solicitudesService.listar();
      if (result.success) {
        const data = result.data;
        const list = Array.isArray(data) ? data : data.solicitudes || [];
        setSolicitudes(list);
      } else {
        setError(result.message || 'No se pudieron cargar las solicitudes.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consultar solicitudes de adopción.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSolicitudes();
    }, [fetchSolicitudes])
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Cargando solicitudes de adopción..." />
      </>
    );
  }

  const headerNode = (
    <View>
      <PageHeader
        eyebrow="PROCESOS DE ADOPCIÓN RESPONSABLE"
        title={rol === 'adoptante' ? 'Mis postulaciones de adopción' : 'Bandeja de solicitudes'}
        subtitle={
          rol === 'adoptante'
            ? 'Consulta el dictamen de cada postulación y las citas presenciales programadas.'
            : 'Evalúa expedientes socioeconómicos, registra dictámenes y coordina entrevistas.'
        }
        maxWidth={960}
      />
      {error ? <ErrorMessage message={error} onRetry={fetchSolicitudes} /> : null}
    </View>
  );

  const renderSolicitud = ({ item }) => {
    const solId = item.id_solicitud;
    const estado = item.estado || 'pendiente';
    const mascotaNombre = item.mascota_nombre || 'Mascota';
    const adoptanteNombre = item.adoptante_nombre || 'Adoptante';
    const fechaRaw = item.fecha_solicitud || item.fecha;
    const motivoText = item.motivo || item.datos_formulario?.motivo || '';

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
          <View style={[styles.metaRow, { borderBottomColor: palette.border }]}>
            <FolioCode prefix="SOLICITUD" id={solId} />
            <StatusStamp status={estado} />
          </View>

          <View style={styles.body}>
            <Pressable
              onPress={() => router.push(`/(tabs)/solicitudes/${solId}`)}
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
                {rol === 'adoptante'
                  ? `Postulación para adoptar a ${mascotaNombre}`
                  : `${mascotaNombre}: postulación de ${adoptanteNombre}`}
              </Text>
            </Pressable>

            <Text
              style={{
                color: palette.inkSecondary,
                fontFamily: fonts.mono,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Fecha: {fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-VE') : 'No registrada'}
              {item.adoptante_correo && rol !== 'adoptante' ? ` · ${item.adoptante_correo}` : ''}
            </Text>

            {motivoText ? (
              <Text
                style={{
                  color: palette.ink,
                  fontFamily: fonts.sans,
                  fontSize: 13.5,
                  lineHeight: 20,
                  marginTop: 10,
                }}
                numberOfLines={2}
              >
                Motivación declarada: "{motivoText}"
              </Text>
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
              label="Abrir expediente y citas"
              variant="secondary"
              compact
              onPress={() => router.push(`/(tabs)/solicitudes/${solId}`)}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {solicitudes.length === 0 && !error ? (
        <View style={{ flex: 1 }}>
          {headerNode}
          <EmptyState
            title="Sin solicitudes registradas"
            message={
              rol === 'adoptante'
                ? 'Todavía no has enviado postulaciones de adopción. Revisa las fichas disponibles en el catálogo.'
                : 'No hay solicitudes pendientes de revisión en este momento.'
            }
            actionLabel={rol === 'adoptante' ? 'Ir al catálogo' : undefined}
            onAction={rol === 'adoptante' ? () => router.push('/(tabs)/mascotas') : undefined}
          />
        </View>
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => String(item.id_solicitud)}
          ListHeaderComponent={headerNode}
          renderItem={renderSolicitud}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchSolicitudes();
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
    marginTop: 14,
  },
  sheet: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  body: {
    padding: 18,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
