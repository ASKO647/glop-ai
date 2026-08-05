import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MEAL_TYPES, type MealType } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

type MealTypePillsProps = {
  value: MealType;
  onChange: (mealType: MealType) => void;
};

/** Lets the user pick which of the 4 meals to log a scanned photo or recipe into, before saving. */
export default function MealTypePills({ value, onChange }: MealTypePillsProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {MEAL_TYPES.map((meal) => {
        const active = meal.id === value;
        return (
          <Pressable
            key={meal.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(meal.id)}
            style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && !active && styles.pressed]}
          >
            <meal.Icon color={active ? colors.onAccent : colors.textSecondary} size={14} />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {t(meal.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
    },
    pillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    labelActive: {
      color: colors.onAccent,
    },
  });
}
