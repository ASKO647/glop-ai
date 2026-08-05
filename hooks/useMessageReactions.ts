import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const REACTION_EMOJIS = ['💪', '🔥', '👏', '😂', '❤️', '😮'];

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  reactorNames: string[];
};

type ReactionRow = {
  id: string;
  message_id: string;
  group_id: string;
  user_id: string;
  emoji: string;
};

/** Realtime reactions for every message in a group, grouped per message + emoji. */
export function useMessageReactions(groupId: string | undefined, userId: string | undefined) {
  const [rows, setRows] = useState<ReactionRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async (userIds: string[]) => {
    const missing = [...new Set(userIds)];
    if (missing.length === 0) return;
    const { data } = await supabase.from('profiles').select('id, prenom').in('id', missing);
    if (!data) return;
    setProfiles((prev) => {
      const next = { ...prev };
      (data as { id: string; prenom: string | null }[]).forEach((row) => {
        next[row.id] = row.prenom;
      });
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    if (!groupId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('message_reactions')
      .select('id, message_id, group_id, user_id, emoji')
      .eq('group_id', groupId);
    const next = (data ?? []) as ReactionRow[];
    setRows(next);
    await loadProfiles(next.map((r) => r.user_id));
    setLoading(false);
  }, [groupId, loadProfiles]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`message_reactions:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as ReactionRow;
          setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
          loadProfiles([row.user_id]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.old as ReactionRow;
          setRows((prev) => prev.filter((r) => r.id !== row.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, loadProfiles]);

  const reactionsByMessage = useCallback(
    (messageId: string): ReactionSummary[] => {
      const forMessage = rows.filter((r) => r.message_id === messageId);
      const byEmoji = new Map<string, ReactionRow[]>();
      forMessage.forEach((r) => {
        byEmoji.set(r.emoji, [...(byEmoji.get(r.emoji) ?? []), r]);
      });
      return REACTION_EMOJIS.filter((emoji) => byEmoji.has(emoji)).map((emoji) => {
        const reactions = byEmoji.get(emoji) ?? [];
        return {
          emoji,
          count: reactions.length,
          reactedByMe: reactions.some((r) => r.user_id === userId),
          reactorNames: reactions.map((r) => profiles[r.user_id] ?? '').filter(Boolean),
        };
      });
    },
    [rows, profiles, userId]
  );

  /** Adds the current user's reaction, or removes it if they'd already reacted with that emoji. */
  const toggleReaction = async (messageId: string, groupIdForMessage: string, emoji: string) => {
    if (!userId) return;
    const existing = rows.find((r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji);

    if (existing) {
      setRows((prev) => prev.filter((r) => r.id !== existing.id));
      const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
      if (error) setRows((prev) => [...prev, existing]);
      return;
    }

    const tempId = `local-${Date.now()}`;
    const optimistic: ReactionRow = { id: tempId, message_id: messageId, group_id: groupIdForMessage, user_id: userId, emoji };
    setRows((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, group_id: groupIdForMessage, user_id: userId, emoji })
      .select('id, message_id, group_id, user_id, emoji')
      .single();

    if (error || !data) {
      setRows((prev) => prev.filter((r) => r.id !== tempId));
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === tempId ? (data as ReactionRow) : r)));
  };

  return { loading, reactionsByMessage, toggleReaction };
}
