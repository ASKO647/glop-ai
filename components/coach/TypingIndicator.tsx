import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
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

type TypingIndicatorProps = {
  /** Replaces the default bare dots with a label above them (e.g. "Le coach cherche des informations...") — same dot animation either way. */
  label?: string;
};

export default function TypingIndicator({ label }: TypingIndicatorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const dots = (
    <View style={styles.dotsRow}>
      <Dot delay={0} color={colors.textSecondary} />
      <Dot delay={150} color={colors.textSecondary} />
      <Dot delay={300} color={colors.textSecondary} />
    </View>
  );

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        {label ? (
          <>
            <Text style={styles.label}>{label}</Text>
            {dots}
          </>
        ) : (
          dots
        )}
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
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderBottomLeftRadius: 4,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
    },
    dotsRow: {
      flexDirection: 'row',
      gap: 5,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
