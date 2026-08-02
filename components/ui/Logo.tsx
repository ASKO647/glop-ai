import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import AppImage from './AppImage';

type LogoProps = {
  height?: number;
};

export default function Logo({ height = 20 }: LogoProps) {
  return (
    <View style={styles.row}>
      <AppImage
        source={require('../../assets/images/logo-mark.png')}
        style={{ width: height, height }}
        resizeMode="contain"
      />
      <Text style={[styles.wordmark, { fontSize: height }]}>
        <Text style={styles.glowup}>GLOWUP </Text>
        <Text style={styles.ai}>AI</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
