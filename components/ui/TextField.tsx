import { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

const TextField = forwardRef<TextInput, TextFieldProps>(({ label, error, style, ...rest }, ref) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, error && styles.inputError, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

TextField.displayName = 'TextField';

export default TextField;

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      fontSize: 12,
      color: colors.danger,
    },
  });
}
