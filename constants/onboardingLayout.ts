import type { ViewStyle } from 'react-native';

export const ONBOARDING_MAX_WIDTH = 560;

/**
 * Desktop-only override for onboarding content blocks — keeps text/option-card columns from
 * stretching into overly long lines on wide screens, applied directly to each block (not via a
 * wrapping container) so screens that mix full-bleed backgrounds with centered content don't need
 * extra nesting.
 */
export const desktopOnboardingWidth: ViewStyle = {
  alignSelf: 'center',
  width: '100%',
  maxWidth: ONBOARDING_MAX_WIDTH,
};
