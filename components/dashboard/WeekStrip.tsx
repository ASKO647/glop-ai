import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { getCurrentWeekDays } from '../../constants/dashboard';
import { colors, radii } from '../../constants/theme';

type WeekStripProps = {
  completionByDate: Record<string, boolean>;
};

export default function WeekStrip({ completionByDate }: WeekStripProps) {
  const days = getCurrentWeekDays();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const completed = completionByDate[day.date] === true;

        let circleStyle: ViewStyle = styles.future;
        let textStyle: TextStyle = styles.futureText;
        if (day.isToday) {
          circleStyle = styles.today;
          textStyle = styles.todayText;
        } else if (day.isPast) {
          circleStyle = completed ? styles.pastCompleted : styles.pastMissed;
          textStyle = completed ? styles.pastCompletedText : styles.pastMissedText;
        }

        return (
          <View key={day.date} style={[styles.circle, circleStyle]}>
            <Text style={[styles.label, textStyle]}>{day.label}</Text>
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
  },
  today: {
    backgroundColor: colors.accent,
  },
  todayText: {
    color: colors.background,
  },
  pastCompleted: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  pastCompletedText: {
    color: colors.textPrimary,
  },
  pastMissed: {
    backgroundColor: colors.surface,
  },
  pastMissedText: {
    color: colors.textTertiary,
  },
  future: {
    backgroundColor: colors.surface,
  },
  futureText: {
    color: colors.borderMuted,
  },
});
