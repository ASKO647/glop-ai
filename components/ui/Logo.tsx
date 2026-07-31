import { StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';

export default function Logo() {
  return (
    <Text style={styles.wordmark}>
      <Text style={styles.glowup}>GLOWUP </Text>
      <Text style={styles.ai}>AI</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
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
