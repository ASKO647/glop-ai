import { useState } from 'react';
import { Image, StyleSheet, View, type ImageProps, type ImageSourcePropType } from 'react-native';
import { colors } from '../../constants/theme';
import { hexToRgba } from '../../lib/color';

type AppImageProps = Omit<ImageProps, 'source'> & {
  source: ImageSourcePropType;
  /** 0 (no darkening) to 1 (fully opaque) — a black veil over the image for text/content contrast. */
  overlay?: number;
};

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
