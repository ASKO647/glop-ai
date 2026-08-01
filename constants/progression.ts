export type PeriodId = '7' | '30' | '90';

export type PeriodOption = { id: PeriodId; label: string; days: number };

export const PERIOD_OPTIONS: PeriodOption[] = [
  { id: '7', label: '7j', days: 7 },
  { id: '30', label: '30j', days: 30 },
  { id: '90', label: '90j', days: 90 },
];

export function formatWeight(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** "−2,4 kg" / "+1,2 kg" / "0,0 kg" — real minus sign, not a hyphen. */
export function formatSignedWeight(diff: number): string {
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return `${sign}${formatWeight(Math.abs(diff))} kg`;
}

export type WeightTrend = {
  diff: number;
  direction: 'up' | 'down' | 'flat';
  /** Whether this direction is desirable given the user's goal — muscle-gain goals invert the usual "down is good" reading. */
  isGood: boolean;
};

export function computeWeightTrend(current: number, reference: number, objectif: string | null): WeightTrend {
  const diff = current - reference;
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  const gainIsGoal = objectif === 'Prise de muscle';
  const isGood = direction === 'flat' ? true : gainIsGoal ? direction === 'up' : direction === 'down';
  return { diff, direction, isGood };
}

/** Single-tap step for the weight-entry stepper. */
export const WEIGHT_STEP = 0.1;

/** Quick-adjustment shortcut pills shown under the stepper. */
export const QUICK_ADJUSTMENTS = [-1, -0.5, 0.5, 1];

/** % of the distance from `start` to `target` already covered, clamped to [0, 100]. Direction-agnostic (works for weight loss or gain goals). */
export function computeProgressPercent(start: number, current: number, target: number): number {
  const total = target - start;
  if (total === 0) return 100;
  const progress = ((current - start) / total) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
