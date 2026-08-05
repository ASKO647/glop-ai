import { Apple, Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';
import type { Profile } from '../context/ProfileContext';
import { formatDecimal, formatInteger, formatLongDate } from '../lib/format';
import type { Locale } from '../lib/i18n';
import { computeBmr, computeTdee } from './energy';
import { appImage } from './images';

/** Same shape as `useLocale()`'s `t` — declared locally so this non-component module doesn't
 * need to import the (React-only) LocaleContext just for a type. */
type TFunction = (key: string, params?: Record<string, string | number>) => string;

// ---------------------------------------------------------------------------
// Program day count
// ---------------------------------------------------------------------------

const PROGRAM_LENGTH_DAYS = 90;

/** Day N of the 90-day program, derived from the account's creation date. */
export function getProgramDay(createdAt: string | null): number {
  if (!createdAt) return 1;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 1;
  const start = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysElapsed = Math.round((todayMidnight.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(PROGRAM_LENGTH_DAYS, Math.max(1, daysElapsed + 1));
}

export { PROGRAM_LENGTH_DAYS };

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISODate(date);
}

/** `iso` shifted by `days` (negative to go back) — unlike `isoDaysAgo`, works from any date, not just today. */
export function shiftISODate(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/**
 * "mardi 28 juillet" — used mid-sentence (e.g. "Tu consultes le ..."), so not capitalized.
 * `locale` is optional (defaulting to French) so call sites outside the dashboard domain that
 * haven't been threaded with a locale yet keep working unchanged.
 */
export function formatDisplayDate(iso: string, locale?: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  return formatLongDate(date, locale ?? 'fr');
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Consecutive fully-completed days, walking back from today (or yesterday if today isn't done yet). */
export function computeStreak(completionByDate: Record<string, boolean>, today: string): number {
  let streak = 0;
  const cursor = new Date(today);
  if (!completionByDate[today]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const iso = toISODate(cursor);
    if (!completionByDate[iso]) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type WeekDayInfo = {
  date: string;
  label: string;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
};

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAY_INITIAL_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * The current Monday-to-Sunday week, each day tagged relative to today.
 * `t` is optional — when omitted (call sites outside the dashboard domain), falls back to the
 * original hardcoded French single-letter labels so those callers keep working unchanged.
 */
export function getCurrentWeekDays(t?: TFunction): WeekDayInfo[] {
  const today = new Date();
  const todayISO = toISODate(today);
  const mondayOffset = (today.getDay() + 6) % 7; // getDay(): 0=Sunday..6=Saturday
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const iso = toISODate(date);
    return {
      date: iso,
      label: t ? t(`dashboard.weekdayInitials.${WEEKDAY_INITIAL_KEYS[i]}`) : WEEKDAY_LABELS[i],
      isToday: iso === todayISO,
      isFuture: iso > todayISO,
      isPast: iso < todayISO,
    };
  });
}

// ---------------------------------------------------------------------------
// Daily missions
// ---------------------------------------------------------------------------

export type MissionKey = 'water' | 'steps' | 'workout' | 'skincare';

export type MissionTemplate = {
  key: MissionKey;
  label: string;
  target: number;
};

// NOTE: these Record keys are matched against `profile.frequence_entrainement` / `profile.objectif`,
// which are French free-text values stored in Supabase — they must stay exactly as-is, not translated.
const STEPS_TARGET_BY_FREQUENCY: Record<string, number> = {
  '1-2': 6000,
  '3-4': 8000,
  '5-6': 9000,
  'Tous les jours': 10000,
};
const DEFAULT_STEPS_TARGET = 8000;

const WATER_TARGET_BY_GOAL: Record<string, number> = {
  'Perte de poids': 3.5,
  'Prise de muscle': 3.5,
  'Glow up & esthétique': 3,
  'Être plus discipliné': 2.5,
};
const DEFAULT_WATER_TARGET = 3;

/** Per-tap increment for each mission, in the same unit as its target. */
export const MISSION_INCREMENT: Record<MissionKey, number> = {
  water: 0.5,
  steps: 1000,
  workout: 1,
  skincare: 1,
};

/** Translated display label for a mission, given its key and current target — used both to seed
 * a freshly-created mission row's `label` column and to render `MissionCard` (which recomputes
 * from `mission_key`/`target` rather than trusting the possibly-stale/other-locale stored label). */
export function getMissionLabel(key: MissionKey, target: number, t: TFunction, locale: Locale): string {
  switch (key) {
    case 'water':
      return t('dashboard.missions.water', { amount: formatDecimal(target, locale, { maximumFractionDigits: 1 }) });
    case 'steps':
      return t('dashboard.missions.steps', { count: formatInteger(target, locale) });
    case 'workout':
      return t('dashboard.missions.workout');
    case 'skincare':
      return t('dashboard.missions.skincare');
    default:
      return '';
  }
}

export function getDefaultMissionTemplates(profile: Profile | null, t: TFunction, locale: Locale): MissionTemplate[] {
  const stepsTarget = STEPS_TARGET_BY_FREQUENCY[profile?.frequence_entrainement ?? ''] ?? DEFAULT_STEPS_TARGET;
  const waterTarget = WATER_TARGET_BY_GOAL[profile?.objectif ?? ''] ?? DEFAULT_WATER_TARGET;

  return [
    { key: 'water', label: getMissionLabel('water', waterTarget, t, locale), target: waterTarget },
    { key: 'steps', label: getMissionLabel('steps', stepsTarget, t, locale), target: stepsTarget },
    { key: 'workout', label: getMissionLabel('workout', 1, t, locale), target: 1 },
    { key: 'skincare', label: getMissionLabel('skincare', 1, t, locale), target: 1 },
  ];
}

export const MISSION_ORDER: MissionKey[] = ['water', 'steps', 'workout', 'skincare'];

export function formatMissionValue(key: MissionKey, value: number, locale: Locale): string {
  if (key === 'steps') return formatInteger(value, locale);
  if (key === 'water') return formatDecimal(value, locale, { maximumFractionDigits: 1 });
  return String(value);
}

// ---------------------------------------------------------------------------
// Meal journal (petit-déjeuner / déjeuner / dîner / collation)
// ---------------------------------------------------------------------------

export type MealType = 'petit-dejeuner' | 'dejeuner' | 'diner' | 'collation';

export type MealTypeInfo = { id: MealType; labelKey: string; Icon: LucideIcon };

export const MEAL_TYPES: MealTypeInfo[] = [
  { id: 'petit-dejeuner', labelKey: 'dashboard.mealTypes.petitDejeuner', Icon: Sunrise },
  { id: 'dejeuner', labelKey: 'dashboard.mealTypes.dejeuner', Icon: Sun },
  { id: 'diner', labelKey: 'dashboard.mealTypes.diner', Icon: Moon },
  { id: 'collation', labelKey: 'dashboard.mealTypes.collation', Icon: Apple },
];

export function getMealTypeInfo(mealType: MealType): MealTypeInfo {
  return MEAL_TYPES.find((m) => m.id === mealType) ?? MEAL_TYPES[0];
}

/** Best-effort guess of which meal a given hour belongs to, for preselecting the scanner/recipe pill. */
export function guessMealTypeFromHour(hour: number): MealType {
  if (hour < 11) return 'petit-dejeuner';
  if (hour < 15) return 'dejeuner';
  if (hour < 18) return 'collation';
  return 'diner';
}

export function guessMealTypeNow(): MealType {
  return guessMealTypeFromHour(new Date().getHours());
}

export function defaultExpandedMealTypes(): Record<MealType, boolean> {
  return { 'petit-dejeuner': true, dejeuner: true, diner: true, collation: true };
}

// ---------------------------------------------------------------------------
// Calories & macros
// ---------------------------------------------------------------------------

// NOTE: these Record keys are matched against `profile.objectif` / `profile.vitesse`, French
// free-text values stored in Supabase — they must stay exactly as-is, not translated.
const GOAL_CALORIE_ADJUSTMENT: Record<string, Record<string, number>> = {
  'Perte de poids': { Progressif: -300, Modéré: -500, Rapide: -750 },
  'Prise de muscle': { Progressif: 200, Modéré: 350, Rapide: 500 },
  'Glow up & esthétique': { Progressif: -150, Modéré: -200, Rapide: -300 },
  'Être plus discipliné': { Progressif: 0, Modéré: 0, Rapide: 0 },
};

const DEFAULT_CALORIE_TARGET = 2000;

/** Mifflin-St Jeor BMR, scaled by activity level and adjusted for the stated goal/pace. */
export function computeCalorieTarget(profile: Profile | null): number {
  const weight = profile?.poids_actuel;
  const height = profile?.taille;
  const age = profile?.age;

  if (!weight || !height || !age) return DEFAULT_CALORIE_TARGET;

  const bmr = computeBmr(weight, height, age, profile?.sexe ?? null);
  const tdee = computeTdee(bmr, profile?.niveau_activite ?? null);

  const adjustment = GOAL_CALORIE_ADJUSTMENT[profile?.objectif ?? '']?.[profile?.vitesse ?? ''] ?? 0;

  return Math.max(1200, Math.round((tdee + adjustment) / 10) * 10);
}

export type MacroTargets = { proteines: number; glucides: number; lipides: number };

/** 30% protein / 40% carbs / 30% fat split, converted to grams (protein & carbs at 4 kcal/g, fat at 9 kcal/g). */
export function computeMacroTargets(calorieTarget: number): MacroTargets {
  return {
    proteines: Math.round((calorieTarget * 0.3) / 4),
    glucides: Math.round((calorieTarget * 0.4) / 4),
    lipides: Math.round((calorieTarget * 0.3) / 9),
  };
}

// ---------------------------------------------------------------------------
// Workout categories & sessions
// ---------------------------------------------------------------------------

export type WorkoutCategoryId = 'all' | 'full_body' | 'upper' | 'lower' | 'cardio';

export const WORKOUT_CATEGORIES: { id: WorkoutCategoryId; labelKey: string }[] = [
  { id: 'all', labelKey: 'dashboard.workoutCategories.all' },
  { id: 'full_body', labelKey: 'dashboard.workoutCategories.fullBody' },
  { id: 'upper', labelKey: 'dashboard.workoutCategories.upper' },
  { id: 'lower', labelKey: 'dashboard.workoutCategories.lower' },
  { id: 'cardio', labelKey: 'dashboard.workoutCategories.cardio' },
];

export type WorkoutExercise = {
  /** Internal French name — never displayed directly; kept only so `getExerciseThumbnail`'s
   * keyword matching keeps working regardless of the active display locale. Use `nameKey` for UI. */
  name: string;
  nameKey: string;
  sets: number;
  reps: string;
};

/** 'both' = no equipment required (or dumbbells only) — doable at home or in a gym. */
export type WorkoutLocation = 'gym' | 'home' | 'both';

export type WorkoutSession = {
  id: string;
  titleKey: string;
  musclesKey: string;
  duration: number;
  kcal: number;
  category: Exclude<WorkoutCategoryId, 'all'>;
  location: WorkoutLocation;
  exercises: WorkoutExercise[];
};

export const WORKOUT_SESSIONS: WorkoutSession[] = [
  {
    id: 'full-body-express',
    titleKey: 'dashboard.workoutSessions.fullBodyExpress.title',
    musclesKey: 'dashboard.workoutSessions.fullBodyExpress.muscles',
    duration: 30,
    kcal: 280,
    category: 'full_body',
    location: 'both',
    exercises: [
      { name: 'Squats', nameKey: 'dashboard.exercises.squats', sets: 3, reps: '15' },
      { name: 'Rowing haltères', nameKey: 'dashboard.exercises.rowingHalteres', sets: 3, reps: '12' },
      { name: 'Développé épaules', nameKey: 'dashboard.exercises.developpeEpaules', sets: 3, reps: '12' },
      { name: 'Gainage', nameKey: 'dashboard.exercises.gainage', sets: 3, reps: '40s' },
    ],
  },
  {
    id: 'push-power',
    titleKey: 'dashboard.workoutSessions.pushPower.title',
    musclesKey: 'dashboard.workoutSessions.pushPower.muscles',
    duration: 40,
    kcal: 320,
    category: 'upper',
    location: 'gym',
    exercises: [
      { name: 'Développé couché', nameKey: 'dashboard.exercises.developpeCouche', sets: 4, reps: '10' },
      {
        name: 'Développé incliné haltères',
        nameKey: 'dashboard.exercises.developpeInclineHalteres',
        sets: 3,
        reps: '12',
      },
      { name: 'Élévations latérales', nameKey: 'dashboard.exercises.elevationsLaterales', sets: 3, reps: '15' },
      { name: 'Extensions triceps', nameKey: 'dashboard.exercises.extensionsTriceps', sets: 3, reps: '12' },
    ],
  },
  {
    id: 'pull-strength',
    titleKey: 'dashboard.workoutSessions.pullStrength.title',
    musclesKey: 'dashboard.workoutSessions.pullStrength.muscles',
    duration: 35,
    kcal: 260,
    category: 'upper',
    location: 'gym',
    exercises: [
      { name: 'Tractions', nameKey: 'dashboard.exercises.tractions', sets: 4, reps: '8' },
      { name: 'Rowing barre', nameKey: 'dashboard.exercises.rowingBarre', sets: 3, reps: '10' },
      { name: 'Tirage vertical', nameKey: 'dashboard.exercises.tirageVertical', sets: 3, reps: '12' },
      { name: 'Curl biceps', nameKey: 'dashboard.exercises.curlBiceps', sets: 3, reps: '12' },
    ],
  },
  {
    id: 'leg-day',
    titleKey: 'dashboard.workoutSessions.legDay.title',
    musclesKey: 'dashboard.workoutSessions.legDay.muscles',
    duration: 45,
    kcal: 380,
    category: 'lower',
    location: 'gym',
    exercises: [
      { name: 'Squats barre', nameKey: 'dashboard.exercises.squatsBarre', sets: 4, reps: '10' },
      { name: 'Fentes marchées', nameKey: 'dashboard.exercises.fentesMarchees', sets: 3, reps: '12' },
      {
        name: 'Soulevé de terre jambes tendues',
        nameKey: 'dashboard.exercises.souleveDeTerreJambesTendues',
        sets: 3,
        reps: '10',
      },
      { name: 'Mollets debout', nameKey: 'dashboard.exercises.molletsDebout', sets: 4, reps: '15' },
    ],
  },
  {
    id: 'glutes-core',
    titleKey: 'dashboard.workoutSessions.glutesCore.title',
    musclesKey: 'dashboard.workoutSessions.glutesCore.muscles',
    duration: 25,
    kcal: 220,
    category: 'lower',
    location: 'both',
    exercises: [
      { name: 'Hip thrust', nameKey: 'dashboard.exercises.hipThrust', sets: 4, reps: '15' },
      { name: 'Fentes bulgares', nameKey: 'dashboard.exercises.fentesBulgares', sets: 3, reps: '12' },
      { name: 'Crunchs', nameKey: 'dashboard.exercises.crunchs', sets: 3, reps: '20' },
      { name: 'Relevé de jambes', nameKey: 'dashboard.exercises.releveDeJambes', sets: 3, reps: '15' },
    ],
  },
  {
    id: 'hiit-cardio',
    titleKey: 'dashboard.workoutSessions.hiitCardio.title',
    musclesKey: 'dashboard.workoutSessions.hiitCardio.muscles',
    duration: 20,
    kcal: 300,
    category: 'cardio',
    location: 'both',
    exercises: [
      { name: 'Jumping jacks', nameKey: 'dashboard.exercises.jumpingJacks', sets: 4, reps: '40s' },
      { name: 'Burpees', nameKey: 'dashboard.exercises.burpees', sets: 4, reps: '30s' },
      { name: 'Mountain climbers', nameKey: 'dashboard.exercises.mountainClimbers', sets: 4, reps: '40s' },
      { name: 'Squat jumps', nameKey: 'dashboard.exercises.squatJumps', sets: 4, reps: '30s' },
    ],
  },
  {
    id: 'fat-burn-circuit',
    titleKey: 'dashboard.workoutSessions.fatBurnCircuit.title',
    musclesKey: 'dashboard.workoutSessions.fatBurnCircuit.muscles',
    duration: 30,
    kcal: 340,
    category: 'cardio',
    location: 'both',
    exercises: [
      { name: 'Corde à sauter', nameKey: 'dashboard.exercises.cordeASauter', sets: 5, reps: '60s' },
      { name: 'Squats sautés', nameKey: 'dashboard.exercises.squatsSautes', sets: 4, reps: '15' },
      { name: 'Pompes', nameKey: 'dashboard.exercises.pompes', sets: 4, reps: '12' },
      { name: 'Gainage dynamique', nameKey: 'dashboard.exercises.gainageDynamique', sets: 3, reps: '45s' },
    ],
  },
  {
    id: 'total-body-strength',
    titleKey: 'dashboard.workoutSessions.totalBodyStrength.title',
    musclesKey: 'dashboard.workoutSessions.totalBodyStrength.muscles',
    duration: 40,
    kcal: 310,
    category: 'full_body',
    location: 'gym',
    exercises: [
      { name: 'Deadlift', nameKey: 'dashboard.exercises.deadlift', sets: 4, reps: '8' },
      { name: 'Pompes', nameKey: 'dashboard.exercises.pompes', sets: 3, reps: '15' },
      { name: 'Fentes', nameKey: 'dashboard.exercises.fentes', sets: 3, reps: '12' },
      { name: 'Tirage horizontal', nameKey: 'dashboard.exercises.tirageHorizontal', sets: 3, reps: '12' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Today's workout
// ---------------------------------------------------------------------------

// NOTE: these Record keys are matched against `profile.objectif` / `profile.frequence_entrainement`,
// French free-text values stored in Supabase — they must stay exactly as-is, not translated.
const GOAL_CATEGORY: Record<string, (dayOfYear: number) => Exclude<WorkoutCategoryId, 'all'>> = {
  'Perte de poids': () => 'cardio',
  'Prise de muscle': (dayOfYear) => (dayOfYear % 2 === 0 ? 'upper' : 'lower'),
  'Glow up & esthétique': () => 'full_body',
  'Être plus discipliné': () => 'full_body',
};
const DEFAULT_GOAL_CATEGORY: Exclude<WorkoutCategoryId, 'all'> = 'full_body';

/** How many days a picked session stays "today's" session before rotating to the next one. */
const ROTATION_PERIOD_BY_FREQUENCY: Record<string, number> = {
  '1-2': 4,
  '3-4': 2,
  '5-6': 1,
  'Tous les jours': 1,
};
const DEFAULT_ROTATION_PERIOD = 3;

/**
 * Today's recommended session, derived from the profile's goal (muscle group focus),
 * training location (excludes gym-only sessions for "Maison"), and weekly frequency
 * (how often the pick rotates) — deterministic for a given day, like `getTipOfTheDay`.
 */
export function getTodaysWorkout(profile: Profile | null): WorkoutSession {
  const dayOfYear = getDayOfYear(new Date());
  const category = (GOAL_CATEGORY[profile?.objectif ?? ''] ?? (() => DEFAULT_GOAL_CATEGORY))(dayOfYear);
  const homeOnly = profile?.lieu_entrainement === 'Maison';

  let pool = WORKOUT_SESSIONS.filter((s) => s.category === category && (!homeOnly || s.location !== 'gym'));
  if (pool.length === 0) {
    pool = WORKOUT_SESSIONS.filter((s) => !homeOnly || s.location !== 'gym');
  }
  if (pool.length === 0) {
    pool = WORKOUT_SESSIONS;
  }

  const period = ROTATION_PERIOD_BY_FREQUENCY[profile?.frequence_entrainement ?? ''] ?? DEFAULT_ROTATION_PERIOD;
  const index = Math.floor(dayOfYear / period) % pool.length;
  return pool[index];
}

// ---------------------------------------------------------------------------
// Workout thumbnails
// ---------------------------------------------------------------------------

// Only 3 stock photos exist for workouts — "full_body" and "upper" both fall back to the
// dumbbells shot since there's no dedicated asset for either.
const EXERCISE_DUMBBELLS_IMAGE = appImage('exercise-dumbbells.jpg');
const EXERCISE_SQUAT_IMAGE = appImage('exercise-squat.jpg');
const EXERCISE_CARDIO_IMAGE = appImage('exercise-cardio.jpg');

export const WORKOUT_CATEGORY_IMAGES: Record<Exclude<WorkoutCategoryId, 'all'>, ImageSourcePropType> = {
  full_body: EXERCISE_DUMBBELLS_IMAGE,
  upper: EXERCISE_DUMBBELLS_IMAGE,
  lower: EXERCISE_SQUAT_IMAGE,
  cardio: EXERCISE_CARDIO_IMAGE,
};

const LOWER_BODY_KEYWORDS = /squat|fente|soulevé|mollet|hip thrust|jambe/i;
const CARDIO_KEYWORDS = /jumping|burpee|mountain|corde|sauté|dynamique/i;

/**
 * Best-effort classification of a single exercise by name, for its own thumbnail (distinct from
 * the session's overall category image). Takes the internal French `exercise.name` (not the
 * translated `nameKey`) so the classification stays correct regardless of display locale.
 */
export function getExerciseThumbnail(exerciseName: string): ImageSourcePropType {
  if (LOWER_BODY_KEYWORDS.test(exerciseName)) return EXERCISE_SQUAT_IMAGE;
  if (CARDIO_KEYWORDS.test(exerciseName)) return EXERCISE_CARDIO_IMAGE;
  return EXERCISE_DUMBBELLS_IMAGE;
}

// ---------------------------------------------------------------------------
// Tip of the day
// ---------------------------------------------------------------------------

type Tip = {
  textKey: string;
  goals?: string[];
};

// NOTE: `goals` entries are matched against `profile.objectif`, a French free-text value stored
// in Supabase — they must stay exactly as-is, not translated.
const TIPS: Tip[] = [
  { textKey: 'dashboard.tips.tip01' },
  { textKey: 'dashboard.tips.tip02' },
  { textKey: 'dashboard.tips.tip03' },
  { textKey: 'dashboard.tips.tip04' },
  { textKey: 'dashboard.tips.tip05' },
  { textKey: 'dashboard.tips.tip06' },
  { textKey: 'dashboard.tips.tip07' },
  { textKey: 'dashboard.tips.tip08', goals: ['Prise de muscle'] },
  { textKey: 'dashboard.tips.tip09', goals: ['Prise de muscle'] },
  { textKey: 'dashboard.tips.tip10', goals: ['Perte de poids'] },
  { textKey: 'dashboard.tips.tip11', goals: ['Perte de poids'] },
  { textKey: 'dashboard.tips.tip12', goals: ['Être plus discipliné'] },
  { textKey: 'dashboard.tips.tip13', goals: ['Être plus discipliné'] },
  { textKey: 'dashboard.tips.tip14', goals: ['Glow up & esthétique'] },
  { textKey: 'dashboard.tips.tip15', goals: ['Glow up & esthétique'] },
  { textKey: 'dashboard.tips.tip16' },
  { textKey: 'dashboard.tips.tip17' },
  { textKey: 'dashboard.tips.tip18' },
  { textKey: 'dashboard.tips.tip19' },
  { textKey: 'dashboard.tips.tip20' },
  { textKey: 'dashboard.tips.tip21' },
];

/** Returns a translation key (not translated text) — callers translate it with `t()`. */
export function getTipOfTheDay(objectif: string | null): string {
  const relevant = objectif ? TIPS.filter((t) => t.goals?.includes(objectif)) : [];
  const pool = relevant.length > 0 ? relevant : TIPS;
  const dayOfYear = getDayOfYear(new Date());
  return pool[dayOfYear % pool.length].textKey;
}
