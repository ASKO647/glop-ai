import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type PastDateBannerProps = {
  label: string;
  onReset: () => void;
};

export default function PastDateBanner({ label, onReset }: PastDateBannerProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.text} numberOfLines={1}>
        Tu consultes le {label}
      </Text>
      <Pressable accessibilityRole="button" onPress={onReset} hitSlop={8}>
        {({ pressed }) => (
          <Text style={[styles.link, pressed && styles.linkPressed]}>Revenir à aujourd'hui</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  linkPressed: {
    opacity: 0.7,
  },
});
