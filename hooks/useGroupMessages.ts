import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 50;
const BUCKET = 'group-images';
// 24h — long enough that a conversation left open in the background doesn't need to re-sign.
const SIGNED_URL_TTL_SECONDS = 86400;

export type GroupMessage = {
  id: string;
  groupId: string;
  userId: string;
  contenu: string | null;
  imagePath: string | null;
  imageSignedUrl: string | null;
  replyToId: string | null;
  deletedAt: string | null;
  createdAt: string;
  /** Optimistic entry not yet confirmed by the server. */
  pending?: boolean;
};

export type MessageAuthor = { prenom: string | null; avatarPath: string | null };

type MessageRow = {
  id: string;
  group_id: string;
  user_id: string;
  contenu: string | null;
  image_path: string | null;
  reply_to_id: string | null;
  deleted_at: string | null;
  created_at: string;
};

const MESSAGE_COLUMNS = 'id, group_id, user_id, contenu, image_path, reply_to_id, deleted_at, created_at';

function fromRow(row: MessageRow): GroupMessage {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    contenu: row.contenu,
    imagePath: row.image_path,
    imageSignedUrl: null,
    replyToId: row.reply_to_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  };
}

async function signImagePaths(rows: GroupMessage[]): Promise<Record<string, string>> {
  const paths = rows.filter((m) => m.imagePath).map((m) => m.imagePath as string);
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  });
  return map;
}

function withSignedUrls(rows: GroupMessage[], map: Record<string, string>): GroupMessage[] {
  if (Object.keys(map).length === 0) return rows;
  return rows.map((m) => (m.imagePath && map[m.imagePath] ? { ...m, imageSignedUrl: map[m.imagePath] } : m));
}

type SendResult = { ok: boolean; error?: string };

/**
 * Realtime, paginated messages for one group conversation. `messages` is newest-first (ready to
 * hand straight to an inverted FlatList). `messagesById` is a superset that also holds reply
 * targets that fell outside the loaded page, so a quoted-reply preview never goes blank just
 * because its parent message scrolled out of the loaded window.
 */
