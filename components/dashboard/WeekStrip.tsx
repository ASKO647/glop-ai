import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { getCurrentWeekDays } from '../../constants/dashboard';
import { colors, radii } from '../../constants/theme';

type WeekStripProps = {
  completionByDate: Record<string, boolean>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export default function WeekStrip({ completionByDate, selectedDate, onSelectDate }: WeekStripProps) {
  const days = getCurrentWeekDays();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const completed = completionByDate[day.date] === true;
        const isSelected = day.date === selectedDate;

        let circleStyle: ViewStyle = styles.future;
        let textStyle: TextStyle = styles.futureText;
        if (isSelected) {
          circleStyle = styles.selected;
          textStyle = styles.selectedText;
        } else if (day.isToday) {
          circleStyle = styles.accentOutline;
          textStyle = styles.accentOutlineText;
        } else if (day.isPast) {
          circleStyle = completed ? styles.accentOutline : styles.pastMissed;
          textStyle = completed ? styles.accentOutlineText : styles.pastMissedText;
        }

        return (
          <Pressable
            key={day.date}
            accessibilityRole="button"
            accessibilityState={{ disabled: day.isFuture, selected: isSelected }}
            disabled={day.isFuture}
            onPress={() => onSelectDate(day.date)}
            style={({ pressed }) => [
              styles.circle,
              circleStyle,
              day.isFuture && styles.futureDisabled,
              pressed && !day.isFuture && styles.pressed,
            ]}
          >
            <Text style={[styles.label, textStyle]}>{day.label}</Text>
          </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  selected: {
    backgroundColor: colors.accent,
  },
  selectedText: {
    color: colors.background,
  },
  // Today (when not the selected day) and completed-past days share the same
  // "notable but not active" treatment — a thin accent ring, no fill.
  accentOutline: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  accentOutlineText: {
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
  futureDisabled: {
    opacity: 0.5,
  },
});
