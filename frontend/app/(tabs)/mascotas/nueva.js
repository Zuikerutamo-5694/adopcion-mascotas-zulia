import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Switch, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import mascotasService from '../../../src/services/mascotas.service';
import rescatesService from '../../../src/services/rescates.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import {
  PageHeader,
  SectionSheet,
  FieldInput,
  OptionGroup,
  ActionButton,
} from '../../../src/components/ui';

const ESPECIES = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'conejo', label: 'Conejo' },
  { value: 'otro', label: 'Otro' },
];

const SEXOS = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
];

const TAMANOS = [
  { value: 'pequeno', label: 'Pequeño' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
];

const ESTADOS = [
  { value: 'en_adopcion', label: 'En adopción' },
  { value: 'en_proceso', label: 'En evaluación' },
  { value: 'en_tratamiento', label: 'En tratamiento' },
  { value: 'en_rescate', label: 'En resguardo' },
  { value: 'adoptada', label: 'Adoptada' },
];

const NIVELES_EJERCICIO = [
  { value: 'Bajo', label: 'Bajo' },
  { value: 'Medio', label: 'Medio' },
  { value: 'Alto', label: 'Alto' },
  { value: 'Muy alto', label: 'Muy alto' },
];

async function appendAssetToFormData(formData, asset, fieldName = 'foto') {
  if (Platform.OS === 'web') {
    if (asset.file) {
      formData.append(fieldName, asset.file, asset.fileName || asset.file.name || 'foto.jpg');
      return;
    }
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    const ext = (blob.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    formData.append(fieldName, blob, asset.fileName || `mascota-${Date.now()}.${ext}`);
  } else {
    const filename = asset.uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append(fieldName, { uri: asset.uri, name: filename, type });
  }
}

export default function NuevaMascotaScreen() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const editId = params.editId ? String(params.editId) : null;
  const isEditing = Boolean(editId);

  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [seccion, setSeccion] = useState('basica');
  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const [rescatesDisponibles, setRescatesDisponibles] = useState([]);
  const [idRescate, setIdRescate] = useState(params.rescateId ? String(params.rescateId) : '');

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('perro');
  const [raza, setRaza] = useState('');
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState('macho');
  const [tamano, setTamano] = useState('mediano');
  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');
  const [estado, setEstado] = useState('en_adopcion');
  const [ubicacion, setUbicacion] = useState(params.lugarRescate || '');
  const [descripcion, setDescripcion] = useState('');
  const [comportamiento, setComportamiento] = useState('');
  const [nivelEjercicio, setNivelEjercicio] = useState('Medio');
  const [compatNinos, setCompatNinos] = useState(true);
  const [compatPerros, setCompatPerros] = useState(false);
  const [compatGatos, setCompatGatos] = useState(false);
  const [fechaRescate, setFechaRescate] = useState(params.fechaRescate || '');
  const [lugarRescate, setLugarRescate] = useState(params.lugarRescate || '');

  const [fotoUrlManual, setFotoUrlManual] = useState('');
  const [pickedAsset, setPickedAsset] = useState(null);

  const [condicionSalud, setCondicionSalud] = useState('');
  const [esterilizado, setEsterilizado] = useState(false);
  const [microchip, setMicrochip] = useState(false);
  const [numMicrochip, setNumMicrochip] = useState('');
  const [alergias, setAlergias] = useState('');
  const [enfermedades, setEnfermedades] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [vacunas, setVacunas] = useState([]);
  const [nuevaVacunaNombre, setNuevaVacunaNombre] = useState('');
  const [nuevaVacunaFecha, setNuevaVacunaFecha] = useState('');
  const [nuevaVacunaProxima, setNuevaVacunaProxima] = useState('');

  const [aliTipo, setAliTipo] = useState('');
  const [aliFrecuencia, setAliFrecuencia] = useState('');
  const [aliCantidad, setAliCantidad] = useState('');
  const [aliMarca, setAliMarca] = useState('');
  const [aliRestricciones, setAliRestricciones] = useState('');

  const [documentosLegales, setDocumentosLegales] = useState([]);
  const [nuevoDocumento, setNuevoDocumento] = useState('');

  useEffect(() => {
    rescatesService
      .listar()
      .then((res) => {
        if (res.success) {
          const list = Array.isArray(res.data) ? res.data : res.data?.rescates || [];
          setRescatesDisponibles(list);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        setInitialLoading(true);
        const res = await mascotasService.obtener(editId);
        if (res.success && res.data) {
          const m = res.data;
          setNombre(m.nombre || '');
          setEspecie(m.especie || 'perro');
          setRaza(m.raza || '');
          setEdad(m.edad_aprox || '');
          setSexo(m.sexo || 'macho');
          setTamano(m.tamano || 'mediano');
          setPeso(m.peso !== null && m.peso !== undefined ? String(m.peso) : '');
          setColor(m.color || '');
          setEstado(m.estado || 'en_adopcion');
          setUbicacion(m.ubicacion || '');
          setDescripcion(m.descripcion || '');
          setComportamiento(m.comportamiento || '');
          setNivelEjercicio(m.nivel_ejercicio || 'Medio');
          setCompatNinos(Boolean(m.compatible_ninos));
          setCompatPerros(Boolean(m.compatible_perros));
          setCompatGatos(Boolean(m.compatible_gatos));
          setFechaRescate(m.fecha_rescate ? String(m.fecha_rescate).split('T')[0] : '');
          setLugarRescate(m.lugar_rescate || '');
          setIdRescate(m.id_rescate ? String(m.id_rescate) : '');
          setCondicionSalud(m.condicion_salud || '');
          setEsterilizado(Boolean(m.esterilizado));
          setMicrochip(Boolean(m.microchip));
          setNumMicrochip(m.numero_microchip || '');
          setAlergias(m.alergias || '');
          setEnfermedades(m.enfermedades_previas || '');
          setMedicamentos(m.medicamentos_actuales || '');
          setVacunas(Array.isArray(m.vacunas) ? m.vacunas : []);
          const ali = m.alimentacion || {};
          setAliTipo(ali.tipo || '');
          setAliFrecuencia(ali.frecuencia || '');
          setAliCantidad(ali.cantidad || '');
          setAliMarca(ali.marca || '');
          setAliRestricciones(ali.restricciones || '');
          setDocumentosLegales(Array.isArray(m.documentos_legales) ? m.documentos_legales : []);
        }
      } catch (_) {
        setSnackMessage('No se pudo cargar la ficha a editar.');
        setSnackVisible(true);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [editId]);

  const seleccionarImagenLocal = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setPickedAsset(pickerResult.assets[0]);
        setSnackMessage('Archivo de imagen preparado para subir.');
        setSnackVisible(true);
      }
    } catch (_) {
      setSnackMessage('No se pudo abrir el selector de archivos.');
      setSnackVisible(true);
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
        veterinario: user?.rol === 'veterinario' ? user.nombre : '',
      },
    ]);
    setNuevaVacunaNombre('');
    setNuevaVacunaFecha('');
    setNuevaVacunaProxima('');
  };

  const agregarDocumentoLegal = () => {
    if (!nuevoDocumento.trim()) return;
    setDocumentosLegales((prev) => [...prev, nuevoDocumento.trim()]);
    setNuevoDocumento('');
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setSeccion('basica');
      setSnackMessage('El nombre del animal es obligatorio.');
      setSnackVisible(true);
      return;
    }

    setLoading(true);
    try {
      const docsFinales = [...documentosLegales];
      if (nuevoDocumento.trim()) {
        docsFinales.push(nuevoDocumento.trim());
      }

      const mascotaData = {
        nombre: nombre.trim(),
        especie,
        raza: raza.trim() || 'Mestizo',
        edad_aprox: edad.trim() || null,
        peso: peso ? parseFloat(peso) : null,
        color: color.trim() || null,
        sexo,
        tamano,
        estado,
        ubicacion: ubicacion.trim() || null,
        descripcion: descripcion.trim() || null,
        comportamiento: comportamiento.trim() || null,
        nivel_ejercicio: nivelEjercicio,
        compatible_ninos: compatNinos,
        compatible_perros: compatPerros,
        compatible_gatos: compatGatos,
        fecha_rescate: fechaRescate.trim() || null,
        lugar_rescate: lugarRescate.trim() || null,
        id_rescate: idRescate ? parseInt(idRescate, 10) : null,
        condicion_salud: condicionSalud.trim() || null,
        esterilizado,
        microchip,
        numero_microchip: microchip ? numMicrochip.trim() : null,
        alergias: alergias.trim() || 'Ninguna',
        enfermedades_previas: enfermedades.trim() || 'Ninguna',
        medicamentos_actuales: medicamentos.trim() || 'Ninguno',
        vacunas,
        alimentacion: {
          tipo: aliTipo.trim(),
          frecuencia: aliFrecuencia.trim(),
          cantidad: aliCantidad.trim(),
          marca: aliMarca.trim(),
          restricciones: aliRestricciones.trim() || 'Ninguna',
        },
        documentos_legales: docsFinales,
        ...(fotoUrlManual.trim() && !isEditing ? { foto_principal: fotoUrlManual.trim() } : {}),
      };

      const result = isEditing
        ? await mascotasService.actualizar(editId, mascotaData)
        : await mascotasService.crear(mascotaData);

      if (result.success && result.data) {
        const targetId = result.data.id_mascota || editId;

        if (pickedAsset) {
          const fd = new FormData();
          await appendAssetToFormData(fd, pickedAsset, 'foto');
          await mascotasService.subirFotos(targetId, fd);
        } else if (isEditing && fotoUrlManual.trim()) {
          await mascotasService.subirFotos(targetId, { url_imagen: fotoUrlManual.trim() });
        }

        setSnackMessage(
          isEditing
            ? 'Ficha actualizada en Supabase.'
            : 'Nueva ficha publicada en Supabase.'
        );
        setSnackVisible(true);
        setTimeout(() => {
          router.replace(`/(tabs)/mascotas/${targetId}`);
        }, 800);
      } else {
        setSnackMessage(result.message || 'No se pudo guardar la ficha.');
        setSnackVisible(true);
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'Error al guardar la ficha.');
      setSnackVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Editar ficha' }} />
        <LoadingScreen message="Cargando ficha de mascota..." />
      </>
    );
  }

  const secciones = [
    { key: 'basica', label: '1. Datos y fotografía' },
    { key: 'salud', label: '2. Salud y vacunas' },
    { key: 'alimentacion', label: '3. Nutrición' },
    { key: 'legal', label: '4. Constancias' },
  ];

  const rescueOptions = [
    { value: '', label: 'Sin vincular' },
    ...rescatesDisponibles.slice(0, 8).map((r) => ({
      value: String(r.id_rescate),
      label: `#${r.id_rescate} · ${(r.ubicacion || 'Rescate').slice(0, 22)}`,
    })),
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow={isEditing ? `EDICIÓN DE FICHA #${editId}` : 'NUEVO REGISTRO EN CATÁLOGO'}
          title={isEditing ? 'Actualizar ficha de animal' : 'Publicar animal en resguardo'}
          subtitle="Completa los apartados disponibles para facilitar la evaluación veterinaria y de adopción."
          secondaryActionLabel="Volver"
          onSecondaryAction={() => router.back()}
          maxWidth={920}
        />

        <View style={styles.body}>
          <View
            style={[
              styles.tabsBar,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            {secciones.map((s) => {
              const active = seccion === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSeccion(s.key)}
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
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {seccion === 'basica' && (
            <>
              <SectionSheet title="Identificación y características físicas">
                <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
                  <FieldInput
                    label="Nombre del animal *"
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ej: Luna"
                    style={isWide && styles.colHalf}
                  />
                  <FieldInput
                    label="Raza o cruce"
                    value={raza}
                    onChangeText={setRaza}
                    placeholder="Ej: Mestizo"
                    style={isWide && styles.colHalf}
                  />
                </View>

                <OptionGroup
                  label="Especie *"
                  options={ESPECIES}
                  value={especie}
                  onChange={setEspecie}
                />

                <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
                  <FieldInput
                    label="Edad aproximada"
                    value={edad}
                    onChangeText={setEdad}
                    placeholder="Ej: 2 años, 5 meses"
                    style={isWide && styles.colHalf}
                  />
                  <FieldInput
                    label="Peso estimado (kg)"
                    value={peso}
                    onChangeText={setPeso}
                    keyboardType="decimal-pad"
                    placeholder="Ej: 12.5"
                    style={isWide && styles.colHalf}
                  />
                </View>

                <FieldInput
                  label="Color y señas particulares"
                  value={color}
                  onChangeText={setColor}
                  placeholder="Ej: Pelaje corto leonado con pecho blanco"
                />

                <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
                  <OptionGroup
                    label="Sexo"
                    options={SEXOS}
                    value={sexo}
                    onChange={setSexo}
                    style={isWide && styles.colHalf}
                  />
                  <OptionGroup
                    label="Tamaño"
                    options={TAMANOS}
                    value={tamano}
                    onChange={setTamano}
                    style={isWide && styles.colHalf}
                  />
                </View>

                <OptionGroup
                  label="Estado actual en el registro"
                  options={ESTADOS}
                  value={estado}
                  onChange={setEstado}
                />
              </SectionSheet>

              <SectionSheet
                title="Fotografía y procedencia"
                subtitle="Sube un archivo desde tu equipo o indica una dirección de imagen verificada."
              >
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <ActionButton
                    label={
                      pickedAsset
                        ? 'Imagen local seleccionada (cambiar)'
                        : 'Seleccionar fotografía del equipo'
                    }
                    variant="secondary"
                    onPress={seleccionarImagenLocal}
                  />
                </View>

                <FieldInput
                  label="O enlace directo de fotografía (https://...)"
                  value={fotoUrlManual}
                  onChangeText={setFotoUrlManual}
                  autoCapitalize="none"
                  placeholder="https://..."
                />

                {rescatesDisponibles.length > 0 ? (
                  <OptionGroup
                    label="Vincular con operativo de rescate registrado (opcional)"
                    options={rescueOptions}
                    value={String(idRescate)}
                    onChange={(val) => {
                      setIdRescate(val);
                      const found = rescatesDisponibles.find(
                        (r) => String(r.id_rescate) === String(val)
                      );
                      if (found) {
                        if (!lugarRescate && found.ubicacion) setLugarRescate(found.ubicacion);
                        if (!fechaRescate && found.fecha_rescate) {
                          setFechaRescate(String(found.fecha_rescate).split('T')[0]);
                        }
                      }
                    }}
                  />
                ) : null}

                <FieldInput
                  label="Ubicación actual (hogar temporal o sede)"
                  value={ubicacion}
                  onChangeText={setUbicacion}
                  placeholder="Ej: Hogar temporal en Los Olivos, Maracaibo"
                />

                <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
                  <FieldInput
                    label="Fecha de rescate (AAAA-MM-DD)"
                    value={fechaRescate}
                    onChangeText={setFechaRescate}
                    placeholder="2026-11-20"
                    style={isWide && styles.colHalf}
                  />
                  <FieldInput
                    label="Sector del hallazgo"
                    value={lugarRescate}
                    onChangeText={setLugarRescate}
                    placeholder="Ej: Vereda del Lago"
                    style={isWide && styles.colHalf}
                  />
                </View>
              </SectionSheet>

              <SectionSheet title="Carácter y convivencia">
                <FieldInput
                  label="Descripción general"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                  numberOfLines={4}
                  placeholder="Historia del animal, estado anímico y necesidades de espacio."
                />
                <FieldInput
                  label="Temperamento observado"
                  value={comportamiento}
                  onChangeText={setComportamiento}
                  multiline
                  numberOfLines={3}
                  placeholder="Ej: Sociable con personas, camina con correa, tranquilo dentro de casa."
                />

                <OptionGroup
                  label="Nivel de actividad física requerido"
                  options={NIVELES_EJERCICIO}
                  value={nivelEjercicio}
                  onChange={setNivelEjercicio}
                />

                <SwitchItem
                  label="Convive adecuadamente con niños"
                  value={compatNinos}
                  onChange={setCompatNinos}
                  palette={palette}
                  fonts={fonts}
                />
                <SwitchItem
                  label="Convive adecuadamente con otros perros"
                  value={compatPerros}
                  onChange={setCompatPerros}
                  palette={palette}
                  fonts={fonts}
                />
                <SwitchItem
                  label="Convive adecuadamente con gatos"
                  value={compatGatos}
                  onChange={setCompatGatos}
                  palette={palette}
                  fonts={fonts}
                />
              </SectionSheet>
            </>
          )}

          {seccion === 'salud' && (
            <SectionSheet title="Antecedentes clínicos y vacunación">
              <FieldInput
                label="Condición clínica general"
                value={condicionSalud}
                onChangeText={setCondicionSalud}
                placeholder="Ej: Sano, desparasitado, en recuperación nutricional"
              />
              <SwitchItem
                label="Animal esterilizado"
                value={esterilizado}
                onChange={setEsterilizado}
                palette={palette}
                fonts={fonts}
              />
              <SwitchItem
                label="Posee microchip de identificación"
                value={microchip}
                onChange={setMicrochip}
                palette={palette}
                fonts={fonts}
              />
              {microchip ? (
                <FieldInput
                  label="Código de microchip"
                  value={numMicrochip}
                  onChangeText={setNumMicrochip}
                />
              ) : null}

              <FieldInput label="Alergias conocidas" value={alergias} onChangeText={setAlergias} />
              <FieldInput
                label="Enfermedades o cirugías previas"
                value={enfermedades}
                onChangeText={setEnfermedades}
                multiline
                numberOfLines={2}
              />
              <FieldInput
                label="Medicación activa"
                value={medicamentos}
                onChangeText={setMedicamentos}
              />

              <View style={[styles.subBlock, { borderTopColor: palette.border }]}>
                <Text
                  style={{
                    color: palette.ink,
                    fontFamily: fonts.serif,
                    fontSize: 17,
                    fontWeight: '600',
                    marginBottom: 10,
                  }}
                >
                  Dosis de vacunación ({vacunas.length})
                </Text>

                {vacunas.map((v, i) => (
                  <View
                    key={`vac-row-${i}`}
                    style={[
                      styles.addedItem,
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
                    <ActionButton
                      label="Quitar"
                      variant="dangerOutline"
                      compact
                      onPress={() => setVacunas((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </View>
                ))}

                <FieldInput
                  label="Nombre de vacuna"
                  value={nuevaVacunaNombre}
                  onChangeText={setNuevaVacunaNombre}
                  placeholder="Ej: Séxtuple canina, Antirrábica, Triple felina"
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
                <ActionButton label="Añadir vacuna a la lista" variant="secondary" onPress={agregarVacuna} />
              </View>
            </SectionSheet>
          )}

          {seccion === 'alimentacion' && (
            <SectionSheet title="Pauta nutricional recomendada">
              <FieldInput
                label="Tipo de alimento"
                value={aliTipo}
                onChangeText={setAliTipo}
                placeholder="Ej: Alimento seco adulto, dieta blanda mixta"
              />
              <View style={[styles.twoCols, isWide && styles.twoColsWide]}>
                <FieldInput
                  label="Frecuencia diaria"
                  value={aliFrecuencia}
                  onChangeText={setAliFrecuencia}
                  placeholder="Ej: 2 tomas diarias"
                  style={isWide && styles.colHalf}
                />
                <FieldInput
                  label="Cantidad por toma"
                  value={aliCantidad}
                  onChangeText={setAliCantidad}
                  placeholder="Ej: 220 gramos"
                  style={isWide && styles.colHalf}
                />
              </View>
              <FieldInput
                label="Marca o fórmula habitual"
                value={aliMarca}
                onChangeText={setAliMarca}
              />
              <FieldInput
                label="Restricciones o cuidados digestivos"
                value={aliRestricciones}
                onChangeText={setAliRestricciones}
                multiline
                numberOfLines={2}
              />
            </SectionSheet>
          )}

          {seccion === 'legal' && (
            <SectionSheet
              title="Constancias y soporte documental"
              subtitle="Registra números de actas de rescate, entregas voluntarias o certificados clínicos."
            >
              {documentosLegales.map((doc, idx) => (
                <View
                  key={`doc-${idx}`}
                  style={[
                    styles.addedItem,
                    {
                      backgroundColor: palette.surfaceSubtle,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text style={{ flex: 1, color: palette.ink, fontFamily: fonts.sans, fontSize: 13.5 }}>
                    {doc}
                  </Text>
                  <ActionButton
                    label="Quitar"
                    variant="dangerOutline"
                    compact
                    onPress={() => setDocumentosLegales((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </View>
              ))}

              <FieldInput
                label="Identificador o descripción del documento"
                value={nuevoDocumento}
                onChangeText={setNuevoDocumento}
                placeholder="Ej: Acta de resguardo Fundación Huellas #FH-2026-105"
              />
              <ActionButton
                label="Añadir documento a la ficha"
                variant="secondary"
                onPress={agregarDocumentoLegal}
              />
            </SectionSheet>
          )}

          <View style={styles.saveBar}>
            <ActionButton
              label="Cancelar"
              variant="secondary"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <ActionButton
              label={
                loading
                  ? 'Guardando en Supabase...'
                  : isEditing
                  ? 'Guardar cambios de ficha'
                  : 'Publicar ficha en catálogo'
              }
              variant="primary"
              loading={loading}
              onPress={handleGuardar}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3200}>
        {snackMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

function SwitchItem({ label, value, onChange, palette, fonts }) {
  return (
    <View style={[styles.switchRow, { borderColor: palette.border }]}>
      <Text style={{ flex: 1, color: palette.ink, fontFamily: fonts.sans, fontSize: 14 }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} color={palette.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  body: {
    maxWidth: 920,
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
    minWidth: 140,
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  twoCols: { flexDirection: 'column' },
  twoColsWide: { flexDirection: 'row', gap: 14 },
  colHalf: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  subBlock: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 16,
  },
  addedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  saveBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
