import { useCallback, useEffect, useState } from 'react';
import { getCurrentWeekDays } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

/** Read-only view of this week's "workout" mission completion, one boolean per date (Mon-Sun). */
export function useWeeklyWorkouts(userId: string | undefined) {
  const [completedByDate, setCompletedByDate] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setCompletedByDate({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const week = getCurrentWeekDays();
    const { data } = await supabase
      .from('daily_missions')
      .select('date, completed')
      .eq('user_id', userId)
      .eq('mission_key', 'workout')
      .gte('date', week[0].date)
      .lte('date', week[6].date);

    const map: Record<string, boolean> = {};
    (data ?? []).forEach((row) => {
      map[row.date] = row.completed;
    });
    setCompletedByDate(map);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { completedByDate, loading, refetch: load };
}
