import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import de from '../locales/de';
import en from '../locales/en';
import es from '../locales/es';
import fr from '../locales/fr';
import it from '../locales/it';
import pt from '../locales/pt';

export const SUPPORTED_LOCALES = ['fr', 'en', 'es', 'de', 'it', 'pt'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** AsyncStorage key for a language picked before signup (welcome screen) — read by both
 * `LocaleContext` (to apply it immediately, pre-auth) and `useSettings` (to seed a brand-new
 * account's `user_settings` row with it instead of silently dropping the explicit choice). */
export const PENDING_LOCALE_STORAGE_KEY = 'glowup:pending-locale';

export type LanguageOption = { id: Locale; flag: string; label: string };

/** Each language names itself, in its own language — used by the Préférences language picker. */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'fr', flag: '🇫🇷', label: 'Français' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'es', flag: '🇪🇸', label: 'Español' },
  { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { id: 'it', flag: '🇮🇹', label: 'Italiano' },
  { id: 'pt', flag: '🇵🇹', label: 'Português' },
];

export const i18n = new I18n({ fr, en, es, de, it, pt });
i18n.defaultLocale = 'fr';
i18n.locale = 'fr';
i18n.enableFallback = true;

function isSupportedLocale(code: string): code is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

/** The device's language if we support it, else French — used for a brand-new account's default and as the fallback before `user_settings.langue` has loaded. */
export function detectSupportedLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? '';
  return isSupportedLocale(code) ? code : 'fr';
}

/** `user_settings.langue` may hold a legacy display word ("Français", from before this feature) instead of a locale code — treat anything unrecognized as "not set" rather than crashing or showing raw keys. */
export function resolveStoredLocale(stored: string): Locale {
  return isSupportedLocale(stored) ? stored : detectSupportedLocale();
}

/** Full language name for a locale, in French — used to tell the AI which language to answer in (the system prompts are authored in French; the model just needs an unambiguous language name). */
export const LOCALE_NAME_FR: Record<Locale, string> = {
  fr: 'français',
  en: 'anglais',
  es: 'espagnol',
  de: 'allemand',
  it: 'italien',
  pt: 'portugais',
};
