import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type CardProps = ViewProps;

export default function Card({ style, children, ...rest }: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii['2xl'],
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
  });
}
