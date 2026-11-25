import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { resolveImageUrl } from '../constants/api';
import { useAppTheme } from '../contexts/ThemeContext';
import { StatusStamp, FolioCode } from './ui';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80';

const ESPECIE_LABEL = {
  perro: 'Canino',
  gato: 'Felino',
  ave: 'Ave',
  conejo: 'Lagomorfo',
  otro: 'Otro',
};

const SEXO_LABEL = {
  macho: 'Macho',
  hembra: 'Hembra',
};

const TAMANO_LABEL = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
};

export default function PetCard({ mascota, onPress, cardWidth }) {
  const { palette, fonts } = useAppTheme();
  const [hovered, setHovered] = useState(false);

  const rawFoto =
    mascota.foto_principal ||
    (mascota.fotos && mascota.fotos.length > 0
      ? mascota.fotos[0].url_imagen || mascota.fotos[0].url || mascota.fotos[0]
      : null);

  const foto = resolveImageUrl(rawFoto) || PLACEHOLDER_IMAGE;
  const estado = mascota.estado || 'en_adopcion';
  const especieKey = mascota.especie?.toLowerCase() || 'otro';
  const edadDisplay =
    mascota.edad_aprox || (mascota.edad ? `${mascota.edad} años` : 'Edad por precisar');

  const widthStyle = cardWidth ? { width: cardWidth } : { width: '100%' };

  return (
    <View style={[styles.wrapper, widthStyle]}>
      <Pressable
        onPress={() => onPress && onPress(mascota)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`Ver ficha de ${mascota.nombre}`}
        style={({ pressed }) => [
          styles.sheet,
          {
            backgroundColor: palette.surface,
            borderColor: hovered ? palette.borderStrong : palette.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={[styles.topMeta, { borderBottomColor: palette.border }]}>
          <FolioCode prefix="FICHA" id={mascota.id_mascota} />
          <StatusStamp status={estado} />
        </View>

        <Image
          source={{ uri: foto }}
          style={[styles.photo, { backgroundColor: palette.surfaceSubtle }]}
          resizeMode="cover"
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.name,
                { color: palette.ink, fontFamily: fonts.serif },
              ]}
              numberOfLines={1}
            >
              {mascota.nombre}
            </Text>
            <Text
              style={[
                styles.speciesTag,
                { color: palette.primaryText, fontFamily: fonts.mono },
              ]}
            >
              {ESPECIE_LABEL[especieKey] || mascota.especie || 'Animal'}
            </Text>
          </View>

          <Text
            style={[
              styles.specsLine,
              { color: palette.inkSecondary, fontFamily: fonts.sans },
            ]}
            numberOfLines={1}
          >
            {mascota.raza || 'Mestizo'} · {edadDisplay}
            {mascota.sexo ? ` · ${SEXO_LABEL[mascota.sexo] || mascota.sexo}` : ''}
            {mascota.tamano ? ` · ${TAMANO_LABEL[mascota.tamano] || mascota.tamano}` : ''}
          </Text>

          {mascota.ubicacion ? (
            <Text
              style={[
                styles.locationLine,
                { color: palette.inkSecondary, fontFamily: fonts.mono },
              ]}
              numberOfLines={1}
            >
              {mascota.ubicacion}
            </Text>
          ) : null}

          {mascota.descripcion ? (
            <Text
              style={[
                styles.description,
                { color: palette.ink, fontFamily: fonts.sans },
              ]}
              numberOfLines={2}
            >
              {mascota.descripcion}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: palette.border,
              backgroundColor: hovered ? palette.surfaceSubtle : palette.surface,
            },
          ]}
        >
          <Text
            style={{
              color: palette.inkSecondary,
              fontFamily: fonts.sans,
              fontSize: 12,
            }}
          >
            {mascota.esterilizado ? 'Esterilizado' : 'Control veterinario'}
          </Text>
          <Text
            style={{
              color: palette.primaryText,
              fontFamily: fonts.sans,
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            Abrir expediente
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  sheet: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  photo: {
    width: '100%',
    height: 206,
  },
  body: {
    padding: 16,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
  },
  speciesTag: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  specsLine: {
    fontSize: 13,
    lineHeight: 19,
  },
  locationLine: {
    fontSize: 11.5,
    marginTop: 4,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopWidth: 1,
    minHeight: 44,
  },
});
