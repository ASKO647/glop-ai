import {
  Dumbbell,
  Lock,
  PartyPopper,
  Sparkles,
  Target,
  TrendingDown,
  Wand2,
  type LucideIcon,
} from 'lucide-react-native';

export type OnboardingOption = {
  id: string;
  /**
   * Raw French label — this is the literal value persisted to Supabase (profiles.objectif,
   * profiles.sexe, etc.) and compared against elsewhere in the app (constants/dashboard.ts,
   * constants/energy.ts, constants/progression.ts, components/progression/EnergyExpenditureCard.tsx).
   * Never change these strings and never render them directly — use `labelKey` for display.
   */
  label: string;
  /** i18n key for the translated, display-only version of `label`. */
  labelKey: string;
  /** Shown at the left of the option card, in a 32px circle. */
  icon?: LucideIcon;
  /** Selecting this option clears every other selection (e.g. "Aucune"). */
  exclusive?: boolean;
};

type BaseStep = {
  id: string;
  titleKey: string;
  subtitleKey?: string;
};

export type SingleStep = BaseStep & { kind: 'single'; options: OnboardingOption[] };
export type MultipleStep = BaseStep & { kind: 'multiple'; options: OnboardingOption[] };

export type NumericStep = BaseStep & {
  kind: 'numeric';
  /** i18n key for the unit label (e.g. "ans", "cm", "kg") — display-only. */
  unitKey?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  /** Quick-adjustment pills shown under the ± stepper. */
  quickAdjustments: number[];
};

export type BreatherStep = BaseStep & {
  kind: 'breather';
  icon: LucideIcon;
  /** Extra privacy insert (breather2 only) — icon is always the lock. */
  privacyTitleKey?: string;
  privacyTextKey?: string;
};

/** Purely computed from current_weight vs target_weight — carries no answer of its own. */
export type ResultStep = { id: 'result'; kind: 'result' };

export type FinalStep = BaseStep & { kind: 'final'; icon: LucideIcon };

