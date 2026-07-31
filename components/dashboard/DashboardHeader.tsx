import { useRouter } from 'expo-router';
import { Bell, Flame } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type DashboardHeaderProps = {
  initial: string;
  greeting: string;
  programDay: number;
  programLength: number;
  streak: number;
};

export default function DashboardHeader({
  initial,
  greeting,
  programDay,
  programLength,
  streak,
}: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/profil')}
        style={({ pressed }) => [styles.identity, pressed && styles.pressed]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={styles.day}>
            Jour {programDay} sur {programLength}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profil')}
          style={({ pressed }) => [styles.streakPill, pressed && styles.pressed]}
        >
          <Flame color={colors.accent} size={14} />
          <Text style={styles.streakText}>{streak}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}
        >
          <Bell color={colors.textSecondary} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  identityText: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  day: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
});
