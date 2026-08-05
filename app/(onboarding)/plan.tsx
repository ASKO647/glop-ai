import { Link } from 'expo-router';
import { Check, Target } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppImage from '../../components/ui/AppImage';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { appImage } from '../../constants/images';
import { getOptionLabelKey } from '../../constants/onboardingFlow';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { asString, useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

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
const WORKOUT_PROGRAM_KEY_BY_FREQUENCY: Record<string, string> = {
  '1_2': 'onboarding.plan.training.base.oneTwo',
  '3_4': 'onboarding.plan.training.base.threeFour',
  '5_6': 'onboarding.plan.training.base.fiveSix',
  daily: 'onboarding.plan.training.base.daily',
};
const FALLBACK_WORKOUT_PROGRAM_KEY = 'onboarding.plan.training.base.default';

const TRAINING_LOCATION_SUFFIX_KEY: Record<string, string> = {
  gym: 'onboarding.plan.training.location.gym',
  home: 'onboarding.plan.training.location.home',
  both: 'onboarding.plan.training.location.both',
};

const RESTRICTION_ADJECTIVE_KEY: Record<string, string> = {
  vegetarian: 'onboarding.plan.nutrition.adjectives.vegetarian',
  vegan: 'onboarding.plan.nutrition.adjectives.vegan',
  gluten_free: 'onboarding.plan.nutrition.adjectives.glutenFree',
  lactose_free: 'onboarding.plan.nutrition.adjectives.lactoseFree',
};

const SLEEP_PROMISE_KEY_BY_ANSWER: Record<string, string> = {
  under_5: 'onboarding.plan.sleep.under5',
  '5_6': 'onboarding.plan.sleep.fiveSix',
  '7_8': 'onboarding.plan.sleep.sevenEight',
  over_8: 'onboarding.plan.sleep.over8',
};
const FALLBACK_SLEEP_PROMISE_KEY = 'onboarding.plan.sleep.default';

const DISCIPLINE_PROMISE_KEY_BY_BLOCKER: Record<string, string> = {
  time: 'onboarding.plan.discipline.time',
  direction: 'onboarding.plan.discipline.direction',
  consistency: 'onboarding.plan.discipline.consistency',
};
const FALLBACK_DISCIPLINE_PROMISE_KEY = 'onboarding.plan.discipline.default';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function PlanScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { answers } = useOnboarding();

  const goalLabelKey = getOptionLabelKey('goal', asString(answers.goal));
  const goalLabel = goalLabelKey ? t(goalLabelKey) : t('onboarding.plan.defaultGoal');

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

  const weightLabel =
    weightDiff === 0
      ? t('onboarding.plan.weightStable')
      : t('onboarding.plan.weightChange', { sign: weightDiff > 0 ? '-' : '+', amount: Math.abs(weightDiff) });
  const durationLabel = t('onboarding.plan.duration', { weight: weightLabel, days: durationDays });

  const trainingBase = t(
    WORKOUT_PROGRAM_KEY_BY_FREQUENCY[asString(answers.workouts_per_week) ?? ''] ?? FALLBACK_WORKOUT_PROGRAM_KEY
  );
  const trainingLocationKey = TRAINING_LOCATION_SUFFIX_KEY[asString(answers.training_location) ?? ''];
  const trainingLocationSuffix = trainingLocationKey ? t(trainingLocationKey) : '';
  const trainingDescription = t('onboarding.plan.training.sentence', {
    base: trainingBase,
    location: trainingLocationSuffix,
  });

  const restrictionIds = Array.isArray(answers.dietary_restrictions) ? answers.dietary_restrictions : [];
  const restrictionAdjectives = restrictionIds
    .filter((id) => id !== 'none')
    .map((id) => RESTRICTION_ADJECTIVE_KEY[id])
    .filter((key): key is string => Boolean(key))
    .map((key) => t(key));
  const nutritionDescription =
    restrictionAdjectives.length > 0
      ? t('onboarding.plan.nutrition.withRestrictions', {
          adjectives: restrictionAdjectives.join(t('onboarding.plan.nutrition.adjectiveSeparator')),
        })
      : t('onboarding.plan.nutrition.default');

  const sleepDescription = t(
    SLEEP_PROMISE_KEY_BY_ANSWER[asString(answers.sleep_hours) ?? ''] ?? FALLBACK_SLEEP_PROMISE_KEY
  );

  const disciplineDescription = t(
    DISCIPLINE_PROMISE_KEY_BY_BLOCKER[asString(answers.blocker) ?? ''] ?? FALLBACK_DISCIPLINE_PROMISE_KEY,
    { days: durationDays }
  );

  const objectives = [
    { title: t('onboarding.plan.objectiveTitles.training'), description: trainingDescription },
    { title: t('onboarding.plan.objectiveTitles.nutrition'), description: nutritionDescription },
    { title: t('onboarding.plan.objectiveTitles.sleep'), description: sleepDescription },
    { title: t('onboarding.plan.objectiveTitles.discipline'), description: disciplineDescription },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <AppImage source={appImage('plan-hero.jpg')} style={styles.heroBanner} overlay={0.45} />

      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.plan.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.plan.subtitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            {/* Icon sits on a colors.accent-filled circle, so it needs onAccent, not background
                (background would turn light-on-light-ish against accent once light mode flips). */}
            <Target color={colors.onAccent} size={18} />
          </View>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroGoal}>{goalLabel}</Text>
            <Text style={styles.heroDuration}>{durationLabel}</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('onboarding.plan.sectionLabel')}</Text>
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
          <Button label={t('onboarding.plan.cta')} variant="primary" style={styles.ctaButton} />
        </Link>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    heroBanner: {
      width: '100%',
      height: 180,
      borderRadius: radii.lg,
      marginTop: spacing.lg,
    },
    header: {
      marginTop: spacing.md,
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
}
