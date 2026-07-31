import { useRouter } from 'expo-router';
import { Clock, Flame } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkoutSession } from '../../constants/dashboard';
import { colors, radii, spacing } from '../../constants/theme';

type WorkoutCardProps = {
  session: WorkoutSession;
};

export default function WorkoutCard({ session }: WorkoutCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/workout/${session.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title}>{session.title}</Text>
      <Text style={styles.muscles} numberOfLines={1}>
        {session.muscles}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock color={colors.textSecondary} size={14} />
          <Text style={styles.metaText}>{session.duration} min</Text>
        </View>
        <View style={styles.metaItem}>
          <Flame color={colors.textSecondary} size={14} />
          <Text style={styles.metaText}>{session.kcal} kcal</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  muscles: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
