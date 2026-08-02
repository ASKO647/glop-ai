/**
 * GlowUp AI design system.
 * Single source of truth for colors, radii, spacing and typography.
 * Never hardcode a color in a component — read it from `useTheme().colors` (see
 * context/ThemeContext.tsx), never import `darkColors`/`lightColors` directly.
 */

export type Colors = {
  background: string;
  surface: string;
  border: string;
  accent: string;
  // Accent, alpha-blended — tinted background for selected pills/badges (10% alpha).
  accentMuted: string;
  // Accent, alpha-blended — tinted background for selected cards (6% alpha, more subtle).
  accentSurface: string;
  // Text/icon color for content placed directly on an `accent`-colored surface (buttons, active
  // pills, badge circles). Never hardcode 'white'/'black' for this — the right choice flips
  // between the two palettes, since one accent is a bright lime and the other a mid-tone green.
  onAccent: string;
  textPrimary: string;
  textSecondary: string;
  // Least prominent regular text tier — placeholders, inactive tab icons, disabled-ish captions.
  textTertiary: string;
  // Border for unselected/neutral small controls (step indicators, radio buttons).
  borderMuted: string;
  // Checked step label text (analyse screen) — the most emphasized muted-family tone.
  stepTextDone: string;
  // Small uppercase section labels (e.g. "OBJECTIFS PRINCIPAUX" on the plan screen).
  labelMuted: string;
  // Form validation / auth error state.
  danger: string;
  // Warning / "wrong direction" state (e.g. a weight-trend arrow going the wrong way).
  warning: string;
  // Pure white — required background for the "Continuer avec Apple" button per Apple's HIG.
  // Intentionally identical in both palettes: it's a fixed platform requirement, not a themed tone.
  white: string;
};

export const darkColors: Colors = {
  background: '#0a0d0c',
  surface: '#101410',
  border: '#232a25',
  accent: '#c6ff3a',
  accentMuted: 'rgba(198, 255, 58, 0.1)',
  accentSurface: 'rgba(198, 255, 58, 0.06)',
  onAccent: '#0a0d0c',
  textPrimary: '#ffffff',
  textSecondary: '#8a9691',
  textTertiary: '#5e6a63',
  borderMuted: '#3a423c',
  stepTextDone: '#d5ddd8',
  labelMuted: '#7c8781',
  danger: '#ff6161',
  warning: '#ffa63a',
  white: '#ffffff',
};

// Every value here was checked against both `background` and `surface` with the same WCAG
// formula as scripts/check-contrast.js — each clears at least 4.5:1 (normal text) with margin.
// `accent` is deliberately darker than a literal "light-mode lime" (#7fb800 only hit ~2.3:1 as
// text on this background — a real fail) because `colors.accent` isn't only a background in this
// app: it's used directly as text/icon color all over (kcal amounts, links, "ghost" button
// labels). #437000 clears 4.5:1+ as text AND, as a background, pairs correctly with a WHITE
// onAccent (~5.9:1) — unlike the dark palette's bright lime, which needs a DARK onAccent instead.
// This is exactly the flip `onAccent` exists for — don't unify the two without re-checking both.
export const lightColors: Colors = {
  background: '#f7f8f5',
  surface: '#ffffff',
  border: '#e3e6df',
  accent: '#437000',
  accentMuted: 'rgba(67, 112, 0, 0.1)',
  accentSurface: 'rgba(67, 112, 0, 0.06)',
  onAccent: '#ffffff',
  textPrimary: '#0a0d0c',
  textSecondary: '#5f6b62',
  textTertiary: '#66716a',
  borderMuted: '#c8ccc3',
  stepTextDone: '#1a211c',
  labelMuted: '#546056',
  danger: '#c0392b',
  warning: '#8a4b00',
  white: '#ffffff',
};

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
  },
  heading: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
} as const;
