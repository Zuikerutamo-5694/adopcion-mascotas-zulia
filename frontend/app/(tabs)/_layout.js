import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { ThemeToggleButton, StatusStamp } from '../../src/components/ui';

const ROL_LABELS = {
  adoptante: 'Adoptante',
  rescatista: 'Rescatista',
  veterinario: 'Veterinario',
  administrador: 'Administrador',
  admin: 'Administrador',
};

function DesktopMasthead({
  user,
  rol,
  currentPath,
  router,
  onLogout,
  palette,
  fonts,
  showRescates,
  showSolicitudes,
  showExpedientes,
  showAdmin,
}) {
  const navItems = [
    { key: 'mascotas', route: '/(tabs)/mascotas', label: 'Catálogo', visible: true },
    { key: 'rescates', route: '/(tabs)/rescates', label: 'Bitácora de rescates', visible: showRescates },
    { key: 'solicitudes', route: '/(tabs)/solicitudes', label: 'Solicitudes', visible: showSolicitudes },
    { key: 'expedientes', route: '/(tabs)/expedientes', label: 'Clínica', visible: showExpedientes },
    { key: 'admin', route: '/(tabs)/admin', label: 'Administración', visible: showAdmin },
    { key: 'perfil', route: '/(tabs)/perfil', label: 'Mi cuenta', visible: true },
  ].filter((i) => i.visible);

  return (
    <View
      style={[
        styles.desktopWrap,
        {
          backgroundColor: palette.surface,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <View style={styles.desktopInner}>
        <Pressable
          onPress={() => router.push('/(tabs)/mascotas')}
          accessibilityRole="link"
          accessibilityLabel="Ir al catálogo principal de Adopción Zulia"
          style={styles.brand}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text
              style={[
                styles.brandTitle,
                { color: palette.ink, fontFamily: fonts.serif },
              ]}
            >
              Adopción Zulia
            </Text>
            <Text
              style={[
                styles.brandSub,
                { color: palette.inkSecondary, fontFamily: fonts.mono },
              ]}
            >
              RED COMUNITARIA Y VETERINARIA
            </Text>
          </View>
        </Pressable>

        <View style={styles.navRow}>
          {navItems.map((item) => {
            const isActive = Boolean(currentPath && currentPath.includes(item.key));
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route)}
                accessibilityRole="link"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.navLink,
                  isActive && {
                    borderBottomColor: palette.primary,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.navLinkText,
                    {
                      color: isActive ? palette.primaryText : palette.inkSecondary,
                      fontFamily: fonts.sans,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.utilityRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/perfil')}
            accessibilityRole="button"
            style={styles.userBlock}
          >
            <Text
              style={{
                color: palette.ink,
                fontFamily: fonts.sans,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {user?.nombre?.split(' ')[0] || 'Usuario'}
            </Text>
            <StatusStamp
              status="neutral"
              label={ROL_LABELS[rol] || rol || 'Adoptante'}
              tone="neutral"
            />
          </Pressable>

          <ThemeToggleButton />

          <Pressable
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={[
              styles.logoutBtn,
              {
                borderColor: palette.status.danger.border,
                backgroundColor: palette.status.danger.bg,
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
              Salir
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MobileTopBar({ rol, router, onLogout, palette, fonts }) {
  return (
    <View
      style={[
        styles.mobileTopWrap,
        {
          backgroundColor: palette.surface,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <Pressable
        onPress={() => router.push('/(tabs)/mascotas')}
        accessibilityRole="link"
        style={styles.mobileBrand}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 26, height: 26 }}
          resizeMode="contain"
        />
        <Text
          style={{
            color: palette.ink,
            fontFamily: fonts.serif,
            fontSize: 17,
            fontWeight: '600',
          }}
        >
          Adopción Zulia
        </Text>
      </Pressable>

      <View style={styles.mobileActions}>
        <StatusStamp
          status="neutral"
          label={ROL_LABELS[rol] || 'Cuenta'}
          tone="neutral"
        />
        <ThemeToggleButton compact />
        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={[
            styles.mobileLogout,
            {
              borderColor: palette.status.danger.border,
              backgroundColor: palette.status.danger.bg,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="logout"
            size={16}
            color={palette.status.danger.fg}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  const { user, logout } = useAuth();
  const rol = user?.rol?.toLowerCase() || '';

  const handleNavbarLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const showRescates = rol === 'rescatista' || rol === 'administrador' || rol === 'admin';
  const showSolicitudes =
    rol === 'adoptante' || rol === 'rescatista' || rol === 'administrador' || rol === 'admin';
  const showExpedientes = rol === 'veterinario' || rol === 'administrador' || rol === 'admin';
  const showAdmin = rol === 'administrador' || rol === 'admin';

  return (
    <ProtectedRoute>
      <View style={{ flex: 1, backgroundColor: palette.canvas }}>
        {isWide ? (
          <DesktopMasthead
            user={user}
            rol={rol}
            currentPath={pathname}
            router={router}
            onLogout={handleNavbarLogout}
            palette={palette}
            fonts={fonts}
            showRescates={showRescates}
            showSolicitudes={showSolicitudes}
            showExpedientes={showExpedientes}
            showAdmin={showAdmin}
          />
        ) : (
          <MobileTopBar
            rol={rol}
            router={router}
            onLogout={handleNavbarLogout}
            palette={palette}
            fonts={fonts}
          />
        )}

        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isWide
              ? { display: 'none' }
              : {
                  backgroundColor: palette.surface,
                  borderTopColor: palette.border,
                  borderTopWidth: 1,
                  paddingBottom: 6,
                  paddingTop: 6,
                  height: 62,
                },
            tabBarActiveTintColor: palette.primaryText,
            tabBarInactiveTintColor: palette.inkSecondary,
            tabBarLabelStyle: {
              fontFamily: fonts.sans,
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen
            name="mascotas"
            options={{
              title: 'Catálogo',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="paw-outline" size={size - 2} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="rescates"
            options={{
              title: 'Rescates',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="compass-outline" size={size - 2} color={color} />
              ),
              href: showRescates ? undefined : null,
            }}
          />

          <Tabs.Screen
            name="solicitudes"
            options={{
              title: 'Solicitudes',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="clipboard-text-outline" size={size - 2} color={color} />
              ),
              href: showSolicitudes ? undefined : null,
            }}
          />

          <Tabs.Screen
            name="expedientes"
            options={{
              title: 'Clínica',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="stethoscope" size={size - 2} color={color} />
              ),
              href: showExpedientes ? undefined : null,
            }}
          />

          <Tabs.Screen
            name="admin"
            options={{
              title: 'Gestión',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="shield-check-outline" size={size - 2} color={color} />
              ),
              href: showAdmin ? undefined : null,
            }}
          />

          <Tabs.Screen
            name="perfil"
            options={{
              title: 'Cuenta',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-outline" size={size - 2} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  desktopWrap: {
    borderBottomWidth: 1,
    zIndex: 100,
  },
  desktopInner: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
  },
  logo: {
    width: 34,
    height: 34,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  navLink: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navLinkText: {
    fontSize: 13.5,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userBlock: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  logoutBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileTopWrap: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mobileBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileLogout: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
