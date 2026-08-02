import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type SuggestionChipProps = {
  label: string;
  onPress: () => void;
};

export default function SuggestionChip({ label, onPress }: SuggestionChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
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
    pressed: {
      opacity: 0.7,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
