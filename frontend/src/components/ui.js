import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';

const STATUS_MAP = {
  en_adopcion: { label: 'En adopción', tone: 'success' },
  disponible: { label: 'En adopción', tone: 'success' },
  aprobada: { label: 'Aprobada', tone: 'success' },
  activo: { label: 'Activo', tone: 'success' },
  completada: { label: 'Completada', tone: 'success' },
  con_expediente: { label: 'Con historia clínica', tone: 'success' },

  en_proceso: { label: 'En evaluación', tone: 'warning' },
  pendiente: { label: 'Pendiente', tone: 'warning' },
  programada: { label: 'Programada', tone: 'warning' },
  sin_evaluacion: { label: 'Pendiente de apertura', tone: 'warning' },

  adoptada: { label: 'Adoptada', tone: 'info' },
  adoptado: { label: 'Adoptada', tone: 'info' },
  en_revision: { label: 'En revisión', tone: 'info' },
  en_rescate: { label: 'En resguardo', tone: 'info' },

  en_tratamiento: { label: 'En tratamiento', tone: 'danger' },
  rechazada: { label: 'Rechazada', tone: 'danger' },
  suspendido: { label: 'Suspendido', tone: 'danger' },
  cancelada: { label: 'Cancelada', tone: 'danger' },

  inactivo: { label: 'Inactivo', tone: 'neutral' },
};

export function getStatusMeta(statusKey, customLabel) {
  const key = String(statusKey || '').toLowerCase();
  const base = STATUS_MAP[key] || { label: customLabel || statusKey || 'Registrado', tone: 'neutral' };
  return customLabel ? { ...base, label: customLabel } : base;
}

export function StatusStamp({ status, label, tone: explicitTone, style }) {
  const { palette, fonts } = useAppTheme();
  const meta = getStatusMeta(status, label);
  const toneKey = explicitTone || meta.tone || 'neutral';
  const colors = palette.status[toneKey] || palette.status.neutral;

  return (
    <View
      style={[
        styles.stamp,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.stampText,
          {
            color: colors.fg,
            fontFamily: fonts.sans,
          },
        ]}
        numberOfLines={1}
      >
        {meta.label}
      </Text>
    </View>
  );
}

