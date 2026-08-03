import { Flame } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate, isoDaysAgo, todayISODate } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { DayCompletion, DayCount } from '../../hooks/useMissionStreak';
import { hexToRgba } from '../../lib/color';

type StreakGridProps = {
  statusByDate: Record<string, DayCompletion>;
  countsByDate: Record<string, DayCount>;
  streak: number;
  activeDays: number;
};

const DAYS = 30;
const COLUMNS = 10;
const SQUARE_SIZE = 24;
const TOOLTIP_DURATION_MS = 3000;

const LEGEND_ITEMS: { status: DayCompletion; label: string }[] = [
  { status: 'full', label: 'Toutes les missions' },
  { status: 'partial', label: 'Partiellement' },
  { status: 'none', label: 'Aucune' },
];

function statusColor(colors: Colors, status: DayCompletion | undefined): string {
  if (status === 'full') return colors.accent;
  if (status === 'partial') return hexToRgba(colors.accent, 0.35);
  return colors.border;
}

function dayDetailLabel(count: DayCount | undefined): string {
  if (!count) return "Aucune activité ce jour-là";
  return `${count.done} mission${count.done > 1 ? 's' : ''} sur ${count.total}`;
}

export default function StreakGrid({ statusByDate, countsByDate, streak, activeDays }: StreakGridProps) {
  const { colors } = useTheme();
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
      <Text style={styles.explainer}>Tes 30 derniers jours — chaque carré représente un jour</Text>

      <View style={styles.activeDaysRow}>
        <Text style={styles.activeDaysText}>{activeDays} / 30 jours actifs</Text>
      </View>

      {tooltipDate && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{formatDisplayDate(tooltipDate)}</Text>
          <Text style={styles.tooltipDetail}>{dayDetailLabel(countsByDate[tooltipDate])}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((date) => (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={`${formatDisplayDate(date)} — appui long pour le détail`}
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
        {LEGEND_ITEMS.map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: statusColor(colors, item.status) }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.streakRow}>
        <Flame color={colors.accent} size={16} />
        <Text style={styles.streakText}>{streak} jour{streak > 1 ? 's' : ''} d'affilée</Text>
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
