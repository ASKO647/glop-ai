import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type CardProps = ViewProps;

export default function Card({ style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
