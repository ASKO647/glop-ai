import { Link } from 'expo-router';
import { Check, Target } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getOptionLabel } from '../../constants/questionnaire';
import { colors, radii, spacing } from '../../constants/theme';
import { asString, useOnboarding } from '../../context/OnboardingContext';

// Estimated weekly weight change (kg) per chosen pace — used only to derive a display duration.
const WEEKLY_RATE_BY_PACE: Record<string, number> = {
  progressive: 0.25,
  moderate: 0.5,
  fast: 0.75,
};

const FALLBACK_CURRENT_WEIGHT = 70;
const FALLBACK_TARGET_WEIGHT = 65;
const FALLBACK_DURATION_DAYS = 90;

// Every phrase below is a forward-looking promise, never a readout of the raw answer.
const WORKOUT_PROGRAM_BY_FREQUENCY: Record<string, string> = {
  '1_2': 'Programme efficace en 1 à 2 séances par semaine',
  '3_4': 'Programme structuré sur 3 à 4 séances par semaine',
  '5_6': 'Programme intensif sur 5 à 6 séances par semaine',
  daily: 'Routine quotidienne pour progresser sans relâche',
};
const FALLBACK_WORKOUT_PROGRAM = 'Programme structuré adapté à ton rythme';

const TRAINING_LOCATION_SUFFIX: Record<string, string> = {
  gym: ', en salle',
  home: ', à la maison',
  both: ', entre salle et maison',
};

const RESTRICTION_ADJECTIVE: Record<string, string> = {
  vegetarian: 'végétarien',
  vegan: 'végan',
  gluten_free: 'sans gluten',
  lactose_free: 'sans lactose',
};

const SLEEP_PROMISE_BY_ANSWER: Record<string, string> = {
  under_5: 'Routine pour gagner 2h de récupération chaque nuit',
  '5_6': 'Routine pour gagner 1h de récupération chaque nuit',
  '7_8': 'Routine pour consolider ton rythme de sommeil actuel',
  over_8: 'Routine pour optimiser la qualité de ton sommeil',
};
const FALLBACK_SLEEP_PROMISE = 'Routine de sommeil optimisée pour ta récupération';

function getDisciplinePromise(blockerId: string | undefined, durationDays: number): string {
  switch (blockerId) {
    case 'time':
      return `Routine express pour avancer même avec un planning chargé, sur ${durationDays} jours`;
    case 'direction':
      return `Feuille de route claire, étape par étape, sur ${durationDays} jours`;
    case 'consistency':
      return `Suivi quotidien pour rester régulier sur ${durationDays} jours`;
    default:
      return `Missions quotidiennes pour tenir sur ${durationDays} jours`;
  }
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

  const trainingDescription =
    (WORKOUT_PROGRAM_BY_FREQUENCY[asString(answers.workouts_per_week) ?? ''] ?? FALLBACK_WORKOUT_PROGRAM) +
    (TRAINING_LOCATION_SUFFIX[asString(answers.training_location) ?? ''] ?? '') +
    '.';

  const restrictionIds = Array.isArray(answers.dietary_restrictions) ? answers.dietary_restrictions : [];
  const restrictionAdjectives = restrictionIds
    .filter((id) => id !== 'none')
    .map((id) => RESTRICTION_ADJECTIVE[id])
    .filter((adjective): adjective is string => Boolean(adjective));
  const nutritionDescription =
    restrictionAdjectives.length > 0
      ? `Plan ${restrictionAdjectives.join(' et ')} structuré, adapté à ton objectif.`
      : 'Plan alimentaire structuré, adapté à ton objectif.';

  const sleepDescription =
    (SLEEP_PROMISE_BY_ANSWER[asString(answers.sleep_hours) ?? ''] ?? FALLBACK_SLEEP_PROMISE) + '.';

  const disciplineDescription = getDisciplinePromise(asString(answers.blocker), durationDays) + '.';

  const objectives = [
    { title: 'Entraînement', description: trainingDescription },
    { title: 'Nutrition', description: nutritionDescription },
    { title: 'Sommeil', description: sleepDescription },
    { title: 'Discipline', description: disciplineDescription },
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
