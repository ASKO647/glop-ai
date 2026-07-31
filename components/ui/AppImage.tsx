import { useState } from 'react';
import { Image, StyleSheet, View, type ImageProps, type ImageSourcePropType } from 'react-native';
import { colors } from '../../constants/theme';

type AppImageProps = Omit<ImageProps, 'source'> & {
  source: ImageSourcePropType;
  /** 0 (no darkening) to 1 (fully opaque) — a black veil over the image for text/content contrast. */
  overlay?: number;
};

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AppImage({
  source,
  style,
  overlay,
  resizeMode = 'cover',
  onError,
  ...rest
}: AppImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {!failed && (
        <Image
          source={source}
          resizeMode={resizeMode}
          style={StyleSheet.absoluteFill}
          onError={(event) => {
            setFailed(true);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
