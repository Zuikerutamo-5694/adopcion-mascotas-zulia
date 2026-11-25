import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import solicitudesService from '../../../src/services/solicitudes.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import ErrorMessage from '../../../src/components/ErrorMessage';
import {
  PageHeader,
  SectionSheet,
  SpecRow,
  StatusStamp,
  FieldInput,
  OptionGroup,
  ActionButton,
  getStatusMeta,
} from '../../../src/components/ui';

const EVAL_OPTIONS = [
  { value: 'en_revision', label: 'En revisión (pasa mascota a evaluación)' },
  { value: 'aprobada', label: 'Aprobar adopción definitiva' },
  { value: 'rechazada', label: 'Rechazar solicitud' },
];

export default function SolicitudDetail() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const rol = user?.rol?.toLowerCase() || '';

  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [evalDialog, setEvalDialog] = useState(false);
  const [evalEstado, setEvalEstado] = useState('aprobada');
  const [evalComentarios, setEvalComentarios] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [citaDialog, setCitaDialog] = useState(false);
  const [citaFecha, setCitaFecha] = useState(tomorrowIso);
  const [citaHora, setCitaHora] = useState('10:00');
  const [citaLugar, setCitaLugar] = useState('');
  const [citaNotas, setCitaNotas] = useState('');
  const [citaLoading, setCitaLoading] = useState(false);

  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    if (id) fetchSolicitud();
  }, [id]);

  const fetchSolicitud = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await solicitudesService.obtener(id);
      if (res.success && res.data) {
        setSolicitud(res.data);
      } else {
        setError(res.message || 'Solicitud no encontrada.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluar = async () => {
    setEvalLoading(true);
    try {
      const result = await solicitudesService.evaluar(id, {
        estado: evalEstado,
        motivo_decision: evalComentarios.trim(),
      });
      if (result.success) {
        setEvalDialog(false);
        setSnackMessage(`Estado actualizado a "${getStatusMeta(evalEstado).label}".`);
        setSnackVisible(true);
        fetchSolicitud();
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'No se pudo registrar el dictamen.');
      setSnackVisible(true);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleAgendarCita = async () => {
    if (!citaFecha.trim() || !citaHora.trim() || !citaLugar.trim()) {
      setSnackMessage('Fecha, hora y punto de encuentro son obligatorios.');
      setSnackVisible(true);
      return;
    }

    setCitaLoading(true);
    try {
      const result = await solicitudesService.agendarCita(id, {
        fecha: citaFecha.trim(),
        hora: citaHora.trim(),
        lugar: citaLugar.trim(),
        notas: citaNotas.trim(),
      });
      if (result.success) {
        setCitaDialog(false);
        setCitaLugar('');
        setCitaNotas('');
        setSnackMessage('Cita registrada en Supabase.');
        setSnackVisible(true);
        fetchSolicitud();
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'No se pudo programar la cita.');
      setSnackVisible(true);
    } finally {
      setCitaLoading(false);
    }
  };

  const handleCambiarEstadoCita = async (idCita, nuevoEstado) => {
    try {
      const res = await solicitudesService.actualizarEstadoCita(id, idCita, nuevoEstado);
      if (res.success) {
        setSnackMessage(`Cita marcada como ${nuevoEstado}.`);
        setSnackVisible(true);
        fetchSolicitud();
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'Error al actualizar estado de la cita.');
      setSnackVisible(true);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Cargando expediente de solicitud..." />
      </>
    );
  }

  if (error || !solicitud) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorMessage message={error || 'Solicitud no encontrada.'} onRetry={fetchSolicitud} />
      </>
    );
  }

  const estado = solicitud.estado || 'pendiente';
  const form = solicitud.datos_formulario || {};
  const isOwnerRescatista =
    rol === 'rescatista' && Number(solicitud.id_publicador) === Number(user?.id_usuario);
  const canEvaluate =
    (rol === 'administrador' || rol === 'admin' || isOwnerRescatista) &&
    (estado === 'pendiente' || estado === 'en_revision');
  const canSchedule = estado !== 'rechazada';

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <PageHeader
          eyebrow={`EXPEDIENTE DE ADOPCIÓN · #${String(solicitud.id_solicitud).padStart(3, '0')}`}
          title={`Solicitud para ${solicitud.mascota_nombre || 'Mascota'}`}
          subtitle={`Postulante: ${solicitud.adoptante_nombre || 'Usuario registrado'}`}
          secondaryActionLabel="Volver a solicitudes"
          onSecondaryAction={() => router.push('/(tabs)/solicitudes')}
          maxWidth={840}
        />

        <View style={styles.body}>
          <SectionSheet
            title="Resumen de la postulación"
            rightElement={<StatusStamp status={estado} />}
          >
            <SpecRow
              label="Animal solicitado"
              value={`${solicitud.mascota_nombre || 'Mascota'} (${solicitud.especie || ''})`}
              actionLabel="Ver ficha"
              onAction={() => router.push(`/(tabs)/mascotas/${solicitud.id_mascota}`)}
            />
            <SpecRow
              label="Datos del postulante"
              value={`${solicitud.adoptante_nombre || 'No especificado'}${
                solicitud.adoptante_correo ? ` · ${solicitud.adoptante_correo}` : ''
              }${solicitud.adoptante_telefono ? ` · ${solicitud.adoptante_telefono}` : ''}`}
            />
            <SpecRow
              label="Fecha de recepción"
              value={
                solicitud.fecha_solicitud
                  ? new Date(solicitud.fecha_solicitud).toLocaleString('es-VE')
                  : 'No registrada'
              }
              mono
              last={!solicitud.motivo_decision}
            />
            {solicitud.motivo_decision ? (
              <SpecRow
                label="Dictamen emitido"
                value={solicitud.motivo_decision}
                last
              />
            ) : null}
          </SectionSheet>

          <SectionSheet title="Declaración socioeconómica y de vivienda">
            <SpecRow
              label="Motivación declarada"
              value={form.motivo || form.motivacion || solicitud.motivo}
            />
            <SpecRow
              label="Inmueble y cerramiento"
              value={`Tipo: ${
                form.tipo_vivienda || solicitud.adoptante_tipo_vivienda || 'N/D'
              } · Cerramiento exterior: ${
                form.tiene_espacio_exterior ?? solicitud.adoptante_tiene_jardin ? 'Sí' : 'No'
              } · Integrantes: ${form.num_personas_hogar ?? 'N/D'}`}
            />
            <SpecRow
              label="Ocupación e ingresos"
              value={`${form.ocupacion || 'Ocupación N/D'} · Ingresos: ${
                form.ingresos_aproximados ||
                (solicitud.adoptante_ingresos ? `${solicitud.adoptante_ingresos} USD` : 'N/D')
              }`}
            />
            <SpecRow
              label="Experiencia y hogar"
              value={`Experiencia: ${String(
                form.experiencia_mascotas || 'N/D'
              )} · Niños en casa: ${form.tiene_ninos ? 'Sí' : 'No'} · Otros animales: ${
                form.tiene_otras_mascotas ? 'Sí' : 'No'
              }`}
              last={!form.compromiso}
            />
            {form.compromiso ? (
              <SpecRow label="Compromiso sanitario" value={form.compromiso} last />
            ) : null}
          </SectionSheet>

          <SectionSheet
            title={`Citas presenciales (${solicitud.citas?.length || 0})`}
            subtitle="Entrevistas domiciliarias y entregas acordadas entre ambas partes."
          >
            {!solicitud.citas || solicitud.citas.length === 0 ? (
              <Text
                style={{
                  color: palette.inkSecondary,
                  fontFamily: fonts.sans,
                  fontSize: 13.5,
                  marginBottom: 14,
                }}
              >
                Todavía no se han agendado citas para esta solicitud.
              </Text>
            ) : (
              <View style={{ gap: 10, marginBottom: 14 }}>
                {solicitud.citas.map((cita) => (
                  <View
                    key={cita.id_cita}
                    style={[
                      styles.citaBox,
                      {
                        backgroundColor: palette.surfaceSubtle,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <View style={styles.citaHeader}>
                      <Text
                        style={{
                          color: palette.ink,
                          fontFamily: fonts.mono,
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        Fecha: {cita.fecha} · Hora: {cita.hora}
                      </Text>
                      <StatusStamp status={cita.estado} />
                    </View>
                    <Text
                      style={{
                        color: palette.ink,
                        fontFamily: fonts.sans,
                        fontSize: 13.5,
                        marginTop: 4,
                      }}
                    >
                      Lugar: {cita.lugar}
                    </Text>
                    {cita.notas ? (
                      <Text
                        style={{
                          color: palette.inkSecondary,
                          fontFamily: fonts.sans,
                          fontSize: 13,
                          marginTop: 2,
                        }}
                      >
                        Indicaciones: {cita.notas}
                      </Text>
                    ) : null}

                    {cita.estado === 'programada' &&
                    (rol === 'administrador' || rol === 'admin' || isOwnerRescatista) ? (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <ActionButton
                          label="Marcar completada"
                          variant="primary"
                          compact
                          onPress={() => handleCambiarEstadoCita(cita.id_cita, 'completada')}
                        />
                        <ActionButton
                          label="Cancelar cita"
                          variant="dangerOutline"
                          compact
                          onPress={() => handleCambiarEstadoCita(cita.id_cita, 'cancelada')}
                        />
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionRow}>
              {canEvaluate ? (
                <ActionButton
                  label={evalDialog ? 'Cerrar dictamen' : 'Emitir dictamen'}
                  variant="primary"
                  onPress={() => {
                    setEvalDialog((v) => !v);
                    setCitaDialog(false);
                  }}
                />
              ) : null}

              {canSchedule ? (
                <ActionButton
                  label={citaDialog ? 'Cerrar agenda' : 'Programar entrevista o entrega'}
                  variant="secondary"
                  onPress={() => {
                    setCitaDialog((v) => !v);
                    setEvalDialog(false);
                  }}
                />
              ) : null}
            </View>

            {evalDialog ? (
              <View
                style={[
                  styles.inlinePanel,
                  {
                    backgroundColor: palette.surfaceSubtle,
                    borderColor: palette.borderStrong,
                  },
                ]}
              >
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 10,
                  }}
                >
                  Registrar dictamen de evaluación
                </Text>

                <OptionGroup
                  label="Resolución"
                  options={EVAL_OPTIONS}
                  value={evalEstado}
                  onChange={setEvalEstado}
                />

                <FieldInput
                  label="Observaciones o fundamento de la decisión"
                  value={evalComentarios}
                  onChangeText={setEvalComentarios}
                  multiline
                  numberOfLines={3}
                  placeholder="Registra los motivos de aprobación, paso a revisión o rechazo."
                />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <ActionButton
                    label="Cancelar"
                    variant="secondary"
                    compact
                    onPress={() => setEvalDialog(false)}
                  />
                  <ActionButton
                    label="Guardar dictamen"
                    variant="primary"
                    compact
                    loading={evalLoading}
                    onPress={handleEvaluar}
                  />
                </View>
              </View>
            ) : null}

            {citaDialog ? (
              <View
                style={[
                  styles.inlinePanel,
                  {
                    backgroundColor: palette.surfaceSubtle,
                    borderColor: palette.borderStrong,
                  },
                ]}
              >
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 10,
                  }}
                >
                  Programar nueva cita presencial
                </Text>

                <FieldInput
                  label="Fecha acordada (AAAA-MM-DD) *"
                  value={citaFecha}
                  onChangeText={setCitaFecha}
                  placeholder="2026-12-05"
                />
                <FieldInput
                  label="Hora en formato 24h (HH:MM) *"
                  value={citaHora}
                  onChangeText={setCitaHora}
                  placeholder="10:30"
                />
                <FieldInput
                  label="Dirección o punto de encuentro *"
                  value={citaLugar}
                  onChangeText={setCitaLugar}
                  placeholder="Ej: Sede Fundación Huellas, Av. Bella Vista, Maracaibo"
                />
                <FieldInput
                  label="Indicaciones previas"
                  value={citaNotas}
                  onChangeText={setCitaNotas}
                  multiline
                  numberOfLines={2}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <ActionButton
                    label="Cancelar"
                    variant="secondary"
                    compact
                    onPress={() => setCitaDialog(false)}
                  />
                  <ActionButton
                    label="Confirmar cita"
                    variant="primary"
                    compact
                    loading={citaLoading}
                    onPress={handleAgendarCita}
                  />
                </View>
              </View>
            ) : null}
          </SectionSheet>
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        {snackMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 44 },
  body: {
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  citaBox: {
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlinePanel: {
    marginTop: 16,
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
});
