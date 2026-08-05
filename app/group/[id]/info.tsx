import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Ban, Copy, Crown, LogOut, Share2, Trash2, UserMinus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Colors } from '../../../constants/theme';
import { radii, spacing } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { useTheme } from '../../../context/ThemeContext';
import { useBlockedUsers } from '../../../hooks/useBlockedUsers';
import { showAlert, showConfirm } from '../../../lib/alert';
import { supabase } from '../../../lib/supabase';

type GroupInfo = { nom: string; description: string | null; codeInvitation: string; createurId: string };
type MemberInfo = { userId: string; role: 'admin' | 'membre'; prenom: string | null };

export default function GroupInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { blockUser } = useBlockedUsers(user?.id);

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: groupRow } = await supabase.from('groups').select('nom, description, code_invitation, createur_id').eq('id', id).maybeSingle();
    const { data: memberRows } = await supabase.from('group_members').select('user_id, role').eq('group_id', id);

    const userIds = (memberRows ?? []).map((m) => m.user_id as string);
    const { data: profileRows } = userIds.length > 0 ? await supabase.from('profiles').select('id, prenom').in('id', userIds) : { data: [] };
    const prenomById = new Map((profileRows ?? []).map((p) => [p.id as string, p.prenom as string | null]));

    setGroup(
      groupRow
        ? {
            nom: groupRow.nom,
            description: groupRow.description,
            codeInvitation: groupRow.code_invitation,
            createurId: groupRow.createur_id,
          }
        : null
    );
    setMembers(
      (memberRows ?? []).map((m) => ({
        userId: m.user_id as string,
        role: m.role as 'admin' | 'membre',
        prenom: prenomById.get(m.user_id as string) ?? null,
      }))
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const myRole = members.find((m) => m.userId === user?.id)?.role;
  const isAdmin = myRole === 'admin';

  const handleCopy = async () => {
    if (!group) return;
    await Clipboard.setStringAsync(group.codeInvitation);
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      await Share.share({ message: t('groups.create.shareMessage', { nom: group.nom, code: group.codeInvitation }) });
    } catch {
      // User dismissed the native share sheet — nothing to do.
    }
  };

  const handleRemoveMember = (member: MemberInfo) => {
    showConfirm(
      t('groups.info.removeMemberConfirmTitle'),
      t('groups.info.removeMemberConfirmMessage', { name: member.prenom ?? '' }),
      t('groups.info.removeMember'),
      () => {
        showConfirm(
          t('groups.info.removeMemberConfirmTitle'),
          t('groups.info.removeMemberConfirmMessage', { name: member.prenom ?? '' }),
          t('groups.info.removeMember'),
          async () => {
            if (!id) return;
            setBusyUserId(member.userId);
            const { error } = await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', member.userId);
            setBusyUserId(null);
            if (error) {
              showAlert(t('common.error'), t('groups.errors.removeMemberFailed'));
              return;
            }
            await load();
          },
          t('common.cancel')
        );
      },
      t('common.cancel')
    );
  };

  const handleBlockMember = (member: MemberInfo) => {
    showConfirm(
      t('groups.info.blockConfirmTitle', { name: member.prenom ?? '' }),
      t('groups.info.blockConfirmMessage'),
      t('groups.info.blockMember'),
      async () => {
        setBusyUserId(member.userId);
        const result = await blockUser(member.userId);
        setBusyUserId(null);
        if (!result.ok) showAlert(t('common.error'), result.error ?? t('groups.errors.blockFailed'));
      },
      t('common.cancel')
    );
  };

  const handleLeave = () => {
    showConfirm(
      t('groups.info.leaveConfirmTitle'),
      t('groups.info.leaveConfirmMessage'),
      t('groups.info.leaveGroup'),
      async () => {
        if (!id || !user) return;
        setLeaving(true);
        const { error } = await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', user.id);
        setLeaving(false);
        if (error) {
          showAlert(t('common.error'), t('groups.errors.leaveFailed'));
          return;
        }
        router.replace('/groups');
      },
      t('common.cancel')
    );
  };

  const handleDeleteGroup = () => {
    showConfirm(
      t('groups.info.deleteConfirmTitle'),
      t('groups.info.deleteConfirmMessage'),
      t('groups.info.deleteConfirmButton'),
      () => {
        showConfirm(
          t('groups.info.deleteConfirmTitle'),
          t('groups.info.deleteConfirmMessage'),
          t('groups.info.deleteConfirmButton'),
          async () => {
            if (!id) return;
            setDeletingGroup(true);
            const { error } = await supabase.from('groups').delete().eq('id', id);
            setDeletingGroup(false);
            if (error) {
              showAlert(t('common.error'), t('groups.errors.deleteGroupFailed'));
              return;
            }
            router.replace('/groups');
          },
          t('common.cancel')
        );
      },
      t('common.cancel')
    );
  };

  if (loading || !group) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('groups.info.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.groupBlock}>
          <Text style={styles.groupName}>{group.nom}</Text>
          {group.description ? <Text style={styles.groupDescription}>{group.description}</Text> : null}
        </View>

        <View style={styles.codeSection}>
          <Text style={styles.sectionLabel}>{t('groups.info.codeLabel')}</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{group.codeInvitation}</Text>
            <View style={styles.codeActions}>
              <Pressable accessibilityRole="button" onPress={handleCopy} hitSlop={8}>
                <Copy color={colors.accent} size={20} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleShare} hitSlop={8}>
                <Share2 color={colors.accent} size={20} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionLabel}>{t('groups.info.membersTitle')}</Text>
          {members.map((member) => {
            const isMe = member.userId === user?.id;
            const initial = (member.prenom ?? '?').trim().charAt(0).toUpperCase() || '?';
            const busy = busyUserId === member.userId;
            return (
              <View key={member.userId} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{initial}</Text>
                </View>
                <View style={styles.memberBody}>
                  <Text style={styles.memberName}>{isMe ? t('groups.info.you') : member.prenom ?? ''}</Text>
                  {member.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Crown color={colors.accent} size={11} />
                      <Text style={styles.adminBadgeText}>{t('groups.info.adminBadge')}</Text>
                    </View>
                  )}
                </View>
                {busy ? (
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : (
                  !isMe && (
                    <View style={styles.memberActions}>
                      {isAdmin && member.role !== 'admin' && (
                        <Pressable accessibilityRole="button" accessibilityLabel={t('groups.info.removeMember')} onPress={() => handleRemoveMember(member)} hitSlop={8}>
                          <UserMinus color={colors.danger} size={18} />
                        </Pressable>
                      )}
                      <Pressable accessibilityRole="button" accessibilityLabel={t('groups.info.blockMember')} onPress={() => handleBlockMember(member)} hitSlop={8}>
                        <Ban color={colors.textSecondary} size={18} />
                      </Pressable>
                    </View>
                  )
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.dangerSection}>
          <Pressable
            accessibilityRole="button"
            onPress={handleLeave}
            disabled={leaving}
            style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}
          >
            <LogOut color={colors.danger} size={18} />
            <Text style={styles.dangerLabel}>{t('groups.info.leaveGroup')}</Text>
            {leaving && <ActivityIndicator color={colors.danger} size="small" />}
          </Pressable>

          {isAdmin && (
            <Pressable
              accessibilityRole="button"
              onPress={handleDeleteGroup}
              disabled={deletingGroup}
              style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}
            >
              <Trash2 color={colors.danger} size={18} />
              <Text style={styles.dangerLabel}>{t('groups.info.deleteGroup')}</Text>
              {deletingGroup && <ActivityIndicator color={colors.danger} size="small" />}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    headerSpacer: {
      width: 36,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    groupBlock: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
    },
    groupName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    groupDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.labelMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    codeSection: {},
    codeBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    code: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 3,
      color: colors.accent,
    },
    codeActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    membersSection: {},
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.accent,
    },
    memberBody: {
      flex: 1,
      gap: 2,
    },
    memberName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      alignSelf: 'flex-start',
    },
    adminBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
    },
    memberActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    dangerSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      gap: spacing.xs,
    },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    dangerLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.danger,
      flex: 1,
    },
  });
}
