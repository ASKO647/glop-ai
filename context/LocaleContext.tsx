import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import { PENDING_LOCALE_STORAGE_KEY, detectSupportedLocale, i18n, resolveStoredLocale, type Locale } from '../lib/i18n';
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
  // Pre-auth (onboarding), there's no `user_settings` row yet to read/write — the welcome
  // screen's language picker persists its choice locally instead, so it takes effect
  // immediately and survives the rest of onboarding (and an app restart before signup).
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (user) return;
    let cancelled = false;
    AsyncStorage.getItem(PENDING_LOCALE_STORAGE_KEY).then((stored) => {
      if (!cancelled && stored) setPendingLocale(resolveStoredLocale(stored));
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // `settings.langue` defaults to 'fr' before a settings row has loaded (see useSettings.ts) —
  // resolveStoredLocale falls back to the detected device locale for that pre-load window and
  // for legacy rows that still hold a display word ("Français") instead of a locale code.
  const locale = user ? resolveStoredLocale(settings.langue) : (pendingLocale ?? detectSupportedLocale());
  i18n.locale = locale;

  const setLocale = async (next: Locale) => {
    if (!user) {
      setPendingLocale(next);
      await AsyncStorage.setItem(PENDING_LOCALE_STORAGE_KEY, next);
      return;
    }
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
