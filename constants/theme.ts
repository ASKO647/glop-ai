/**
 * GlowUp AI design system.
 * Single source of truth for colors, radii, spacing and typography.
 * Never hardcode a color in a component — import it from here.
 */

export const colors = {
  background: '#0a0d0c',
  surface: '#101410',
  border: '#232a25',
  accent: '#c6ff3a',
  // Accent, alpha-blended — tinted background for selected pills/badges (10% alpha).
  accentMuted: 'rgba(198, 255, 58, 0.1)',
  // Accent, alpha-blended — tinted background for selected cards (6% alpha, more subtle).
  accentSurface: 'rgba(198, 255, 58, 0.06)',
  textPrimary: '#ffffff',
  textSecondary: '#8a9691',
  textTertiary: '#5e6a63',
  // Border for unselected/neutral small controls (step indicators, radio buttons).
  borderMuted: '#3a423c',
  // Checked step label text (analyse screen) — brighter than textSecondary, short of pure white.
  stepTextDone: '#d5ddd8',
  // Small uppercase section labels (e.g. "OBJECTIFS PRINCIPAUX" on the plan screen).
  labelMuted: '#7c8781',
  // Form validation / auth error state.
  danger: '#ff6161',
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const typography = {
  fontFamily: undefined, // system sans-serif on both platforms
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
} as const;

const theme = { colors, radii, spacing, typography };

export default theme;
