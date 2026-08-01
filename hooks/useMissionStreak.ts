import { useCallback, useEffect, useState } from 'react';
import { computeStreak, isoDaysAgo, todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

export type DayCompletion = 'full' | 'partial' | 'none';
export type DayCount = { done: number; total: number };

const STREAK_WINDOW_DAYS = 30;

/** Read-only 30-day view of `daily_missions`, used by the streak grid — never creates rows (unlike useDailyMissions). */
export function useMissionStreak(userId: string | undefined) {
  const [statusByDate, setStatusByDate] = useState<Record<string, DayCompletion>>({});
  const [countsByDate, setCountsByDate] = useState<Record<string, DayCount>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setStatusByDate({});
      setCountsByDate({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const since = isoDaysAgo(STREAK_WINDOW_DAYS - 1);
    const { data } = await supabase
      .from('daily_missions')
      .select('date, completed')
      .eq('user_id', userId)
      .gte('date', since);

    const totalsByDate: Record<string, { total: number; done: number }> = {};
    (data ?? []).forEach((row) => {
      const entry = totalsByDate[row.date] ?? { total: 0, done: 0 };
      entry.total += 1;
      if (row.completed) entry.done += 1;
      totalsByDate[row.date] = entry;
    });

    const status: Record<string, DayCompletion> = {};
    Object.entries(totalsByDate).forEach(([date, { total, done }]) => {
      status[date] = done === 0 ? 'none' : done === total ? 'full' : 'partial';
    });

    setStatusByDate(status);
    setCountsByDate(totalsByDate);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const completionByDate: Record<string, boolean> = {};
  Object.entries(statusByDate).forEach(([date, status]) => {
    completionByDate[date] = status === 'full';
  });
  const streak = computeStreak(completionByDate, todayISODate());

  const activeDays = Object.values(statusByDate).filter((status) => status !== 'none').length;

  return { statusByDate, countsByDate, streak, activeDays, loading, refetch: load };
}
