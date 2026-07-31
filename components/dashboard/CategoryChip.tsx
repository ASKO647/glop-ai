import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type CategoryChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function CategoryChip({ label, active, onPress }: CategoryChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && !active && styles.pressed]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.background,
  },
});
