import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabase';

type ActionResult = { ok: boolean; error?: string };

/** The signed-in user's own block list — used to hide a blocked member's messages locally. */
export function useBlockedUsers(userId: string | undefined) {
  const { t } = useLocale();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setBlockedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('blocked_users').select('blocked_user_id').eq('user_id', userId);
    setBlockedIds(new Set((data ?? []).map((row) => row.blocked_user_id as string)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const blockUser = async (blockedUserId: string): Promise<ActionResult> => {
    if (!userId) return { ok: false, error: t('groups.errors.blockFailed') };
    setBlockedIds((prev) => new Set(prev).add(blockedUserId));
    const { error } = await supabase.from('blocked_users').insert({ user_id: userId, blocked_user_id: blockedUserId });
    if (error) {
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(blockedUserId);
        return next;
      });
      return { ok: false, error: t('groups.errors.blockFailed') };
    }
    return { ok: true };
  };

  return { blockedIds, loading, blockUser };
}
