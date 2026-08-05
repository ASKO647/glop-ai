import { createContext, useContext, type ReactNode } from 'react';
import { i18n, resolveStoredLocale, type Locale } from '../lib/i18n';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from './AuthContext';

export type { Locale };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  /** Delegates to the shared i18n-js instance, already set to `locale` above. */
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings, update } = useSettings(user?.id);

  // `settings.langue` defaults to 'fr' before a settings row has loaded (see useSettings.ts) —
  // resolveStoredLocale falls back to the detected device locale for that pre-load window and
  // for legacy rows that still hold a display word ("Français") instead of a locale code.
  const locale = resolveStoredLocale(settings.langue);
  i18n.locale = locale;

  const setLocale = async (next: Locale) => {
    await update({ langue: next });
  };

  const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);

  const value: LocaleContextValue = { locale, setLocale, t };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
