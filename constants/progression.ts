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

/** "−2,4 kg depuis le départ" / "+1,2 kg depuis le départ" — real minus sign, not a hyphen. */
export function formatWeightDelta(current: number, start: number): string {
  const diff = current - start;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return `${sign}${formatWeight(Math.abs(diff))} kg depuis le départ`;
}

/** % of the distance from `start` to `target` already covered, clamped to [0, 100]. Direction-agnostic (works for weight loss or gain goals). */
export function computeProgressPercent(start: number, current: number, target: number): number {
  const total = target - start;
  if (total === 0) return 100;
  const progress = ((current - start) / total) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
