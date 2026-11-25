import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import expedientesService from '../../../src/services/expedientes.service';
import mascotasService from '../../../src/services/mascotas.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import ErrorMessage from '../../../src/components/ErrorMessage';
import {
  PageHeader,
  SectionSheet,
  FieldInput,
  ActionButton,
} from '../../../src/components/ui';

export default function ExpedienteScreen() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { mascotaId } = useLocalSearchParams();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 680;

  const rol = user?.rol?.toLowerCase() || '';
  const canEdit = rol === 'veterinario' || rol === 'administrador' || rol === 'admin';

  const [mascota, setMascota] = useState(null);
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNew, setIsNew] = useState(false);

  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [peso, setPeso] = useState('');
  const [temperatura, setTemperatura] = useState('');

  const [vacunas, setVacunas] = useState([]);
  const [nuevaVacunaNombre, setNuevaVacunaNombre] = useState('');
  const [nuevaVacunaFecha, setNuevaVacunaFecha] = useState('');
  const [nuevaVacunaProxima, setNuevaVacunaProxima] = useState('');

  const [saving, setSaving] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    if (mascotaId) {
      fetchData();
    }
  }, [mascotaId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [petRes, expRes] = await Promise.all([
        mascotasService.obtener(mascotaId),
        expedientesService.obtener(mascotaId),
      ]);

      if (petRes.success) {
        setMascota(petRes.data);
      }

      if (expRes.success && Array.isArray(expRes.data) && expRes.data.length > 0) {
        const latest = expRes.data[0];
        setExpediente(latest);
        setDiagnostico(latest.diagnostico || '');
        setTratamiento(latest.tratamientos || latest.tratamiento || '');
        setObservaciones(latest.observaciones || '');
        setPeso(latest.peso !== null && latest.peso !== undefined ? String(latest.peso) : '');
        setTemperatura(
          latest.temperatura !== null && latest.temperatura !== undefined
            ? String(latest.temperatura)
            : ''
        );
        setVacunas(
          Array.isArray(latest.vacunas)
            ? latest.vacunas.map((v) =>
                typeof v === 'string'
                  ? { nombre: v, fecha: '', proxima: '' }
                  : {
                      nombre: v.nombre || '',
                      fecha: v.fecha || '',
                      proxima: v.proxima || '',
                      veterinario: v.veterinario || '',
                    }
              )
            : []
        );
        setIsNew(false);
      } else {
        setIsNew(true);
        setExpediente(null);
        if (petRes.success && petRes.data) {
          if (petRes.data.peso) setPeso(String(petRes.data.peso));
          if (Array.isArray(petRes.data.vacunas)) setVacunas(petRes.data.vacunas);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar la historia clínica.');
    } finally {
      setLoading(false);
    }
  };

  const agregarVacuna = () => {
    if (!nuevaVacunaNombre.trim()) {
      setSnackMessage('Indica el nombre de la vacuna.');
      setSnackVisible(true);
      return;
    }
    setVacunas((prev) => [
      ...prev,
      {
        nombre: nuevaVacunaNombre.trim(),
        fecha: nuevaVacunaFecha.trim() || new Date().toISOString().split('T')[0],
        proxima: nuevaVacunaProxima.trim(),
        veterinario: user?.nombre || '',
      },
    ]);
    setNuevaVacunaNombre('');
    setNuevaVacunaFecha('');
    setNuevaVacunaProxima('');
  };

  const handleSave = async () => {
    if (!diagnostico.trim()) {
      setSnackMessage('El diagnóstico clínico es obligatorio.');
      setSnackVisible(true);
      return;
    }

    setSaving(true);
    try {
      const expData = {
        diagnostico: diagnostico.trim(),
        tratamientos: tratamiento.trim() || null,
        observaciones: observaciones.trim() || null,
        peso: peso ? parseFloat(peso) : null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        vacunas,
      };

      const result = isNew
        ? await expedientesService.crear(mascotaId, expData)
        : await expedientesService.actualizar(expediente.id_expediente, expData);

      if (result.success) {
        setSnackMessage(
          isNew
            ? 'Historia médica abierta y sincronizada con la ficha.'
            : 'Cambios clínicos guardados en Supabase.'
        );
        setSnackVisible(true);
        await fetchData();
      } else {
        setSnackMessage(result.message || 'No se pudo guardar el registro.');
        setSnackVisible(true);
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'Error al guardar la historia médica.');
      setSnackVisible(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Cargando historia clínica..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorMessage message={error} onRetry={fetchData} />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow={`HISTORIA CLÍNICA · PACIENTE #${String(mascotaId).padStart(3, '0')}`}
          title={mascota ? `Paciente: ${mascota.nombre}` : 'Evaluación veterinaria'}
          subtitle={
            expediente?.veterinario_nombre
              ? `Última actualización por ${expediente.veterinario_nombre} el ${new Date(
                  expediente.fecha_actualizacion
                ).toLocaleDateString('es-VE')}`
              : 'Apertura de evaluación inicial para animal en resguardo.'
          }
          secondaryActionLabel="Volver a bandeja"
          onSecondaryAction={() => router.back()}
          actionLabel={mascota ? 'Ver ficha pública' : undefined}
          onAction={mascota ? () => router.push(`/(tabs)/mascotas/${mascotaId}`) : undefined}
          actionVariant="secondary"
          maxWidth={840}
        />

        <View style={styles.body}>
          {isNew ? (
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: palette.status.warning.bg,
                  borderColor: palette.status.warning.border,
                },
              ]}
            >
              <Text
                style={{
                  color: palette.status.warning.fg,
                  fontFamily: fonts.sans,
                  fontSize: 13.5,
                  fontWeight: '500',
                }}
              >
                Este paciente aún no cuenta con historia médica abierta. Completa el diagnóstico inicial para habilitar su respaldo sanitario.
              </Text>
            </View>
          ) : null}

          <SectionSheet title="1. Signos vitales y examen físico">
            <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
              <FieldInput
                label="Peso corporal (kg)"
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                placeholder="Ej: 14.2"
                disabled={saving || !canEdit}
                style={isWide && styles.colHalf}
              />
              <FieldInput
                label="Temperatura rectal (°C)"
                value={temperatura}
                onChangeText={setTemperatura}
                keyboardType="numeric"
                placeholder="Ej: 38.5"
                disabled={saving || !canEdit}
                style={isWide && styles.colHalf}
              />
            </View>

            <FieldInput
              label="Diagnóstico clínico *"
              value={diagnostico}
              onChangeText={setDiagnostico}
              multiline
              numberOfLines={4}
              placeholder="Estado general, mucosas, piel, auscultación y hallazgos."
              disabled={saving || !canEdit}
            />

            <FieldInput
              label="Tratamiento prescrito"
              value={tratamiento}
              onChangeText={setTratamiento}
              multiline
              numberOfLines={3}
              placeholder="Fármacos, posología y duración."
              disabled={saving || !canEdit}
            />

            <FieldInput
              label="Observaciones y controles futuros"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={3}
              disabled={saving || !canEdit}
            />
          </SectionSheet>

          <SectionSheet title={`2. Esquema de vacunación (${vacunas.length})`}>
            {vacunas.length === 0 ? (
              <Text
                style={{
                  color: palette.inkSecondary,
                  fontFamily: fonts.sans,
                  fontSize: 13.5,
                  marginBottom: 14,
                }}
              >
                No hay dosis registradas todavía.
              </Text>
            ) : (
              vacunas.map((v, idx) => (
                <View
                  key={`${v.nombre}-${idx}`}
                  style={[
                    styles.vacRow,
                    {
                      backgroundColor: palette.surfaceSubtle,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.ink, fontFamily: fonts.sans, fontWeight: '700' }}>
                      {v.nombre}
                    </Text>
                    <Text style={{ color: palette.inkSecondary, fontFamily: fonts.mono, fontSize: 12 }}>
                      Aplicada: {v.fecha || 'N/D'}
                      {v.proxima ? ` · Próxima: ${v.proxima}` : ''}
                    </Text>
                  </View>
                  {canEdit ? (
                    <ActionButton
                      label="Quitar"
                      variant="dangerOutline"
                      compact
                      onPress={() => setVacunas((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  ) : null}
                </View>
              ))
            )}

            {canEdit ? (
              <View style={[styles.addBlock, { borderTopColor: palette.border }]}>
                <FieldInput
                  label="Vacuna o biológico"
                  value={nuevaVacunaNombre}
                  onChangeText={setNuevaVacunaNombre}
                  placeholder="Ej: Antirrábica, Séxtuple, Triple felina"
                />
                <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
                  <FieldInput
                    label="Fecha aplicación (AAAA-MM-DD)"
                    value={nuevaVacunaFecha}
                    onChangeText={setNuevaVacunaFecha}
                    placeholder="2026-11-24"
                    style={isWide && styles.colHalf}
                  />
                  <FieldInput
                    label="Próximo refuerzo (AAAA-MM-DD)"
                    value={nuevaVacunaProxima}
                    onChangeText={setNuevaVacunaProxima}
                    placeholder="2027-11-24"
                    style={isWide && styles.colHalf}
                  />
                </View>
                <ActionButton
                  label="Incorporar vacuna al esquema"
                  variant="secondary"
                  onPress={agregarVacuna}
                />
              </View>
            ) : null}
          </SectionSheet>

          {canEdit ? (
            <ActionButton
              label={
                saving
                  ? 'Guardando en Supabase...'
                  : isNew
                  ? 'Abrir historia médica oficial'
                  : 'Guardar actualización clínica'
              }
              variant="primary"
              fullWidth
              loading={saving}
              onPress={handleSave}
            />
          ) : null}
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        {snackMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: 44 },
  body: {
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  noticeBox: {
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
  },
  twoCols: { flexDirection: 'column' },
  twoColsWide: { flexDirection: 'row', gap: 14 },
  colHalf: { flex: 1 },
  vacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  addBlock: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 14,
  },
});
