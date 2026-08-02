import { useFocusEffect, useRouter } from 'expo-router';
import { CheckCircle2, Clock, Flame } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeekHistoryStrip from '../../components/workout/WeekHistoryStrip';
import AppImage from '../../components/ui/AppImage';
import Button from '../../components/ui/Button';
import { getExerciseThumbnail, getTodaysWorkout, todayISODate } from '../../constants/dashboard';
import { colors, radii, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useWeeklyWorkouts } from '../../hooks/useWeeklyWorkouts';

export default function WorkoutTabScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { completedByDate, loading: historyLoading, refetch: refetchHistory } = useWeeklyWorkouts(user?.id);

  useFocusEffect(
    useCallback(() => {
      refetchHistory();
    }, [refetchHistory])
  );

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  const session = getTodaysWorkout(profile);
  const doneToday = completedByDate[todayISODate()] === true;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppImage source={require('../../assets/images/plan-hero.jpg')} style={styles.banner} overlay={0.5} />

        <Text style={typography.title}>Séance du jour</Text>
        <Text style={styles.subtitle}>
          Recommandée selon ton objectif{profile?.frequence_entrainement ? ` · ${profile.frequence_entrainement}/sem` : ''}
          {profile?.lieu_entrainement ? ` · ${profile.lieu_entrainement}` : ''}
        </Text>

        <View style={styles.sessionCard}>
          {doneToday && (
            <View style={styles.doneBadge}>
              <CheckCircle2 color={colors.accent} size={14} />
              <Text style={styles.doneBadgeText}>Terminée aujourd'hui</Text>
            </View>
          )}

          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.muscles}>{session.muscles}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock color={colors.textSecondary} size={16} />
              <Text style={styles.metaText}>{session.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Flame color={colors.textSecondary} size={16} />
              <Text style={styles.metaText}>{session.kcal} kcal</Text>
            </View>
          </View>

          <View style={styles.exercisesList}>
            {session.exercises.map((exercise) => (
              <View key={exercise.name} style={styles.exerciseRow}>
                <AppImage source={getExerciseThumbnail(exercise.name)} style={styles.exerciseThumbnail} overlay={0.3} />
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetail}>
                  {exercise.sets} x {exercise.reps}
                </Text>
              </View>
            ))}
          </View>

          <Button
            label={doneToday ? 'Refaire la séance' : 'Commencer'}
            variant={doneToday ? 'secondary' : 'primary'}
            onPress={() => router.push(`/workout/session/${session.id}`)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>
          {historyLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <WeekHistoryStrip completedByDate={completedByDate} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  banner: {
    width: '100%',
    height: 140,
    borderRadius: radii.lg,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  muscles: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  exercisesList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  exerciseThumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  exerciseDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
