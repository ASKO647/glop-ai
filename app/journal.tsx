import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalorieRing from '../components/dashboard/CalorieRing';
import MacroBar from '../components/dashboard/MacroBar';
import MealTypeCard from '../components/dashboard/MealTypeCard';
import AddFoodModal from '../components/journal/AddFoodModal';
import EditMealModal from '../components/journal/EditMealModal';
import MealItemMenuModal from '../components/journal/MealItemMenuModal';
import ChoiceModal, { type ChoiceOption } from '../components/settings/ChoiceModal';
import {
  MEAL_TYPES,
  computeCalorieTarget,
  computeMacroTargets,
  defaultExpandedMealTypes,
  formatDisplayDate,
  getMealTypeInfo,
  shiftISODate,
  todayISODate,
  type MealType,
} from '../constants/dashboard';
import type { Colors } from '../constants/theme';
import { radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { useMeals, type Meal } from '../hooks/useMeals';
import { showAlert, showConfirm } from '../lib/alert';

export default function JournalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const MOVE_TO_OPTIONS: ChoiceOption[] = useMemo(
    () => MEAL_TYPES.map((m) => ({ id: m.id, label: t(m.labelKey) })),
    [t]
  );

  const [selectedDate, setSelectedDate] = useState(todayISODate());
  const isToday = selectedDate === todayISODate();

  const {
    mealsByType,
    totalsByType,
    totals,
    loading,
    addMeal,
    updateMeal,
    deleteMeal,
    moveMeal,
  } = useMeals(user?.id, selectedDate);

  const [expandedMealTypes, setExpandedMealTypes] = useState(defaultExpandedMealTypes());
  const [addFoodMealType, setAddFoodMealType] = useState<MealType | null>(null);
  const [addingFood, setAddingFood] = useState(false);
  const [menuMeal, setMenuMeal] = useState<Meal | null>(null);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [moveMealTarget, setMoveMealTarget] = useState<Meal | null>(null);

  const toggleMealType = (mealType: MealType) =>
    setExpandedMealTypes((prev) => ({ ...prev, [mealType]: !prev[mealType] }));

  const handleAddFood = async (input: {
    name: string;
    portion: string;
    kcal: number;
    proteines: number;
    glucides: number;
    lipides: number;
  }) => {
    if (!addFoodMealType) return;
    setAddingFood(true);
    const ok = await addMeal({ ...input, mealType: addFoodMealType });
    setAddingFood(false);
    if (ok) setAddFoodMealType(null);
    else showAlert(t('common.error'), t('dashboard.errors.addFoodFailed'));
  };

  const handleEditSave = async (patch: { portion: string; kcal: number }) => {
    if (!editMeal) return;
    setSavingEdit(true);
    const ok = await updateMeal(editMeal.id, patch);
    setSavingEdit(false);
    if (ok) setEditMeal(null);
    else showAlert(t('common.error'), t('dashboard.errors.editFoodFailed'));
  };

  const handleDeleteMeal = (meal: Meal) => {
    showConfirm(
      t('dashboard.meals.deleteConfirmTitle'),
      t('dashboard.meals.deleteConfirmMessage', { name: meal.name }),
      t('dashboard.actions.delete'),
      async () => {
        const ok = await deleteMeal(meal.id);
        if (!ok) showAlert(t('common.error'), t('dashboard.errors.deleteFoodFailed'));
      },
      t('common.cancel')
    );
  };

  const handleMoveMeal = async (option: ChoiceOption) => {
    if (!moveMealTarget) return;
    await moveMeal(moveMealTarget.id, option.id as MealType);
    setMoveMealTarget(null);
  };

  const calorieTarget = computeCalorieTarget(profile);
  const macroTargets = computeMacroTargets(calorieTarget);
  const caloriesRemaining = calorieTarget - totals.kcal;
  const percent = calorieTarget > 0 ? (totals.kcal / calorieTarget) * 100 : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('dashboard.journal.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.journal.prevDay')}
            onPress={() => setSelectedDate((d) => shiftISODate(d, -1))}
            hitSlop={8}
            style={({ pressed }) => [styles.dateArrow, pressed && styles.pressed]}
          >
            <ChevronLeft color={colors.textPrimary} size={20} />
          </Pressable>

          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel} numberOfLines={1}>
              {isToday ? t('common.today') : formatDisplayDate(selectedDate, locale)}
            </Text>
            {!isToday && (
              <Pressable accessibilityRole="button" onPress={() => setSelectedDate(todayISODate())} hitSlop={6}>
                {({ pressed }) => (
                  <Text style={[styles.todayLink, pressed && styles.todayLinkPressed]}>{t('common.today')}</Text>
                )}
              </Pressable>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.journal.nextDay')}
            accessibilityState={{ disabled: isToday }}
            disabled={isToday}
            onPress={() => setSelectedDate((d) => shiftISODate(d, 1))}
            hitSlop={8}
            style={({ pressed }) => [styles.dateArrow, pressed && !isToday && styles.pressed]}
          >
            <ChevronRight color={isToday ? colors.textTertiary : colors.textPrimary} size={20} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryEyebrow}>
                {isToday ? t('common.today') : formatDisplayDate(selectedDate, locale)}
              </Text>
              <Text style={styles.summaryValue}>{Math.max(0, Math.round(caloriesRemaining))}</Text>
              <Text style={styles.summaryUnit}>{t('dashboard.calories.remainingUnit')}</Text>
            </View>
            <CalorieRing percent={percent} />
          </View>

          <View style={styles.summaryMacros}>
            <MacroBar label={t('dashboard.macros.protein')} current={totals.proteines} target={macroTargets.proteines} />
            <MacroBar label={t('dashboard.macros.carbs')} current={totals.glucides} target={macroTargets.glucides} />
            <MacroBar label={t('dashboard.macros.fat')} current={totals.lipides} target={macroTargets.lipides} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <View style={styles.mealsList}>
            {MEAL_TYPES.map((mealTypeInfo) => (
              <MealTypeCard
                key={mealTypeInfo.id}
                mealType={mealTypeInfo.id}
                meals={mealsByType[mealTypeInfo.id]}
                totalKcal={totalsByType[mealTypeInfo.id].kcal}
                expanded={expandedMealTypes[mealTypeInfo.id]}
                onToggleExpand={() => toggleMealType(mealTypeInfo.id)}
                onAddFood={() => setAddFoodMealType(mealTypeInfo.id)}
                onLongPressFood={setMenuMeal}
              />
            ))}
          </View>
        )}

        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>{t('dashboard.journal.totalsTitle')}</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{totals.kcal}</Text>
              <Text style={styles.totalLabel}>kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{totals.proteines}g</Text>
              <Text style={styles.totalLabel}>{t('dashboard.macros.protein')}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{totals.glucides}g</Text>
              <Text style={styles.totalLabel}>{t('dashboard.macros.carbs')}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{totals.lipides}g</Text>
              <Text style={styles.totalLabel}>{t('dashboard.macros.fat')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AddFoodModal
        visible={addFoodMealType !== null}
        mealType={addFoodMealType}
        saving={addingFood}
        onCancel={() => setAddFoodMealType(null)}
        onSave={handleAddFood}
      />

      <MealItemMenuModal
        visible={menuMeal !== null}
        mealName={menuMeal?.name ?? null}
        onCancel={() => setMenuMeal(null)}
        onEdit={() => {
          setEditMeal(menuMeal);
          setMenuMeal(null);
        }}
        onMove={() => {
          setMoveMealTarget(menuMeal);
          setMenuMeal(null);
        }}
        onDelete={() => {
          if (menuMeal) handleDeleteMeal(menuMeal);
          setMenuMeal(null);
        }}
      />

      <EditMealModal
        visible={editMeal !== null}
        meal={editMeal}
        saving={savingEdit}
        onCancel={() => setEditMeal(null)}
        onSave={handleEditSave}
      />

      <ChoiceModal
        visible={moveMealTarget !== null}
        title={t('dashboard.actions.moveTo')}
        options={MOVE_TO_OPTIONS}
        selectedLabel={moveMealTarget ? t(getMealTypeInfo(moveMealTarget.mealType).labelKey) : null}
        onCancel={() => setMoveMealTarget(null)}
        onSelect={handleMoveMeal}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      ...typography.heading,
      flex: 1,
      textAlign: 'center',
      color: colors.textPrimary,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    headerSpacer: {
      width: 36,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
      gap: spacing.lg,
    },
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateArrow: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateCenter: {
      alignItems: 'center',
      gap: 2,
    },
    dateLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    todayLink: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    todayLinkPressed: {
      opacity: 0.7,
    },
    summaryCard: {
      backgroundColor: colors.accent,
      borderRadius: radii.xl,
      padding: 20,
      gap: spacing.md,
    },
    summaryTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryInfo: {
      flexShrink: 1,
    },
    summaryEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.onAccent,
      opacity: 0.6,
    },
    summaryValue: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.onAccent,
      marginTop: 4,
    },
    summaryUnit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onAccent,
      opacity: 0.7,
    },
    summaryMacros: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    mealsList: {
      gap: spacing.sm,
    },
    totalsCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    totalsTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    totalItem: {
      alignItems: 'center',
      gap: 2,
    },
    totalValue: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    totalLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
