import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BadgeMedal from '../../components/badges/BadgeMedal';
import type { BadgeWithStatus } from '../../hooks/useBadges';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

type BadgesSummaryCardProps = {
  badges: BadgeWithStatus[];
  earnedCount: number;
  totalCount: number;
};

/** Hidden entirely by the caller when `earnedCount` is 0. */
export default function BadgesSummaryCard({ badges, earnedCount, totalCount }: BadgesSummaryCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const unlocked = badges.filter((badge) => badge.unlockedAt);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/badges')}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('progression.badgesSummary.title')}</Text>
        <Text style={styles.counter}>
          {earnedCount} / {totalCount}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {unlocked.map((badge) => (
          <BadgeMedal key={badge.key} Icon={badge.Icon} unlocked size={48} iconSize={22} />
        ))}
      </ScrollView>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardPressed: {
      opacity: 0.85,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    counter: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
}
