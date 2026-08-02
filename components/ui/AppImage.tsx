import { useState } from 'react';
import { Image, StyleSheet, View, type ImageProps, type ImageSourcePropType } from 'react-native';
import { colors } from '../../constants/theme';
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
          style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba(colors.background, overlay) }]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.surface,
  },
});
