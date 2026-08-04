import { Droplet } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatLiters, weekdayLetter } from '../../constants/hydration';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { WaterDayTotal } from '../../hooks/useWaterLogs';

type HydrationSummaryCardProps = {
  /** Last 7 days, ascending (oldest first, today last). */
  history: WaterDayTotal[];
  goalMl: number;
};

export default function HydrationSummaryCard({ history, goalMl }: HydrationSummaryCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const average =
    history.length > 0 ? Math.round(history.reduce((sum, day) => sum + day.totalMl, 0) / history.length) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Droplet color={colors.accent} size={18} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Hydratation</Text>
          <Text style={styles.subtitle}>Moyenne des 7 derniers jours</Text>
        </View>
        <Text style={styles.average}>{formatLiters(average)} L</Text>
      </View>

      <View style={styles.barsRow}>
        {history.map((day) => {
          const percent = goalMl > 0 ? Math.min(1, day.totalMl / goalMl) : 0;
          return (
            <View key={day.date} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${Math.max(4, percent * 100)}%` }]} />
              </View>
              <Text style={styles.barLabel}>{weekdayLetter(day.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
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
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerInfo: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    average: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accent,
    },
    barsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 64,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      height: '100%',
      justifyContent: 'flex-end',
    },
    barTrack: {
      width: 12,
      flex: 1,
      borderRadius: radii.full,
      backgroundColor: colors.border,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: radii.full,
      backgroundColor: colors.accent,
    },
    barLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
    },
  });
}
