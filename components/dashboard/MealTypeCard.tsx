import { ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getMealTypeInfo, type MealType } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { Meal } from '../../hooks/useMeals';

type MealTypeCardProps = {
  mealType: MealType;
  meals: Meal[];
  totalKcal: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onAddFood: () => void;
  onLongPressFood: (meal: Meal) => void;
};

export default function MealTypeCard({
  mealType,
  meals,
  totalKcal,
  expanded,
  onToggleExpand,
  onAddFood,
  onLongPressFood,
}: MealTypeCardProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const info = getMealTypeInfo(mealType);
  const typeLabel = t(info.labelKey);
  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('dashboard.meals.typeHeaderAccessibility', { type: typeLabel, kcal: totalKcal })}
        onPress={onToggleExpand}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.iconBox}>
          <info.Icon color={colors.accent} size={18} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {typeLabel}
        </Text>
        <Text style={styles.kcal}>{totalKcal} kcal</Text>
        <ChevronIcon color={colors.textTertiary} size={18} />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {meals.length === 0 ? (
            <Text style={styles.emptyText}>{t('dashboard.meals.emptyMealType')}</Text>
          ) : (
            <View style={styles.foodsList}>
              {meals.map((meal) => (
                <Pressable
                  key={meal.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('dashboard.meals.itemAccessibility', { name: meal.name })}
                  onLongPress={() => onLongPressFood(meal)}
                  delayLongPress={350}
                  style={({ pressed }) => [styles.foodRow, pressed && styles.foodRowPressed]}
                >
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>
                      {meal.name}
                    </Text>
                    {meal.portion ? (
                      <Text style={styles.foodPortion} numberOfLines={1}>
                        {meal.portion}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.foodKcal}>{meal.kcal} kcal</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={onAddFood}
            style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
          >
            <Plus color={colors.accent} size={14} strokeWidth={2.5} />
            <Text style={styles.addText}>{t('dashboard.meals.addFoodLink')}</Text>
          </Pressable>
        </View>
      )}
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
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    headerPressed: {
      opacity: 0.8,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    kcal: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accent,
    },
    body: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    foodsList: {
      gap: 2,
    },
    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    foodRowPressed: {
      opacity: 0.6,
    },
    foodInfo: {
      flexShrink: 1,
      marginRight: spacing.sm,
    },
    foodName: {
      fontSize: 13,
      color: colors.textPrimary,
    },
    foodPortion: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    foodKcal: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: spacing.xs,
    },
    addRowPressed: {
      opacity: 0.7,
    },
    addText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
  });
}
