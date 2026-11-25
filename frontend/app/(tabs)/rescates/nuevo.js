import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import rescatesService from '../../../src/services/rescates.service';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import {
  PageHeader,
  SectionSheet,
  FieldInput,
  ActionButton,
} from '../../../src/components/ui';

export default function NuevoRescate() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();

  const [notas, setNotas] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fechaRescate, setFechaRescate] = useState(new Date().toISOString().split('T')[0]);
  const [condicion, setCondicion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!notas.trim()) {
      setError('El resumen del operativo es obligatorio.');
      return;
    }
    if (!ubicacion.trim()) {
      setError('El sector o municipio del hallazgo es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const rescateData = {
        notas: notas.trim(),
        ubicacion: ubicacion.trim(),
        fecha_rescate: fechaRescate.trim() || undefined,
        condicion_inicial: condicion.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      };

      const result = await rescatesService.crear(rescateData);
      if (result.success) {
        setSnackMessage('Operativo registrado en Supabase.');
        setSnackVisible(true);
        setTimeout(() => router.back(), 800);
      } else {
        setError(result.message || 'No se pudo registrar el operativo.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el operativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow="NUEVA ENTRADA DE BITÁCORA"
          title="Registrar operativo de rescate"
          subtitle="Documenta los datos de ubicación y condición inicial para trazabilidad del resguardo."
          secondaryActionLabel="Volver"
          onSecondaryAction={() => router.back()}
          maxWidth={760}
        />

        <View style={styles.body}>
          <SectionSheet title="Datos del hallazgo">
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: palette.status.danger.bg,
                    borderColor: palette.status.danger.border,
                  },
                ]}
              >
                <Text style={{ color: palette.status.danger.fg, fontFamily: fonts.sans, fontSize: 13.5 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <FieldInput
              label="Resumen del operativo *"
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={3}
              placeholder="Ej: Rescate de camada canina en zona comercial"
              disabled={loading}
            />

            <FieldInput
              label="Municipio y sector exacto *"
              value={ubicacion}
              onChangeText={setUbicacion}
              placeholder="Ej: Av. 5 de Julio con Delicias, Maracaibo"
              disabled={loading}
            />

            <FieldInput
              label="Fecha de intervención (AAAA-MM-DD)"
              value={fechaRescate}
              onChangeText={setFechaRescate}
              placeholder="2026-11-24"
              disabled={loading}
            />

            <FieldInput
              label="Condición física inicial observada"
              value={condicion}
              onChangeText={setCondicion}
              placeholder="Ej: Deshidratación leve, sin lesiones visibles"
              disabled={loading}
            />

            <FieldInput
              label="Observaciones adicionales de campo"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={3}
              disabled={loading}
            />

            <View style={styles.actions}>
              <ActionButton
                label="Cancelar"
                variant="secondary"
                onPress={() => router.back()}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <ActionButton
                label={loading ? 'Guardando...' : 'Guardar en bitácora'}
                variant="primary"
                loading={loading}
                onPress={handleSubmit}
                style={{ flex: 2 }}
              />
            </View>
          </SectionSheet>
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2200}>
        {snackMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: 40 },
  body: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  errorBox: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
});
