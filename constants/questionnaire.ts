export type QuestionOption = {
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
  /** Selecting this option clears every other selection (e.g. "Aucune"). */
  exclusive?: boolean;
};

type BaseQuestion = {
  id: string;
  /** i18n key for the question's display text. */
  titleKey: string;
};

export type SingleChoiceQuestion = BaseQuestion & {
  type: 'single';
  options: QuestionOption[];
};

export type MultipleChoiceQuestion = BaseQuestion & {
  type: 'multiple';
  options: QuestionOption[];
};

export type NumericQuestion = BaseQuestion & {
  type: 'numeric';
  /** i18n key for the unit label (e.g. "ans", "cm", "kg") — display-only. */
  unitKey?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
};

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | NumericQuestion;

export const QUESTIONS: Question[] = [
  {
    id: 'goal',
    type: 'single',
    titleKey: 'onboarding.questionnaire.goal.title',
    options: [
      { id: 'weight_loss', label: 'Perte de poids', labelKey: 'onboarding.questionnaire.goal.options.weightLoss' },
      { id: 'muscle_gain', label: 'Prise de muscle', labelKey: 'onboarding.questionnaire.goal.options.muscleGain' },
      { id: 'glow_up', label: 'Glow up & esthétique', labelKey: 'onboarding.questionnaire.goal.options.glowUp' },
      { id: 'discipline', label: 'Être plus discipliné', labelKey: 'onboarding.questionnaire.goal.options.discipline' },
    ],
  },
  {
    id: 'gender',
    type: 'single',
    titleKey: 'onboarding.questionnaire.gender.title',
    options: [
      { id: 'male', label: 'Homme', labelKey: 'onboarding.questionnaire.gender.options.male' },
      { id: 'female', label: 'Femme', labelKey: 'onboarding.questionnaire.gender.options.female' },
      { id: 'other', label: 'Autre', labelKey: 'onboarding.questionnaire.gender.options.other' },
    ],
  },
  {
    id: 'age',
    type: 'numeric',
    titleKey: 'onboarding.questionnaire.age.title',
    unitKey: 'onboarding.questionnaire.units.years',
    min: 13,
    max: 90,
    defaultValue: 25,
  },
  {
    id: 'height',
    type: 'numeric',
    titleKey: 'onboarding.questionnaire.height.title',
    unitKey: 'onboarding.questionnaire.units.cm',
    min: 120,
    max: 220,
    defaultValue: 170,
  },
  {
    id: 'current_weight',
    type: 'numeric',
    titleKey: 'onboarding.questionnaire.currentWeight.title',
    unitKey: 'onboarding.questionnaire.units.kg',
    min: 30,
    max: 200,
    defaultValue: 70,
  },
  {
    id: 'target_weight',
    type: 'numeric',
    titleKey: 'onboarding.questionnaire.targetWeight.title',
    unitKey: 'onboarding.questionnaire.units.kg',
    min: 30,
    max: 200,
    defaultValue: 65,
  },
  {
    id: 'pace',
    type: 'single',
    titleKey: 'onboarding.questionnaire.pace.title',
    options: [
      { id: 'progressive', label: 'Progressif', labelKey: 'onboarding.questionnaire.pace.options.progressive' },
      { id: 'moderate', label: 'Modéré', labelKey: 'onboarding.questionnaire.pace.options.moderate' },
      { id: 'fast', label: 'Rapide', labelKey: 'onboarding.questionnaire.pace.options.fast' },
    ],
  },
  {
    id: 'activity_level',
    type: 'single',
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
    type: 'single',
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
    type: 'single',
    titleKey: 'onboarding.questionnaire.trainingLocation.title',
    options: [
      { id: 'gym', label: 'Salle', labelKey: 'onboarding.questionnaire.trainingLocation.options.gym' },
      { id: 'home', label: 'Maison', labelKey: 'onboarding.questionnaire.trainingLocation.options.home' },
      { id: 'both', label: 'Les deux', labelKey: 'onboarding.questionnaire.trainingLocation.options.both' },
    ],
  },
  {
    id: 'diet_quality',
    type: 'single',
    titleKey: 'onboarding.questionnaire.dietQuality.title',
    options: [
      { id: 'messy', label: 'Désordonnée', labelKey: 'onboarding.questionnaire.dietQuality.options.messy' },
      { id: 'okay', label: 'Correcte', labelKey: 'onboarding.questionnaire.dietQuality.options.okay' },
      { id: 'healthy', label: 'Plutôt saine', labelKey: 'onboarding.questionnaire.dietQuality.options.healthy' },
      { id: 'structured', label: 'Très structurée', labelKey: 'onboarding.questionnaire.dietQuality.options.structured' },
    ],
  },
  {
    id: 'sleep_hours',
    type: 'single',
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
    type: 'single',
    titleKey: 'onboarding.questionnaire.blocker.title',
    options: [
      { id: 'motivation', label: 'Manque de motivation', labelKey: 'onboarding.questionnaire.blocker.options.motivation' },
      { id: 'time', label: 'Manque de temps', labelKey: 'onboarding.questionnaire.blocker.options.time' },
      { id: 'direction', label: 'Je ne sais pas quoi faire', labelKey: 'onboarding.questionnaire.blocker.options.direction' },
      { id: 'consistency', label: "Je n'ai pas tenu", labelKey: 'onboarding.questionnaire.blocker.options.consistency' },
    ],
  },
  {
    id: 'dietary_restrictions',
    type: 'multiple',
    titleKey: 'onboarding.questionnaire.dietaryRestrictions.title',
    options: [
      { id: 'none', label: 'Aucune', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.none', exclusive: true },
      { id: 'vegetarian', label: 'Végétarien', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.vegetarian' },
      { id: 'vegan', label: 'Végan', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.vegan' },
      { id: 'gluten_free', label: 'Sans gluten', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.glutenFree' },
      { id: 'lactose_free', label: 'Sans lactose', labelKey: 'onboarding.questionnaire.dietaryRestrictions.options.lactoseFree' },
    ],
  },
  {
    id: 'commitment_level',
    type: 'single',
    titleKey: 'onboarding.questionnaire.commitmentLevel.title',
    options: [
      { id: 'testing', label: 'Je teste', labelKey: 'onboarding.questionnaire.commitmentLevel.options.testing' },
      { id: 'motivated', label: 'Je suis motivé', labelKey: 'onboarding.questionnaire.commitmentLevel.options.motivated' },
      { id: 'determined', label: 'Je suis déterminé à changer', labelKey: 'onboarding.questionnaire.commitmentLevel.options.determined' },
    ],
  },
];

/**
 * Looks up the raw French label for a given question/option id pair — this is the value
 * that gets persisted to Supabase (see `QuestionOption.label` above). Never use this for display.
 */
export function getOptionLabel(questionId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question || question.type === 'numeric') return undefined;
  return question.options.find((o) => o.id === optionId)?.label;
}

/** Looks up the i18n key for the translated, display-only label of a given question/option id pair. */
export function getOptionLabelKey(questionId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question || question.type === 'numeric') return undefined;
  return question.options.find((o) => o.id === optionId)?.labelKey;
}
