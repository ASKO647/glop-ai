import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import AppImage from '../ui/AppImage';

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  thumbnail?: ImageSourcePropType;
};

export default function OptionCard({ label, selected, onPress, thumbnail }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.content}>
        {thumbnail ? <AppImage source={thumbnail} style={styles.thumbnail} overlay={0.35} /> : null}
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      </View>
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
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
  },
  label: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.accent,
  },
});
