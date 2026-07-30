import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getOptionLabel } from '../../constants/questionnaire';
import { colors, spacing, typography } from '../../constants/theme';
import { useOnboarding, type AnswerValue } from '../../context/OnboardingContext';

// Estimated weekly weight change (kg) per chosen pace — used only to derive a display duration.
const WEEKLY_RATE_BY_PACE: Record<string, number> = {
  progressive: 0.25,
  moderate: 0.5,
  fast: 0.75,
};

const FALLBACK_CURRENT_WEIGHT = 70;
const FALLBACK_TARGET_WEIGHT = 65;
const FALLBACK_DURATION_DAYS = 90;

function asString(value: AnswerValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function PlanScreen() {
  const { answers } = useOnboarding();

  const goalLabel = getOptionLabel('goal', asString(answers.goal)) ?? 'Transformation personnalisée';

  const currentWeight =
    typeof answers.current_weight === 'number' ? answers.current_weight : FALLBACK_CURRENT_WEIGHT;
  const targetWeight =
    typeof answers.target_weight === 'number' ? answers.target_weight : FALLBACK_TARGET_WEIGHT;
  const weightDiff = Math.round(currentWeight - targetWeight);

  const weeklyRate = WEEKLY_RATE_BY_PACE[asString(answers.pace) ?? 'moderate'] ?? WEEKLY_RATE_BY_PACE.moderate;
  const durationDays =
    weightDiff === 0
      ? FALLBACK_DURATION_DAYS
      : clamp(Math.round((Math.abs(weightDiff) / weeklyRate) * 7), 30, 365);

  const weightLabel = weightDiff === 0 ? 'Poids stable' : `${weightDiff > 0 ? '-' : '+'}${Math.abs(weightDiff)} kg`;

  const workoutsLabel = getOptionLabel('workouts_per_week', asString(answers.workouts_per_week)) ?? '3-4';
  const locationLabel = getOptionLabel('training_location', asString(answers.training_location)) ?? 'Les deux';
  const dietLabel = getOptionLabel('diet_quality', asString(answers.diet_quality)) ?? 'Correcte';
  const restrictionIds = Array.isArray(answers.dietary_restrictions) ? answers.dietary_restrictions : [];
  const restrictionLabels = restrictionIds
    .filter((id) => id !== 'none')
    .map((id) => getOptionLabel('dietary_restrictions', id))
    .filter((label): label is string => Boolean(label));
  const sleepLabel = getOptionLabel('sleep_hours', asString(answers.sleep_hours)) ?? '7-8';
  const commitmentLabel = getOptionLabel('commitment_level', asString(answers.commitment_level)) ?? 'Je suis motivé';
  const blockerLabel = getOptionLabel('blocker', asString(answers.blocker)) ?? 'le manque de régularité';

  const axes = [
    {
      title: 'Entraînement',
      description: `${workoutsLabel} séances / semaine · ${locationLabel}`,
    },
    {
      title: 'Nutrition',
      description:
        restrictionLabels.length > 0 ? `${dietLabel} · ${restrictionLabels.join(', ')}` : dietLabel,
    },
    {
      title: 'Sommeil',
      description: `${sleepLabel} heures / nuit`,
    },
    {
      title: 'Discipline',
      description: `${commitmentLabel} · Priorité : ${blockerLabel}`,
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={typography.title}>Ton plan est prêt</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{goalLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroValue}>{weightLabel}</Text>
          <Text style={styles.heroCaption}>en {durationDays} jours</Text>
        </Card>

        <View style={styles.axes}>
          {axes.map((axis) => (
            <Card key={axis.title} style={styles.axisCard}>
              <Text style={styles.axisTitle}>{axis.title}</Text>
              <Text style={styles.axisDescription}>{axis.description}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Link href="/signup" asChild>
          <Button label="Voir mon plan" variant="primary" />
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.accent,
  },
  heroCaption: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
  axes: {
    gap: spacing.sm,
  },
  axisCard: {
    gap: spacing.xs,
  },
  axisTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  axisDescription: {
    ...typography.caption,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
