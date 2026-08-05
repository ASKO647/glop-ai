import type { Locale } from '../context/LocaleContext';
import { formatDecimal, formatLongDate } from '../lib/format';
import { isoDaysAgo, toISODate } from './dashboard';

export type PeriodId = '3' | '7' | '14' | '30' | '90';

export type PeriodOption = { id: PeriodId; label: string; days: number };

export const PERIOD_OPTIONS: PeriodOption[] = [
  { id: '3', label: '3j', days: 3 },
  { id: '7', label: '7j', days: 7 },
  { id: '14', label: '14j', days: 14 },
  { id: '30', label: '30j', days: 30 },
  { id: '90', label: '90j', days: 90 },
];

// `locale` defaults to 'fr' so callers that haven't been threaded through yet (outside the
// progression/recipes domains) keep compiling and rendering exactly as before.
export function formatWeight(value: number, locale: Locale = 'fr'): string {
  return formatDecimal(value, locale);
}

/** "−2,4 kg" / "+1,2 kg" / "0,0 kg" — real minus sign, not a hyphen. */
export function formatSignedWeight(diff: number, locale: Locale = 'fr'): string {
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  return `${sign}${formatWeight(Math.abs(diff), locale)} kg`;
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

// ---------------------------------------------------------------------------
// Goal ETA estimate
// ---------------------------------------------------------------------------

export type WeightLogLike = { date: string; poids: number };

export type GoalEstimate =
  | { status: 'not-enough-data' }
  | { status: 'no-trend' }
  | { status: 'estimated'; date: string; daysAway: number };

const TREND_WINDOW_DAYS = 14;
const MIN_LOGS_REQUIRED = 3;
// Below this, the trend reads as noise rather than a real direction — not worth extrapolating.
const MIN_SLOPE_KG_PER_DAY = 0.005;

function linearRegressionSlope(points: { x: number; y: number }[]): number {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Linear trend (least squares) over the last 14 days of `logs`, extrapolated to `targetWeight`.
 * Needs at least 3 weigh-ins within that window; a flat trend, or one moving away from the
 * target, can't produce a sane ETA — those return `no-trend` rather than an absurd/backwards date.
 */
export function computeGoalEstimate(logs: WeightLogLike[], targetWeight: number | null): GoalEstimate {
  if (targetWeight == null) return { status: 'not-enough-data' };

  const since = isoDaysAgo(TREND_WINDOW_DAYS - 1);
  const recentLogs = logs.filter((log) => log.date >= since).sort((a, b) => a.date.localeCompare(b.date));
  if (recentLogs.length < MIN_LOGS_REQUIRED) return { status: 'not-enough-data' };

  const firstDate = new Date(`${recentLogs[0].date}T00:00:00`);
  const points = recentLogs.map((log) => ({
    x: Math.round((new Date(`${log.date}T00:00:00`).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)),
    y: log.poids,
  }));
  const slope = linearRegressionSlope(points); // kg/day

  const currentWeight = recentLogs[recentLogs.length - 1].poids;
  const remaining = targetWeight - currentWeight;

  const movingTowardGoal = Math.abs(slope) > MIN_SLOPE_KG_PER_DAY && Math.sign(slope) === Math.sign(remaining);
  if (!movingTowardGoal) return { status: 'no-trend' };

  const daysAway = Math.round(remaining / slope);
  if (daysAway <= 0) return { status: 'no-trend' };

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAway);
  return { status: 'estimated', date: toISODate(targetDate), daysAway };
}

/** "14 novembre 2026" */
export function formatEstimateDate(iso: string, locale: Locale = 'fr'): string {
  const date = new Date(`${iso}T00:00:00`);
  return formatLongDate(date, locale);
}
