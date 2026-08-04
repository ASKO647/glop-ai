import { useCallback, useEffect, useMemo, useState } from 'react';
import { isoDaysAgo, toISODate } from '../constants/dashboard';
import { computeFastingStats, resolveProgramSetting } from '../constants/fasting';
import { supabase } from '../lib/supabase';

export type FastingSession = {
  id: string;
  debut: string;
  fin: string | null;
  duree_cible_heures: number;
  programme: string;
  created_at: string;
};

const HISTORY_WINDOW_DAYS = 90;
const TICK_MS = 60000;

/** Session en cours, démarrage/arrêt, historique 90 jours et statistiques du jeûne intermittent. */
export function useFasting(userId: string | undefined) {
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const since = isoDaysAgo(HISTORY_WINDOW_DAYS - 1);
    const { data } = await supabase
      .from('fasting_sessions')
      .select('id, debut, fin, duree_cible_heures, programme, created_at')
      .eq('user_id', userId)
      .gte('debut', `${since}T00:00:00.000Z`)
      .order('debut', { ascending: false });

    setSessions((data ?? []) as FastingSession[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Ticks once a minute so the elapsed-time display advances; elapsedMs itself is always
  // recomputed from `debut` below, never accumulated in memory, so reopening the app after
  // any amount of time shows the correct value immediately on the very first render.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const activeSession = useMemo(() => sessions.find((s) => s.fin == null) ?? null, [sessions]);

  const elapsedMs = useMemo(() => {
    if (!activeSession) return 0;
    return Math.max(0, now - new Date(activeSession.debut).getTime());
  }, [activeSession, now]);

  const history = useMemo(() => sessions.filter((s) => s.fin != null), [sessions]);

  const stats = useMemo(() => computeFastingStats(sessions), [sessions]);

  const lastCompletedTodayMs = useMemo(() => {
    const todayIso = isoDaysAgo(0);
    const todays = history.find((s) => toISODate(new Date(s.debut)) === todayIso);
    if (!todays || !todays.fin) return null;
    return new Date(todays.fin).getTime() - new Date(todays.debut).getTime();
  }, [history]);

  const startFasting = async (startAt: Date, programmeJeune: string): Promise<boolean> => {
    if (!userId || activeSession) return false;
    const resolved = resolveProgramSetting(programmeJeune);

    const { data, error } = await supabase
      .from('fasting_sessions')
      .insert({
        user_id: userId,
        debut: startAt.toISOString(),
        duree_cible_heures: resolved.targetHours,
        programme: resolved.label,
      })
      .select('id, debut, fin, duree_cible_heures, programme, created_at')
      .single();

    if (error || !data) return false;
    setSessions((prev) => [data as FastingSession, ...prev]);
    setNow(Date.now());
    return true;
  };

  const stopFasting = async (): Promise<boolean> => {
    if (!activeSession) return false;
    const finIso = new Date().toISOString();

    const { error } = await supabase
      .from('fasting_sessions')
      .update({ fin: finIso })
      .eq('id', activeSession.id);

    if (error) return false;
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? { ...s, fin: finIso } : s)));
    return true;
  };

  const deleteSession = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('fasting_sessions').delete().eq('id', id);
    if (error) return false;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    return true;
  };

  return {
    sessions,
    activeSession,
    elapsedMs,
    history,
    stats,
    lastCompletedTodayMs,
    loading,
    refetch: load,
    startFasting,
    stopFasting,
    deleteSession,
  };
}
