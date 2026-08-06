import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { generateUniqueGroupCode, signGroupImagePaths } from '../lib/groups';
import { supabase } from '../lib/supabase';

export type GroupRole = 'admin' | 'membre';

export type GroupSummary = {
  id: string;
  nom: string;
  description: string | null;
  codeInvitation: string;
  createurId: string;
  isPrivate: boolean;
  avatarPath: string | null;
  avatarSignedUrl: string | null;
  role: GroupRole;
  memberCount: number;
  lastMessage: {
    contenu: string | null;
    hasImage: boolean;
    authorPrenom: string | null;
    createdAt: string;
  } | null;
  unreadCount: number;
};

type GroupRow = {
  id: string;
  nom: string;
  description: string | null;
  code_invitation: string;
  createur_id: string;
  is_private: boolean;
  avatar_path: string | null;
};

type MemberRow = {
  group_id: string;
  role: GroupRole;
  last_read_at: string;
};

type ActionResult = { ok: boolean; error?: string; groupId?: string; codeInvitation?: string; pending?: boolean };

/** A group's most recent (non-deleted) message plus its author's first name and whether it carries an image. */
async function fetchLastMessage(groupId: string): Promise<GroupSummary['lastMessage']> {
  const { data } = await supabase
    .from('group_messages')
    .select('contenu, image_path, user_id, created_at')
    .eq('group_id', groupId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: author } = await supabase.from('profiles').select('prenom').eq('id', data.user_id).maybeSingle();

  return {
    contenu: data.contenu,
    hasImage: !!data.image_path,
    authorPrenom: author?.prenom ?? null,
    createdAt: data.created_at,
  };
}

/** Messages from other members sent after this member's `last_read_at`, not counting their own. */
async function fetchUnreadCount(groupId: string, userId: string, lastReadAt: string): Promise<number> {
  const { count } = await supabase
    .from('group_messages')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .neq('user_id', userId)
    .is('deleted_at', null)
    .gt('created_at', lastReadAt);
  return count ?? 0;
}

async function fetchMemberCount(groupId: string): Promise<number> {
  const { count } = await supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', groupId);
  return count ?? 0;
}

/** The signed-in user's groups, each enriched with role, member count, last message preview and unread count. */
export function useGroups(userId: string | undefined) {
  const { t } = useLocale();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id, role, last_read_at')
      .eq('user_id', userId);
    const members = (memberRows ?? []) as MemberRow[];

    if (members.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = members.map((m) => m.group_id);
    const { data: groupRows } = await supabase
      .from('groups')
      .select('id, nom, description, code_invitation, createur_id, is_private, avatar_path')
      .in('id', groupIds);
    const rows = (groupRows ?? []) as GroupRow[];
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const avatarUrlByPath = await signGroupImagePaths(
      rows.map((row) => row.avatar_path).filter((path): path is string => !!path)
    );

    const summaries = await Promise.all(
      members.map(async (member): Promise<GroupSummary | null> => {
        const row = rowsById.get(member.group_id);
        if (!row) return null;
        const [lastMessage, unreadCount, memberCount] = await Promise.all([
          fetchLastMessage(member.group_id),
          fetchUnreadCount(member.group_id, userId, member.last_read_at),
          fetchMemberCount(member.group_id),
        ]);
        return {
          id: row.id,
          nom: row.nom,
          description: row.description,
          codeInvitation: row.code_invitation,
          createurId: row.createur_id,
          isPrivate: row.is_private,
          avatarPath: row.avatar_path,
          avatarSignedUrl: row.avatar_path ? avatarUrlByPath[row.avatar_path] ?? null : null,
          role: member.role,
          memberCount,
          lastMessage,
          unreadCount,
        };
      })
    );

    const sorted = summaries
      .filter((g): g is GroupSummary => g !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? '';
        const bTime = b.lastMessage?.createdAt ?? '';
        return bTime.localeCompare(aTime);
      });

    setGroups(sorted);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const joinByCode = async (rawCode: string): Promise<ActionResult> => {
    if (!userId) return { ok: false, error: t('groups.errors.joinFailed') };
    const code = rawCode.trim().toUpperCase();
    if (!code) return { ok: false, error: t('groups.errors.codeRequired') };

    const { data: group } = await supabase
      .from('groups')
      .select('id, is_private')
      .eq('code_invitation', code)
      .maybeSingle();
    if (!group) return { ok: false, error: t('groups.errors.codeInvalid') };

    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) return { ok: false, error: t('groups.errors.alreadyMember') };

    if (group.is_private) {
      // A valid code for a private group doesn't add the member directly — it creates a request
      // the group's admin must accept (see app/group/[id]/info.tsx). The unique (group_id,
      // user_id) constraint means a previously refused request can't be re-sent by inserting
      // again — surfaced explicitly rather than as a generic "join failed".
      const { data: existingRequest } = await supabase
        .from('group_join_requests')
        .select('status')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRequest?.status === 'en_attente') return { ok: true, pending: true };
      if (existingRequest?.status === 'refuse') return { ok: false, error: t('groups.errors.joinRequestRefused') };

      const { error } = await supabase.from('group_join_requests').insert({ group_id: group.id, user_id: userId });
      if (error) return { ok: false, error: t('groups.errors.joinFailed') };
      return { ok: true, pending: true };
    }

    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, role: 'membre' });
    if (error) return { ok: false, error: t('groups.errors.joinFailed') };

    await load();
    return { ok: true, groupId: group.id };
  };

  const createGroup = async (nom: string, description: string): Promise<ActionResult> => {
    if (!userId) return { ok: false, error: t('groups.errors.createFailed') };
    const trimmedName = nom.trim();
    if (!trimmedName) return { ok: false, error: t('groups.errors.nameRequired') };

    const code = await generateUniqueGroupCode();
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        nom: trimmedName,
        description: description.trim() || null,
        code_invitation: code,
        createur_id: userId,
      })
      .select('id')
      .single();
    if (error || !group) return { ok: false, error: t('groups.errors.createFailed') };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'admin' });
    if (memberError) return { ok: false, error: t('groups.errors.createFailed') };

    await load();
    return { ok: true, groupId: group.id, codeInvitation: code };
  };

  return { groups, loading, refetch: load, joinByCode, createGroup };
}
