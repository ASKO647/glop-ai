import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { computeHydrationGoal } from '../constants/hydration';
import type { Profile } from '../context/ProfileContext';
import { PENDING_LOCALE_STORAGE_KEY, detectSupportedLocale, resolveStoredLocale } from '../lib/i18n';
import { supabase } from '../lib/supabase';

export type WeightUnit = 'kg' | 'lb';
export type ThemeMode = 'dark' | 'light' | 'system';

export type UserSettings = {
  notificationsActives: boolean;
  rappelMatin: string;
  rappelSoir: string;
  unitePoids: WeightUnit;
  langue: string;
  themeMode: ThemeMode;
  objectifEauMl: number;
  programmeJeune: string;
};

// 'system' (not a hardcoded scheme) so screens rendered before a settings row is loaded —
// pre-login onboarding, or the brief window while an authenticated user's row is still
// fetching — follow the OS preference instead of flashing dark on a light-mode device.
const DEFAULT_SETTINGS: UserSettings = {
  notificationsActives: true,
  rappelMatin: '08:00',
  rappelSoir: '20:00',
  unitePoids: 'kg',
  langue: 'fr',
  themeMode: 'system',
  objectifEauMl: 2000,
  programmeJeune: '16:8',
};

type SettingsRow = {
  notifications_actives: boolean;
  rappel_matin: string;
  rappel_soir: string;
  unite_poids: WeightUnit;
  langue: string;
  theme_mode: ThemeMode;
  objectif_eau_ml: number;
  programme_jeune: string;
};

const SETTINGS_COLUMNS =
  'notifications_actives, rappel_matin, rappel_soir, unite_poids, langue, theme_mode, objectif_eau_ml, programme_jeune';

function fromRow(row: SettingsRow): UserSettings {
  return {
    notificationsActives: row.notifications_actives,
    rappelMatin: row.rappel_matin,
    rappelSoir: row.rappel_soir,
    unitePoids: row.unite_poids,
    langue: row.langue,
    themeMode: row.theme_mode,
    objectifEauMl: row.objectif_eau_ml,
    programmeJeune: row.programme_jeune,
  };
}

function toRow(settings: UserSettings): SettingsRow {
  return {
    notifications_actives: settings.notificationsActives,
    rappel_matin: settings.rappelMatin,
    rappel_soir: settings.rappelSoir,
    unite_poids: settings.unitePoids,
    langue: settings.langue,
    theme_mode: settings.themeMode,
    objectif_eau_ml: settings.objectifEauMl,
    programme_jeune: settings.programmeJeune,
  };
}

/** Reads `user_settings`, creating a default row on first visit, and writes changes immediately (optimistic, reverts on failure). */
export function useSettings(userId: string | undefined, profile?: Profile | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_settings')
        .select(SETTINGS_COLUMNS)
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        if (!cancelled) {
          setSettings(fromRow(data as SettingsRow));
          setLoading(false);
        }
        return;
      }

      // First visit: no row yet. Prefer a language explicitly picked before signup (the welcome
      // screen's picker, persisted locally since there's no `user_settings` row yet to write to)
      // over silently re-detecting the device's language and possibly overriding that choice;
      // fall back to device detection, per the "detect phone language on first launch" spec.
      // Also seed the hydration goal from the profile's weight/activity level rather than the
      // flat fallback (which only applies when no profile is available to compute from).
      const pendingLocale = await AsyncStorage.getItem(PENDING_LOCALE_STORAGE_KEY);
      const langue = pendingLocale ? resolveStoredLocale(pendingLocale) : detectSupportedLocale();

      const { data: created } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...toRow({
            ...DEFAULT_SETTINGS,
            langue,
            objectifEauMl: computeHydrationGoal(profile?.poids_actuel, profile?.niveau_activite),
          }),
        })
        .select(SETTINGS_COLUMNS)
        .single();

      if (created) await AsyncStorage.removeItem(PENDING_LOCALE_STORAGE_KEY);

      if (!cancelled) {
        setSettings(created ? fromRow(created as SettingsRow) : DEFAULT_SETTINGS);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** Merges `patch` into the current settings and writes immediately; reverts locally if the write fails. */
  const update = async (patch: Partial<UserSettings>): Promise<boolean> => {
    if (!userId) return false;
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);

    const { error } = await supabase
      .from('user_settings')
      .update({ ...toRow(next), updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      setSettings(previous);
      return false;
    }
    return true;
  };

  return { settings, loading, update };
}
