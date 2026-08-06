import * as Clipboard from 'expo-clipboard';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, Camera, Check, Copy, Crown, LogOut, Share2, Trash2, X, ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsSwitch } from '../../../components/settings/SettingsRow';
import TextInputModal from '../../../components/ui/TextInputModal';
import type { Colors } from '../../../constants/theme';
import { radii, spacing } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { useTheme } from '../../../context/ThemeContext';
import { useBlockedUsers } from '../../../hooks/useBlockedUsers';
import { showAlert, showConfirm } from '../../../lib/alert';
import { signGroupImagePaths } from '../../../lib/groups';
import { uploadBase64Image } from '../../../lib/storageUpload';
import { supabase } from '../../../lib/supabase';

const AVATAR_MAX_WIDTH = 512;
const BANNER_MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.7;
// 24h — same TTL as the other private-bucket signers in this app (useAvatar, useGroupMessages).
const AVATAR_SIGNED_URL_TTL_SECONDS = 86400;

type GroupInfo = {
  nom: string;
  description: string | null;
  codeInvitation: string;
  createurId: string;
  avatarPath: string | null;
  bannerPath: string | null;
  isPrivate: boolean;
};
type MemberInfo = { userId: string; role: 'admin' | 'membre'; prenom: string | null };
type JoinRequest = { id: string; userId: string; prenom: string | null; avatarSignedUrl: string | null };

type GroupUpdateOutcome = 'ok' | 'blocked' | 'error';

/**
 * Updates `groups` and tells apart a real Supabase error from a write RLS silently swallowed —
 * an `update().eq('id', ...)` a row's UPDATE policy rejects returns no `error` and simply
 * affects 0 rows, which without `.select()` looks identical to a successful no-op. Requesting
 * the row back distinguishes "wrote the new value" from "the policy blocked it," so a blocked
 * write can be surfaced to the user instead of silently doing nothing.
 */
async function updateGroupRow(groupId: string, patch: Record<string, unknown>): Promise<GroupUpdateOutcome> {
  const { data, error } = await supabase.from('groups').update(patch).eq('id', groupId).select('id');
  if (error) {
    console.error('Failed to update group', groupId, patch, error);
    return 'error';
  }
  if (!data || data.length === 0) {
    console.error('Group update affected 0 rows (likely blocked by the groups UPDATE policy):', groupId, patch);
    return 'blocked';
  }
  return 'ok';
}

/** Signs a batch of `profiles.avatar_path` values (private `avatars` bucket) for the pending-requests list. */
async function signProfileAvatarPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from('avatars').createSignedUrls(paths, AVATAR_SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  });
  return map;
}

