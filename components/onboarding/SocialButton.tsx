import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type SocialButtonProps = {
  label: string;
  icon: ReactNode;
  variant: 'white' | 'outline';
  onPress: () => void;
};

export default function SocialButton({ label, icon, variant, onPress }: SocialButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
    // The "white" variant's background is a fixed white regardless of theme
    // (matches Google/Apple brand button conventions), so its text must stay
    // a fixed dark color too — colors.background would turn near-white in
    // light mode and become illegible on the white button.
    labelDark: {
      color: '#0a0d0c',
    },
    labelLight: {
      color: colors.textPrimary,
    },
  });
}
