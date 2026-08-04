import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../components/ui/Logo';
import BadgeMedal from '../../components/badges/BadgeMedal';
import BadgeUnlockModal from '../../components/badges/BadgeUnlockModal';
import CalorieCard from '../../components/dashboard/CalorieCard';
import CategoryChip from '../../components/dashboard/CategoryChip';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import BmiCard from '../../components/dashboard/BmiCard';
import HydrationCard from '../../components/dashboard/HydrationCard';
import MealTypeCard from '../../components/dashboard/MealTypeCard';
import MissionCard from '../../components/dashboard/MissionCard';
import PastDateBanner from '../../components/dashboard/PastDateBanner';
import StatCard from '../../components/dashboard/StatCard';
import TipCard from '../../components/dashboard/TipCard';
import WeekStrip from '../../components/dashboard/WeekStrip';
import WorkoutCard from '../../components/dashboard/WorkoutCard';
import AddFoodModal from '../../components/journal/AddFoodModal';
import EditMealModal from '../../components/journal/EditMealModal';
import MealItemMenuModal from '../../components/journal/MealItemMenuModal';
import ChoiceModal, { type ChoiceOption } from '../../components/settings/ChoiceModal';
import NumberStepperModal from '../../components/ui/NumberStepperModal';
import {
  MEAL_TYPES,
  WORKOUT_CATEGORIES,
  WORKOUT_SESSIONS,
  computeCalorieTarget,
  computeMacroTargets,
  computeStreak,
  defaultExpandedMealTypes,
  formatDisplayDate,
  getDisplayName,
  getMealTypeInfo,
  getProgramDay,
  getTipOfTheDay,
  PROGRAM_LENGTH_DAYS,
  todayISODate,
  type MealType,
  type WorkoutCategoryId,
} from '../../constants/dashboard';
import { WATER_GOAL_MAX_ML, WATER_GOAL_MIN_ML, WATER_GOAL_STEP_ML } from '../../constants/hydration';
import type { Colors } from '../../constants/theme';
import { spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { useBadges } from '../../hooks/useBadges';
import { useDailyMissions } from '../../hooks/useDailyMissions';
import { useMeals, type Meal } from '../../hooks/useMeals';
import { useSettings } from '../../hooks/useSettings';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { showAlert, showConfirm } from '../../lib/alert';

const RECOMMENDED_COUNT = 3;
const MOVE_TO_OPTIONS: ChoiceOption[] = MEAL_TYPES.map((m) => ({ id: m.id, label: m.label }));

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, loading: profileLoading } = useProfile();
  const [selectedDate, setSelectedDate] = useState(todayISODate());
  const isViewingPast = selectedDate !== todayISODate();
  const { missions, completionByDate, loading: missionsLoading, incrementMission } = useDailyMissions(
    user?.id,
    profile,
    profileLoading,
    selectedDate
  );
  const {
    mealsByType,
    totalsByType,
    totals,
    loading: mealsLoading,
    refetch: refetchMeals,
    addMeal,
    updateMeal,
    deleteMeal,
    moveMeal,
  } = useMeals(user?.id, selectedDate);
  const { logs: weightLogs, refetch: refetchWeightLogs } = useWeightLogs(user?.id);
  const { badges, pendingUnlock, dismissPendingUnlock } = useBadges();
  const { totalToday: waterTotalToday, addWater, removeWater, refetch: refetchWater } = useWaterLogs(user?.id);
  const { settings, update: updateSettings } = useSettings(user?.id);
  const [category, setCategory] = useState<WorkoutCategoryId>('all');
  const [waterGoalModalVisible, setWaterGoalModalVisible] = useState(false);
  const [savingWaterGoal, setSavingWaterGoal] = useState(false);

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
    else showAlert('Erreur', "Impossible d'ajouter cet aliment. Réessaie.");
  };

  const handleEditSave = async (patch: { portion: string; kcal: number }) => {
    if (!editMeal) return;
    setSavingEdit(true);
    const ok = await updateMeal(editMeal.id, patch);
    setSavingEdit(false);
    if (ok) setEditMeal(null);
    else showAlert('Erreur', 'Impossible de modifier cet aliment. Réessaie.');
  };

  const handleDeleteMeal = (meal: Meal) => {
    showConfirm('Supprimer cet aliment ?', `"${meal.name}" sera retiré de ton journal.`, 'Supprimer', async () => {
      const ok = await deleteMeal(meal.id);
      if (!ok) showAlert('Erreur', 'Impossible de supprimer cet aliment. Réessaie.');
    });
  };

  const handleMoveMeal = async (option: ChoiceOption) => {
    if (!moveMealTarget) return;
    await moveMeal(moveMealTarget.id, option.id as MealType);
    setMoveMealTarget(null);
  };

  const handleQuickAddWater = async (ml: number) => {
    const ok = await addWater(ml);
    if (!ok) showAlert('Erreur', "Impossible d'ajouter cette quantité d'eau. Réessaie.");
  };

  const handleSetWaterTotal = async (targetMl: number) => {
    const delta = targetMl - waterTotalToday;
    const ok = delta > 0 ? await addWater(delta) : delta < 0 ? await removeWater(-delta) : true;
    if (!ok) showAlert('Erreur', "Impossible de mettre à jour l'hydratation. Réessaie.");
  };

  const handleSaveWaterGoal = async (value: number) => {
    setSavingWaterGoal(true);
    const ok = await updateSettings({ objectifEauMl: value });
    setSavingWaterGoal(false);
    if (ok) setWaterGoalModalVisible(false);
    else showAlert('Erreur', "Impossible d'enregistrer l'objectif. Réessaie.");
  };

  useFocusEffect(
    useCallback(() => {
      refetchWeightLogs();
      refetchMeals();
      refetchWater();
    }, [refetchWeightLogs, refetchMeals, refetchWater])
  );

  const displayName = getDisplayName(profile?.email ?? user?.email ?? null);
  const initial = (displayName ?? '?').charAt(0).toUpperCase();
  const greeting = displayName ? `Salut, ${displayName}` : 'Salut !';
  const programDay = getProgramDay(profile?.created_at ?? null);
  const streak = useMemo(() => computeStreak(completionByDate, todayISODate()), [completionByDate]);

  const calorieTarget = computeCalorieTarget(profile);
  const macroTargets = computeMacroTargets(calorieTarget);
  const caloriesRemaining = calorieTarget - totals.kcal;
  const percent = calorieTarget > 0 ? (totals.kcal / calorieTarget) * 100 : 0;

  const completedMissions = missions.filter((m) => m.completed).length;

  const recommendedSessions = useMemo(() => {
    const filtered =
      category === 'all' ? WORKOUT_SESSIONS : WORKOUT_SESSIONS.filter((s) => s.category === category);
    return filtered.slice(0, RECOMMENDED_COUNT);
  }, [category]);

  const tip = getTipOfTheDay(profile?.objectif ?? null);

  const recentBadges = useMemo(
    () =>
      badges
        .filter((b) => b.unlockedAt)
        .sort((a, b) => (b.unlockedAt! > a.unlockedAt! ? 1 : -1))
        .slice(0, 3),
    [badges]
  );

  const poidsActuel = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].poids : profile?.poids_actuel ?? null;
  const poidsObjectif = profile?.poids_objectif;
  const ecart = poidsActuel != null && poidsObjectif != null ? Math.abs(poidsActuel - poidsObjectif) : null;

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right']}>
        <Text style={styles.emptyTitle}>Profil introuvable</Text>
        <Text style={styles.emptyText}>
          Impossible de charger ton profil pour le moment. Réessaie dans un instant.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrapper}>
          <Logo />
        </View>

        <DashboardHeader
          initial={initial}
          greeting={greeting}
          programDay={programDay}
          programLength={PROGRAM_LENGTH_DAYS}
          streak={streak}
        />

        <WeekStrip
          completionByDate={completionByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {isViewingPast && (
          <PastDateBanner
            label={formatDisplayDate(selectedDate)}
            onReset={() => setSelectedDate(todayISODate())}
          />
        )}

        <CalorieCard
          caloriesRemaining={caloriesRemaining}
          percent={percent}
          proteines={{ current: totals.proteines, target: macroTargets.proteines }}
          glucides={{ current: totals.glucides, target: macroTargets.glucides }}
          lipides={{ current: totals.lipides, target: macroTargets.lipides }}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Missions du jour</Text>
            <Text style={styles.sectionCounter}>
              {completedMissions}/{missions.length}
            </Text>
          </View>
          <View style={styles.missionsList}>
            {missionsLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : missions.length === 0 ? (
              <Text style={styles.emptyMealsTitle}>Aucune mission enregistrée ce jour-là</Text>
            ) : (
              missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  missionKey={mission.mission_key}
                  label={mission.label}
                  current={mission.current}
                  target={mission.target}
                  completed={mission.completed}
                  disabled={isViewingPast}
                  onPress={() => incrementMission(mission)}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Journal alimentaire</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/journal')} hitSlop={8}>
              {({ pressed }) => (
                <Text style={[styles.link, pressed && styles.linkPressed]}>Voir le journal</Text>
              )}
            </Pressable>
          </View>

          {mealsLoading ? (
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
        </View>

        <HydrationCard
          totalMl={waterTotalToday}
          goalMl={settings.objectifEauMl}
          onSetTotal={handleSetWaterTotal}
          onQuickAdd={handleQuickAddWater}
          onLongPressHeader={() => setWaterGoalModalVisible(true)}
        />

        <BmiCard weightKg={poidsActuel} heightCm={profile.taille} />

        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {WORKOUT_CATEGORIES.map((c) => (
              <CategoryChip key={c.id} label={c.label} active={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Séances recommandées</Text>
          <View style={styles.sessionsList}>
            {recommendedSessions.map((session) => (
              <WorkoutCard key={session.id} session={session} />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Poids actuel" value={poidsActuel != null ? `${poidsActuel} kg` : '-'} />
          <StatCard label="Objectif" value={poidsObjectif != null ? `${poidsObjectif} kg` : '-'} />
          <StatCard label="Écart restant" value={ecart != null ? `${ecart} kg` : '-'} />
        </View>

        {recentBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tes badges</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/badges')} hitSlop={8}>
                {({ pressed }) => (
                  <Text style={[styles.link, pressed && styles.linkPressed]}>Voir tout</Text>
                )}
              </Pressable>
            </View>
            <View style={styles.badgesRow}>
              {recentBadges.map((badge) => (
                <View key={badge.key} style={styles.badgeChip}>
                  <BadgeMedal Icon={badge.Icon} unlocked size={48} iconSize={22} />
                  <Text style={styles.badgeChipLabel} numberOfLines={1}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TipCard text={tip} />
      </ScrollView>

      <BadgeUnlockModal badge={pendingUnlock} onDismiss={dismissPendingUnlock} />

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
        title="Déplacer vers"
        options={MOVE_TO_OPTIONS}
        selectedLabel={moveMealTarget ? getMealTypeInfo(moveMealTarget.mealType).label : null}
        onCancel={() => setMoveMealTarget(null)}
        onSelect={handleMoveMeal}
      />

      <NumberStepperModal
        visible={waterGoalModalVisible}
        title="Objectif quotidien"
        initialValue={settings.objectifEauMl}
        unit="ml"
        step={WATER_GOAL_STEP_ML}
        min={WATER_GOAL_MIN_ML}
        max={WATER_GOAL_MAX_ML}
        quickAdjustments={[-500, -250, 250, 500]}
        saving={savingWaterGoal}
        onCancel={() => setWaterGoalModalVisible(false)}
        onSave={handleSaveWaterGoal}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: 24,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logoWrapper: {
    alignSelf: 'flex-start',
    // content's gap is 24; pull it down to the requested 12px below the logo.
    marginBottom: -12,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  linkPressed: {
    opacity: 0.7,
  },
  missionsList: {
    gap: spacing.sm,
  },
  mealsList: {
    gap: spacing.sm,
  },
  emptyMealsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sessionsList: {
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  badgeChip: {
    width: 72,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  });
}