export default function GroupInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { blockUser } = useBlockedUsers(user?.id);

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [togglingPrivate, setTogglingPrivate] = useState(false);
  const [activeModal, setActiveModal] = useState<'name' | 'description' | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: groupRow } = await supabase
      .from('groups')
      .select('nom, description, code_invitation, createur_id, avatar_path, banner_path, is_private')
      .eq('id', id)
      .maybeSingle();
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
            avatarPath: groupRow.avatar_path,
            bannerPath: groupRow.banner_path,
            isPrivate: groupRow.is_private,
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

    const imagePaths = [groupRow?.avatar_path, groupRow?.banner_path].filter((p): p is string => !!p);
    if (imagePaths.length > 0) {
      const urls = await signGroupImagePaths(imagePaths);
      setAvatarUrl(groupRow?.avatar_path ? urls[groupRow.avatar_path] ?? null : null);
      setBannerUrl(groupRow?.banner_path ? urls[groupRow.banner_path] ?? null : null);
    } else {
      setAvatarUrl(null);
      setBannerUrl(null);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const myRole = members.find((m) => m.userId === user?.id)?.role;
  const isAdmin = myRole === 'admin';

  const loadJoinRequests = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('group_join_requests')
      .select('id, user_id')
      .eq('group_id', id)
      .eq('status', 'en_attente');
    const rows = data ?? [];
    const userIds = rows.map((r) => r.user_id as string);
    const { data: profileRows } =
      userIds.length > 0 ? await supabase.from('profiles').select('id, prenom, avatar_path').in('id', userIds) : { data: [] };
    const profileById = new Map((profileRows ?? []).map((p) => [p.id as string, p]));
    const avatarPaths = (profileRows ?? []).map((p) => p.avatar_path).filter((p): p is string => !!p);
    const avatarUrls = await signProfileAvatarPaths(avatarPaths);

    setJoinRequests(
      rows.map((r) => {
        const profile = profileById.get(r.user_id as string);
        return {
          id: r.id as string,
          userId: r.user_id as string,
          prenom: profile?.prenom ?? null,
          avatarSignedUrl: profile?.avatar_path ? avatarUrls[profile.avatar_path] ?? null : null,
        };
      })
    );
  }, [id]);

  useEffect(() => {
    if (isAdmin && group?.isPrivate) {
      loadJoinRequests();
    } else {
      setJoinRequests([]);
    }
  }, [isAdmin, group?.isPrivate, loadJoinRequests]);

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

  const pickAndUploadImage = async (kind: 'avatar' | 'banner') => {
    if (!isAdmin || !id) return;
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t('groups.info.photoPermissionDeniedTitle'), t('groups.info.photoPermissionDeniedMessage'));
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];

    const setUploading = kind === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    try {
      const maxWidth = kind === 'avatar' ? AVATAR_MAX_WIDTH : BANNER_MAX_WIDTH;
      const targetWidth = asset.width > 0 ? Math.min(asset.width, maxWidth) : maxWidth;
      const context = ImageManipulator.manipulate(asset.uri).resize({ width: targetWidth });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG, base64: true });
      if (!saved.base64) {
        showAlert(t('common.error'), t('groups.info.photoUpdateFailed'));
        return;
      }

      const storagePath = `${id}/${kind}.jpg`;
      const uploadResult = await uploadBase64Image('group-images', storagePath, saved.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        showAlert(t('common.error'), uploadResult.error ?? t('groups.info.photoUpdateFailed'));
        return;
      }

      const column = kind === 'avatar' ? 'avatar_path' : 'banner_path';
      const outcome = await updateGroupRow(id, { [column]: storagePath });
      if (outcome !== 'ok') {
        showAlert(t('common.error'), outcome === 'blocked' ? t('groups.info.updateBlocked') : t('groups.info.photoUpdateFailed'));
        return;
      }
      await load();
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async (value: string): Promise<string | undefined> => {
    if (!id) return t('groups.info.updateFailed');
    const trimmed = value.trim();
    if (!trimmed) return t('groups.errors.nameRequired');
    const outcome = await updateGroupRow(id, { nom: trimmed });
    if (outcome !== 'ok') return outcome === 'blocked' ? t('groups.info.updateBlocked') : t('groups.info.updateFailed');
    await load();
    return undefined;
  };

  const handleSaveDescription = async (value: string): Promise<string | undefined> => {
    if (!id) return t('groups.info.updateFailed');
    const outcome = await updateGroupRow(id, { description: value.trim() || null });
    if (outcome !== 'ok') return outcome === 'blocked' ? t('groups.info.updateBlocked') : t('groups.info.updateFailed');
    await load();
    return undefined;
  };

  const handleTogglePrivate = async (value: boolean) => {
    if (!id) return;
    setTogglingPrivate(true);
    const outcome = await updateGroupRow(id, { is_private: value });
    setTogglingPrivate(false);
    if (outcome !== 'ok') {
      // Re-read the confirmed DB state either way — on a blocked/failed write this restores the
      // switch to its actual value rather than leaving it showing an unconfirmed optimistic flip.
      await load();
      showAlert(t('common.error'), outcome === 'blocked' ? t('groups.info.updateBlocked') : t('groups.info.updateFailed'));
      return;
    }
    await load();
  };

  const handleAcceptRequest = async (request: JoinRequest) => {
    setBusyRequestId(request.id);
    const { error } = await supabase.rpc('accept_group_join_request', { request_id: request.id });
    setBusyRequestId(null);
    if (error) {
      showAlert(t('common.error'), t('groups.info.acceptRequestFailed'));
      return;
    }
    await Promise.all([loadJoinRequests(), load()]);
  };

  const handleRefuseRequest = async (request: JoinRequest) => {
    setBusyRequestId(request.id);
    const { error } = await supabase.rpc('refuse_group_join_request', { request_id: request.id });
    setBusyRequestId(null);
    if (error) {
      showAlert(t('common.error'), t('groups.info.refuseRequestFailed'));
      return;
    }
    await loadJoinRequests();
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

  const groupInitial = group.nom.trim().charAt(0).toUpperCase() || '?';

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
        <Pressable
          accessibilityRole={isAdmin ? 'button' : undefined}
          accessibilityLabel={t('groups.info.bannerAccessibility')}
          onPress={isAdmin ? () => pickAndUploadImage('banner') : undefined}
          style={styles.banner}
        >
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder} />
          )}
          {uploadingBanner && (
            <View style={styles.bannerOverlay}>
              <ActivityIndicator color="#ffffff" />
            </View>
          )}
          {isAdmin && !uploadingBanner && (
            <View style={styles.bannerCameraBadge}>
              <Camera color={colors.onAccent} size={13} />
            </View>
          )}
        </Pressable>

        <View style={styles.groupBlock}>
          <Pressable
            accessibilityRole={isAdmin ? 'button' : undefined}
            accessibilityLabel={t('groups.info.avatarAccessibility')}
            onPress={isAdmin ? () => pickAndUploadImage('avatar') : undefined}
            style={styles.avatarWrap}
          >
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{groupInitial}</Text>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
            </View>
            {isAdmin && !uploadingAvatar && (
              <View style={styles.avatarCameraBadge}>
                <Camera color={colors.onAccent} size={13} />
              </View>
            )}
          </Pressable>

          <Pressable
            accessibilityRole={isAdmin ? 'button' : undefined}
            onPress={isAdmin ? () => setActiveModal('name') : undefined}
            style={({ pressed }) => [pressed && isAdmin && styles.pressed]}
          >
            <Text style={styles.groupName}>{group.nom}</Text>
          </Pressable>
          <Pressable
            accessibilityRole={isAdmin ? 'button' : undefined}
            onPress={isAdmin ? () => setActiveModal('description') : undefined}
            style={({ pressed }) => [pressed && isAdmin && styles.pressed]}
          >
            <Text style={styles.groupDescription}>{group.description || (isAdmin ? t('groups.create.descriptionPlaceholder') : '')}</Text>
          </Pressable>
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

        {isAdmin && (
          <View style={styles.privateSection}>
            <View style={styles.privateRow}>
              <View style={styles.privateTexts}>
                <Text style={styles.privateLabel}>{t('groups.info.privateToggleLabel')}</Text>
                <Text style={styles.privateSubtitle}>{t('groups.info.privateToggleSubtitle')}</Text>
              </View>
              <SettingsSwitch value={group.isPrivate} onValueChange={handleTogglePrivate} disabled={togglingPrivate} />
            </View>
          </View>
        )}

        {isAdmin && group.isPrivate && joinRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionLabel}>{t('groups.info.pendingRequestsTitle')}</Text>
            {joinRequests.map((request) => {
              const initial = (request.prenom ?? '?').trim().charAt(0).toUpperCase() || '?';
              const busy = busyRequestId === request.id;
              return (
                <View key={request.id} style={styles.requestRow}>
                  <View style={styles.memberAvatar}>
                    {request.avatarSignedUrl ? (
                      <Image source={{ uri: request.avatarSignedUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.memberAvatarText}>{initial}</Text>
                    )}
                  </View>
                  <Text style={styles.memberName}>{request.prenom ?? ''}</Text>
                  {busy ? (
                    <ActivityIndicator color={colors.textSecondary} size="small" />
                  ) : (
                    <View style={styles.requestActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('groups.info.acceptRequest')}
                        onPress={() => handleAcceptRequest(request)}
                        hitSlop={8}
                        style={[styles.requestButton, styles.requestButtonAccept]}
                      >
                        <Check color={colors.onAccent} size={16} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('groups.info.refuseRequest')}
                        onPress={() => handleRefuseRequest(request)}
                        hitSlop={8}
                        style={[styles.requestButton, styles.requestButtonRefuse]}
                      >
                        <X color={colors.danger} size={16} />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.membersSection}>
          <Text style={styles.sectionLabel}>{t('groups.info.membersTitle')}</Text>
          {members.map((member) => {
            const isMe = member.userId === user?.id;
            const initial = (member.prenom ?? '?').trim().charAt(0).toUpperCase() || '?';
            const busy = busyUserId === member.userId;
            const canRemove = isAdmin && !isMe && member.role !== 'admin';
            return (
              <Pressable
                key={member.userId}
                onLongPress={canRemove ? () => handleRemoveMember(member) : undefined}
                style={({ pressed }) => [styles.memberRow, pressed && canRemove && styles.pressed]}
              >
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
                    <Pressable accessibilityRole="button" accessibilityLabel={t('groups.info.blockMember')} onPress={() => handleBlockMember(member)} hitSlop={8}>
                      <Ban color={colors.textSecondary} size={18} />
                    </Pressable>
                  )
                )}
              </Pressable>
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

      <TextInputModal
        visible={activeModal === 'name'}
        title={t('groups.create.nameLabel')}
        initialValue={group.nom}
        placeholder={t('groups.create.namePlaceholder')}
        onCancel={() => setActiveModal(null)}
        onSave={handleSaveName}
      />
      <TextInputModal
        visible={activeModal === 'description'}
        title={t('groups.create.descriptionLabel')}
        initialValue={group.description ?? ''}
        placeholder={t('groups.create.descriptionPlaceholder')}
        onCancel={() => setActiveModal(null)}
        onSave={handleSaveDescription}
      />
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
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    banner: {
      height: 120,
      backgroundColor: colors.surface,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    bannerPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.surface,
    },
    bannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 13, 12, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerCameraBadge: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.lg,
      width: 28,
      height: 28,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupBlock: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      marginTop: -44,
    },
    avatarWrap: {
      width: 88,
      height: 88,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 13, 12, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.accent,
    },
    avatarCameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: spacing.sm,
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
    codeSection: {
      paddingHorizontal: spacing.lg,
    },
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
    privateSection: {
      paddingHorizontal: spacing.lg,
    },
    privateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    privateTexts: {
      flex: 1,
      gap: 2,
    },
    privateLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    privateSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    requestsSection: {
      paddingHorizontal: spacing.lg,
    },
    requestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    requestActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    requestButton: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestButtonAccept: {
      backgroundColor: colors.accent,
    },
    requestButtonRefuse: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    membersSection: {
      paddingHorizontal: spacing.lg,
    },
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
      overflow: 'hidden',
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
    dangerSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.lg,
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
