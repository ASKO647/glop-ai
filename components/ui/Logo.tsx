import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

type LogoProps = {
  variant?: 'full' | 'mark';
  height?: number;
};

export default function Logo({ variant = 'full', height = 28 }: LogoProps) {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../assets/images/logo-mark.png')}
        style={{ width: height, height }}
        resizeMode="contain"
      />
      {variant === 'full' && (
        <Text style={styles.wordmark}>
          <Text style={styles.glowup}>GLOWUP</Text>
          <Text style={styles.ai}>AI</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: 18,
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