export function useGroupMessages(groupId: string | undefined, userId: string | undefined) {
  const { t } = useLocale();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messagesById, setMessagesById] = useState<Record<string, GroupMessage>>({});
  const [profiles, setProfiles] = useState<Record<string, MessageAuthor>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const mergeMessages = useRef<(rows: GroupMessage[]) => void>(() => {});

  mergeMessages.current = (rows: GroupMessage[]) => {
    setMessagesById((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        next[row.id] = row;
      });
      return next;
    });
  };

  const loadProfiles = useCallback(async (userIds: string[]) => {
    const missing = [...new Set(userIds)];
    if (missing.length === 0) return;
    const { data } = await supabase.from('profiles').select('id, prenom, avatar_path').in('id', missing);
    if (!data) return;
    setProfiles((prev) => {
      const next = { ...prev };
      (data as { id: string; prenom: string | null; avatar_path: string | null }[]).forEach((row) => {
        next[row.id] = { prenom: row.prenom, avatarPath: row.avatar_path };
      });
      return next;
    });
  }, []);

  /** Fetches any reply-target messages not already known, so quoted previews always resolve. */
  const resolveReplyTargets = useCallback(async (rows: GroupMessage[], known: Set<string>) => {
    const missingIds = [...new Set(rows.map((m) => m.replyToId).filter((id): id is string => !!id && !known.has(id)))];
    if (missingIds.length === 0) return [];
    const { data } = await supabase.from('group_messages').select(MESSAGE_COLUMNS).in('id', missingIds);
    return ((data ?? []) as MessageRow[]).map(fromRow);
  }, []);

  const load = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      setMessagesById({});
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from('group_messages')
      .select(MESSAGE_COLUMNS)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const rows = ((data ?? []) as MessageRow[]).map(fromRow);
    const signedMap = await signImagePaths(rows);
    const signed = withSignedUrls(rows, signedMap);

    const replyTargets = await resolveReplyTargets(signed, new Set(signed.map((m) => m.id)));
    const targetSignedMap = await signImagePaths(replyTargets);
    const signedTargets = withSignedUrls(replyTargets, targetSignedMap);

    await loadProfiles([...signed, ...signedTargets].map((m) => m.userId));

    setMessages(signed);
    mergeMessages.current([...signed, ...signedTargets]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [groupId, loadProfiles, resolveReplyTargets]);

  const loadMore = useCallback(async () => {
    if (!groupId || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldest = messages[messages.length - 1];
    const { data } = await supabase
      .from('group_messages')
      .select(MESSAGE_COLUMNS)
      .eq('group_id', groupId)
      .lt('created_at', oldest.createdAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const rows = ((data ?? []) as MessageRow[]).map(fromRow);
    const signedMap = await signImagePaths(rows);
    const signed = withSignedUrls(rows, signedMap);

    const known = new Set([...messages.map((m) => m.id), ...signed.map((m) => m.id)]);
    const replyTargets = await resolveReplyTargets(signed, known);
    const targetSignedMap = await signImagePaths(replyTargets);
    const signedTargets = withSignedUrls(replyTargets, targetSignedMap);

    await loadProfiles([...signed, ...signedTargets].map((m) => m.userId));

    setMessages((prev) => [...prev, ...signed]);
    mergeMessages.current([...signed, ...signedTargets]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [groupId, hasMore, loadProfiles, loadingMore, messages, resolveReplyTargets]);

  useEffect(() => {
    load();
  }, [load]);

  const markAsRead = useCallback(async () => {
    if (!groupId || !userId) return;
    await supabase
      .from('group_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('user_id', userId);
  }, [groupId, userId]);

  useEffect(() => {
    if (!groupId || !userId) return;
    markAsRead();
    return () => {
      markAsRead();
    };
  }, [groupId, userId, markAsRead]);

  // Realtime: other members' messages/edits arrive here; our own sends are applied directly by
  // sendMessage()/deleteMessage() from their request response, so duplicates are skipped by id.
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const row = fromRow(payload.new as MessageRow);
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [row, ...prev]));
          mergeMessages.current([row]);
          await loadProfiles([row.userId]);
          if (row.imagePath) {
            const map = await signImagePaths([row]);
            const [signedRow] = withSignedUrls([row], map);
            setMessages((prev) => prev.map((m) => (m.id === signedRow.id ? signedRow : m)));
            mergeMessages.current([signedRow]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = fromRow(payload.new as MessageRow);
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row, imageSignedUrl: m.imageSignedUrl } : m)));
          mergeMessages.current([row]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, loadProfiles]);

  const sendMessage = async (contenu: string | null, imagePath: string | null, replyToId: string | null): Promise<SendResult> => {
    if (!groupId || !userId) return { ok: false, error: t('groups.errors.sendFailed') };
    const trimmed = contenu?.trim() || null;
    if (!trimmed && !imagePath) return { ok: false, error: t('groups.errors.emptyMessage') };

    setSending(true);
    const tempId = `local-${Date.now()}`;
    const optimistic: GroupMessage = {
      id: tempId,
      groupId,
      userId,
      contenu: trimmed,
      imagePath,
      imageSignedUrl: imagePath ? null : null,
      replyToId,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, user_id: userId, contenu: trimmed, image_path: imagePath, reply_to_id: replyToId })
      .select(MESSAGE_COLUMNS)
      .single();

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSending(false);
      return { ok: false, error: t('groups.errors.sendFailed') };
    }

    let confirmed = fromRow(data as MessageRow);
    if (confirmed.imagePath) {
      const map = await signImagePaths([confirmed]);
      [confirmed] = withSignedUrls([confirmed], map);
    }
    setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)));
    mergeMessages.current([confirmed]);
    setSending(false);
    return { ok: true };
  };

  const deleteMessage = async (messageId: string): Promise<SendResult> => {
    const previous = messages;
    const deletedAt = new Date().toISOString();
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, contenu: null, imagePath: null, deletedAt } : m)));

    const { error } = await supabase.from('group_messages').update({ deleted_at: deletedAt }).eq('id', messageId);
    if (error) {
      setMessages(previous);
      return { ok: false, error: t('groups.errors.deleteFailed') };
    }
    mergeMessages.current([{ ...(messagesById[messageId] ?? previous.find((m) => m.id === messageId)!), deletedAt, contenu: null, imagePath: null }]);
    return { ok: true };
  };

  const reportMessage = async (messageId: string, motif: string): Promise<SendResult> => {
    if (!userId) return { ok: false, error: t('groups.errors.reportFailed') };
    const { error } = await supabase.from('message_reports').insert({ message_id: messageId, reporter_id: userId, motif });
    if (error) return { ok: false, error: t('groups.errors.reportFailed') };
    return { ok: true };
  };

  const getMessageById = useCallback((id: string) => messagesById[id] ?? null, [messagesById]);

  return {
    messages,
    profiles,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sending,
    sendMessage,
    deleteMessage,
    reportMessage,
    getMessageById,
  };
}
