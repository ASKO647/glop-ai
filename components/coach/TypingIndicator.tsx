import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

const PERIOD = 900;

function Dot({ delay }: { delay: number }) {
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

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

export default function TypingIndicator() {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.textSecondary,
  },
});
