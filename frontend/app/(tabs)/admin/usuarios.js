import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import adminService from '../../../src/services/admin.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import EmptyState from '../../../src/components/EmptyState';
import ErrorMessage from '../../../src/components/ErrorMessage';
import {
  PageHeader,
  StatusStamp,
  FolioCode,
  OptionGroup,
  ActionButton,
} from '../../../src/components/ui';

const ROL_LABELS = {
  adoptante: 'Adoptante',
  rescatista: 'Rescatista',
  veterinario: 'Veterinario',
  administrador: 'Administrador',
};

const ESTADO_OPTIONS = [
  { value: 'activo', label: 'Activo (acceso normal)' },
  { value: 'inactivo', label: 'Inactivo (baja temporal)' },
  { value: 'suspendido', label: 'Suspendido (bloqueo)' },
];

export default function UsuariosAdmin() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { user: currentAdmin } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEstado, setNewEstado] = useState('activo');
  const [updating, setUpdating] = useState(false);

  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredUsuarios(
        usuarios.filter(
          (u) =>
            u.nombre?.toLowerCase().includes(q) ||
            (u.correo || u.email)?.toLowerCase().includes(q) ||
            u.rol?.toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredUsuarios(usuarios);
    }
  }, [searchQuery, usuarios]);

  const fetchUsuarios = async () => {
    try {
      setError('');
      const result = await adminService.listarUsuarios();
      if (result.success) {
        const data = result.data;
        const list = Array.isArray(data) ? data : data.usuarios || [];
        setUsuarios(list);
      } else {
        setError(result.message || 'No se pudo consultar el directorio.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el listado de cuentas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openChangeEstado = (usuario) => {
    setSelectedUser(usuario);
    setNewEstado(usuario.estado || 'activo');
    setConfirmDialog(true);
  };

  const confirmChangeEstado = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const userId = selectedUser.id_usuario;
      const result = await adminService.cambiarEstadoUsuario(userId, {
        estado: newEstado,
      });
      if (result.success) {
        setSnackMessage(`Estado de ${selectedUser.nombre} cambiado a "${newEstado}".`);
        setSnackVisible(true);
        setUsuarios((prev) =>
          prev.map((u) => (u.id_usuario === userId ? { ...u, estado: newEstado } : u))
        );
      } else {
        setSnackMessage(result.message || 'No se pudo actualizar el estado.');
        setSnackVisible(true);
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'Error al cambiar estado de la cuenta.');
      setSnackVisible(true);
    } finally {
      setUpdating(false);
      setConfirmDialog(false);
      setSelectedUser(null);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Cargando directorio de usuarios..." />
      </>
    );
  }

  const headerNode = (
    <View>
      <PageHeader
        eyebrow="CONTROL DE CUENTAS Y PERMISOS"
        title="Directorio de usuarios registrados"
        subtitle="Filtra por nombre, correo o rol y ajusta el estado operativo de cualquier cuenta."
        secondaryActionLabel="Volver al resumen"
        onSecondaryAction={() => router.push('/(tabs)/admin')}
        maxWidth={960}
      />
      <View style={styles.searchOuter}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: palette.surface,
              borderColor: searchFocused ? palette.primary : palette.borderStrong,
              borderWidth: searchFocused ? 2 : 1,
            },
          ]}
        >
          <TextInput
            placeholder="Buscar por nombre, correo electrónico o rol..."
            placeholderTextColor={palette.inkSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={[
              styles.searchInput,
              { color: palette.ink, fontFamily: fonts.sans },
              Platform.OS === 'web' && { outlineStyle: 'none' },
            ]}
          />
        </View>
      </View>
      {error ? <ErrorMessage message={error} onRetry={fetchUsuarios} /> : null}
    </View>
  );

  const renderUsuario = ({ item }) => {
    const rol = item.rol?.toLowerCase() || '';
    const isSelf = Number(item.id_usuario) === Number(currentAdmin?.id_usuario);
    const isSelected = confirmDialog && selectedUser?.id_usuario === item.id_usuario;

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
          <View style={styles.mainRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleLine}>
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    fontWeight: '600',
                  }}
                >
                  {item.nombre} {isSelf ? '(Sesión actual)' : ''}
                </Text>
                <FolioCode prefix="USR" id={item.id_usuario} />
              </View>

              <Text
                style={{
                  color: palette.inkSecondary,
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {item.correo || item.email}
                {item.telefono ? ` · ${item.telefono}` : ''}
              </Text>

              <View style={styles.stampsRow}>
                <StatusStamp
                  status="neutral"
                  label={ROL_LABELS[rol] || rol}
                  tone="neutral"
                />
                <StatusStamp status={item.estado || 'activo'} />
              </View>
            </View>

            <ActionButton
              label={isSelected ? 'Cerrar' : 'Cambiar estado'}
              variant="secondary"
              compact
              disabled={isSelf}
              onPress={() => {
                if (isSelected) {
                  setConfirmDialog(false);
                  setSelectedUser(null);
                } else {
                  openChangeEstado(item);
                }
              }}
            />
          </View>

          {isSelected ? (
            <View
              style={[
                styles.editorBox,
                {
                  backgroundColor: palette.surfaceSubtle,
                  borderTopColor: palette.border,
                },
              ]}
            >
              <OptionGroup
                label="Seleccionar nuevo estado de cuenta"
                options={ESTADO_OPTIONS}
                value={newEstado}
                onChange={setNewEstado}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <ActionButton
                  label="Cancelar"
                  variant="secondary"
                  compact
                  onPress={() => {
                    setConfirmDialog(false);
                    setSelectedUser(null);
                  }}
                />
                <ActionButton
                  label="Guardar estado"
                  variant="primary"
                  compact
                  loading={updating}
                  onPress={confirmChangeEstado}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {filteredUsuarios.length === 0 && !error ? (
        <View style={{ flex: 1 }}>
          {headerNode}
          <EmptyState
            title="Sin cuentas que coincidan"
            message="Modifica el término de búsqueda para listar otros perfiles."
          />
        </View>
      ) : (
        <FlatList
          data={filteredUsuarios}
          keyExtractor={(item) => String(item.id_usuario)}
          ListHeaderComponent={headerNode}
          renderItem={renderUsuario}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchUsuarios();
              }}
              colors={[palette.primary]}
            />
          }
        />
      )}

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        {snackMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchOuter: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchBox: {
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
  },
  searchInput: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: { paddingBottom: 40 },
  itemOuter: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sheet: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  stampsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editorBox: {
    padding: 16,
    borderTopWidth: 1,
  },
});
