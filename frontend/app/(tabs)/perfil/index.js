import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Switch, Snackbar } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import {
  PageHeader,
  SectionSheet,
  SpecRow,
  StatusStamp,
  FolioCode,
  FieldInput,
  OptionGroup,
  ActionButton,
} from '../../../src/components/ui';

const ROL_LABELS = {
  adoptante: 'Adoptante',
  rescatista: 'Rescatista',
  veterinario: 'Veterinario',
  administrador: 'Administrador',
};

const TIPOS_VIVIENDA = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'finca', label: 'Finca' },
  { value: 'otro', label: 'Otro' },
];

export default function PerfilIndex() {
  const { palette, fonts, isDark, toggleTheme } = useAppTheme();
  const router = useRouter();
  const { user, logout, refreshUser, updateProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ingresos, setIngresos] = useState('');
  const [tipoVivienda, setTipoVivienda] = useState('casa');
  const [tieneJardin, setTieneJardin] = useState(false);
  const [experiencia, setExperiencia] = useState('');
  const [organizacion, setOrganizacion] = useState('');
  const [zonaRescate, setZonaRescate] = useState('');
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [clinicaAsociada, setClinicaAsociada] = useState('');
  const [especialidad, setEspecialidad] = useState('');

  const [logoutDialog, setLogoutDialog] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const rol = user?.rol?.toLowerCase() || '';
  const perfil = user?.perfil || {};

  useEffect(() => {
    if (user) {
      setNombre(user.nombre || '');
      setTelefono(user.telefono || '');
      setDireccion(user.direccion || '');
      setIngresos(
        perfil.ingresos_aproximados ?? user.ingresos_aproximados
          ? String(perfil.ingresos_aproximados ?? user.ingresos_aproximados)
          : ''
      );
      setTipoVivienda(perfil.tipo_vivienda || user.tipo_vivienda || 'casa');
      setTieneJardin(Boolean(perfil.tiene_jardin ?? user.tiene_jardin));
      setExperiencia(perfil.experiencia || user.experiencia || '');
      setOrganizacion(perfil.organizacion || user.organizacion || '');
      setZonaRescate(perfil.zona_rescate || user.zona_rescate || '');
      setNumeroLicencia(perfil.numero_licencia || user.numero_licencia || user.licencia || '');
      setClinicaAsociada(perfil.clinica_asociada || user.clinica_asociada || '');
      setEspecialidad(perfil.especialidad || user.especialidad || '');
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    if (!nombre.trim()) {
      setSnackMessage('El nombre no puede quedar vacío.');
      setSnackVisible(true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      };

      if (rol === 'adoptante') {
        payload.ingresos_aproximados = ingresos ? parseFloat(ingresos) : null;
        payload.tipo_vivienda = tipoVivienda;
        payload.tiene_jardin = tieneJardin;
        payload.experiencia = experiencia.trim();
      } else if (rol === 'rescatista') {
        payload.organizacion = organizacion.trim();
        payload.zona_rescate = zonaRescate.trim();
        payload.experiencia = experiencia.trim();
      } else if (rol === 'veterinario') {
        payload.numero_licencia = numeroLicencia.trim();
        payload.clinica_asociada = clinicaAsociada.trim();
        payload.especialidad = especialidad.trim();
      }

      const res = await updateProfile(payload);
      if (res.success) {
        setEditing(false);
        setSnackMessage('Datos actualizados en Supabase.');
        setSnackVisible(true);
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'No se pudieron guardar los cambios.');
      setSnackVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogoutDialog(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const initials = user.nombre
    ? user.nombre
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'US';

  const createdDate = user.created_at || user.createdAt;

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <PageHeader
          eyebrow="CREDENCIALES Y PREFERENCIAS"
          title="Mi cuenta en la red"
          subtitle="Administra tu información de contacto, datos específicos de tu rol y sesión activa."
          actionLabel={editing ? 'Cancelar edición' : 'Editar datos'}
          onAction={() => setEditing((v) => !v)}
          actionVariant="secondary"
          maxWidth={980}
        />

        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          <View style={[styles.leftCol, isDesktop && styles.leftColDesktop]}>
            <SectionSheet>
              <View style={styles.identityBlock}>
                <View
                  style={[
                    styles.monogram,
                    {
                      backgroundColor: palette.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: palette.onPrimary,
                      fontFamily: fonts.serif,
                      fontSize: 24,
                      fontWeight: '700',
                    }}
                  >
                    {initials}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <FolioCode prefix="CUENTA" id={user.id_usuario} />
                  <Text
                    style={{
                      color: palette.ink,
                      fontFamily: fonts.serif,
                      fontSize: 22,
                      fontWeight: '600',
                      marginVertical: 2,
                    }}
                  >
                    {user.nombre}
                  </Text>
                  <StatusStamp
                    status="activo"
                    label={ROL_LABELS[rol] || rol}
                    tone="success"
                  />
                </View>
              </View>

              <View style={[styles.prefBlock, { borderTopColor: palette.border }]}>
                <View style={styles.prefRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.ink, fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '600' }}>
                      Apariencia visual
                    </Text>
                    <Text style={{ color: palette.inkSecondary, fontFamily: fonts.sans, fontSize: 12 }}>
                      {isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
                    </Text>
                  </View>
                  <ActionButton
                    label={isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
                    variant="secondary"
                    compact
                    onPress={toggleTheme}
                  />
                </View>

                <ActionButton
                  label="Sincronizar perfil con Supabase"
                  variant="secondary"
                  fullWidth
                  onPress={async () => {
                    await refreshUser();
                    setSnackMessage('Datos sincronizados desde Supabase.');
                    setSnackVisible(true);
                  }}
                />

                {!logoutDialog ? (
                  <ActionButton
                    label="Cerrar sesión en este navegador"
                    variant="dangerOutline"
                    fullWidth
                    onPress={() => setLogoutDialog(true)}
                  />
                ) : (
                  <View
                    style={[
                      styles.confirmBox,
                      {
                        backgroundColor: palette.status.danger.bg,
                        borderColor: palette.status.danger.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: palette.status.danger.fg,
                        fontFamily: fonts.sans,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      ¿Confirmas cerrar la sesión actual?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                      <ActionButton
                        label="Cancelar"
                        variant="secondary"
                        compact
                        onPress={() => setLogoutDialog(false)}
                      />
                      <ActionButton
                        label="Salir ahora"
                        variant="danger"
                        compact
                        onPress={handleLogout}
                      />
                    </View>
                  </View>
                )}
              </View>
            </SectionSheet>
          </View>

          <View style={[styles.rightCol, isDesktop && styles.rightColDesktop]}>
            <SectionSheet
              title={editing ? 'Modificar información registrada' : 'Datos de contacto y rol'}
            >
              {!editing ? (
                <>
                  <SpecRow label="Correo electrónico" value={user.correo} />
                  <SpecRow label="Teléfono" value={user.telefono} mono />
                  <SpecRow label="Municipio / Sector" value={user.direccion} />

                  {rol === 'adoptante' && (
                    <>
                      <SpecRow
                        label="Ingresos declarados"
                        value={
                          perfil.ingresos_aproximados ?? user.ingresos_aproximados
                            ? `USD ${perfil.ingresos_aproximados ?? user.ingresos_aproximados}`
                            : null
                        }
                        mono
                      />
                      <SpecRow
                        label="Condición de vivienda"
                        value={`${perfil.tipo_vivienda || user.tipo_vivienda || 'No indicada'} · ${
                          perfil.tiene_jardin ?? user.tiene_jardin
                            ? 'Con patio cerrado'
                            : 'Sin patio exterior'
                        }`}
                      />
                      <SpecRow
                        label="Experiencia con animales"
                        value={perfil.experiencia || user.experiencia}
                        last={!createdDate}
                      />
                    </>
                  )}

                  {rol === 'rescatista' && (
                    <>
                      <SpecRow
                        label="Organización o fundación"
                        value={
                          perfil.organizacion || user.organizacion || 'Rescatista independiente'
                        }
                      />
                      <SpecRow
                        label="Zona de cobertura"
                        value={perfil.zona_rescate || user.zona_rescate}
                      />
                      <SpecRow
                        label="Trayectoria en rescate"
                        value={perfil.experiencia || user.experiencia}
                        last={!createdDate}
                      />
                    </>
                  )}

                  {rol === 'veterinario' && (
                    <>
                      <SpecRow
                        label="Matrícula profesional"
                        value={perfil.numero_licencia || user.numero_licencia}
                        mono
                      />
                      <SpecRow
                        label="Clínica asociada"
                        value={perfil.clinica_asociada || user.clinica_asociada}
                      />
                      <SpecRow
                        label="Especialidad"
                        value={
                          perfil.especialidad || user.especialidad || 'Medicina general'
                        }
                        last={!createdDate}
                      />
                    </>
                  )}

                  {createdDate ? (
                    <SpecRow
                      label="Fecha de alta"
                      value={new Date(createdDate).toLocaleDateString('es-VE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      last
                    />
                  ) : null}
                </>
              ) : (
                <View>
                  <FieldInput label="Nombre y apellido" value={nombre} onChangeText={setNombre} />
                  <FieldInput label="Teléfono" value={telefono} onChangeText={setTelefono} />
                  <FieldInput
                    label="Municipio y sector"
                    value={direccion}
                    onChangeText={setDireccion}
                  />

                  {rol === 'adoptante' && (
                    <>
                      <FieldInput
                        label="Ingresos mensuales aproximados (USD)"
                        value={ingresos}
                        onChangeText={setIngresos}
                        keyboardType="numeric"
                      />
                      <OptionGroup
                        label="Tipo de vivienda"
                        options={TIPOS_VIVIENDA}
                        value={tipoVivienda}
                        onChange={setTipoVivienda}
                      />
                      <View style={[styles.switchRow, { borderColor: palette.border }]}>
                        <Text
                          style={{
                            flex: 1,
                            color: palette.ink,
                            fontFamily: fonts.sans,
                            fontSize: 14,
                          }}
                        >
                          ¿Cuenta con patio o jardín cerrado?
                        </Text>
                        <Switch
                          value={tieneJardin}
                          onValueChange={setTieneJardin}
                          color={palette.primary}
                        />
                      </View>
                      <FieldInput
                        label="Experiencia con animales"
                        value={experiencia}
                        onChangeText={setExperiencia}
                        multiline
                        numberOfLines={3}
                      />
                    </>
                  )}

                  {rol === 'rescatista' && (
                    <>
                      <FieldInput
                        label="Organización o fundación"
                        value={organizacion}
                        onChangeText={setOrganizacion}
                      />
                      <FieldInput
                        label="Zona de rescate"
                        value={zonaRescate}
                        onChangeText={setZonaRescate}
                      />
                      <FieldInput
                        label="Experiencia"
                        value={experiencia}
                        onChangeText={setExperiencia}
                        multiline
                        numberOfLines={3}
                      />
                    </>
                  )}

                  {rol === 'veterinario' && (
                    <>
                      <FieldInput
                        label="Número de matrícula"
                        value={numeroLicencia}
                        onChangeText={setNumeroLicencia}
                      />
                      <FieldInput
                        label="Clínica asociada"
                        value={clinicaAsociada}
                        onChangeText={setClinicaAsociada}
                      />
                      <FieldInput
                        label="Especialidad"
                        value={especialidad}
                        onChangeText={setEspecialidad}
                      />
                    </>
                  )}

                  <ActionButton
                    label={saving ? 'Guardando...' : 'Guardar cambios en Supabase'}
                    variant="primary"
                    fullWidth
                    loading={saving}
                    onPress={handleSaveProfile}
                    style={{ marginTop: 6 }}
                  />
                </View>
              )}
            </SectionSheet>
          </View>
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2500}>
        {snackMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 44 },
  grid: {
    maxWidth: 980,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  gridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftCol: { width: '100%' },
  leftColDesktop: { flex: 0.85, maxWidth: 380 },
  rightCol: { width: '100%' },
  rightColDesktop: { flex: 1.15 },
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monogram: {
    width: 60,
    height: 60,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefBlock: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 16,
    gap: 10,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  confirmBox: {
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginBottom: 12,
  },
});
