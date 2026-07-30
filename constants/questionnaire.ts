export type QuestionOption = {
  id: string;
  label: string;
  /** Selecting this option clears every other selection (e.g. "Aucune"). */
  exclusive?: boolean;
};

type BaseQuestion = {
  id: string;
  question: string;
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
  unit?: string;
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
    question: 'Quel est ton objectif principal ?',
    options: [
      { id: 'weight_loss', label: 'Perte de poids' },
      { id: 'muscle_gain', label: 'Prise de muscle' },
      { id: 'glow_up', label: 'Glow up & esthétique' },
      { id: 'discipline', label: 'Être plus discipliné' },
    ],
  },
  {
    id: 'gender',
    type: 'single',
    question: 'Tu es…',
    options: [
      { id: 'male', label: 'Homme' },
      { id: 'female', label: 'Femme' },
      { id: 'other', label: 'Autre' },
    ],
  },
  {
    id: 'age',
    type: 'numeric',
    question: 'Quel âge as-tu ?',
    unit: 'ans',
    min: 13,
    max: 90,
    defaultValue: 25,
  },
  {
    id: 'height',
    type: 'numeric',
    question: 'Quelle est ta taille ?',
    unit: 'cm',
    min: 120,
    max: 220,
    defaultValue: 170,
  },
  {
    id: 'current_weight',
    type: 'numeric',
    question: 'Quel est ton poids actuel ?',
    unit: 'kg',
    min: 30,
    max: 200,
    defaultValue: 70,
  },
  {
    id: 'target_weight',
    type: 'numeric',
    question: 'Quel est ton poids objectif ?',
    unit: 'kg',
    min: 30,
    max: 200,
    defaultValue: 65,
  },
  {
    id: 'pace',
    type: 'single',
    question: 'Quelle vitesse souhaites-tu ?',
    options: [
      { id: 'progressive', label: 'Progressif' },
      { id: 'moderate', label: 'Modéré' },
      { id: 'fast', label: 'Rapide' },
    ],
  },
  {
    id: 'activity_level',
    type: 'single',
    question: "Quel est ton niveau d'activité ?",
    options: [
      { id: 'sedentary', label: 'Sédentaire' },
      { id: 'light', label: 'Léger' },
      { id: 'moderate', label: 'Modéré' },
      { id: 'very_active', label: 'Très actif' },
    ],
  },
  {
    id: 'workouts_per_week',
    type: 'single',
    question: "Combien d'entraînements par semaine ?",
    options: [
      { id: '1_2', label: '1-2' },
      { id: '3_4', label: '3-4' },
      { id: '5_6', label: '5-6' },
      { id: 'daily', label: 'Tous les jours' },
    ],
  },
  {
    id: 'training_location',
    type: 'single',
    question: "Où t'entraînes-tu ?",
    options: [
      { id: 'gym', label: 'Salle' },
      { id: 'home', label: 'Maison' },
      { id: 'both', label: 'Les deux' },
    ],
  },
  {
    id: 'diet_quality',
    type: 'single',
    question: 'Comment est ton alimentation actuelle ?',
    options: [
      { id: 'messy', label: 'Désordonnée' },
      { id: 'okay', label: 'Correcte' },
      { id: 'healthy', label: 'Plutôt saine' },
      { id: 'structured', label: 'Très structurée' },
    ],
  },
  {
    id: 'sleep_hours',
    type: 'single',
    question: 'Combien d\'heures dors-tu ?',
    options: [
      { id: 'under_5', label: 'Moins de 5' },
      { id: '5_6', label: '5-6' },
      { id: '7_8', label: '7-8' },
      { id: 'over_8', label: 'Plus de 8' },
    ],
  },
  {
    id: 'blocker',
    type: 'single',
    question: "Qu'est-ce qui t'a bloqué jusqu'ici ?",
    options: [
      { id: 'motivation', label: 'Manque de motivation' },
      { id: 'time', label: 'Manque de temps' },
      { id: 'direction', label: 'Je ne sais pas quoi faire' },
      { id: 'consistency', label: "Je n'ai pas tenu" },
    ],
  },
  {
    id: 'dietary_restrictions',
    type: 'multiple',
    question: 'As-tu des restrictions alimentaires ?',
    options: [
      { id: 'none', label: 'Aucune', exclusive: true },
      { id: 'vegetarian', label: 'Végétarien' },
      { id: 'vegan', label: 'Végan' },
      { id: 'gluten_free', label: 'Sans gluten' },
      { id: 'lactose_free', label: 'Sans lactose' },
    ],
  },
  {
    id: 'commitment_level',
    type: 'single',
    question: "Quel est ton niveau d'engagement ?",
    options: [
      { id: 'testing', label: 'Je teste' },
      { id: 'motivated', label: 'Je suis motivé' },
      { id: 'determined', label: 'Je suis déterminé à changer' },
    ],
  },
];
