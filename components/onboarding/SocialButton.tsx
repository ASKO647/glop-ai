import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type SocialButtonProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  loading?: boolean;
};

export default function SocialButton({ label, icon, onPress, loading = false }: SocialButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={[styles.base, loading && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabled: {
      opacity: 0.7,
    },
    label: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
}
