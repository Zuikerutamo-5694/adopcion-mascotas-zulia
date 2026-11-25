import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const FONTS = {
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'IBM Plex Mono', Consolas, 'Courier New', monospace",
};

export const LIGHT_PALETTE = {
  mode: 'light',
  canvas: '#F6F4EE',
  surface: '#FFFFFF',
  surfaceSubtle: '#EDE9DF',
  ink: '#171A18',
  inkSecondary: '#464D48',
  border: '#CEC8BC',
  borderStrong: '#767167',
  primary: '#134E3A',
  primaryText: '#134E3A',
  onPrimary: '#FFFFFF',
  primarySubtle: '#E3F1EA',
  accent: '#A83814',
  accentText: '#A83814',
  onAccent: '#FFFFFF',
  accentSubtle: '#F9ECE6',
  danger: '#8E1F19',
  onDanger: '#FFFFFF',
  status: {
    success: { bg: '#E3F1EA', fg: '#134E3A', border: '#9AC5B1' },
    warning: { bg: '#F9EFE0', fg: '#7C3E0B', border: '#DFBE93' },
    info: { bg: '#E6EEF4', fg: '#1B4464', border: '#A8C2D6' },
    danger: { bg: '#F9E8E6', fg: '#8E1F19', border: '#DFA9A4' },
    neutral: { bg: '#ECEAE4', fg: '#3F4440', border: '#C4C0B6' },
  },
};

export const DARK_PALETTE = {
  mode: 'dark',
  canvas: '#111513',
  surface: '#181E1B',
  surfaceSubtle: '#212925',
  ink: '#F1EFEA',
  inkSecondary: '#B3BCB6',
  border: '#2E3833',
  borderStrong: '#75837B',
  primary: '#4FD1A5',
  primaryText: '#6EE7B7',
  onPrimary: '#082219',
  primarySubtle: '#143328',
  accent: '#F59E56',
  accentText: '#F59E56',
  onAccent: '#1F1105',
  accentSubtle: '#332012',
  danger: '#FCA5A5',
  onDanger: '#2B0B0A',
  status: {
    success: { bg: '#143328', fg: '#86EFAC', border: '#285E49' },
    warning: { bg: '#362410', fg: '#FCD34D', border: '#6B471E' },
    info: { bg: '#162B3D', fg: '#93C5FD', border: '#2C5270' },
    danger: { bg: '#3B1817', fg: '#FCA5A5', border: '#732F2C' },
    neutral: { bg: '#252B28', fg: '#D1D7D3', border: '#49534E' },
  },
};

export function createPaperTheme(mode = 'light') {
  const p = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: 4,
    colors: {
      ...base.colors,
      primary: p.primary,
      onPrimary: p.onPrimary,
      primaryContainer: p.primarySubtle,
      onPrimaryContainer: p.primaryText,
      secondary: p.accent,
      onSecondary: p.onAccent,
      secondaryContainer: p.accentSubtle,
      onSecondaryContainer: p.accentText,
      background: p.canvas,
      onBackground: p.ink,
      surface: p.surface,
      onSurface: p.ink,
      surfaceVariant: p.surfaceSubtle,
      onSurfaceVariant: p.inkSecondary,
      outline: p.borderStrong,
      outlineVariant: p.border,
      error: p.status.danger.fg,
      onError: mode === 'dark' ? '#2B0B0A' : '#FFFFFF',
      errorContainer: p.status.danger.bg,
      onErrorContainer: p.status.danger.fg,
      elevation: {
        level0: 'transparent',
        level1: p.surface,
        level2: p.surface,
        level3: p.surfaceSubtle,
        level4: p.surfaceSubtle,
        level5: p.surfaceSubtle,
      },
    },
  };
}

const defaultTheme = createPaperTheme('light');
export default defaultTheme;
