import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import adminService from '../../../src/services/admin.service';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import ErrorMessage from '../../../src/components/ErrorMessage';
import {
  PageHeader,
  SectionSheet,
  SpecRow,
  ActionButton,
} from '../../../src/components/ui';

export default function AdminIndex() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();

  const [reportes, setReportes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { width } = useWindowDimensions();
  const isDesktop = width >= 880;

  const fetchReportes = useCallback(async () => {
    try {
      setError('');
      const result = await adminService.obtenerReportes();
      if (result.success) {
        setReportes(result.data);
      } else {
        setError(result.message || 'No se pudieron consultar los indicadores.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consultar métricas en Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReportes();
    }, [fetchReportes])
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Consultando registro administrativo en Supabase..." />
      </>
    );
  }

  const stats = reportes || {};
  const totalMascotas = stats.mascotas?.total || 0;
  const enAdopcion =
    (stats.mascotas?.por_estado?.en_adopcion || 0) +
    (stats.mascotas?.por_estado?.en_proceso || 0);
  const adopcionesCompletadas = stats.mascotas?.por_estado?.adoptada || 0;
  const enTratamiento = stats.mascotas?.por_estado?.en_tratamiento || 0;

  const totalUsuarios = stats.usuarios?.total || 0;
  const totalRescates = stats.rescates?.total || 0;
  const solicitudesPendientes =
    (stats.solicitudes?.por_estado?.pendiente || 0) +
    (stats.solicitudes?.por_estado?.en_revision || 0);
  const totalSolicitudes = stats.solicitudes?.total || 0;
  const totalCitas = stats.citas?.total || 0;

  const kpiItems = [
    { code: 'ANIMALES EN REGISTRO', value: totalMascotas, note: `${enAdopcion} disponibles o en evaluación` },
    { code: 'SOLICITUDES ACTIVAS', value: solicitudesPendientes, note: `De ${totalSolicitudes} recibidas en total` },
    { code: 'ADOPCIONES CERRADAS', value: adopcionesCompletadas, note: 'Entregas formalizadas' },
    { code: 'CUENTAS REGISTRADAS', value: totalUsuarios, note: 'Adoptantes, rescatistas y clínica' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchReportes();
            }}
            colors={[palette.primary]}
          />
        }
      >
        <PageHeader
          eyebrow="SUPERVISIÓN Y AUDITORÍA · SUPABASE EN VIVO"
          title="Registro operativo de la plataforma"
          subtitle="Consolidado en tiempo real de fichas animales, procesos de adopción, operativos de rescate y cuentas activas."
          secondaryActionLabel="Sincronizar"
          onSecondaryAction={fetchReportes}
          actionLabel="Directorio de usuarios"
          onAction={() => router.push('/(tabs)/admin/usuarios')}
          maxWidth={1080}
        />

        {error ? <ErrorMessage message={error} onRetry={fetchReportes} /> : null}

        <View style={styles.body}>
          <View
            style={[
              styles.ledgerBand,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            {kpiItems.map((item, idx) => (
              <View
                key={item.code}
                style={[
                  styles.kpiCell,
                  idx > 0 && isDesktop && { borderLeftWidth: 1, borderLeftColor: palette.border },
                  idx > 0 && !isDesktop && { borderTopWidth: 1, borderTopColor: palette.border },
                ]}
              >
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {item.code}
                </Text>
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 36,
                    fontWeight: '600',
                    marginVertical: 4,
                  }}
                >
                  {item.value}
                </Text>
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.sans,
                    fontSize: 12.5,
                  }}
                >
                  {item.note}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.splitRow, isDesktop && styles.splitRowDesktop]}>
            <SectionSheet
              title="Desglose de actividad en base de datos"
              style={isDesktop && { flex: 1.2 }}
            >
              <SpecRow label="Operativos de rescate documentados" value={String(totalRescates)} mono />
              <SpecRow label="Animales en tratamiento veterinario" value={String(enTratamiento)} mono />
              <SpecRow label="Postulaciones pendientes o en revisión" value={String(solicitudesPendientes)} mono />
              <SpecRow label="Citas presenciales registradas" value={String(totalCitas)} mono />
              <SpecRow label="Total histórico de solicitudes" value={String(totalSolicitudes)} mono last />
            </SectionSheet>

            <SectionSheet
              title="Moderación y control de acceso"
              subtitle="Revisa el estado de las cuentas registradas o suspende perfiles que incumplan las normas de custodia."
              style={isDesktop && { flex: 0.9 }}
            >
              <View style={{ gap: 10 }}>
                <ActionButton
                  label="Administrar cuentas de usuarios"
                  variant="primary"
                  fullWidth
                  onPress={() => router.push('/(tabs)/admin/usuarios')}
                />
                <ActionButton
                  label="Revisar bandeja de solicitudes"
                  variant="secondary"
                  fullWidth
                  onPress={() => router.push('/(tabs)/solicitudes')}
                />
                <ActionButton
                  label="Revisar bitácora de rescates"
                  variant="secondary"
                  fullWidth
                  onPress={() => router.push('/(tabs)/rescates')}
                />
              </View>
            </SectionSheet>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 44 },
  body: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  ledgerBand: {
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    overflow: 'hidden',
  },
  kpiCell: {
    flex: 1,
    minWidth: 210,
    padding: 20,
  },
  splitRow: {
    flexDirection: 'column',
    gap: 16,
  },
  splitRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
});
