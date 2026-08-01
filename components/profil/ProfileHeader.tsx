import { StyleSheet, Text, View } from 'react-native';
import { formatWeight } from '../../constants/progression';
import { colors, radii, spacing } from '../../constants/theme';

type ProfileHeaderProps = {
  initial: string;
  email: string;
  isSubscribed: boolean;
  programDay: number;
  programLength: number;
  /** null while unknown (no start weight / no logs yet). */
  weightLost: number | null;
  streak: number;
  statsLoading: boolean;
};

export default function ProfileHeader({
  initial,
  email,
  isSubscribed,
  programDay,
  programLength,
  weightLost,
  streak,
  statsLoading,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <Text style={styles.email} numberOfLines={1}>
        {email}
      </Text>

      <View style={[styles.badge, isSubscribed ? styles.badgePremium : styles.badgeFree]}>
        <Text style={[styles.badgeText, isSubscribed ? styles.badgeTextPremium : styles.badgeTextFree]}>
          {isSubscribed ? 'Premium' : 'Gratuit'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{`Jour ${programDay} / ${programLength}`}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {statsLoading ? '…' : weightLost != null ? `${formatWeight(weightLost)} kg perdus` : '—'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {statsLoading ? '…' : `${streak} jour${streak > 1 ? 's' : ''} d'affilée`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgePremium: {
    backgroundColor: colors.accent,
  },
  badgeFree: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextPremium: {
    color: colors.background,
  },
  badgeTextFree: {
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  stat: {
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
});
