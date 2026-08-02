import { useFocusEffect, useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';
import BadgeMedal from '../../components/badges/BadgeMedal';
import BadgeUnlockModal from '../../components/badges/BadgeUnlockModal';
import CalorieCard from '../../components/dashboard/CalorieCard';
import CategoryChip from '../../components/dashboard/CategoryChip';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import MealRow from '../../components/dashboard/MealRow';
import MissionCard from '../../components/dashboard/MissionCard';
import PastDateBanner from '../../components/dashboard/PastDateBanner';
import StatCard from '../../components/dashboard/StatCard';
import TipCard from '../../components/dashboard/TipCard';
import WeekStrip from '../../components/dashboard/WeekStrip';
import WorkoutCard from '../../components/dashboard/WorkoutCard';
import {
  WORKOUT_CATEGORIES,
  WORKOUT_SESSIONS,
  computeCalorieTarget,
  computeMacroTargets,
  computeStreak,
  formatDisplayDate,
  getDisplayName,
  getProgramDay,
  getTipOfTheDay,
  PROGRAM_LENGTH_DAYS,
  todayISODate,
  type WorkoutCategoryId,
} from '../../constants/dashboard';
import { colors, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useBadges } from '../../hooks/useBadges';
import { useDailyMissions } from '../../hooks/useDailyMissions';
import { useMeals } from '../../hooks/useMeals';
import { useWeightLogs } from '../../hooks/useWeightLogs';

const RECOMMENDED_COUNT = 3;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [selectedDate, setSelectedDate] = useState(todayISODate());
  const isViewingPast = selectedDate !== todayISODate();
  const { missions, completionByDate, loading: missionsLoading, incrementMission } = useDailyMissions(
    user?.id,
    profile,
    profileLoading,
    selectedDate
  );
  const { meals, totals, loading: mealsLoading, refetch: refetchMeals } = useMeals(user?.id, selectedDate);
  const { logs: weightLogs, refetch: refetchWeightLogs } = useWeightLogs(user?.id);
  const { badges, pendingUnlock, dismissPendingUnlock } = useBadges();
  const [category, setCategory] = useState<WorkoutCategoryId>('all');

  useFocusEffect(
    useCallback(() => {
      refetchWeightLogs();
      refetchMeals();
    }, [refetchWeightLogs, refetchMeals])
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
            <Text style={styles.sectionTitle}>Repas d'aujourd'hui</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/meals')} hitSlop={8}>
              {({ pressed }) => (
                <Text style={[styles.link, pressed && styles.linkPressed]}>Voir tout</Text>
              )}
            </Pressable>
          </View>

          {mealsLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : meals.length === 0 ? (
            <View style={styles.emptyMeals}>
              <Camera color={colors.textTertiary} size={28} />
              <Text style={styles.emptyMealsTitle}>Scanne ton premier repas</Text>
              <Button label="Scanner" onPress={() => router.push('/scanner')} style={styles.emptyMealsButton} />
            </View>
          ) : (
            <View style={styles.mealsList}>
              {meals.map((meal) => (
                <MealRow
                  key={meal.id}
                  name={meal.name}
                  kcal={meal.kcal}
                  time={new Date(meal.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
              ))}
            </View>
          )}
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  emptyMeals: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyMealsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyMealsButton: {
    paddingHorizontal: spacing.lg,
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
