import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const PERIOD = 900;

function Dot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.delay(Math.max(0, PERIOD - delay - 600)),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return <Animated.View style={[{ width: 6, height: 6, borderRadius: radii.full, backgroundColor: color }, { opacity }]} />;
}

export default function TypingIndicator() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Dot delay={0} color={colors.textSecondary} />
        <Dot delay={150} color={colors.textSecondary} />
        <Dot delay={300} color={colors.textSecondary} />
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    bubble: {
      flexDirection: 'row',
      gap: 5,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderBottomLeftRadius: 4,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
    },
  });
}
