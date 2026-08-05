import type { Locale } from '../context/LocaleContext';
import { formatDecimal } from '../lib/format';
import type { Colors } from './theme';

export type BmiCategoryId = 'insuffisance' | 'normal' | 'surpoids' | 'obesite';

export type BmiCategoryInfo = {
  id: BmiCategoryId;
  label: string;
  rangeLabel: string;
  /** Short, non-judgmental line shown right under the classification bar. */
  explanation: string;
  /** Longer paragraph shown in the explanatory modal. */
  detail: string;
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const BMI_THRESHOLDS = { underweight: 18.5, overweight: 25, obese: 30 } as const;

// Visual domain for the classification bar. "Obésité" has no real upper bound, so it's capped
// here purely to give the bar a finite width — a BMI above this still classifies as "obésité",
// it's just visually pinned to the right edge instead of pushing the bar off-screen.
export const BMI_DOMAIN_MIN = 15;
export const BMI_DOMAIN_MAX = 40;

export function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function formatBmi(bmi: number, locale: Locale = 'fr'): string {
  return formatDecimal(bmi, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Structural order only (ids are internal, never displayed) — used for color/segment-width
// lookups that don't need translated text. Same order as the categories below.
export const BMI_CATEGORY_IDS: BmiCategoryId[] = ['insuffisance', 'normal', 'surpoids', 'obesite'];

/** Builds the fully localized category list — label/rangeLabel/explanation/detail all come from `t`, `id` stays the fixed internal slug. */
export function getBmiCategories(t: TranslateFn): BmiCategoryInfo[] {
  return BMI_CATEGORY_IDS.map((id) => ({
    id,
    label: t(`progression.bmi.categories.${id}.label`),
    rangeLabel: t(`progression.bmi.categories.${id}.rangeLabel`),
    explanation: t(`progression.bmi.categories.${id}.explanation`),
    detail: t(`progression.bmi.categories.${id}.detail`),
  }));
}

export function getBmiCategory(bmi: number, t: TranslateFn): BmiCategoryInfo {
  const categories = getBmiCategories(t);
  if (bmi < BMI_THRESHOLDS.underweight) return categories[0];
  if (bmi < BMI_THRESHOLDS.overweight) return categories[1];
  if (bmi < BMI_THRESHOLDS.obese) return categories[2];
  return categories[3];
}

// Segment widths (%), proportional to each category's share of [BMI_DOMAIN_MIN, BMI_DOMAIN_MAX] —
// same order as BMI_CATEGORY_IDS.
export const BMI_SEGMENT_WIDTHS_PERCENT: number[] = (() => {
  const bounds = [
    BMI_DOMAIN_MIN,
    BMI_THRESHOLDS.underweight,
    BMI_THRESHOLDS.overweight,
    BMI_THRESHOLDS.obese,
    BMI_DOMAIN_MAX,
  ];
  const total = BMI_DOMAIN_MAX - BMI_DOMAIN_MIN;
  const widths: number[] = [];
  for (let i = 0; i < 4; i++) widths.push(((bounds[i + 1] - bounds[i]) / total) * 100);
  return widths;
})();

/** 0-100 position for the cursor/marker, clamped to the visual domain. */
export function bmiToPercent(bmi: number): number {
  const clamped = Math.min(BMI_DOMAIN_MAX, Math.max(BMI_DOMAIN_MIN, bmi));
  return ((clamped - BMI_DOMAIN_MIN) / (BMI_DOMAIN_MAX - BMI_DOMAIN_MIN)) * 100;
}

/** Same 0-100 scale, for placing the boundary labels (18,5 / 25 / 30) under the bar. */
export function bmiThresholdToPercent(value: number): number {
  return ((value - BMI_DOMAIN_MIN) / (BMI_DOMAIN_MAX - BMI_DOMAIN_MIN)) * 100;
}

// Dedicated, deliberately muted palette for the classification bar — distinct from
// colors.warning/colors.danger, which are tuned to read as urgent alerts elsewhere in the
// app. A BMI reading shouldn't look alarming, so these stay soft regardless of category.
type BmiPalette = Record<Exclude<BmiCategoryId, 'normal'>, string>;

const BMI_COLORS_DARK: BmiPalette = {
  insuffisance: '#8fb8d9',
  surpoids: '#d9a26b',
  obesite: '#c97b7b',
};

const BMI_COLORS_LIGHT: BmiPalette = {
  insuffisance: '#5f87a8',
  surpoids: '#a8783f',
  obesite: '#a24c4c',
};

/** "normal" always mirrors the app's own accent — every other category picks from a fixed, muted pair. */
export function bmiCategoryColor(colors: Colors, resolvedScheme: 'dark' | 'light', id: BmiCategoryId): string {
  if (id === 'normal') return colors.accent;
  const palette = resolvedScheme === 'light' ? BMI_COLORS_LIGHT : BMI_COLORS_DARK;
  return palette[id];
}
