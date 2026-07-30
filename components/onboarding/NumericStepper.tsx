import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type NumericStepperProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
};

export default function NumericStepper({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: NumericStepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={decrement}
        disabled={value <= min}
        style={[styles.button, value <= min && styles.buttonDisabled]}
      >
        <Minus color={colors.textPrimary} size={22} />
      </Pressable>

      <View style={styles.valueBox}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={increment}
        disabled={value >= max}
        style={[styles.button, value >= max && styles.buttonDisabled]}
      >
        <Plus color={colors.textPrimary} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  button: {
    width: 52,
    height: 52,
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
  valueBox: {
    minWidth: 120,
    alignItems: 'center',
  },
  value: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.textPrimary,
  },
  unit: {
    marginTop: spacing.xs,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
