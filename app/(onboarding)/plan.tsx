import { Link } from 'expo-router';
import { Check, Target } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getOptionLabel } from '../../constants/questionnaire';
import { colors, radii, spacing } from '../../constants/theme';
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
  const durationLabel = `${weightLabel} en ${durationDays} jours`;

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

  const objectives = [
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
        <Text style={styles.title}>Ton plan est prêt 🎉</Text>
        <Text style={styles.subtitle}>Ta transformation commence maintenant.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Target color={colors.background} size={18} />
          </View>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroGoal}>{goalLabel}</Text>
            <Text style={styles.heroDuration}>{durationLabel}</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Objectifs principaux</Text>
          <View style={styles.objectiveList}>
            {objectives.map((objective) => (
              <View key={objective.title} style={styles.objectiveRow}>
                <Check color={colors.accent} size={14} strokeWidth={3} />
                <Text style={styles.objectiveText}>
                  <Text style={styles.objectiveTitle}>{objective.title} : </Text>
                  {objective.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Link href="/signup" asChild>
          <Button label="Voir mon plan" variant="primary" style={styles.ctaButton} />
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextGroup: {
    flex: 1,
    gap: 4,
  },
  heroGoal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  heroDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.labelMuted,
  },
  objectiveList: {
    gap: 14,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  objectiveTitle: {
    fontWeight: '700',
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  ctaButton: {
    height: 52,
    borderRadius: radii.lg,
  },
});
