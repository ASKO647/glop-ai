import { useCallback, useEffect, useState } from 'react';
import { isoDaysAgo, todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

export type WeightLog = {
  id: string;
  date: string;
  poids: number;
};

const HISTORY_WINDOW_DAYS = 90;

/** Reads up to 90 days of weight history (ascending by date), and lets the screen add/overwrite today's entry. */
export function useWeightLogs(userId: string | undefined) {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const since = isoDaysAgo(HISTORY_WINDOW_DAYS - 1);
    const { data } = await supabase
      .from('weight_logs')
      .select('id, date, poids')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date', { ascending: true });

    setLogs((data ?? []) as WeightLog[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Writes today's weight, overwriting the existing entry for today if there is one. */
  const saveTodayWeight = async (poids: number): Promise<boolean> => {
    if (!userId) return false;
    const today = todayISODate();
    const existing = logs.find((log) => log.date === today);
    setSaving(true);

    if (existing) {
      const { error } = await supabase.from('weight_logs').update({ poids }).eq('id', existing.id);
      setSaving(false);
      if (error) return false;
      setLogs((prev) => prev.map((log) => (log.id === existing.id ? { ...log, poids } : log)));
      return true;
    }

    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ user_id: userId, date: today, poids })
      .select('id, date, poids')
      .single();
    setSaving(false);
    if (error || !data) return false;
    setLogs((prev) => [...prev, data as WeightLog].sort((a, b) => a.date.localeCompare(b.date)));
    return true;
  };

  return { logs, loading, saving, saveTodayWeight, refetch: load };
}
