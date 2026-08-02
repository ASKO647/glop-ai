import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type CategoryChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function CategoryChip({ label, active, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
      color: colors.onAccent,
    },
  });
}
