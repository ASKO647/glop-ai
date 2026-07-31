import { Lightbulb } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type TipCardProps = {
  text: string;
};

export default function TipCard({ text }: TipCardProps) {
  return (
    <View style={styles.card}>
      <Lightbulb color={colors.accent} size={18} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
