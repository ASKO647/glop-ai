import type { Locale } from '../lib/i18n';
import { formatDecimal } from '../lib/format';

export const WATER_GLASS_ML = 250;
export const WATER_GOAL_MIN_ML = 1000;
export const WATER_GOAL_MAX_ML = 5000;
export const WATER_GOAL_STEP_ML = 250;
export const DEFAULT_WATER_GOAL_ML = 2000;

const HYDRATION_ML_PER_KG = 35;
const HYDRATION_BONUS_VERY_ACTIVE_ML = 500;
const HYDRATION_BONUS_MODERATE_ML = 250;

/**
 * 35ml per kg of body weight, +500ml if activity level is "Très actif", +250ml if "Modéré",
 * rounded up to the next 250ml — only used to seed a brand-new user's hydration goal on their
 * first visit; the user can always change it manually afterward via the water goal modal.
 */
export function computeHydrationGoal(poidsKg: number | null | undefined, niveauActivite: string | null | undefined): number {
  if (!poidsKg) return DEFAULT_WATER_GOAL_ML;
  let goalMl = poidsKg * HYDRATION_ML_PER_KG;
  if (niveauActivite === 'Très actif') goalMl += HYDRATION_BONUS_VERY_ACTIVE_ML;
  else if (niveauActivite === 'Modéré') goalMl += HYDRATION_BONUS_MODERATE_ML;
  return Math.ceil(goalMl / WATER_GOAL_STEP_ML) * WATER_GOAL_STEP_ML;
}

/** How many 250ml glasses make up a given goal — always at least 1. */
export function computeGlassCount(goalMl: number): number {
  return Math.max(1, Math.round(goalMl / WATER_GLASS_ML));
}

/**
 * "1,2" / "2" — locale-aware decimal, trimmed to a whole number when there's no fraction.
 * `locale` is optional (defaulting to French) so call sites outside the dashboard domain that
 * haven't been threaded with a locale yet keep working unchanged.
 */
export function formatLiters(ml: number, locale?: Locale): string {
  const liters = Math.round(ml / 100) / 10;
  return formatDecimal(liters, locale ?? 'fr', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Date#getDay(): 0=Sunday..6=Saturday

export function weekdayLetter(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return WEEKDAY_LETTERS[date.getDay()];
}
