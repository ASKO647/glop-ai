import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type WeightUnit = 'kg' | 'lb';

export type UserSettings = {
  notificationsActives: boolean;
  rappelMatin: string;
  rappelSoir: string;
  unitePoids: WeightUnit;
  langue: string;
};

const DEFAULT_SETTINGS: UserSettings = {
  notificationsActives: true,
  rappelMatin: '08:00',
  rappelSoir: '20:00',
  unitePoids: 'kg',
  langue: 'Français',
};

type SettingsRow = {
  notifications_actives: boolean;
  rappel_matin: string;
  rappel_soir: string;
  unite_poids: WeightUnit;
  langue: string;
};

function fromRow(row: SettingsRow): UserSettings {
  return {
    notificationsActives: row.notifications_actives,
    rappelMatin: row.rappel_matin,
    rappelSoir: row.rappel_soir,
    unitePoids: row.unite_poids,
    langue: row.langue,
  };
}

function toRow(settings: UserSettings): SettingsRow {
  return {
    notifications_actives: settings.notificationsActives,
    rappel_matin: settings.rappelMatin,
    rappel_soir: settings.rappelSoir,
    unite_poids: settings.unitePoids,
    langue: settings.langue,
  };
}

/** Reads `user_settings`, creating a default row on first visit, and writes changes immediately (optimistic, reverts on failure). */
export function useSettings(userId: string | undefined) {
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
        .select('notifications_actives, rappel_matin, rappel_soir, unite_poids, langue')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        if (!cancelled) {
          setSettings(fromRow(data as SettingsRow));
          setLoading(false);
        }
        return;
      }

      const { data: created } = await supabase
        .from('user_settings')
        .insert({ user_id: userId, ...toRow(DEFAULT_SETTINGS) })
        .select('notifications_actives, rappel_matin, rappel_soir, unite_poids, langue')
        .single();

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