export function FolioCode({ prefix = 'FOLIO', id, style }) {
  const { palette, fonts } = useAppTheme();
  const padded = id !== undefined && id !== null ? String(id).padStart(3, '0') : '000';
  return (
    <Text
      style={[
        styles.folio,
        {
          color: palette.inkSecondary,
          fontFamily: fonts.mono,
        },
        style,
      ]}
    >
      {prefix}-{padded}
    </Text>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  secondaryActionLabel,
  onSecondaryAction,
  maxWidth = 1200,
}) {
  const { palette, fonts } = useAppTheme();

  return (
    <View
      style={[
        styles.pageHeaderWrap,
        {
          borderBottomColor: palette.border,
          backgroundColor: palette.canvas,
        },
      ]}
    >
      <View style={[styles.pageHeaderInner, { maxWidth }]}>
        <View style={styles.pageHeaderCopy}>
          {eyebrow ? (
            <Text
              style={[
                styles.eyebrow,
                { color: palette.primaryText, fontFamily: fonts.mono },
              ]}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={[
              styles.pageTitle,
              { color: palette.ink, fontFamily: fonts.serif },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.pageSubtitle,
                { color: palette.inkSecondary, fontFamily: fonts.sans },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {(actionLabel || secondaryActionLabel) ? (
          <View style={styles.pageHeaderActions}>
            {secondaryActionLabel && onSecondaryAction ? (
              <ActionButton
                label={secondaryActionLabel}
                onPress={onSecondaryAction}
                variant="secondary"
              />
            ) : null}
            {actionLabel && onAction ? (
              <ActionButton
                label={actionLabel}
                onPress={onAction}
                variant={actionVariant}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  compact = false,
  icon,
  style,
  accessibilityLabel,
}) {
  const { palette, fonts, isDark } = useAppTheme();
  const [hovered, setHovered] = useState(false);

  let bg = palette.primary;
  let fg = palette.onPrimary;
  let borderCol = palette.primary;

  if (variant === 'accent') {
    bg = palette.accent;
    fg = palette.onAccent;
    borderCol = palette.accent;
  } else if (variant === 'secondary') {
    bg = hovered ? palette.surfaceSubtle : palette.surface;
    fg = palette.ink;
    borderCol = palette.borderStrong;
  } else if (variant === 'danger') {
    bg = palette.status.danger.fg;
    fg = isDark ? '#2B0B0A' : '#FFFFFF';
    borderCol = palette.status.danger.fg;
  } else if (variant === 'dangerOutline') {
    bg = hovered ? palette.status.danger.bg : 'transparent';
    fg = palette.status.danger.fg;
    borderCol = palette.status.danger.border;
  } else if (variant === 'ghost') {
    bg = hovered ? palette.surfaceSubtle : 'transparent';
    fg = palette.primaryText;
    borderCol = 'transparent';
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.buttonBase,
        compact ? styles.buttonCompact : styles.buttonStandard,
        fullWidth && { width: '100%' },
        {
          backgroundColor: bg,
          borderColor: borderCol,
          opacity: disabled ? 0.52 : pressed ? 0.88 : (hovered && (variant === 'primary' || variant === 'accent' || variant === 'danger')) ? 0.92 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={17} color={fg} />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          compact && styles.buttonLabelCompact,
          { color: fg, fontFamily: fonts.sans },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  helperText,
  errorText,
  rightActionLabel,
  onRightAction,
  onSubmitEditing,
  style,
}) {
  const { palette, fonts } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.fieldWrap, style]}>
      {label ? (
        <Text
          style={[
            styles.fieldLabel,
            { color: palette.ink, fontFamily: fonts.sans },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputShell,
          multiline && { minHeight: Math.max(88, numberOfLines * 26), alignItems: 'stretch' },
          {
            backgroundColor: disabled ? palette.surfaceSubtle : palette.surface,
            borderColor: errorText
              ? palette.status.danger.fg
              : focused
              ? palette.primary
              : palette.borderStrong,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.inkSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.inputNative,
            multiline && styles.inputMultiline,
            {
              color: palette.ink,
              fontFamily: fonts.sans,
            },
            Platform.OS === 'web' && { outlineStyle: 'none' },
          ]}
        />
        {rightActionLabel && onRightAction ? (
          <Pressable
            onPress={onRightAction}
            accessibilityRole="button"
            style={styles.inputRightBtn}
          >
            <Text
              style={{
                color: palette.primaryText,
                fontFamily: fonts.sans,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {rightActionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {errorText ? (
        <Text style={[styles.helperText, { color: palette.status.danger.fg, fontFamily: fonts.sans }]}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: palette.inkSecondary, fontFamily: fonts.sans }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export function OptionGroup({ label, options, value, onChange, wrap = true, style }) {
  const { palette, fonts } = useAppTheme();

  return (
    <View style={[styles.optionGroupWrap, style]}>
      {label ? (
        <Text
          style={[
            styles.fieldLabel,
            { color: palette.ink, fontFamily: fonts.sans },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View style={[styles.optionRow, wrap && { flexWrap: 'wrap' }]}>
        {options.map((opt) => {
          const optVal = opt.value !== undefined ? opt.value : opt.key;
          const active = value === optVal;
          return (
            <Pressable
              key={String(optVal)}
              onPress={() => onChange(optVal)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: active ? palette.primary : palette.surface,
                  borderColor: active ? palette.primary : palette.borderStrong,
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
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SectionSheet({ title, subtitle, rightElement, children, style }) {
  const { palette, fonts } = useAppTheme();

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      {(title || rightElement) ? (
        <View style={[styles.sheetHeader, { borderBottomColor: palette.border }]}>
          <View style={{ flex: 1 }}>
            {title ? (
              <Text
                style={[
                  styles.sheetTitle,
                  { color: palette.ink, fontFamily: fonts.serif },
                ]}
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: palette.inkSecondary, fontFamily: fonts.sans },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          {rightElement ? <View>{rightElement}</View> : null}
        </View>
      ) : null}
      <View style={styles.sheetBody}>{children}</View>
    </View>
  );
}

export function SpecRow({ label, value, mono = false, actionLabel, onAction, last = false }) {
  const { palette, fonts } = useAppTheme();

  return (
    <View
      style={[
        styles.specRow,
        !last && { borderBottomWidth: 1, borderBottomColor: palette.border },
      ]}
    >
      <Text
        style={[
          styles.specLabel,
          { color: palette.inkSecondary, fontFamily: fonts.sans },
        ]}
      >
        {label}
      </Text>
      <View style={styles.specValueWrap}>
        <Text
          style={[
            styles.specValue,
            {
              color: palette.ink,
              fontFamily: mono ? fonts.mono : fonts.sans,
              fontSize: mono ? 12.5 : 14,
            },
          ]}
        >
          {value || 'No registrado'}
        </Text>
        {actionLabel && onAction ? (
          <ActionButton
            label={actionLabel}
            onPress={onAction}
            variant="ghost"
            compact
          />
        ) : null}
      </View>
    </View>
  );
}

export function ThemeToggleButton({ compact = false }) {
  const { isDark, toggleTheme, palette, fonts } = useAppTheme();
  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={[
        styles.themeBtn,
        compact && styles.themeBtnCompact,
        {
          backgroundColor: palette.surfaceSubtle,
          borderColor: palette.borderStrong,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={isDark ? 'weather-sunny' : 'weather-night'}
        size={16}
        color={palette.ink}
      />
      {!compact ? (
        <Text
          style={{
            color: palette.ink,
            fontFamily: fonts.sans,
            fontSize: 12,
            fontWeight: '600',
          }}
        >
          {isDark ? 'Claro' : 'Oscuro'}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stamp: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  stampText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  folio: {
    fontSize: 12,
    fontWeight: '500',
  },
  pageHeaderWrap: {
    borderBottomWidth: 1,
    width: '100%',
  },
  pageHeaderInner: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 14,
  },
  pageHeaderCopy: {
    flex: 1,
    minWidth: 240,
  },
  eyebrow: {
    fontSize: 12,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    maxWidth: 680,
  },
  pageHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonStandard: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonCompact: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonLabelCompact: {
    fontSize: 13,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    minHeight: 44,
  },
  inputNative: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputRightBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  optionGroupWrap: {
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '600',
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sheetBody: {
    padding: 20,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
  },
  specLabel: {
    fontSize: 13,
    minWidth: 140,
    flexShrink: 0,
  },
  specValueWrap: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  specValue: {
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  themeBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeBtnCompact: {
    minWidth: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
});
