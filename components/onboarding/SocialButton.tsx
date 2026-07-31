import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type SocialButtonProps = {
  label: string;
  icon: ReactNode;
  variant: 'white' | 'outline';
  onPress: () => void;
};

export default function SocialButton({ label, icon, variant, onPress }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.base, variant === 'white' ? styles.white : styles.outline]}
    >
      {icon}
      <Text style={[styles.label, variant === 'white' ? styles.labelDark : styles.labelLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  white: {
    backgroundColor: colors.white,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  labelDark: {
    color: colors.background,
  },
  labelLight: {
    color: colors.textPrimary,
  },
});
