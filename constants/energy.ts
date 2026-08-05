// Mifflin-St Jeor BMR + activity-level multiplier — the same formula `computeCalorieTarget`
// (constants/dashboard.ts) builds its goal-adjusted calorie target from, factored out here so the
// Progression screen's "Dépenses énergétiques" card can show the raw BMR/TDEE (before any
// goal-based adjustment) without duplicating the formula.

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sédentaire: 1.2,
  Léger: 1.375,
  Modéré: 1.55,
  'Très actif': 1.725,
};

export const DEFAULT_ACTIVITY_MULTIPLIER = 1.4;

/** Basal metabolic rate (kcal/day) — Mifflin-St Jeor. */
export function computeBmr(poidsKg: number, tailleCm: number, age: number, sexe: string | null): number {
  const base = 10 * poidsKg + 6.25 * tailleCm - 5 * age;
  return sexe === 'Homme' ? base + 5 : sexe === 'Femme' ? base - 161 : base - 78;
}

/** Total daily energy expenditure (kcal/day) — BMR scaled by activity level. */
export function computeTdee(bmr: number, niveauActivite: string | null): number {
  const multiplier = ACTIVITY_MULTIPLIERS[niveauActivite ?? ''] ?? DEFAULT_ACTIVITY_MULTIPLIER;
  return bmr * multiplier;
}
