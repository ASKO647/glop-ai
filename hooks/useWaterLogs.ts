import { useCallback, useEffect, useMemo, useState } from 'react';
import { isoDaysAgo, todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

export type WaterLog = {
  id: string;
  date: string;
  quantite_ml: number;
  created_at: string;
};

export type WaterDayTotal = { date: string; totalMl: number };

const HISTORY_WINDOW_DAYS = 30;

/** Today's hydration total (plus per-meal-style add/remove) and a zero-filled 30-day daily history. */
export function useWaterLogs(userId: string | undefined) {
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const since = isoDaysAgo(HISTORY_WINDOW_DAYS - 1);
    const { data } = await supabase
      .from('water_logs')
      .select('id, date, quantite_ml, created_at')
      .eq('user_id', userId)
      .gte('date', since)
      .order('created_at', { ascending: true });

    setLogs((data ?? []) as WaterLog[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const history: WaterDayTotal[] = useMemo(() => {
    const totalsByDate = new Map<string, number>();
    for (const log of logs) {
      totalsByDate.set(log.date, (totalsByDate.get(log.date) ?? 0) + log.quantite_ml);
    }
    return Array.from({ length: HISTORY_WINDOW_DAYS }, (_, i) => {
      const date = isoDaysAgo(HISTORY_WINDOW_DAYS - 1 - i);
      return { date, totalMl: Math.max(0, totalsByDate.get(date) ?? 0) };
    });
  }, [logs]);

  const totalToday = history[history.length - 1]?.totalMl ?? 0;

  const insertDelta = async (deltaMl: number): Promise<boolean> => {
    if (!userId || deltaMl === 0) return false;
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, date: todayISODate(), quantite_ml: deltaMl })
      .select('id, date, quantite_ml, created_at')
      .single();

    if (error || !data) return false;
    setLogs((prev) => [...prev, data as WaterLog]);
    return true;
  };

  /** Logs `ml` of water drunk today. */
  const addWater = (ml: number) => insertDelta(Math.abs(ml));

  /** Removes `ml` from today's total (e.g. unchecking a glass, or undoing an accidental add). */
  const removeWater = (ml: number) => insertDelta(-Math.abs(ml));

  return { history, totalToday, loading, refetch: load, addWater, removeWater };
}
