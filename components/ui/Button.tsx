import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
};

export default function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const { styles, variantStyles, labelVariantStyles } = useMemo(() => makeStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelVariantStyles[variant].color} />
      ) : (
        <Text style={[styles.label, labelVariantStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  const styles = StyleSheet.create({
    base: {
      borderRadius: radii['2xl'],
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
  });

  const variantStyles = StyleSheet.create({
    primary: {
      backgroundColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: 'transparent',
    },
  });

  const labelVariantStyles = StyleSheet.create({
    primary: {
      color: colors.onAccent,
    },
    secondary: {
      color: colors.textPrimary,
    },
    ghost: {
      color: colors.accent,
    },
    danger: {
      color: colors.danger,
    },
  });

  return { styles, variantStyles, labelVariantStyles };
}
