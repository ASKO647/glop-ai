import type { ViewStyle } from 'react-native';
import { radii } from './theme';

export const DESKTOP_MODAL_MAX_WIDTH = 480;

/**
 * Desktop override for a modal's backdrop `View` (mobile keeps `justifyContent: 'flex-end'` to
 * slide up from the bottom) — centers the sheet in the viewport instead.
 */
export const desktopModalBackdrop: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
};

/**
 * Desktop override for a modal's sheet `View` — rounds all four corners (mobile only rounds the
 * top ones, since the sheet touches the bottom edge there) and caps its width instead of
 * stretching edge to edge.
 */
export const desktopModalSheet: ViewStyle = {
  borderRadius: radii['2xl'],
  borderTopLeftRadius: radii['2xl'],
  borderTopRightRadius: radii['2xl'],
  borderBottomLeftRadius: radii['2xl'],
  borderBottomRightRadius: radii['2xl'],
  maxWidth: DESKTOP_MODAL_MAX_WIDTH,
  width: '100%',
};
