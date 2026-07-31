import type { Profile } from '../context/ProfileContext';

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

/**
 * There's no first-name field on `profiles` yet, so the greeting derives a
 * display name from the email's local part (e.g. "arnold.35@x.com" -> "Arnold").
 */
export function getDisplayName(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0];
  const match = local.match(/^[a-zA-Z]+/);
  const name = match ? match[0] : local;
  if (!name) return null;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

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

/** The current Monday-to-Sunday week, each day tagged relative to today. */
export function getCurrentWeekDays(): WeekDayInfo[] {
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
      label: WEEKDAY_LABELS[i],
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

function formatLiters(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Per-tap increment for each mission, in the same unit as its target. */
export const MISSION_INCREMENT: Record<MissionKey, number> = {
  water: 0.5,
  steps: 1000,
  workout: 1,
  skincare: 1,
};

export function getDefaultMissionTemplates(profile: Profile | null): MissionTemplate[] {
  const stepsTarget = STEPS_TARGET_BY_FREQUENCY[profile?.frequence_entrainement ?? ''] ?? DEFAULT_STEPS_TARGET;
  const waterTarget = WATER_TARGET_BY_GOAL[profile?.objectif ?? ''] ?? DEFAULT_WATER_TARGET;

  return [
    { key: 'water', label: `Boire ${formatLiters(waterTarget)}L d'eau`, target: waterTarget },
    { key: 'steps', label: `${stepsTarget.toLocaleString('fr-FR')} pas`, target: stepsTarget },
    { key: 'workout', label: 'Séance du jour', target: 1 },
    { key: 'skincare', label: 'Routine skincare', target: 1 },
  ];
}

export const MISSION_ORDER: MissionKey[] = ['water', 'steps', 'workout', 'skincare'];

export function formatMissionValue(key: MissionKey, value: number): string {
  if (key === 'steps') return value.toLocaleString('fr-FR');
  if (key === 'water') return formatLiters(value);
  return String(value);
}

// ---------------------------------------------------------------------------
// Calories & macros
// ---------------------------------------------------------------------------

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  Sédentaire: 1.2,
  Léger: 1.375,
  Modéré: 1.55,
  'Très actif': 1.725,
};
const DEFAULT_ACTIVITY_MULTIPLIER = 1.4;

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

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = profile?.sexe === 'Homme' ? base + 5 : profile?.sexe === 'Femme' ? base - 161 : base - 78;

  const multiplier = ACTIVITY_MULTIPLIER[profile?.niveau_activite ?? ''] ?? DEFAULT_ACTIVITY_MULTIPLIER;
  const tdee = bmr * multiplier;

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

export const WORKOUT_CATEGORIES: { id: WorkoutCategoryId; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'full_body', label: 'Full body' },
  { id: 'upper', label: 'Haut du corps' },
  { id: 'lower', label: 'Bas du corps' },
  { id: 'cardio', label: 'Cardio' },
];

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
};

export type WorkoutSession = {
  id: string;
  title: string;
  muscles: string;
  duration: number;
  kcal: number;
  category: Exclude<WorkoutCategoryId, 'all'>;
  exercises: WorkoutExercise[];
};

