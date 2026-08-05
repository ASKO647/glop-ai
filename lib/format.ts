import type { Locale } from './i18n';
import type { WeightUnit } from '../hooks/useSettings';

/** BCP 47 tag Intl needs for each app locale — the app locale codes are bare language codes. */
const INTL_LOCALE: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
};

function tag(locale: Locale): string {
  return INTL_LOCALE[locale];
}

/** Generic `Intl.DateTimeFormat` wrapper — pass any `options` (weekday/day/month/year, etc). */
export function formatDate(date: Date, locale: Locale, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(tag(locale), options).format(date);
}

/** "Wednesday 5 August" — dashboard header, day-of-week screens. */
export function formatLongDate(date: Date, locale: Locale): string {
  return formatDate(date, locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "5 August 2026" — dates with a year (subscription renewal, journal entries). */
export function formatFullDate(date: Date, locale: Locale): string {
  return formatDate(date, locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "5 Aug" — compact axis labels (weight chart). */
export function formatShortDate(date: Date, locale: Locale): string {
  return formatDate(date, locale, { day: 'numeric', month: 'short' });
}

/** Decimal number, comma or period per locale (e.g. weight, BMI, water liters). */
export function formatDecimal(
  value: number,
  locale: Locale,
  { minimumFractionDigits = 1, maximumFractionDigits = 1 }: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {},
): string {
  return new Intl.NumberFormat(tag(locale), { minimumFractionDigits, maximumFractionDigits }).format(value);
}

/** Integer with locale thousands separator (e.g. step counts). */
export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(tag(locale), { maximumFractionDigits: 0 }).format(value);
}

/** Weight value + unit, e.g. "72,4 kg" (fr) vs "72.4 kg" (en) — unit abbreviations are locale-invariant. */
export function formatWeight(value: number, unit: WeightUnit, locale: Locale): string {
  return `${formatDecimal(value, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}`;
}
