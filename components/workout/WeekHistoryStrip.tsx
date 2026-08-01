import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { getCurrentWeekDays } from '../../constants/dashboard';
import { colors, radii } from '../../constants/theme';

type WeekHistoryStripProps = {
  completedByDate: Record<string, boolean>;
};

/** Read-only "did I train?" view of the current week — same 7-circle layout as the dashboard's WeekStrip, no taps. */
export default function WeekHistoryStrip({ completedByDate }: WeekHistoryStripProps) {
  const days = getCurrentWeekDays();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const completed = completedByDate[day.date] === true;

        let circleStyle: ViewStyle = styles.future;
        if (day.isFuture) {
          circleStyle = styles.future;
        } else if (completed) {
          circleStyle = styles.completed;
        } else if (day.isToday) {
          circleStyle = styles.todayOutline;
        } else {
          circleStyle = styles.missed;
        }

        return (
          <View key={day.date} style={styles.item}>
            <View style={[styles.circle, circleStyle]}>
              {completed ? (
                <Check color={colors.background} size={16} />
              ) : (
                <Text
                  style={[
                    styles.label,
                    day.isFuture && styles.futureLabel,
                    day.isToday && !day.isFuture && styles.todayLabel,
                  ]}
                >
                  {day.label}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  futureLabel: {
    color: colors.borderMuted,
  },
  todayLabel: {
    color: colors.textPrimary,
  },
  completed: {
    backgroundColor: colors.accent,
  },
  todayOutline: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  missed: {
    backgroundColor: colors.surface,
  },
  future: {
    backgroundColor: colors.surface,
  },
});
