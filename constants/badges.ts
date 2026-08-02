import {
  Camera,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Target,
  Trophy,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

export type BadgeKey =
  | 'premier_pas'
  | 'regularite'
  | 'discipline'
  | 'nutritionniste'
  | 'transformation'
  | 'objectif_atteint'
  | 'marathonien'
  | 'fidele';

/** Everything a badge's `isUnlocked` needs, assembled once per evaluation by `useBadges`. */
export type BadgeContext = {
  missionsCompletedCount: number;
  /** Consecutive days with at least one completed mission — looser than the dashboard's "all missions" streak. */
  streak: number;
  mealsScannedCount: number;
  /** 0-3 — one of the 3 fixed progress-photo slots filled counts as 1. */
  progressPhotosCount: number;
  weightGoalReached: boolean;
  /** Days where the `workout` mission was completed — the closest available proxy for "sessions finished". */
  workoutSessionsCount: number;
  daysSinceSignup: number;
};

export type BadgeDefinition = {
  key: BadgeKey;
  name: string;
  description: string;
  Icon: LucideIcon;
  isUnlocked: (ctx: BadgeContext) => boolean;
};

export const BADGES: BadgeDefinition[] = [
  {
    key: 'premier_pas',
    name: 'Premier pas',
    description: 'Complète ta première mission du jour.',
    Icon: Footprints,
    isUnlocked: (ctx) => ctx.missionsCompletedCount >= 1,
  },
  {
    key: 'regularite',
    name: 'Régularité',
    description: '7 jours d’affilée avec au moins une mission complétée.',
    Icon: Flame,
    isUnlocked: (ctx) => ctx.streak >= 7,
  },
  {
    key: 'discipline',
    name: 'Discipline',
    description: '30 jours d’affilée avec au moins une mission complétée.',
    Icon: Trophy,
    isUnlocked: (ctx) => ctx.streak >= 30,
  },
  {
    key: 'nutritionniste',
    name: 'Nutritionniste',
    description: 'Scanne 20 repas.',
    Icon: Utensils,
    isUnlocked: (ctx) => ctx.mealsScannedCount >= 20,
  },
  {
    key: 'transformation',
    name: 'Transformation',
    description: 'Enregistre tes 3 photos de progression.',
    Icon: Camera,
    isUnlocked: (ctx) => ctx.progressPhotosCount >= 3,
  },
  {
    key: 'objectif_atteint',
    name: 'Objectif atteint',
    description: 'Atteins ton poids cible.',
    Icon: Target,
    isUnlocked: (ctx) => ctx.weightGoalReached,
  },
  {
    key: 'marathonien',
    name: 'Marathonien',
    description: 'Termine 10 séances d’entraînement.',
    Icon: Dumbbell,
    isUnlocked: (ctx) => ctx.workoutSessionsCount >= 10,
  },
  {
    key: 'fidele',
    name: 'Fidèle',
    description: '90 jours depuis ton inscription.',
    Icon: Heart,
    isUnlocked: (ctx) => ctx.daysSinceSignup >= 90,
  },
];
