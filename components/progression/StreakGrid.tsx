import { Flame } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate, isoDaysAgo, todayISODate } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { DayCompletion, DayCount } from '../../hooks/useMissionStreak';
import { hexToRgba } from '../../lib/color';

type StreakGridProps = {
  statusByDate: Record<string, DayCompletion>;
  countsByDate: Record<string, DayCount>;
  streak: number;
  activeDays: number;
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const DAYS = 30;
const COLUMNS = 10;
const SQUARE_SIZE = 24;
const TOOLTIP_DURATION_MS = 3000;

function legendItems(t: TranslateFn): { status: DayCompletion; label: string }[] {
  return [
    { status: 'full', label: t('progression.streak.legendFull') },
    { status: 'partial', label: t('progression.streak.legendPartial') },
    { status: 'none', label: t('progression.streak.legendNone') },
  ];
}

function statusColor(colors: Colors, status: DayCompletion | undefined): string {
  if (status === 'full') return colors.accent;
  if (status === 'partial') return hexToRgba(colors.accent, 0.35);
  return colors.border;
}

function dayDetailLabel(t: TranslateFn, count: DayCount | undefined): string {
  if (!count) return t('progression.streak.noActivity');
  return t('progression.streak.missionsDone', { count: count.done, total: count.total });
}

export default function StreakGrid({ statusByDate, countsByDate, streak, activeDays }: StreakGridProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const showTooltip = (date: string) => {
    setTooltipDate(date);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setTooltipDate(null), TOOLTIP_DURATION_MS);
  };

  const dates = Array.from({ length: DAYS }, (_, i) => isoDaysAgo(DAYS - 1 - i));
  const today = todayISODate();
  const rows: string[][] = [];
  for (let i = 0; i < dates.length; i += COLUMNS) {
    rows.push(dates.slice(i, i + COLUMNS));
  }

  return (
    <View>
      <Text style={styles.explainer}>{t('progression.streak.explainer')}</Text>

      <View style={styles.activeDaysRow}>
        <Text style={styles.activeDaysText}>{t('progression.streak.activeDays', { count: activeDays })}</Text>
      </View>

      {tooltipDate && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{formatDisplayDate(tooltipDate)}</Text>
          <Text style={styles.tooltipDetail}>{dayDetailLabel(t, countsByDate[tooltipDate])}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((date) => (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={t('progression.streak.dayDetailAccessibility', { date: formatDisplayDate(date) })}
                onLongPress={() => showTooltip(date)}
                style={[
                  styles.square,
                  { backgroundColor: statusColor(colors, statusByDate[date]) },
                  date === today && styles.squareToday,
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legendRow}>
        {legendItems(t).map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: statusColor(colors, item.status) }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.streakRow}>
        <Flame color={colors.accent} size={16} />
        <Text style={styles.streakText}>{t('progression.streak.streakDays', { count: streak })}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    explainer: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    activeDaysRow: {
      alignItems: 'flex-end',
      marginBottom: spacing.sm,
    },
    activeDaysText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tooltip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
    },
    tooltipDate: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    tooltipDetail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    grid: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    square: {
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      borderRadius: 6,
    },
    squareToday: {
      borderWidth: 1,
      borderColor: colors.textPrimary,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 4,
    },
    legendLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
    },
    streakText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
