import { useMemo, useState } from 'react';
import { Image, StyleSheet, View, type ImageProps, type ImageSourcePropType } from 'react-native';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

type AppImageProps = Omit<ImageProps, 'source'> & {
  source: ImageSourcePropType;
  /** 0 (no darkening) to 1 (fully opaque) — a black veil over the image for text/content contrast. */
  overlay?: number;
  /**
   * Set when a caller draws its own fixed-light content/scrim on top of this image (instead of
   * using `overlay`) — e.g. welcome.tsx's LinearGradient hero. Without this, a failed/loading
   * image falls back to `colors.surface`, which is near-white in light mode and would leave
   * that fixed-light content unreadable; this forces a fixed dark backdrop instead.
   */
  darkPlaceholder?: boolean;
  children?: React.ReactNode;
};

export default function AppImage({
  source,
  style,
  overlay,
  darkPlaceholder,
  resizeMode = 'cover',
  onLoad,
  onError,
  children,
  ...rest
}: AppImageProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // The placeholder fallback is a loading/error backdrop, never a permanent one — showing it
  // once the image has actually loaded would paint over a perfectly good photo.
  const showPlaceholder = !loaded || failed;
  // With an `overlay` (or an explicit `darkPlaceholder`), callers draw fixed-light content on
  // top expecting a photo+dark-scrim backdrop (see the overlay comment below). If the photo
  // never loads, colors.surface would stand in instead — light and near-white in light mode —
  // leaving that fixed-light content unreadable. Fall back to a fixed dark tone instead so the
  // assumption still holds.
  const placeholderStyle = overlay || darkPlaceholder ? styles.placeholderDark : styles.placeholder;

  return (
    <View style={[styles.container, showPlaceholder && placeholderStyle, style]}>
      {!failed && (
        <Image
          source={source}
          resizeMode={resizeMode}
          style={StyleSheet.absoluteFill}
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            setFailed(true);
            console.error('AppImage failed to load:', source, event.nativeEvent.error);
            onError?.(event);
          }}
          {...rest}
        />
      )}
      {overlay ? (
        <View
          pointerEvents="none"
          // The overlay always darkens toward black regardless of theme — it exists to keep
          // light foreground content (icons/text drawn over a photo) readable, which is a
          // property of the photo, not of the app's current color scheme.
          style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba('#000000', overlay) }]}
        />
      ) : null}
      {children}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      overflow: 'hidden',
    },
    placeholder: {
      backgroundColor: colors.surface,
    },
    placeholderDark: {
      backgroundColor: '#1a1f1b',
    },
  });
}
