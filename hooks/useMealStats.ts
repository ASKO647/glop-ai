import { useCallback, useEffect, useMemo, useState } from 'react';
import { isoDaysAgo, todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

export type MealDayTotal = { date: string; kcal: number };

const HISTORY_WINDOW_DAYS = 30;

/** Daily kcal totals (`meals`, summed per date) over the last 30 days — feeds the Progression screen's calorie-average and weekly-energy cards. */
export function useMealStats(userId: string | undefined) {
  const [kcalByDate, setKcalByDate] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setKcalByDate({});
      setLoading(false);
      return;
    }
    setLoading(true);

    const since = isoDaysAgo(HISTORY_WINDOW_DAYS - 1);
    const { data } = await supabase.from('meals').select('date, kcal').eq('user_id', userId).gte('date', since);

    const totals: Record<string, number> = {};
    for (const row of (data ?? []) as { date: string; kcal: number }[]) {
      totals[row.date] = (totals[row.date] ?? 0) + row.kcal;
    }
    setKcalByDate(totals);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const history: MealDayTotal[] = useMemo(
    () =>
      Array.from({ length: HISTORY_WINDOW_DAYS }, (_, i) => {
        const date = isoDaysAgo(HISTORY_WINDOW_DAYS - 1 - i);
        return { date, kcal: kcalByDate[date] ?? 0 };
      }),
    [kcalByDate]
  );

  const average7 = useMemo(() => average(history.slice(-7)), [history]);
  const average30 = useMemo(() => average(history), [history]);
  const todayKcal = kcalByDate[todayISODate()] ?? 0;

  return { kcalByDate, history, average7, average30, todayKcal, loading, refetch: load };
}

function average(days: MealDayTotal[]): number {
  if (days.length === 0) return 0;
  return days.reduce((sum, day) => sum + day.kcal, 0) / days.length;
}
