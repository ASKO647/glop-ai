import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type StatCardProps = {
  label: string;
  value: string;
};

export default function StatCard({ label, value }: StatCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/progression')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
