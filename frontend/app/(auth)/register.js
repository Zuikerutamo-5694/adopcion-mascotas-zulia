import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
  Pressable,
} from 'react-native';
import { Switch } from 'react-native-paper';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import {
  FieldInput,
  ActionButton,
  OptionGroup,
  SectionSheet,
  ThemeToggleButton,
} from '../../src/components/ui';

const ROLES = [
  { value: 'adoptante', label: 'Adoptante' },
  { value: 'rescatista', label: 'Rescatista' },
  { value: 'veterinario', label: 'Veterinario' },
];

const TIPOS_VIVIENDA = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'finca', label: 'Finca' },
  { value: 'otro', label: 'Otro' },
];

export default function RegisterScreen() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { register } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rol, setRol] = useState('adoptante');
  const [showPassword, setShowPassword] = useState(false);

  const [ingresosAproximados, setIngresosAproximados] = useState('');
  const [tipoVivienda, setTipoVivienda] = useState('casa');
  const [tieneJardin, setTieneJardin] = useState(false);
  const [experiencia, setExperiencia] = useState('');

  const [organizacion, setOrganizacion] = useState('');
  const [zonaRescate, setZonaRescate] = useState('');

  const [especialidad, setEspecialidad] = useState('');
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [clinicaAsociada, setClinicaAsociada] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const validate = () => {
    if (!nombre.trim()) return 'El nombre completo es obligatorio.';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return 'Ingresa un correo electrónico válido.';
    }
    if (!password || password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (password !== confirmPassword) {
      return 'La confirmación de contraseña no coincide.';
    }
    if (!telefono.trim()) {
      return 'El teléfono de contacto es obligatorio.';
    }
    if (rol === 'veterinario' && !numeroLicencia.trim()) {
      return 'El número de matrícula profesional es obligatorio para veterinarios.';
    }
    return null;
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const userData = {
      nombre: nombre.trim(),
      correo: email.trim().toLowerCase(),
      password,
      telefono: telefono.trim(),
      direccion: direccion.trim() || undefined,
      rol,
    };

    if (rol === 'adoptante') {
      userData.ingresos_aproximados = ingresosAproximados
        ? parseFloat(ingresosAproximados)
        : undefined;
      userData.tipo_vivienda = tipoVivienda;
      userData.tiene_jardin = tieneJardin;
      userData.experiencia = experiencia.trim() || undefined;
    } else if (rol === 'rescatista') {
      userData.organizacion = organizacion.trim() || undefined;
      userData.zona_rescate = zonaRescate.trim() || undefined;
      userData.experiencia = experiencia.trim() || undefined;
    } else if (rol === 'veterinario') {
      userData.numero_licencia = numeroLicencia.trim();
      userData.clinica_asociada = clinicaAsociada.trim() || undefined;
      userData.especialidad = especialidad.trim() || undefined;
    }

    setLoading(true);
    try {
      const result = await register(userData);
      if (result.success) {
        setSuccess('Registro completado en Supabase. Ingresando al catálogo...');
        setTimeout(() => {
          router.replace('/(tabs)/mascotas');
        }, 600);
      } else {
        setError(result.message || 'No se pudo completar el registro.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Error al registrar la cuenta. Verifica la conexión con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { backgroundColor: palette.canvas }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
          <View style={styles.topBarInner}>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link" style={styles.brandRow}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    fontWeight: '700',
                  }}
                >
                  Adopción Zulia
                </Text>
              </Pressable>
            </Link>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ThemeToggleButton />
              <Link href="/(auth)/login" asChild>
                <ActionButton label="Iniciar sesión" variant="secondary" compact />
              </Link>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.intro}>
            <Text style={{ color: palette.primaryText, fontFamily: fonts.mono, fontSize: 12 }}>
              INSCRIPCIÓN DE USUARIOS
            </Text>
            <Text
              style={{
                color: palette.ink,
                fontFamily: fonts.serif,
                fontSize: 30,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              Crear cuenta en la red comunitaria
            </Text>
            <Text
              style={{
                color: palette.inkSecondary,
                fontFamily: fonts.sans,
                fontSize: 14,
                marginTop: 6,
                lineHeight: 21,
              }}
            >
              Completa tus datos de contacto y el perfil correspondiente a tu participación en el Estado Zulia.
            </Text>
          </View>

          <SectionSheet title="1. Rol y datos de identificación">
            {error ? (
              <View
                style={[
                  styles.messageBox,
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

            {success ? (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: palette.status.success.bg,
                    borderColor: palette.status.success.border,
                  },
                ]}
              >
                <Text style={{ color: palette.status.success.fg, fontFamily: fonts.sans, fontSize: 13.5 }}>
                  {success}
                </Text>
              </View>
            ) : null}

            <OptionGroup
              label="Tipo de participación *"
              options={ROLES}
              value={rol}
              onChange={setRol}
            />

            <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
              <FieldInput
                label="Nombre y apellido *"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: María Chiquinquirá Paz"
                disabled={loading}
                style={isWide && styles.colHalf}
              />
              <FieldInput
                label="Teléfono de contacto *"
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Ej: 0414-6001234"
                keyboardType="phone-pad"
                disabled={loading}
                style={isWide && styles.colHalf}
              />
            </View>

            <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
              <FieldInput
                label="Correo electrónico *"
                value={email}
                onChangeText={setEmail}
                placeholder="correo@dominio.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                disabled={loading}
                style={isWide && styles.colHalf}
              />
              <FieldInput
                label="Municipio y sector"
                value={direccion}
                onChangeText={setDireccion}
                placeholder="Ej: Maracaibo, Sector Tierra Negra"
                disabled={loading}
                style={isWide && styles.colHalf}
              />
            </View>

            <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
              <FieldInput
                label="Contraseña (mínimo 8 caracteres) *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                rightActionLabel={showPassword ? 'Ocultar' : 'Mostrar'}
                onRightAction={() => setShowPassword((v) => !v)}
                disabled={loading}
                style={isWide && styles.colHalf}
              />
              <FieldInput
                label="Confirmar contraseña *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                disabled={loading}
                style={isWide && styles.colHalf}
              />
            </View>
          </SectionSheet>

          {rol === 'adoptante' && (
            <SectionSheet
              title="2. Perfil de hogar adoptante"
              subtitle="Estos datos agilizan tus futuras solicitudes de adopción."
            >
              <OptionGroup
                label="Tipo de vivienda"
                options={TIPOS_VIVIENDA}
                value={tipoVivienda}
                onChange={setTipoVivienda}
              />

              <FieldInput
                label="Ingresos mensuales aproximados (USD)"
                value={ingresosAproximados}
                onChangeText={setIngresosAproximados}
                keyboardType="numeric"
                placeholder="Ej: 450"
                helperText="Dato reservado únicamente para verificar capacidad de atención veterinaria."
                disabled={loading}
              />

              <View style={[styles.switchRow, { borderColor: palette.border }]}>
                <Text style={{ flex: 1, color: palette.ink, fontFamily: fonts.sans, fontSize: 14 }}>
                  ¿La vivienda cuenta con patio o área exterior cerrada?
                </Text>
                <Switch
                  value={tieneJardin}
                  onValueChange={setTieneJardin}
                  color={palette.primary}
                />
              </View>

              <FieldInput
                label="Experiencia previa cuidando animales"
                value={experiencia}
                onChangeText={setExperiencia}
                multiline
                numberOfLines={3}
                placeholder="Describe brevemente si has tenido perros, gatos u otros animales."
                disabled={loading}
              />
            </SectionSheet>
          )}

          {rol === 'rescatista' && (
            <SectionSheet
              title="2. Perfil de rescatista o fundación"
              subtitle="Información visible en las fichas de animales bajo tu resguardo."
            >
              <FieldInput
                label="Organización o fundación (opcional si eres independiente)"
                value={organizacion}
                onChangeText={setOrganizacion}
                placeholder="Ej: Fundación Huellas del Lago"
                disabled={loading}
              />
              <FieldInput
                label="Zona de cobertura en el Estado Zulia"
                value={zonaRescate}
                onChangeText={setZonaRescate}
                placeholder="Ej: Maracaibo Norte y San Francisco"
                disabled={loading}
              />
              <FieldInput
                label="Experiencia en operativos y resguardo"
                value={experiencia}
                onChangeText={setExperiencia}
                multiline
                numberOfLines={3}
                disabled={loading}
              />
            </SectionSheet>
          )}

          {rol === 'veterinario' && (
            <SectionSheet
              title="2. Credenciales médicas veterinarias"
              subtitle="Habilita la apertura y firma de historias clínicas en el sistema."
            >
              <FieldInput
                label="Número de matrícula o colegio veterinario *"
                value={numeroLicencia}
                onChangeText={setNumeroLicencia}
                placeholder="Ej: VET-ZUL-2026-0199"
                disabled={loading}
              />
              <FieldInput
                label="Clínica o consultorio asociado"
                value={clinicaAsociada}
                onChangeText={setClinicaAsociada}
                placeholder="Ej: Centro Veterinario La Limpia"
                disabled={loading}
              />
              <FieldInput
                label="Especialidad clínica"
                value={especialidad}
                onChangeText={setEspecialidad}
                placeholder="Ej: Medicina de pequeños animales, cirugía"
                disabled={loading}
              />
            </SectionSheet>
          )}

          <View style={styles.submitRow}>
            <ActionButton
              label={loading ? 'Guardando cuenta...' : 'Completar registro'}
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  topBar: {
    borderBottomWidth: 1,
    width: '100%',
  },
  topBarInner: {
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  container: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  intro: {
    marginBottom: 22,
  },
  messageBox: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  twoCols: {
    flexDirection: 'column',
  },
  twoColsWide: {
    flexDirection: 'row',
    gap: 14,
  },
  colHalf: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  submitRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
