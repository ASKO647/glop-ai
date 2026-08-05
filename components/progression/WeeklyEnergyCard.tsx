import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export type WeeklyEnergyDay = {
  date: string;
  label: string;
  isToday: boolean;
  kcal: number;
};

type WeeklyEnergyCardProps = {
  days: WeeklyEnergyDay[];
  target: number;
};

const CHART_HEIGHT = 100;

export default function WeeklyEnergyCard({ days, target }: WeeklyEnergyCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const maxValue = Math.max(target, ...days.map((d) => d.kcal), 1);
  const targetPercent = Math.min(100, (target / maxValue) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.chartArea}>
        <View pointerEvents="none" style={[styles.targetLine, { bottom: `${targetPercent}%` }]} />
        <View style={styles.barsRow}>
          {days.map((day) => {
            const percent = day.kcal > 0 ? Math.max(4, Math.min(100, (day.kcal / maxValue) * 100)) : 0;
            return (
              <View key={day.date} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${percent}%` }, day.isToday && styles.barFillToday]} />
                </View>
                <Text style={[styles.barLabel, day.isToday && styles.barLabelToday]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
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
    },
    chartArea: {
      height: CHART_HEIGHT + 20,
    },
    targetLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderTopColor: colors.textTertiary,
    },
    barsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: '100%',
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      height: '100%',
      justifyContent: 'flex-end',
    },
    // The track has to read as visibly darker than the fill (below), since the fill for a
    // non-today bar reuses `border` — using the same tone for both would make that bar invisible.
    barTrack: {
      width: 14,
      height: CHART_HEIGHT,
      borderRadius: radii.full,
      backgroundColor: colors.background,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: radii.full,
      backgroundColor: colors.border,
    },
    barFillToday: {
      backgroundColor: colors.accent,
    },
    barLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    barLabelToday: {
      color: colors.textPrimary,
    },
  });
}