export const WORKOUT_SESSIONS: WorkoutSession[] = [
  {
    id: 'full-body-express',
    title: 'Full Body Express',
    muscles: 'Jambes, dos, épaules',
    duration: 30,
    kcal: 280,
    category: 'full_body',
    exercises: [
      { name: 'Squats', sets: 3, reps: '15' },
      { name: 'Rowing haltères', sets: 3, reps: '12' },
      { name: 'Développé épaules', sets: 3, reps: '12' },
      { name: 'Gainage', sets: 3, reps: '40s' },
    ],
  },
  {
    id: 'push-power',
    title: 'Push Power',
    muscles: 'Pectoraux, épaules, triceps',
    duration: 40,
    kcal: 320,
    category: 'upper',
    exercises: [
      { name: 'Développé couché', sets: 4, reps: '10' },
      { name: 'Développé incliné haltères', sets: 3, reps: '12' },
      { name: 'Élévations latérales', sets: 3, reps: '15' },
      { name: 'Extensions triceps', sets: 3, reps: '12' },
    ],
  },
  {
    id: 'pull-strength',
    title: 'Pull Strength',
    muscles: 'Dos, biceps',
    duration: 35,
    kcal: 260,
    category: 'upper',
    exercises: [
      { name: 'Tractions', sets: 4, reps: '8' },
      { name: 'Rowing barre', sets: 3, reps: '10' },
      { name: 'Tirage vertical', sets: 3, reps: '12' },
      { name: 'Curl biceps', sets: 3, reps: '12' },
    ],
  },
  {
    id: 'leg-day',
    title: 'Leg Day',
    muscles: 'Quadriceps, ischios, fessiers',
    duration: 45,
    kcal: 380,
    category: 'lower',
    exercises: [
      { name: 'Squats barre', sets: 4, reps: '10' },
      { name: 'Fentes marchées', sets: 3, reps: '12' },
      { name: 'Soulevé de terre jambes tendues', sets: 3, reps: '10' },
      { name: 'Mollets debout', sets: 4, reps: '15' },
    ],
  },
  {
    id: 'glutes-core',
    title: 'Glutes & Core',
    muscles: 'Fessiers, abdominaux',
    duration: 25,
    kcal: 220,
    category: 'lower',
    exercises: [
      { name: 'Hip thrust', sets: 4, reps: '15' },
      { name: 'Fentes bulgares', sets: 3, reps: '12' },
      { name: 'Crunchs', sets: 3, reps: '20' },
      { name: 'Relevé de jambes', sets: 3, reps: '15' },
    ],
  },
  {
    id: 'hiit-cardio',
    title: 'HIIT Cardio',
    muscles: 'Corps entier, cardio',
    duration: 20,
    kcal: 300,
    category: 'cardio',
    exercises: [
      { name: 'Jumping jacks', sets: 4, reps: '40s' },
      { name: 'Burpees', sets: 4, reps: '30s' },
      { name: 'Mountain climbers', sets: 4, reps: '40s' },
      { name: 'Squat jumps', sets: 4, reps: '30s' },
    ],
  },
  {
    id: 'fat-burn-circuit',
    title: 'Fat Burn Circuit',
    muscles: 'Corps entier, cardio',
    duration: 30,
    kcal: 340,
    category: 'cardio',
    exercises: [
      { name: 'Corde à sauter', sets: 5, reps: '60s' },
      { name: 'Squats sautés', sets: 4, reps: '15' },
      { name: 'Pompes', sets: 4, reps: '12' },
      { name: 'Gainage dynamique', sets: 3, reps: '45s' },
    ],
  },
  {
    id: 'total-body-strength',
    title: 'Total Body Strength',
    muscles: 'Corps entier',
    duration: 40,
    kcal: 310,
    category: 'full_body',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: '8' },
      { name: 'Pompes', sets: 3, reps: '15' },
      { name: 'Fentes', sets: 3, reps: '12' },
      { name: 'Tirage horizontal', sets: 3, reps: '12' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Tip of the day
// ---------------------------------------------------------------------------

type Tip = {
  text: string;
  goals?: string[];
};

const TIPS: Tip[] = [
  { text: "Bois un grand verre d'eau dès le réveil pour relancer ton métabolisme." },
  { text: 'Prépare tes repas de la semaine à l’avance pour éviter les écarts de dernière minute.' },
  { text: "Le sommeil compte autant que l'entraînement : vise 7 à 8h par nuit." },
  { text: 'Ajoute 5 minutes de marche après chaque repas pour améliorer la digestion.' },
  { text: 'Étire-toi 5 minutes après chaque séance pour accélérer la récupération.' },
  { text: 'La régularité bat toujours l’intensité : une petite séance vaut mieux que rien.' },
  { text: "Note ce que tu manges aujourd'hui, même approximativement — la conscience change tout." },
  {
    text: 'Augmente progressivement les charges dès que tu termines tes séries sans difficulté.',
    goals: ['Prise de muscle'],
  },
  {
    text: "Vise 1,6 à 2g de protéines par kilo de poids de corps pour soutenir la prise de muscle.",
    goals: ['Prise de muscle'],
  },
  {
    text: 'Un léger déficit calorique suffit — pas besoin de te priver pour progresser.',
    goals: ['Perte de poids'],
  },
  {
    text: 'Privilégie les protéines et les fibres à chaque repas pour tenir plus facilement ton déficit.',
    goals: ['Perte de poids'],
  },
  {
    text: 'La cohérence sur 90 jours compte plus que la perfection sur une semaine.',
    goals: ['Être plus discipliné'],
  },
  {
    text: 'Prépare tes affaires de sport la veille pour supprimer les excuses du matin.',
    goals: ['Être plus discipliné'],
  },
  {
    text: 'Une routine skincare simple et régulière bat une routine compliquée abandonnée après 3 jours.',
    goals: ['Glow up & esthétique'],
  },
  { text: 'Le soleil et le sommeil font autant pour ta peau que n’importe quel soin.', goals: ['Glow up & esthétique'] },
  { text: 'Bouge un minimum 30 minutes par jour, même en dehors de tes séances.' },
  { text: 'Limite les écrans 30 minutes avant de dormir pour améliorer la qualité de ton sommeil.' },
  { text: 'Un échauffement de 5 minutes réduit nettement le risque de blessure.' },
  { text: 'Fixe-toi un seul objectif à la fois : la régularité vient de la simplicité.' },
  { text: 'Célèbre les petites victoires — elles construisent la motivation à long terme.' },
  { text: 'Respire profondément 1 minute avant chaque repas pour mieux écouter ta faim.' },
];

export function getTipOfTheDay(objectif: string | null): string {
  const relevant = objectif ? TIPS.filter((t) => t.goals?.includes(objectif)) : [];
  const pool = relevant.length > 0 ? relevant : TIPS;
  const dayOfYear = getDayOfYear(new Date());
  return pool[dayOfYear % pool.length].text;
}
