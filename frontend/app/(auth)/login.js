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
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import {
  FieldInput,
  ActionButton,
  ThemeToggleButton,
  SectionSheet,
} from '../../src/components/ui';

const DEMO_ACCOUNTS = [
  { rol: 'adoptante', label: 'Adoptante', detail: 'Postulación y seguimiento de citas' },
  { rol: 'rescatista', label: 'Rescatista', detail: 'Bitácora de campo y publicación' },
  { rol: 'veterinario', label: 'Veterinario', detail: 'Historias clínicas y vacunación' },
  { rol: 'administrador', label: 'Administrador', detail: 'Moderación y registro general' },
];

export default function LoginScreen() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { login, loginDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState('');
  const [error, setError] = useState('');

  const { width } = useWindowDimensions();
  const isDesktop = width >= 880;

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico registrado.');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.replace('/(tabs)/mascotas');
        return;
      }
      setError(result.message || 'Las credenciales ingresadas no coinciden.');
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      setError(
        serverMsg ||
          'No hubo respuesta del servidor local en el puerto 4000. Verifica que el backend esté activo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSeedLogin = async (rol) => {
    setError('');
    setDemoLoadingRole(rol);
    try {
      const result = await loginDemo(rol);
      if (result.success) {
        router.replace('/(tabs)/mascotas');
      } else {
        setError(result.message || 'No se pudo iniciar sesión con la cuenta seleccionada.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No se pudo conectar con el servidor API en localhost:4000.'
      );
    } finally {
      setDemoLoadingRole('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { backgroundColor: palette.canvas },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
          <View style={styles.topBarInner}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View>
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 19,
                    fontWeight: '700',
                  }}
                >
                  Adopción Zulia
                </Text>
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.mono,
                    fontSize: 10.5,
                  }}
                >
                  REGISTRO COLABORATIVO · MARACAIBO Y MUNICIPIOS
                </Text>
              </View>
            </View>
            <ThemeToggleButton />
          </View>
        </View>

        <View style={[styles.mainGrid, isDesktop && styles.mainGridDesktop]}>
          <View style={[styles.editorialCol, isDesktop && styles.editorialColDesktop]}>
            <Text
              style={[
                styles.kicker,
                { color: palette.primaryText, fontFamily: fonts.mono },
              ]}
            >
              PLATAFORMA COMUNITARIA DE ADOPCIÓN RESPONSABLE
            </Text>
            <Text
              style={[
                styles.heroTitle,
                { color: palette.ink, fontFamily: fonts.serif },
              ]}
            >
              Un expediente claro para cada animal rescatado en el Zulia.
            </Text>
            <Text
              style={[
                styles.heroBody,
                { color: palette.inkSecondary, fontFamily: fonts.sans },
              ]}
            >
              Fundaciones, rescatistas independientes, médicos veterinarios y familias adoptantes trabajan sobre el mismo registro verificable: desde el operativo de rescate y el control sanitario hasta la entrevista presencial de entrega.
            </Text>

            <View
              style={[
                styles.rolesLedger,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.ledgerTitle,
                  { color: palette.ink, fontFamily: fonts.sans },
                ]}
              >
                Roles articulados en la red
              </Text>
              <View style={[styles.ledgerItem, { borderTopColor: palette.border }]}>
                <Text style={[styles.ledgerRole, { color: palette.primaryText, fontFamily: fonts.mono }]}>
                  01 · RESCATE
                </Text>
                <Text style={[styles.ledgerDesc, { color: palette.inkSecondary, fontFamily: fonts.sans }]}>
                  Documentación de hallazgos por sector, condición física inicial y resguardo temporal.
                </Text>
              </View>
              <View style={[styles.ledgerItem, { borderTopColor: palette.border }]}>
                <Text style={[styles.ledgerRole, { color: palette.primaryText, fontFamily: fonts.mono }]}>
                  02 · CLÍNICA
                </Text>
                <Text style={[styles.ledgerDesc, { color: palette.inkSecondary, fontFamily: fonts.sans }]}>
                  Diagnóstico veterinario, control de peso, esterilización y esquema de vacunación.
                </Text>
              </View>
              <View style={[styles.ledgerItem, { borderTopColor: palette.border }]}>
                <Text style={[styles.ledgerRole, { color: palette.primaryText, fontFamily: fonts.mono }]}>
                  03 · HOGAR
                </Text>
                <Text style={[styles.ledgerDesc, { color: palette.inkSecondary, fontFamily: fonts.sans }]}>
                  Solicitud socioeconómica transparente, programación de citas y seguimiento.
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.formCol, isDesktop && styles.formColDesktop]}>
            <SectionSheet
              title="Acceso a la plataforma"
              subtitle="Ingresa con tu correo registrado o prueba un rol activo en Supabase."
            >
              {error ? (
                <View
                  style={[
                    styles.alertBox,
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
                      fontSize: 13.5,
                      fontWeight: '500',
                    }}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <FieldInput
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="nombre@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                disabled={loading || Boolean(demoLoadingRole)}
              />

              <FieldInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                rightActionLabel={showPassword ? 'Ocultar' : 'Mostrar'}
                onRightAction={() => setShowPassword((v) => !v)}
                disabled={loading || Boolean(demoLoadingRole)}
                onSubmitEditing={handleLogin}
              />

              <ActionButton
                label={loading ? 'Verificando credenciales...' : 'Ingresar a mi cuenta'}
                onPress={handleLogin}
                loading={loading}
                disabled={Boolean(demoLoadingRole)}
                variant="primary"
                fullWidth
                style={{ marginTop: 4 }}
              />

              <View style={styles.registerPrompt}>
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.sans,
                    fontSize: 13.5,
                  }}
                >
                  ¿Deseas postularte o registrar una fundación?
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable accessibilityRole="link" style={styles.inlineLink}>
                    <Text
                      style={{
                        color: palette.accentText,
                        fontFamily: fonts.sans,
                        fontSize: 13.5,
                        fontWeight: '700',
                      }}
                    >
                      Crear cuenta nueva
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <View style={[styles.demoDivider, { borderTopColor: palette.border }]}>
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.sans,
                    fontSize: 13,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  Cuentas semilla verificadas en Supabase
                </Text>
                <Text
                  style={{
                    color: palette.inkSecondary,
                    fontFamily: fonts.sans,
                    fontSize: 12.5,
                    marginBottom: 12,
                  }}
                >
                  Selecciona un perfil para recorrer las funciones propias de ese rol:
                </Text>

                <View style={styles.demoList}>
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isThisLoading = demoLoadingRole === acc.rol;
                    return (
                      <Pressable
                        key={acc.rol}
                        onPress={() => handleQuickSeedLogin(acc.rol)}
                        disabled={loading || Boolean(demoLoadingRole)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ingresar como ${acc.label}`}
                        style={({ pressed }) => [
                          styles.demoRow,
                          {
                            backgroundColor: palette.surfaceSubtle,
                            borderColor: palette.borderStrong,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: palette.ink,
                              fontFamily: fonts.sans,
                              fontSize: 13.5,
                              fontWeight: '700',
                            }}
                          >
                            {acc.label}
                          </Text>
                          <Text
                            style={{
                              color: palette.inkSecondary,
                              fontFamily: fonts.sans,
                              fontSize: 12,
                            }}
                          >
                            {acc.detail}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: palette.primaryText,
                            fontFamily: fonts.mono,
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {isThisLoading ? 'Entrando...' : 'Usar cuenta'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SectionSheet>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topBar: {
    borderBottomWidth: 1,
    width: '100%',
  },
  topBarInner: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
  },
  mainGrid: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 28,
  },
  mainGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 44,
    gap: 48,
  },
  editorialCol: {
    width: '100%',
  },
  editorialColDesktop: {
    flex: 1.15,
    paddingTop: 8,
  },
  formCol: {
    width: '100%',
  },
  formColDesktop: {
    flex: 0.95,
    maxWidth: 460,
  },
  kicker: {
    fontSize: 12,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '600',
    marginBottom: 14,
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  rolesLedger: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 18,
  },
  ledgerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  ledgerItem: {
    borderTopWidth: 1,
    paddingVertical: 10,
    gap: 3,
  },
  ledgerRole: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  ledgerDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  alertBox: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  registerPrompt: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 14,
  },
  inlineLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  demoDivider: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 18,
  },
  demoList: {
    gap: 8,
  },
  demoRow: {
    minHeight: 52,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
