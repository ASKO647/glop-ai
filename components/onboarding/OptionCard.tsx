import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, type ImageSourcePropType } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import AppImage from '../ui/AppImage';

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  imageSource?: ImageSourcePropType;
};

export default function OptionCard({ label, selected, onPress, imageSource }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {imageSource && <AppImage source={imageSource} style={styles.thumbnail} overlay={0.35} />}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {selected && <Check color={colors.accent} size={20} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.accent,
  },
});
