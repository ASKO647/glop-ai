import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BadgeMedal from '../components/badges/BadgeMedal';
import BadgeUnlockModal from '../components/badges/BadgeUnlockModal';
import ResponsiveContainer from '../components/ui/ResponsiveContainer';
import type { Colors } from '../constants/theme';
import { radii, spacing, typography } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { useBadges, type BadgeWithStatus } from '../hooks/useBadges';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { formatFullDate } from '../lib/format';

function chunkRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export default function BadgesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const { isDesktop } = useBreakpoint();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { badges, earnedCount, totalCount, pendingUnlock, dismissPendingUnlock } = useBadges();

  // 4 per row on desktop instead of 2 — same cards, same `cell: { flex: 1 }` row layout.
  const rows = chunkRows(badges, isDesktop ? 4 : 2);
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('badges.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer style={styles.gridWrapper}>
          <View style={styles.progressBlock}>
            <Text style={styles.progressLabel}>
              {t('badges.progress', { count: earnedCount, total: totalCount })}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((badge: BadgeWithStatus) => (
                  <View key={badge.key} style={styles.cell}>
                    <BadgeMedal Icon={badge.Icon} unlocked={!!badge.unlockedAt} size={64} iconSize={28} />
                    <Text
                      style={[styles.badgeName, badge.unlockedAt ? styles.badgeNameUnlocked : styles.badgeNameLocked]}
                      numberOfLines={1}
                    >
                      {t(badge.nameKey)}
                    </Text>
                    <Text
                      style={[styles.badgeSub, badge.unlockedAt ? styles.badgeSubUnlocked : styles.badgeSubLocked]}
                      numberOfLines={2}
                    >
                      {badge.unlockedAt ? formatFullDate(new Date(badge.unlockedAt), locale) : t(badge.descriptionKey)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ResponsiveContainer>
      </ScrollView>

      <BadgeUnlockModal badge={pendingUnlock} onDismiss={dismissPendingUnlock} />
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    headerSpacer: {
      width: 36,
    },
    headerTitle: {
      ...typography.heading,
      color: colors.textPrimary,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
      gap: spacing.lg,
    },
    contentDesktop: {
      paddingHorizontal: 0,
      paddingBottom: spacing.xl,
    },
    // `content`'s own `gap` no longer has two direct children to separate on desktop (only the
    // `ResponsiveContainer` wrapper does) — this reproduces it one level down, on both branches.
    gridWrapper: {
      gap: spacing.lg,
    },
    progressBlock: {
      gap: spacing.sm,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    progressTrack: {
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
    },
    grid: {
      gap: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
    },
    badgeName: {
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    badgeNameUnlocked: {
      color: colors.textPrimary,
    },
    badgeNameLocked: {
      color: colors.textTertiary,
    },
    badgeSub: {
      fontSize: 10,
      textAlign: 'center',
    },
    badgeSubUnlocked: {
      color: colors.textSecondary,
    },
    badgeSubLocked: {
      color: colors.labelMuted,
    },
  });
}
