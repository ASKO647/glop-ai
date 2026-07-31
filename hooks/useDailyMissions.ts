import { useEffect, useState } from 'react';
import {
  MISSION_INCREMENT,
  MISSION_ORDER,
  getDefaultMissionTemplates,
  isoDaysAgo,
  todayISODate,
  type MissionKey,
} from '../constants/dashboard';
import type { Profile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';

export type DailyMission = {
  id: string;
  mission_key: MissionKey;
  label: string;
  target: number;
  current: number;
  completed: boolean;
};

const HISTORY_WINDOW_DAYS = 30;

/**
 * Loads (or creates, if missing) today's mission rows for the signed-in user, plus a
 * date -> "fully completed" map covering the trailing 30 days for the week strip / streak.
 */
export function useDailyMissions(userId: string | undefined, profile: Profile | null, profileLoading: boolean) {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [completionByDate, setCompletionByDate] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || profileLoading) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const today = todayISODate();

      const { data: todayRows } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      let rows = todayRows ?? [];

      if (rows.length === 0) {
        const templates = getDefaultMissionTemplates(profile);
        const inserts = templates.map((template) => ({
          user_id: userId,
          date: today,
          mission_key: template.key,
          label: template.label,
          target: template.target,
          current: 0,
          completed: false,
        }));
        const { data: inserted } = await supabase.from('daily_missions').insert(inserts).select();
        rows = inserted ?? [];
      }

      const since = isoDaysAgo(HISTORY_WINDOW_DAYS);
      const { data: historyRows } = await supabase
        .from('daily_missions')
        .select('date, completed')
        .eq('user_id', userId)
        .gte('date', since);

      const totalsByDate: Record<string, { total: number; done: number }> = {};
      (historyRows ?? []).forEach((row) => {
        const entry = totalsByDate[row.date] ?? { total: 0, done: 0 };
        entry.total += 1;
        if (row.completed) entry.done += 1;
        totalsByDate[row.date] = entry;
      });
      const completed: Record<string, boolean> = {};
      Object.entries(totalsByDate).forEach(([date, { total, done }]) => {
        completed[date] = total > 0 && total === done;
      });

      if (!cancelled) {
        const sorted = [...rows].sort(
          (a, b) => MISSION_ORDER.indexOf(a.mission_key as MissionKey) - MISSION_ORDER.indexOf(b.mission_key as MissionKey)
        );
        setMissions(sorted as DailyMission[]);
        setCompletionByDate(completed);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, profileLoading]);

  const incrementMission = async (mission: DailyMission) => {
    if (mission.completed) return;

    const step = MISSION_INCREMENT[mission.mission_key] ?? 1;
    const nextCurrent = Math.min(mission.target, Math.round((mission.current + step) * 100) / 100);
    const nextCompleted = nextCurrent >= mission.target;

    const updatedMissions = missions.map((m) =>
      m.id === mission.id ? { ...m, current: nextCurrent, completed: nextCompleted } : m
    );
    setMissions(updatedMissions);

    const allCompletedToday = updatedMissions.length > 0 && updatedMissions.every((m) => m.completed);
    setCompletionByDate((prev) => ({ ...prev, [todayISODate()]: allCompletedToday }));

    await supabase
      .from('daily_missions')
      .update({ current: nextCurrent, completed: nextCompleted })
      .eq('id', mission.id);
  };

  return { missions, completionByDate, loading, incrementMission };
}