export type OnboardingStep = SingleStep | MultipleStep | NumericStep | BreatherStep | ResultStep | FinalStep;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'goal',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.goal.title',
    options: [
      {
        id: 'weight_loss',
        label: 'Perte de poids',
        labelKey: 'onboarding.questionnaire.goal.options.weightLoss',
        icon: TrendingDown,
      },
      {
        id: 'muscle_gain',
        label: 'Prise de muscle',
        labelKey: 'onboarding.questionnaire.goal.options.muscleGain',
        icon: Dumbbell,
      },
      {
        id: 'glow_up',
        label: 'Glow up & esthétique',
        labelKey: 'onboarding.questionnaire.goal.options.glowUp',
        icon: Sparkles,
      },
      {
        id: 'discipline',
        label: 'Être plus discipliné',
        labelKey: 'onboarding.questionnaire.goal.options.discipline',
        icon: Target,
      },
    ],
  },
  {
    id: 'gender',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.gender.title',
    options: [
      { id: 'male', label: 'Homme', labelKey: 'onboarding.questionnaire.gender.options.male' },
      { id: 'female', label: 'Femme', labelKey: 'onboarding.questionnaire.gender.options.female' },
      { id: 'other', label: 'Autre', labelKey: 'onboarding.questionnaire.gender.options.other' },
    ],
  },
  {
    id: 'breather1',
    kind: 'breather',
    titleKey: 'onboarding.flow.breather1.title',
    subtitleKey: 'onboarding.flow.breather1.subtitle',
    icon: Wand2,
  },
  {
    id: 'age',
    kind: 'numeric',
    titleKey: 'onboarding.questionnaire.age.title',
    unitKey: 'onboarding.questionnaire.units.years',
    min: 13,
    max: 90,
    defaultValue: 25,
    quickAdjustments: [-5, -1, 1, 5],
  },
  {
    id: 'height',
    kind: 'numeric',
    titleKey: 'onboarding.questionnaire.height.title',
    unitKey: 'onboarding.questionnaire.units.cm',
    min: 120,
    max: 220,
    defaultValue: 170,
    quickAdjustments: [-5, -1, 1, 5],
  },
  {
    id: 'current_weight',
    kind: 'numeric',
    titleKey: 'onboarding.questionnaire.currentWeight.title',
    unitKey: 'onboarding.questionnaire.units.kg',
    min: 30,
    max: 200,
    defaultValue: 70,
    quickAdjustments: [-5, -1, 1, 5],
  },
  {
    id: 'target_weight',
    kind: 'numeric',
    titleKey: 'onboarding.questionnaire.targetWeight.title',
    unitKey: 'onboarding.questionnaire.units.kg',
    min: 30,
    max: 200,
    defaultValue: 65,
    quickAdjustments: [-5, -1, 1, 5],
  },
  { id: 'result', kind: 'result' },
  {
    id: 'pace',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.pace.title',
    options: [
      { id: 'progressive', label: 'Progressif', labelKey: 'onboarding.questionnaire.pace.options.progressive' },
      { id: 'moderate', label: 'Modéré', labelKey: 'onboarding.questionnaire.pace.options.moderate' },
      { id: 'fast', label: 'Rapide', labelKey: 'onboarding.questionnaire.pace.options.fast' },
    ],
  },
  {
    id: 'activity_level',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.activityLevel.title',
    options: [
      { id: 'sedentary', label: 'Sédentaire', labelKey: 'onboarding.questionnaire.activityLevel.options.sedentary' },
      { id: 'light', label: 'Léger', labelKey: 'onboarding.questionnaire.activityLevel.options.light' },
      { id: 'moderate', label: 'Modéré', labelKey: 'onboarding.questionnaire.activityLevel.options.moderate' },
      { id: 'very_active', label: 'Très actif', labelKey: 'onboarding.questionnaire.activityLevel.options.veryActive' },
    ],
  },
  {
    id: 'workouts_per_week',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.workoutsPerWeek.title',
    options: [
      { id: '1_2', label: '1-2', labelKey: 'onboarding.questionnaire.workoutsPerWeek.options.oneTwo' },
      { id: '3_4', label: '3-4', labelKey: 'onboarding.questionnaire.workoutsPerWeek.options.threeFour' },
      { id: '5_6', label: '5-6', labelKey: 'onboarding.questionnaire.workoutsPerWeek.options.fiveSix' },
      { id: 'daily', label: 'Tous les jours', labelKey: 'onboarding.questionnaire.workoutsPerWeek.options.daily' },
    ],
  },
  {
    id: 'training_location',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.trainingLocation.title',
    options: [
      { id: 'gym', label: 'Salle', labelKey: 'onboarding.questionnaire.trainingLocation.options.gym' },
      { id: 'home', label: 'Maison', labelKey: 'onboarding.questionnaire.trainingLocation.options.home' },
      { id: 'both', label: 'Les deux', labelKey: 'onboarding.questionnaire.trainingLocation.options.both' },
    ],
  },
  {
    id: 'breather2',
    kind: 'breather',
    titleKey: 'onboarding.flow.breather2.title',
    subtitleKey: 'onboarding.flow.breather2.subtitle',
    icon: PartyPopper,
    privacyTitleKey: 'onboarding.flow.breather2.privacyTitle',
    privacyTextKey: 'onboarding.flow.breather2.privacyText',
  },
  {
    id: 'diet_quality',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.dietQuality.title',
    options: [
      { id: 'messy', label: 'Désordonnée', labelKey: 'onboarding.questionnaire.dietQuality.options.messy' },
      { id: 'okay', label: 'Correcte', labelKey: 'onboarding.questionnaire.dietQuality.options.okay' },
      { id: 'healthy', label: 'Plutôt saine', labelKey: 'onboarding.questionnaire.dietQuality.options.healthy' },
      { id: 'structured', label: 'Très structurée', labelKey: 'onboarding.questionnaire.dietQuality.options.structured' },
    ],
  },
  {
    id: 'dietary_restrictions',
    kind: 'multiple',
    titleKey: 'onboarding.questionnaire.dietaryRestrictions.title',
    options: [
      {
        id: 'none',
        label: 'Aucune',
        labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.none',
        exclusive: true,
      },
      { id: 'vegetarian', label: 'Végétarien', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.vegetarian' },
      { id: 'vegan', label: 'Végan', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.vegan' },
      { id: 'gluten_free', label: 'Sans gluten', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.glutenFree' },
      { id: 'lactose_free', label: 'Sans lactose', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.lactoseFree' },
    ],
  },
  {
    id: 'sleep_hours',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.sleepHours.title',
    options: [
      { id: 'under_5', label: 'Moins de 5', labelKey: 'onboarding.questionnaire.sleepHours.options.under5' },
      { id: '5_6', label: '5-6', labelKey: 'onboarding.questionnaire.sleepHours.options.fiveSix' },
      { id: '7_8', label: '7-8', labelKey: 'onboarding.questionnaire.sleepHours.options.sevenEight' },
      { id: 'over_8', label: 'Plus de 8', labelKey: 'onboarding.questionnaire.sleepHours.options.over8' },
    ],
  },
  {
    id: 'blocker',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.blocker.title',
    options: [
      { id: 'motivation', label: 'Manque de motivation', labelKey: 'onboarding.questionnaire.blocker.options.motivation' },
      { id: 'time', label: 'Manque de temps', labelKey: 'onboarding.questionnaire.blocker.options.time' },
      { id: 'direction', label: 'Je ne sais pas quoi faire', labelKey: 'onboarding.questionnaire.blocker.options.direction' },
      { id: 'consistency', label: "Je n'ai pas tenu", labelKey: 'onboarding.questionnaire.blocker.options.consistency' },
    ],
  },
  {
    id: 'commitment_level',
    kind: 'single',
    titleKey: 'onboarding.questionnaire.commitmentLevel.title',
    options: [
      { id: 'testing', label: 'Je teste', labelKey: 'onboarding.questionnaire.commitmentLevel.options.testing' },
      { id: 'motivated', label: 'Je suis motivé', labelKey: 'onboarding.questionnaire.commitmentLevel.options.motivated' },
      {
        id: 'determined',
        label: 'Je suis déterminé à changer',
        labelKey: 'onboarding.questionnaire.commitmentLevel.options.determined',
      },
    ],
  },
  {
    id: 'final',
    kind: 'final',
    titleKey: 'onboarding.flow.final.title',
    subtitleKey: 'onboarding.flow.final.subtitle',
    icon: PartyPopper,
  },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export function getStep(id: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((step) => step.id === id);
}

export function getStepByIndex(index: number): OnboardingStep | undefined {
  return ONBOARDING_STEPS[index];
}

/**
 * Looks up the raw French label for a given step/option id pair — this is the value that gets
 * persisted to Supabase (see `OnboardingOption.label` above). Never use this for display.
 */
export function getOptionLabel(stepId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const step = getStep(stepId);
  if (!step || (step.kind !== 'single' && step.kind !== 'multiple')) return undefined;
  return step.options.find((o) => o.id === optionId)?.label;
}

/** Looks up the i18n key for the translated, display-only label of a given step/option id pair. */
export function getOptionLabelKey(stepId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const step = getStep(stepId);
  if (!step || (step.kind !== 'single' && step.kind !== 'multiple')) return undefined;
  return step.options.find((o) => o.id === optionId)?.labelKey;
}

/** The options list for a single/multiple-choice step, for callers that only deal with question steps (e.g. profil.tsx rebuilding a ChoiceModal's option list). */
export function getStepOptions(stepId: string): OnboardingOption[] {
  const step = getStep(stepId);
  if (!step || (step.kind !== 'single' && step.kind !== 'multiple')) return [];
  return step.options;
}

export { Lock as PrivacyIcon };
