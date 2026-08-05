import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import AppImage from './AppImage';

type LogoProps = {
  height?: number;
  /** Wordmark font size — defaults to `height` (icon and text sized together) when omitted. */
  textSize?: number;
};

export default function Logo({ height = 20, textSize }: LogoProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <AppImage
        source={appImage('logo-mark.png')}
        style={{ width: height, height }}
        resizeMode="contain"
      />
      <Text style={[styles.wordmark, { fontSize: textSize ?? height }]}>
        <Text style={styles.glowup}>GLOWUP </Text>
        <Text style={styles.ai}>AI</Text>
      </Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    wordmark: {
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    glowup: {
      color: colors.textPrimary,
    },
    ai: {
      color: colors.accent,
    },
  });
}
