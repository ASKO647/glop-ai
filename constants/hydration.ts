export const WATER_GLASS_ML = 250;
export const WATER_GOAL_MIN_ML = 1000;
export const WATER_GOAL_MAX_ML = 5000;
export const WATER_GOAL_STEP_ML = 250;
export const DEFAULT_WATER_GOAL_ML = 2000;

/** How many 250ml glasses make up a given goal — always at least 1. */
export function computeGlassCount(goalMl: number): number {
  return Math.max(1, Math.round(goalMl / WATER_GLASS_ML));
}

/** "1,2" / "2" — French decimal comma, trimmed to a whole number when there's no fraction. */
export function formatLiters(ml: number): string {
  const liters = Math.round(ml / 100) / 10;
  return liters.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Date#getDay(): 0=Sunday..6=Saturday

export function weekdayLetter(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return WEEKDAY_LETTERS[date.getDay()];
}
