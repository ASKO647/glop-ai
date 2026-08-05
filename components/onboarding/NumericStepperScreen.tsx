import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const HOLD_START_DELAY_MS = 400;
const HOLD_TICK_INTERVAL_MS = 90;
const HOLD_HAPTIC_EVERY = 5;
const VALUE_FADE_DURATION_MS = 150;

type NumericStepperScreenProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  quickAdjustments: number[];
  onChange: (value: number) => void;
};

export default function NumericStepperScreen({
  value,
  min,
  max,
  step = 1,
  unit,
  quickAdjustments,
  onChange,
}: NumericStepperScreenProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const valueOpacity = useRef(new Animated.Value(1)).current;
  const valueTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    valueOpacity.setValue(0);
    valueTranslateY.setValue(6);
    Animated.parallel([
      Animated.timing(valueOpacity, { toValue: 1, duration: VALUE_FADE_DURATION_MS, useNativeDriver: true }),
      Animated.timing(valueTranslateY, { toValue: 0, duration: VALUE_FADE_DURATION_MS, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const valueStyle = {
    opacity: valueOpacity,
    transform: [{ translateY: valueTranslateY }],
  };

  const changeBy = (delta: number) => {
    onChange(Math.min(max, Math.max(min, value + delta)));
  };

  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTickCount = useRef(0);
  const isHolding = useRef(false);

  const clearHold = () => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
    holdTimeout.current = null;
    holdInterval.current = null;
  };

  useEffect(() => clearHold, []);

  const handlePressIn = (delta: number) => {
    isHolding.current = false;
    holdTickCount.current = 0;
    holdTimeout.current = setTimeout(() => {
      isHolding.current = true;
      holdInterval.current = setInterval(() => {
        holdTickCount.current += 1;
        changeBy(delta);
        if (holdTickCount.current % HOLD_HAPTIC_EVERY === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, HOLD_TICK_INTERVAL_MS);
    }, HOLD_START_DELAY_MS);
  };

  const handlePressOut = () => {
    clearHold();
  };

  const handlePress = (delta: number) => {
    // A held press already applied its own increments via the interval above — the tap event
    // that fires on release would double-count the last one if not skipped here.
    if (isHolding.current) {
      isHolding.current = false;
      return;
    }
    changeBy(delta);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPressIn={() => handlePressIn(-step)}
          onPressOut={handlePressOut}
          onPress={() => handlePress(-step)}
          disabled={value <= min}
          style={({ pressed }) => [styles.button, value <= min && styles.buttonDisabled, pressed && styles.pressed]}
        >
          <Minus color={colors.textPrimary} size={26} />
        </Pressable>

        <View style={styles.valueBox}>
          <Animated.Text style={[styles.value, valueStyle]}>{value}</Animated.Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPressIn={() => handlePressIn(step)}
          onPressOut={handlePressOut}
          onPress={() => handlePress(step)}
          disabled={value >= max}
          style={({ pressed }) => [styles.button, value >= max && styles.buttonDisabled, pressed && styles.pressed]}
        >
          <Plus color={colors.textPrimary} size={26} />
        </Pressable>
      </View>

      <View style={styles.pillRow}>
        {quickAdjustments.map((amount) => (
          <Pressable
            key={amount}
            accessibilityRole="button"
            onPress={() => {
              changeBy(amount);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <Text style={styles.pillLabel}>
              {amount > 0 ? '+' : ''}
              {amount}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xl,
    },
    button: {
      width: 64,
      height: 64,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.7,
    },
    valueBox: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: spacing.xs,
      minWidth: 140,
    },
    value: {
      fontSize: 56,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.accent,
    },
    unit: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
