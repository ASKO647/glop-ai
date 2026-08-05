import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Flame } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { WORKOUT_SESSIONS } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing, typography } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = WORKOUT_SESSIONS.find((s) => s.id === id);
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
          {session ? t(session.titleKey) : t('dashboard.workout.fallbackTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!session ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('dashboard.workout.notFound')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.muscles}>{t(session.musclesKey)}</Text>

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

          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>{t('dashboard.workout.exercisesTitle')}</Text>
            <View style={styles.exercisesList}>
              {session.exercises.map((exercise) => (
                <View key={exercise.nameKey} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{t(exercise.nameKey)}</Text>
                  <Text style={styles.exerciseDetail}>
                    {exercise.sets} x {exercise.reps}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Button label={t('dashboard.workout.startFull')} onPress={() => router.push(`/workout/session/${session.id}`)} />
        </ScrollView>
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
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
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
    exercisesSection: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    exercisesList: {
      gap: spacing.sm,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    exerciseName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    exerciseDetail: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
