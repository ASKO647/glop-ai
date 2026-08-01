import { Flame } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { isoDaysAgo, todayISODate } from '../../constants/dashboard';
import { colors, radii, spacing } from '../../constants/theme';
import type { DayCompletion } from '../../hooks/useMissionStreak';

type StreakGridProps = {
  statusByDate: Record<string, DayCompletion>;
  streak: number;
};

const DAYS = 30;
const COLUMNS = 10;
const SQUARE_SIZE = 24;

function statusColor(status: DayCompletion | undefined): string {
  if (status === 'full') return colors.accent;
  if (status === 'partial') return 'rgba(198, 255, 58, 0.35)';
  return colors.border;
}

export default function StreakGrid({ statusByDate, streak }: StreakGridProps) {
  const dates = Array.from({ length: DAYS }, (_, i) => isoDaysAgo(DAYS - 1 - i));
  const today = todayISODate();
  const rows: string[][] = [];
  for (let i = 0; i < dates.length; i += COLUMNS) {
    rows.push(dates.slice(i, i + COLUMNS));
  }

  return (
    <View>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((date) => (
              <View
                key={date}
                style={[
                  styles.square,
                  { backgroundColor: statusColor(statusByDate[date]) },
                  date === today && styles.squareToday,
                ]}
              />
            ))}
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

const styles = StyleSheet.create({
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
