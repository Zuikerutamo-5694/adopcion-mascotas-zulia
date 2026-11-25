import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import mascotasService from '../../../src/services/mascotas.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import PetCard from '../../../src/components/PetCard';
import FilterBar from '../../../src/components/FilterBar';
import LoadingScreen from '../../../src/components/LoadingScreen';
import EmptyState from '../../../src/components/EmptyState';
import ErrorMessage from '../../../src/components/ErrorMessage';
import { PageHeader, ActionButton } from '../../../src/components/ui';

export default function MascotasIndex() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const rol = user?.rol?.toLowerCase() || '';

  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [inputSearch, setInputSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [especieFilter, setEspecieFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1040;
  const isTablet = width >= 680 && width < 1040;
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const containerInnerWidth = Math.max(280, Math.min(width, 1200) - 40);
  const gapPx = 16;
  const cardWidth = Math.floor(
    (containerInnerWidth - gapPx * (numColumns - 1)) / numColumns
  );

  const canCreate =
    rol === 'rescatista' || rol === 'veterinario' || rol === 'administrador' || rol === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputSearch.trim());
    }, 320);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  const fetchMascotas = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append && mascotas.length === 0) setLoading(true);
        setError('');

        const params = { page: pageNum, limit: 12 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (especieFilter) params.especie = especieFilter;
        if (estadoFilter) params.estado = estadoFilter;

        const result = await mascotasService.listar(params);
        if (result.success) {
          const data = result.data || {};
          const list = Array.isArray(data) ? data : data.mascotas || [];
          const pages = data.pagination?.totalPages || 1;

          if (append) {
            setMascotas((prev) => [...prev, ...list]);
          } else {
            setMascotas(list);
          }
          setTotalPages(pages);
          setPage(pageNum);
        } else {
          setError(result.message || 'No se pudo cargar el catálogo.');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'No hubo conexión con el servicio de mascotas.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, especieFilter, estadoFilter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchMascotas(1, false);
    }, [fetchMascotas])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMascotas(1, false);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      setLoadingMore(true);
      fetchMascotas(page + 1, true);
    }
  };

  const handlePetPress = (mascota) => {
    router.push(`/(tabs)/mascotas/${mascota.id_mascota}`);
  };

  if (loading && mascotas.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Consultando registro de mascotas en Supabase..." />
      </>
    );
  }

  const headerNode = (
    <View>
      <PageHeader
        eyebrow="REGISTRO PÚBLICO · ESTADO ZULIA"
        title="Animales en resguardo y adopción"
        subtitle="Fichas verificadas por rescatistas y centros veterinarios asociados en Maracaibo, San Francisco y municipios vecinos."
        actionLabel={canCreate ? 'Registrar nueva mascota' : undefined}
        onAction={canCreate ? () => router.push('/(tabs)/mascotas/nueva') : undefined}
        actionVariant="primary"
      />
      <FilterBar
        searchQuery={inputSearch}
        onSearchChange={setInputSearch}
        especieFilter={especieFilter}
        onEspecieChange={setEspecieFilter}
        estadoFilter={estadoFilter}
        onEstadoChange={setEstadoFilter}
        totalShown={mascotas.length}
      />
      {error ? (
        <ErrorMessage message={error} onRetry={() => fetchMascotas(1, false)} />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {mascotas.length === 0 && !loading ? (
        <View style={{ flex: 1 }}>
          {headerNode}
          <EmptyState
            title="Ninguna ficha coincide con la búsqueda"
            message="Ajusta el filtro de especie, estado o término ingresado para ver animales registrados."
            actionLabel="Restablecer filtros"
            onAction={() => {
              setInputSearch('');
              setDebouncedSearch('');
              setEspecieFilter('');
              setEstadoFilter('');
            }}
          />
        </View>
      ) : (
        <FlatList
          data={mascotas}
          keyExtractor={(item) => String(item.id_mascota)}
          ListHeaderComponent={headerNode}
          renderItem={({ item }) => (
            <View style={numColumns === 1 ? styles.singleColItem : undefined}>
              <PetCard
                mascota={item}
                onPress={handlePetPress}
                cardWidth={cardWidth}
              />
            </View>
          )}
          numColumns={numColumns}
          key={`cols-${numColumns}`}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.columnRow : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[palette.primary]}
              tintColor={palette.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActionButton label="Cargando más fichas..." loading disabled variant="secondary" />
              </View>
            ) : page < totalPages ? (
              <View style={styles.footer}>
                <ActionButton
                  label="Mostrar más fichas"
                  onPress={loadMore}
                  variant="secondary"
                />
              </View>
            ) : (
              <View style={{ height: 32 }} />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingBottom: 40,
  },
  columnRow: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    gap: 16,
  },
  singleColItem: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
});
