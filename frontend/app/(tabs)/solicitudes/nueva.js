import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Switch, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import solicitudesService from '../../../src/services/solicitudes.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import {
  PageHeader,
  SectionSheet,
  FieldInput,
  OptionGroup,
  ActionButton,
} from '../../../src/components/ui';

const TIPO_VIVIENDA = [
  { value: 'casa_patio', label: 'Casa con patio' },
  { value: 'casa_sin_patio', label: 'Casa sin patio' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'finca', label: 'Finca / Campo' },
];

const EXPERIENCIA_MASCOTAS = [
  { value: 'ninguna', label: 'Sin experiencia' },
  { value: 'basica', label: 'Básica' },
  { value: 'intermedia', label: 'Intermedia' },
  { value: 'avanzada', label: 'Amplia' },
];

export default function NuevaSolicitudScreen() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { mascotaId, mascotaNombre } = useLocalSearchParams();

  const [ingresos, setIngresos] = useState('');
  const [ocupacion, setOcupacion] = useState('');
  const [numPersonas, setNumPersonas] = useState('2');
  const [tieneNinos, setTieneNinos] = useState(false);
  const [tieneOtrosPets, setTieneOtrosPets] = useState(false);

  const [tipoVivienda, setTipoVivienda] = useState('casa_patio');
  const [tieneEspacio, setTieneEspacio] = useState(true);

  const [motivo, setMotivo] = useState('');
  const [experiencia, setExperiencia] = useState('intermedia');
  const [compromiso, setCompromiso] = useState('');

  const [saving, setSaving] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (user) {
      const p = user.perfil || {};
      const ing = p.ingresos_aproximados ?? user.ingresos_aproximados;
      if (ing) setIngresos(`${ing} USD`);
      if (p.tipo_vivienda === 'apartamento') {
        setTipoVivienda('apartamento');
        setTieneEspacio(false);
      } else if (p.tiene_jardin) {
        setTipoVivienda('casa_patio');
        setTieneEspacio(true);
      }
    }
  }, [user]);

  const tabs = ['1. Grupo familiar', '2. Vivienda', '3. Motivación'];

  const handleSubmit = async () => {
    if (!mascotaId) {
      setSnackMessage('Selecciona primero una ficha desde el catálogo.');
      setSnackVisible(true);
      return;
    }
    if (!motivo.trim()) {
      setSnackMessage('Explica tu motivación para adoptar antes de enviar.');
      setSnackVisible(true);
      setCurrentTab(2);
      return;
    }
    if (!tipoVivienda) {
      setSnackMessage('Selecciona las condiciones de vivienda.');
      setSnackVisible(true);
      setCurrentTab(1);
      return;
    }

    setSaving(true);
    try {
      const solicitudData = {
        id_mascota: parseInt(mascotaId, 10),
        datos_formulario: {
          motivo: motivo.trim(),
          experiencia_mascotas: experiencia,
          tipo_vivienda: tipoVivienda,
          num_personas_hogar: numPersonas ? parseInt(numPersonas, 10) : undefined,
          tiene_ninos: tieneNinos,
          tiene_otras_mascotas: tieneOtrosPets,
          tiene_espacio_exterior: tieneEspacio,
          ocupacion: ocupacion.trim() || undefined,
          ingresos_aproximados: ingresos.trim() || undefined,
          compromiso: compromiso.trim() || undefined,
        },
      };

      const result = await solicitudesService.crear(solicitudData);
      if (result.success) {
        setSnackMessage('Postulación registrada en Supabase.');
        setSnackVisible(true);
        setTimeout(() => {
          router.replace(`/(tabs)/solicitudes/${result.data.id_solicitud}`);
        }, 800);
      } else {
        setSnackMessage(result.message || 'No se pudo enviar la postulación.');
        setSnackVisible(true);
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'Error al registrar la postulación.');
      setSnackVisible(true);
    } finally {
      setSaving(false);
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
          eyebrow={mascotaId ? `POSTULACIÓN · FICHA #${String(mascotaId).padStart(3, '0')}` : 'POSTULACIÓN DE ADOPCIÓN'}
          title={mascotaNombre ? `Adoptar a ${mascotaNombre}` : 'Formulario de adopción responsable'}
          subtitle="La información consignada es revisada únicamente por el rescatista responsable para garantizar el bienestar del animal."
          secondaryActionLabel="Cancelar"
          onSecondaryAction={() => router.back()}
          maxWidth={800}
        />

        <View style={styles.body}>
          <View
            style={[
              styles.tabsBar,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            {tabs.map((tab, i) => {
              const active = i === currentTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setCurrentTab(i)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.tabBtn,
                    active && { backgroundColor: palette.primary },
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
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {currentTab === 0 && (
            <SectionSheet title="Composición y sustento del hogar">
              <FieldInput
                label="Ocupación u oficio"
                value={ocupacion}
                onChangeText={setOcupacion}
                placeholder="Ej: Docente universitario, comerciante, ingeniero"
                disabled={saving}
              />

              <FieldInput
                label="Ingresos mensuales aproximados del hogar"
                value={ingresos}
                onChangeText={setIngresos}
                placeholder="Ej: 450 USD"
                helperText="Referencia confidencial destinada a respaldar alimentación y controles médicos."
                disabled={saving}
              />

              <FieldInput
                label="Cantidad de personas que habitan la vivienda"
                value={numPersonas}
                onChangeText={setNumPersonas}
                keyboardType="numeric"
                disabled={saving}
              />

              <View style={[styles.switchRow, { borderColor: palette.border }]}>
                <Text style={{ flex: 1, color: palette.ink, fontFamily: fonts.sans, fontSize: 14 }}>
                  ¿Habitan niños menores de 12 años en la vivienda?
                </Text>
                <Switch value={tieneNinos} onValueChange={setTieneNinos} color={palette.primary} />
              </View>

              <View style={[styles.switchRow, { borderColor: palette.border }]}>
                <Text style={{ flex: 1, color: palette.ink, fontFamily: fonts.sans, fontSize: 14 }}>
                  ¿Conviven otros animales actualmente en casa?
                </Text>
                <Switch
                  value={tieneOtrosPets}
                  onValueChange={setTieneOtrosPets}
                  color={palette.primary}
                />
              </View>
            </SectionSheet>
          )}

          {currentTab === 1 && (
            <SectionSheet title="Espacio físico y seguridad">
              <OptionGroup
                label="Tipo de inmueble"
                options={TIPO_VIVIENDA}
                value={tipoVivienda}
                onChange={setTipoVivienda}
              />

              <View style={[styles.switchRow, { borderColor: palette.border }]}>
                <Text style={{ flex: 1, color: palette.ink, fontFamily: fonts.sans, fontSize: 14 }}>
                  ¿El inmueble posee cerramiento seguro (cerca perimetral o mallas en balcones)?
                </Text>
                <Switch
                  value={tieneEspacio}
                  onValueChange={setTieneEspacio}
                  color={palette.primary}
                />
              </View>
            </SectionSheet>
          )}

          {currentTab === 2 && (
            <SectionSheet title="Experiencia previa y compromiso">
              <OptionGroup
                label="Experiencia cuidando mascotas"
                options={EXPERIENCIA_MASCOTAS}
                value={experiencia}
                onChange={setExperiencia}
              />

              <FieldInput
                label="¿Por qué deseas integrar a este animal en tu hogar? *"
                value={motivo}
                onChangeText={setMotivo}
                multiline
                numberOfLines={4}
                placeholder="Describe tu rutina diaria, quién estará a cargo y el ambiente familiar."
                disabled={saving}
              />

              <FieldInput
                label="Compromiso de seguimiento veterinario y adaptación"
                value={compromiso}
                onChangeText={setCompromiso}
                multiline
                numberOfLines={3}
                placeholder="Acuerdo respecto a vacunas al día, esterilización y visitas de seguimiento."
                disabled={saving}
              />
            </SectionSheet>
          )}

          <View style={styles.navRow}>
            {currentTab > 0 ? (
              <ActionButton
                label="Paso anterior"
                variant="secondary"
                onPress={() => setCurrentTab((t) => t - 1)}
                style={{ flex: 1 }}
              />
            ) : null}

            {currentTab < tabs.length - 1 ? (
              <ActionButton
                label="Continuar"
                variant="primary"
                onPress={() => setCurrentTab((t) => t + 1)}
                style={{ flex: 2 }}
              />
            ) : (
              <ActionButton
                label={saving ? 'Enviando postulación...' : 'Enviar postulación formal'}
                variant="accent"
                loading={saving}
                onPress={handleSubmit}
                style={{ flex: 2 }}
              />
            )}
          </View>
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
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  tabsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    minWidth: 130,
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
