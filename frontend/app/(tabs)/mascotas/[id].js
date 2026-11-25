import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import mascotasService from '../../../src/services/mascotas.service';
import { resolveImageUrl } from '../../../src/constants/api';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import ErrorMessage from '../../../src/components/ErrorMessage';
import {
  StatusStamp,
  FolioCode,
  ActionButton,
  SectionSheet,
  SpecRow,
  getStatusMeta,
} from '../../../src/components/ui';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generarHTMLPDF(mascota, mainPhotoUrl) {
  const statusLabel = getStatusMeta(mascota.estado).label;
  const vacunaRows =
    (mascota.vacunas || [])
      .map((v) => {
        const obj = typeof v === 'string' ? { nombre: v } : v;
        return `<tr><td>${escapeHtml(obj.nombre || '-')}</td><td>${escapeHtml(
          obj.fecha || '-'
        )}</td><td>${escapeHtml(obj.proxima || '-')}</td><td>${escapeHtml(
          obj.veterinario || '-'
        )}</td></tr>`;
      })
      .join('') ||
    '<tr><td colspan="4" style="text-align:center;color:#555">Sin vacunas registradas</td></tr>';

  const docRows =
    (mascota.documentos_legales || [])
      .map((d) => `<li style="margin-bottom:4px;">${escapeHtml(d)}</li>`)
      .join('') || '<li style="color:#555">Sin constancias adjuntas</li>';

  const ali = mascota.alimentacion || {};

  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8"/>
    <title>Expediente #${escapeHtml(mascota.id_mascota)} - ${escapeHtml(mascota.nombre)}</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; padding: 32px; color: #171A18; font-size: 13px; line-height: 1.5; }
      .masthead { display: flex; justify-content: space-between; border-bottom: 2px solid #134E3A; padding-bottom: 12px; margin-bottom: 24px; font-family: Arial, sans-serif; }
      .folio { font-family: monospace; font-size: 12px; color: #464D48; }
      .header { display: flex; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
      .header img { width: 190px; height: 140px; object-fit: cover; border-radius: 4px; border: 1px solid #CEC8BC; }
      h1 { margin: 0 0 6px 0; font-size: 26px; color: #171A18; }
      h2 { font-size: 15px; color: #134E3A; margin: 22px 0 8px 0; border-bottom: 1px solid #CEC8BC; padding-bottom: 4px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-family: Arial, sans-serif; }
      th { background: #EDE9DF; color: #171A18; padding: 7px 10px; text-align: left; font-size: 11.5px; border: 1px solid #CEC8BC; }
      td { border: 1px solid #CEC8BC; padding: 7px 10px; font-size: 12px; }
      footer { margin-top: 32px; border-top: 1px solid #CEC8BC; padding-top: 10px; color: #464D48; font-size: 11px; font-family: Arial, sans-serif; display: flex; justify-content: space-between; }
    </style>
  </head>
  <body>
    <div class="masthead">
      <div><strong>RED COMUNITARIA DE ADOPCIÓN Y RESCATE · ESTADO ZULIA</strong></div>
      <div class="folio">FICHA-${String(mascota.id_mascota || '').padStart(3, '0')} · ${escapeHtml(statusLabel)}</div>
    </div>

    <div class="header">
      <img src="${escapeHtml(mainPhotoUrl)}" alt="${escapeHtml(mascota.nombre)}"/>
      <div>
        <h1>${escapeHtml(mascota.nombre)}</h1>
        <p style="margin:4px 0;font-family:Arial,sans-serif;"><strong>Especie y raza:</strong> ${escapeHtml(mascota.especie || '')} · ${escapeHtml(mascota.raza || 'Mestizo')}</p>
        <p style="margin:4px 0;font-family:Arial,sans-serif;"><strong>Edad / Sexo / Tamaño:</strong> ${escapeHtml(mascota.edad_aprox || 'No indicada')} · ${escapeHtml(mascota.sexo || '-')} · ${escapeHtml(mascota.tamano || '-')}</p>
        <p style="margin:4px 0;font-family:Arial,sans-serif;"><strong>Ubicación actual:</strong> ${escapeHtml(mascota.ubicacion || 'No especificada')}</p>
      </div>
    </div>

    ${mascota.descripcion ? `<p><strong>Reseña:</strong> ${escapeHtml(mascota.descripcion)}</p>` : ''}

    <h2>Condición Clínica y Vacunación</h2>
    <table>
      <tbody>
        <tr><th>Condición general</th><td>${escapeHtml(mascota.condicion_salud || 'No especificada')}</td><th>Esterilizado</th><td>${mascota.esterilizado ? 'Sí' : 'No'}</td></tr>
        <tr><th>Peso</th><td>${mascota.peso ? escapeHtml(mascota.peso + ' kg') : 'No registrado'}</td><th>Microchip</th><td>${mascota.microchip ? 'Sí (' + escapeHtml(mascota.numero_microchip || '') + ')' : 'No'}</td></tr>
        <tr><th>Alergias</th><td>${escapeHtml(mascota.alergias || 'Ninguna')}</td><th>Medicamentos</th><td>${escapeHtml(mascota.medicamentos_actuales || 'Ninguno')}</td></tr>
      </tbody>
    </table>

    <table style="margin-top:12px;">
      <thead><tr><th>Vacuna</th><th>Aplicación</th><th>Próxima dosis</th><th>Profesional</th></tr></thead>
      <tbody>${vacunaRows}</tbody>
    </table>

    <h2>Plan Nutricional</h2>
    <table>
      <tbody>
        <tr><th>Tipo</th><td>${escapeHtml(ali.tipo || '-')}</td><th>Frecuencia</th><td>${escapeHtml(ali.frecuencia || '-')}</td></tr>
        <tr><th>Ración</th><td>${escapeHtml(ali.cantidad || '-')}</td><th>Referencia</th><td>${escapeHtml(ali.marca || '-')}</td></tr>
      </tbody>
    </table>

    <h2>Constancias Documentales</h2>
    <ul style="font-family:Arial,sans-serif;font-size:12px;">${docRows}</ul>

    <footer>
      <span>Adopción Zulia · Registro Comunitario</span>
      <span>Emitido el ${new Date().toLocaleDateString('es-VE')}</span>
    </footer>
  </body>
  </html>`;
}

export default function MascotaDetail() {
  const { palette, fonts } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const rol = user?.rol?.toLowerCase() || '';

  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [activeTab, setActiveTab] = useState('info');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snackMessage, setSnackMessage] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const fetchMascota = useCallback(async () => {
    try {
      setError('');
      const result = await mascotasService.obtener(id);
      if (result.success) {
        setMascota(result.data);
      } else {
        setError(result.message || 'No se pudo cargar la ficha.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consultar la ficha en el servidor.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchMascota();
    }, [fetchMascota])
  );

  const handlePickPhoto = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setUploadingPhoto(true);
        const asset = pickerResult.assets[0];
        const formData = new FormData();

        if (Platform.OS === 'web') {
          if (asset.file) {
            formData.append('foto', asset.file, asset.fileName || asset.file.name || 'foto.jpg');
          } else {
            const resp = await fetch(asset.uri);
            const blob = await resp.blob();
            formData.append('foto', blob, `mascota-${id}-${Date.now()}.jpg`);
          }
        } else {
          const filename = asset.uri.split('/').pop() || 'photo.jpg';
          formData.append('foto', { uri: asset.uri, name: filename, type: 'image/jpeg' });
        }

        const result = await mascotasService.subirFotos(id, formData);
        if (result.success) {
          setSnackMessage('Fotografía incorporada al expediente.');
          setSnackVisible(true);
          fetchMascota();
        }
      }
    } catch (err) {
      setSnackMessage(err.response?.data?.message || 'No se pudo adjuntar la fotografía.');
      setSnackVisible(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteMascota = async () => {
    setDeleting(true);
    try {
      const res = await mascotasService.eliminar(id);
      if (res.success) {
        setDeleteDialog(false);
        router.replace('/(tabs)/mascotas');
      }
    } catch (err) {
      setDeleteDialog(false);
      setSnackMessage(
        err.response?.data?.message || 'No cuentas con permisos para retirar esta ficha.'
      );
      setSnackVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!mascota) return;
    setExportingPDF(true);
    try {
      const rawUrl =
        mascota.foto_principal ||
        (mascota.fotos && mascota.fotos[0]?.url_imagen) ||
        PLACEHOLDER_IMAGE;
      const mainPhotoUrl = resolveImageUrl(rawUrl) || PLACEHOLDER_IMAGE;
      const html = generarHTMLPDF(mascota, mainPhotoUrl);
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          win.print();
        }
      } else {
        await Share.share({
          message: `Expediente de ${mascota.nombre} (${mascota.especie})`,
          title: `Expediente ${mascota.nombre}`,
        });
      }
      setSnackMessage('Documento preparado para impresión o guardado en PDF.');
      setSnackVisible(true);
    } catch (_) {
      setSnackMessage('No se pudo abrir la vista de impresión.');
      setSnackVisible(true);
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Cargando expediente...' }} />
        <LoadingScreen message="Cargando expediente completo..." />
      </>
    );
  }

  if (error || !mascota) {
    return (
      <>
        <Stack.Screen options={{ title: 'Ficha no disponible' }} />
        <ErrorMessage message={error || 'Mascota no encontrada.'} onRetry={fetchMascota} />
      </>
    );
  }

  const fotosObjs = Array.isArray(mascota.fotos) ? mascota.fotos : [];
  const fotosUrls =
    fotosObjs.length > 0
      ? fotosObjs.map((f) => resolveImageUrl(f.url_imagen || f) || PLACEHOLDER_IMAGE)
      : [resolveImageUrl(mascota.foto_principal) || PLACEHOLDER_IMAGE];

  const estado = mascota.estado || 'en_adopcion';
  const isOwnerRescatista =
    rol === 'rescatista' && Number(mascota.id_publicador) === Number(user?.id_usuario);
  const canAdopt =
    rol === 'adoptante' && (estado === 'en_adopcion' || estado === 'en_proceso');
  const canEdit =
    rol === 'administrador' || rol === 'admin' || rol === 'veterinario' || isOwnerRescatista;
  const canDelete = rol === 'administrador' || rol === 'admin' || isOwnerRescatista;
  const canManageExpediente =
    rol === 'veterinario' || rol === 'administrador' || rol === 'admin';

  const tabs = [
    { key: 'info', label: 'Ficha general' },
    { key: 'salud', label: 'Salud y vacunas' },
    { key: 'alimentacion', label: 'Nutrición' },
    { key: 'legal', label: 'Constancias' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <Stack.Screen
        options={{
          title: `Ficha: ${mascota.nombre}`,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.breadcrumbRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/mascotas')}
            accessibilityRole="link"
            style={styles.backLink}
          >
            <Text style={{ color: palette.primaryText, fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '600' }}>
              Volver al catálogo
            </Text>
          </Pressable>
          <FolioCode prefix="FICHA" id={mascota.id_mascota} />
        </View>

        <View style={[styles.dossierGrid, isDesktop && styles.dossierGridDesktop]}>
          <View style={[styles.leftRail, isDesktop && styles.leftRailDesktop]}>
            <View
              style={[
                styles.photoFrame,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Image
                source={{ uri: fotosUrls[selectedPhoto] || fotosUrls[0] }}
                style={[styles.mainPhoto, isDesktop && styles.mainPhotoDesktop]}
                resizeMode="cover"
              />
              {fotosUrls.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.thumbRow,
                    { borderTopColor: palette.border },
                  ]}
                >
                  {fotosUrls.map((url, idx) => (
                    <Pressable
                      key={`thumb-${idx}`}
                      onPress={() => setSelectedPhoto(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Fotografía ${idx + 1}`}
                    >
                      <Image
                        source={{ uri: url }}
                        style={[
                          styles.thumb,
                          {
                            borderColor:
                              selectedPhoto === idx ? palette.primary : palette.border,
                            borderWidth: selectedPhoto === idx ? 2 : 1,
                          },
                        ]}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            <SectionSheet title="Acciones del expediente">
              <View style={styles.actionStack}>
                {canAdopt ? (
                  <ActionButton
                    label={`Postularme para adoptar a ${mascota.nombre}`}
                    variant="accent"
                    fullWidth
                    onPress={() =>
                      router.push(
                        `/(tabs)/solicitudes/nueva?mascotaId=${
                          mascota.id_mascota
                        }&mascotaNombre=${encodeURIComponent(mascota.nombre)}`
                      )
                    }
                  />
                ) : null}

                {canManageExpediente ? (
                  <ActionButton
                    label="Abrir historia clínica veterinaria"
                    variant="primary"
                    fullWidth
                    onPress={() => router.push(`/(tabs)/expedientes/${mascota.id_mascota}`)}
                  />
                ) : null}

                <View style={styles.secondaryActionsGrid}>
                  <ActionButton
                    label={exportingPDF ? 'Generando...' : 'Imprimir PDF'}
                    variant="secondary"
                    loading={exportingPDF}
                    onPress={handleExportarPDF}
                    style={{ flex: 1 }}
                  />
                  {canEdit ? (
                    <ActionButton
                      label={uploadingPhoto ? 'Subiendo...' : 'Añadir foto'}
                      variant="secondary"
                      loading={uploadingPhoto}
                      onPress={handlePickPhoto}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </View>

                {(canEdit || canDelete) ? (
                  <View style={styles.secondaryActionsGrid}>
                    {canEdit ? (
                      <ActionButton
                        label="Editar datos"
                        variant="secondary"
                        onPress={() =>
                          router.push(`/(tabs)/mascotas/nueva?editId=${mascota.id_mascota}`)
                        }
                        style={{ flex: 1 }}
                      />
                    ) : null}
                    {canDelete ? (
                      <ActionButton
                        label="Retirar ficha"
                        variant="dangerOutline"
                        onPress={() => setDeleteDialog((v) => !v)}
                        style={{ flex: 1 }}
                      />
                    ) : null}
                  </View>
                ) : null}

                {deleteDialog ? (
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
                      ¿Confirmas eliminar permanentemente la publicación de {mascota.nombre}?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                      <ActionButton
                        label="Cancelar"
                        variant="secondary"
                        compact
                        onPress={() => setDeleteDialog(false)}
                      />
                      <ActionButton
                        label="Confirmar retiro"
                        variant="danger"
                        compact
                        loading={deleting}
                        onPress={handleDeleteMascota}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </SectionSheet>
          </View>

          <View style={[styles.rightCol, isDesktop && styles.rightColDesktop]}>
            <View
              style={[
                styles.titleSheet,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.titleTopRow}>
                <FolioCode prefix="EXPEDIENTE" id={mascota.id_mascota} />
                <StatusStamp status={estado} />
              </View>

              <Text
                style={[
                  styles.petName,
                  { color: palette.ink, fontFamily: fonts.serif },
                ]}
              >
                {mascota.nombre}
              </Text>

              <Text
                style={{
                  color: palette.inkSecondary,
                  fontFamily: fonts.sans,
                  fontSize: 14.5,
                  lineHeight: 22,
                }}
              >
                {mascota.raza || 'Mestizo'} · {mascota.edad_aprox || 'Edad por precisar'} ·{' '}
                {mascota.sexo || '-'} · Tamaño {mascota.tamano || '-'}
                {mascota.publicador_nombre
                  ? ` · Resguardo a cargo de ${mascota.publicador_nombre}`
                  : ''}
              </Text>

              {mascota.descripcion ? (
                <Text
                  style={[
                    styles.leadDescription,
                    {
                      color: palette.ink,
                      fontFamily: fonts.sans,
                      borderTopColor: palette.border,
                    },
                  ]}
                >
                  {mascota.descripcion}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.tabsBar,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.tabBtn,
                      active && {
                        backgroundColor: palette.primary,
                      },
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
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab === 'info' && (
              <SectionSheet title="Datos generales y convivencia">
                <SpecRow label="Especie" value={mascota.especie} />
                <SpecRow label="Raza" value={mascota.raza || 'Mestizo'} />
                <SpecRow label="Edad estimada" value={mascota.edad_aprox} />
                <SpecRow label="Peso registrado" value={mascota.peso ? `${mascota.peso} kg` : null} mono />
                <SpecRow label="Color o pelaje" value={mascota.color} />
                <SpecRow label="Ubicación actual" value={mascota.ubicacion} />
                <SpecRow
                  label="Fecha de rescate"
                  value={mascota.fecha_rescate ? String(mascota.fecha_rescate).split('T')[0] : null}
                  mono
                />
                <SpecRow
                  label="Lugar del hallazgo"
                  value={mascota.lugar_rescate || mascota.rescate_ubicacion}
                />
                <SpecRow label="Nivel de actividad" value={mascota.nivel_ejercicio} />
                <SpecRow label="Temperamento" value={mascota.comportamiento} />
                <SpecRow
                  label="Convivencia en hogar"
                  value={`Niños: ${mascota.compatible_ninos ? 'Compatible' : 'Requiere precaución'} · Perros: ${
                    mascota.compatible_perros ? 'Compatible' : 'No evaluado / selectivo'
                  } · Gatos: ${mascota.compatible_gatos ? 'Compatible' : 'No evaluado / selectivo'}`}
                  last
                />
              </SectionSheet>
            )}

            {activeTab === 'salud' && (
              <SectionSheet title="Estado sanitario y vacunación">
                <SpecRow label="Condición general" value={mascota.condicion_salud} />
                <SpecRow label="Esterilización" value={mascota.esterilizado ? 'Realizada' : 'Pendiente'} />
                <SpecRow
                  label="Identificación microchip"
                  value={
                    mascota.microchip
                      ? `Registrado (${mascota.numero_microchip || 'sin código'})`
                      : 'No posee'
                  }
                  mono={Boolean(mascota.numero_microchip)}
                />
                <SpecRow label="Alergias conocidas" value={mascota.alergias || 'Ninguna'} />
                <SpecRow label="Antecedentes médicos" value={mascota.enfermedades_previas || 'Ninguno'} />
                <SpecRow
                  label="Medicación actual"
                  value={mascota.medicamentos_actuales || 'Ninguna'}
                  last={!mascota.expedientes?.length && !(mascota.vacunas || []).length}
                />

                {Array.isArray(mascota.expedientes) && mascota.expedientes.length > 0 ? (
                  <View
                    style={[
                      styles.clinicalNote,
                      {
                        backgroundColor: palette.status.success.bg,
                        borderColor: palette.status.success.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: palette.status.success.fg,
                        fontFamily: fonts.mono,
                        fontSize: 11.5,
                        fontWeight: '600',
                      }}
                    >
                      ÚLTIMO REPORTE VETERINARIO ·{' '}
                      {new Date(mascota.expedientes[0].fecha_actualizacion).toLocaleDateString('es-VE')}
                    </Text>
                    <Text
                      style={{
                        color: palette.status.success.fg,
                        fontFamily: fonts.sans,
                        fontSize: 13.5,
                        fontWeight: '700',
                        marginTop: 4,
                      }}
                    >
                      Atendido por: {mascota.expedientes[0].veterinario_nombre || 'Médico veterinario'}
                    </Text>
                    <Text
                      style={{
                        color: palette.status.success.fg,
                        fontFamily: fonts.sans,
                        fontSize: 13.5,
                        marginTop: 4,
                      }}
                    >
                      Diagnóstico: {mascota.expedientes[0].diagnostico}
                    </Text>
                    {mascota.expedientes[0].tratamientos ? (
                      <Text
                        style={{
                          color: palette.status.success.fg,
                          fontFamily: fonts.sans,
                          fontSize: 13,
                          marginTop: 2,
                        }}
                      >
                        Tratamiento: {mascota.expedientes[0].tratamientos}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={{ marginTop: 18 }}>
                  <Text
                    style={{
                      color: palette.ink,
                      fontFamily: fonts.serif,
                      fontSize: 17,
                      fontWeight: '600',
                      marginBottom: 8,
                    }}
                  >
                    Registro de vacunas ({(mascota.vacunas || []).length})
                  </Text>
                  {(mascota.vacunas || []).length === 0 ? (
                    <Text style={{ color: palette.inkSecondary, fontFamily: fonts.sans, fontSize: 13.5 }}>
                      No figuran dosis cargadas en el expediente.
                    </Text>
                  ) : (
                    mascota.vacunas.map((v, i) => {
                      const vObj = typeof v === 'string' ? { nombre: v } : v;
                      return (
                        <View
                          key={`vac-${i}`}
                          style={[
                            styles.SubRow,
                            {
                              backgroundColor: palette.surfaceSubtle,
                              borderColor: palette.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: palette.ink,
                              fontFamily: fonts.sans,
                              fontSize: 13.5,
                              fontWeight: '700',
                            }}
                          >
                            {vObj.nombre}
                          </Text>
                          <Text
                            style={{
                              color: palette.inkSecondary,
                              fontFamily: fonts.mono,
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            Aplicada: {vObj.fecha || 'N/D'} · Refuerzo: {vObj.proxima || 'N/D'}
                            {vObj.veterinario ? ` · ${vObj.veterinario}` : ''}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </SectionSheet>
            )}

            {activeTab === 'alimentacion' && (
              <SectionSheet title="Pauta de alimentación">
                {mascota.alimentacion && Object.keys(mascota.alimentacion).length > 0 ? (
                  <>
                    <SpecRow label="Tipo de dieta" value={mascota.alimentacion.tipo} />
                    <SpecRow label="Frecuencia diaria" value={mascota.alimentacion.frecuencia} />
                    <SpecRow label="Ración sugerida" value={mascota.alimentacion.cantidad} mono />
                    <SpecRow label="Marca o referencia" value={mascota.alimentacion.marca} />
                    <SpecRow
                      label="Restricciones"
                      value={mascota.alimentacion.restricciones || 'Sin restricciones especiales'}
                      last
                    />
                  </>
                ) : (
                  <Text style={{ color: palette.inkSecondary, fontFamily: fonts.sans, fontSize: 14 }}>
                    El publicador aún no ha detallado una pauta nutricional específica.
                  </Text>
                )}
              </SectionSheet>
            )}

            {activeTab === 'legal' && (
              <SectionSheet
                title="Constancias y soporte documental"
                subtitle="Actas de rescate, certificados sanitarios y compromisos de entrega."
              >
                {(mascota.documentos_legales || []).length === 0 ? (
                  <Text
                    style={{
                      color: palette.inkSecondary,
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      marginBottom: 16,
                    }}
                  >
                    No hay actas o constancias numeradas asociadas a esta ficha.
                  </Text>
                ) : (
                  <View style={{ marginBottom: 16, gap: 8 }}>
                    {mascota.documentos_legales.map((doc, i) => (
                      <View
                        key={`doc-${i}`}
                        style={[
                          styles.SubRow,
                          {
                            backgroundColor: palette.surfaceSubtle,
                            borderColor: palette.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: palette.ink,
                            fontFamily: fonts.sans,
                            fontSize: 13.5,
                            fontWeight: '500',
                          }}
                        >
                          {doc}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <ActionButton
                  label={exportingPDF ? 'Generando documento...' : 'Descargar o imprimir expediente PDF'}
                  variant="primary"
                  onPress={handleExportarPDF}
                  loading={exportingPDF}
                />
              </SectionSheet>
            )}
          </View>
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={3000}>
        {snackMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  dossierGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  dossierGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  leftRail: {
    width: '100%',
  },
  leftRailDesktop: {
    flex: 0.85,
    maxWidth: 460,
  },
  rightCol: {
    width: '100%',
  },
  rightColDesktop: {
    flex: 1.15,
  },
  photoFrame: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mainPhoto: {
    width: '100%',
    height: 290,
  },
  mainPhotoDesktop: {
    height: 350,
  },
  thumbRow: {
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  thumb: {
    width: 64,
    height: 52,
    borderRadius: 4,
  },
  actionStack: {
    gap: 10,
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  confirmBox: {
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  titleSheet: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  titleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 38,
    marginBottom: 6,
  },
  leadDescription: {
    fontSize: 14.5,
    lineHeight: 22,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  tabsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    minWidth: 110,
    minHeight: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  clinicalNote: {
    marginTop: 14,
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  SubRow: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
});
