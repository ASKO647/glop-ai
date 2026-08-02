import { useCallback, useEffect, useState } from 'react';
import { BADGES, type BadgeContext, type BadgeDefinition } from '../constants/badges';
import { computeStreak, todayISODate } from '../constants/dashboard';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';

export type BadgeWithStatus = BadgeDefinition & { unlockedAt: string | null };

function daysSinceSignup(createdAt: string | null): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const start = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((todayMidnight.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Reads `user_badges` plus everything needed to evaluate the 8 fixed badge conditions
 * (`daily_missions`, `meals`, `progress_photos`, `weight_logs`), inserts any badge that just
 * unlocked, and queues newly-unlocked badges for a celebration modal — one at a time.
 */
export function useBadges() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [unlockedAtByKey, setUnlockedAtByKey] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [unlockQueue, setUnlockQueue] = useState<BadgeDefinition[]>([]);

  const evaluate = useCallback(async () => {
    if (!user) {
      setUnlockedAtByKey({});
      setLoading(false);
      return;
    }
    setLoading(true);

    const [badgesRes, missionsRes, mealsRes, photosRes, weightRes] = await Promise.all([
      supabase.from('user_badges').select('badge_key, unlocked_at').eq('user_id', user.id),
      supabase.from('daily_missions').select('date, completed, mission_key').eq('user_id', user.id),
      supabase.from('meals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('progress_photos').select('id').eq('user_id', user.id),
      supabase.from('weight_logs').select('poids').eq('user_id', user.id).order('date', { ascending: false }).limit(1),
    ]);

    const existing: Record<string, string> = {};
    (badgesRes.data ?? []).forEach((row) => {
      existing[row.badge_key] = row.unlocked_at;
    });

    // "At least one mission completed that day" — looser than the dashboard's streak, which
    // requires every mission of the day to be done. Built here rather than reused from
    // useMissionStreak because the two badges need this specific, more permissive definition.
    let missionsCompletedCount = 0;
    let workoutSessionsCount = 0;
    const anyCompletedByDate: Record<string, boolean> = {};
    (missionsRes.data ?? []).forEach((row) => {
      if (!row.completed) return;
      missionsCompletedCount += 1;
      // No dedicated "sessions finished" table exists — the workout mission (capped at 1/day)
      // is the closest available proxy for a completed training session.
      if (row.mission_key === 'workout') workoutSessionsCount += 1;
      anyCompletedByDate[row.date] = true;
    });
    const streak = computeStreak(anyCompletedByDate, todayISODate());

    const startWeight = profile?.poids_actuel ?? null;
    const targetWeight = profile?.poids_objectif ?? null;
    const latestWeight = weightRes.data?.[0]?.poids ?? startWeight;
    let weightGoalReached = false;
    if (startWeight != null && targetWeight != null && latestWeight != null) {
      weightGoalReached = targetWeight <= startWeight ? latestWeight <= targetWeight : latestWeight >= targetWeight;
    }

    const ctx: BadgeContext = {
      missionsCompletedCount,
      streak,
      mealsScannedCount: mealsRes.count ?? 0,
      progressPhotosCount: photosRes.data?.length ?? 0,
      weightGoalReached,
      workoutSessionsCount,
      daysSinceSignup: daysSinceSignup(profile?.created_at ?? null),
    };

    const toUnlock = BADGES.filter((badge) => !existing[badge.key] && badge.isUnlocked(ctx));

    if (toUnlock.length > 0) {
      try {
        const { data: inserted, error } = await supabase
          .from('user_badges')
          .insert(toUnlock.map((badge) => ({ user_id: user.id, badge_key: badge.key })))
          .select('badge_key, unlocked_at');
        if (!error) {
          (inserted ?? []).forEach((row) => {
            existing[row.badge_key] = row.unlocked_at;
          });
          setUnlockQueue((prev) => [...prev, ...toUnlock]);
        }
      } catch {
        // Best-effort — a failed insert here just means the badge unlocks on the next evaluation instead.
      }
    }

    setUnlockedAtByKey(existing);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  const dismissPendingUnlock = () => {
    setUnlockQueue((prev) => prev.slice(1));
  };

  const badges: BadgeWithStatus[] = BADGES.map((badge) => ({
    ...badge,
    unlockedAt: unlockedAtByKey[badge.key] ?? null,
  }));

  return {
    badges,
    earnedCount: Object.keys(unlockedAtByKey).length,
    totalCount: BADGES.length,
    loading,
    pendingUnlock: unlockQueue[0] ?? null,
    dismissPendingUnlock,
  };
}
