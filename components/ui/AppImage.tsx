import { useMemo, useState } from 'react';
import { Image, StyleSheet, View, type ImageProps, type ImageSourcePropType } from 'react-native';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

type AppImageProps = Omit<ImageProps, 'source'> & {
  source: ImageSourcePropType;
  /** 0 (no darkening) to 1 (fully opaque) — a black veil over the image for text/content contrast. */
  overlay?: number;
  children?: React.ReactNode;
};

export default function AppImage({
  source,
  style,
  overlay,
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

  // The surface-colored fallback is a loading/error placeholder, never a permanent backdrop —
  // showing it once the image has actually loaded would paint over a perfectly good photo.
  const showPlaceholder = !loaded || failed;

  return (
    <View style={[styles.container, showPlaceholder && styles.placeholder, style]}>
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
  });
}
