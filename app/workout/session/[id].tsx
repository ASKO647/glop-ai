import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';
import { WORKOUT_SESSIONS, todayISODate } from '../../../constants/dashboard';
import type { Colors } from '../../../constants/theme';
import { radii, spacing, typography } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';
import { useTheme } from '../../../context/ThemeContext';
import { useDailyMissions } from '../../../hooks/useDailyMissions';

const DEFAULT_REST_SECONDS = 60;
const REST_STEP_SECONDS = 15;
const MIN_REST_SECONDS = 0;
const MAX_REST_SECONDS = 300;

function formatTargetReps(reps: string): string {
  return /^\d+$/.test(reps) ? `${reps} répétitions` : reps;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = WORKOUT_SESSIONS.find((s) => s.id === id);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { missions, incrementMission } = useDailyMissions(user?.id, profile, profileLoading, todayISODate());

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState<number[]>(
    () => session?.exercises.map(() => 0) ?? []
  );
  const [phase, setPhase] = useState<'active' | 'resting'>('active');
  const [restRemaining, setRestRemaining] = useState(DEFAULT_REST_SECONDS);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (phase !== 'resting') return;
    if (restRemaining <= 0) {
      setPhase('active');
      setCurrentSet((s) => s + 1);
      return;
    }
    const timeout = setTimeout(() => setRestRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timeout);
  }, [phase, restRemaining]);

  const currentExercise = session?.exercises[exerciseIndex];
  const isLastExercise = session ? exerciseIndex === session.exercises.length - 1 : false;
  const exerciseSetsDone = currentExercise ? completedSetsByExercise[exerciseIndex] >= currentExercise.sets : false;

  const totalSets = useMemo(() => session?.exercises.reduce((acc, e) => acc + e.sets, 0) ?? 0, [session]);
  const completedTotal = completedSetsByExercise.reduce((acc, n) => acc + n, 0);
  const overallProgress = totalSets > 0 ? completedTotal / totalSets : 0;

  const handleSetComplete = () => {
    if (!currentExercise) return;
    setCompletedSetsByExercise((prev) =>
      prev.map((count, i) => (i === exerciseIndex ? Math.min(currentExercise.sets, count + 1) : count))
    );
    if (currentSet < currentExercise.sets) {
      setRestRemaining(DEFAULT_REST_SECONDS);
      setPhase('resting');
    }
  };

  const adjustRest = (delta: number) => {
    setRestRemaining((r) => Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, r + delta)));
  };

  const skipRest = () => {
    setPhase('active');
    setCurrentSet((s) => s + 1);
  };

  const goToExercise = (index: number) => {
    setExerciseIndex(index);
    setCurrentSet(1);
    setPhase('active');
  };

  const handleFinish = async () => {
    setFinishing(true);
    const workoutMission = missions.find((m) => m.mission_key === 'workout');
    if (workoutMission && !workoutMission.completed) {
      await incrementMission(workoutMission);
    }
    router.replace('/');
  };

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {session?.title ?? 'Séance'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!session || !currentExercise ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Cette séance est introuvable.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <ProgressBar progress={overallProgress} />
          <Text style={styles.progressLabel}>
            {completedTotal}/{totalSets} séries complétées
          </Text>

          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.setLabel}>
              Série {Math.min(currentSet, currentExercise.sets)} sur {currentExercise.sets}
            </Text>
            <Text style={styles.repsLabel}>Objectif : {formatTargetReps(currentExercise.reps)}</Text>
          </View>

          {phase === 'resting' ? (
            <View style={styles.restCard}>
              <Text style={styles.restTitle}>Repos</Text>
              <Text style={styles.restCountdown}>{formatCountdown(restRemaining)}</Text>
              <View style={styles.restControls}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => adjustRest(-REST_STEP_SECONDS)}
                  style={({ pressed }) => [styles.restStepButton, pressed && styles.pressed]}
                >
                  <Minus color={colors.textPrimary} size={18} />
                  <Text style={styles.restStepText}>15s</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => adjustRest(REST_STEP_SECONDS)}
                  style={({ pressed }) => [styles.restStepButton, pressed && styles.pressed]}
                >
                  <Plus color={colors.textPrimary} size={18} />
                  <Text style={styles.restStepText}>15s</Text>
                </Pressable>
              </View>
              <Button label="Passer le repos" variant="secondary" onPress={skipRest} />
            </View>
          ) : (
            <Button
              label="Série terminée"
              onPress={handleSetComplete}
              disabled={exerciseSetsDone}
            />
          )}

          <View style={styles.navRow}>
            <Button
              label="Précédent"
              variant="secondary"
              disabled={exerciseIndex === 0}
              onPress={() => goToExercise(exerciseIndex - 1)}
              style={styles.navButton}
            />
            {isLastExercise ? (
              <Button
                label="Terminer"
                onPress={handleFinish}
                loading={finishing}
                style={styles.navButton}
              />
            ) : (
              <Button
                label="Suivant"
                onPress={() => goToExercise(exerciseIndex + 1)}
                style={styles.navButton}
              />
            )}
          </View>
        </View>
      )}
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
      gap: spacing.sm,
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
    headerTitle: {
      ...typography.heading,
      color: colors.textPrimary,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    progressLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    exerciseCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
    },
    exerciseName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    setLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
    },
    repsLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    restCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
    },
    restTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    restCountdown: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    restControls: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    restStepButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    restStepText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    navRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: 'auto',
    },
    navButton: {
      flex: 1,
    },
  });
}
