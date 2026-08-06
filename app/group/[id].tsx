import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatInputBar from '../../components/groups/ChatInputBar';
import ImageViewerModal from '../../components/groups/ImageViewerModal';
import MessageActionSheet from '../../components/groups/MessageActionSheet';
import MessageBubble from '../../components/groups/MessageBubble';
import TextInputModal from '../../components/ui/TextInputModal';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { useBlockedUsers } from '../../hooks/useBlockedUsers';
import { useGroupMessages, type GroupMessage } from '../../hooks/useGroupMessages';
import { useMessageReactions } from '../../hooks/useMessageReactions';
import { showAlert } from '../../lib/alert';
import { signGroupImagePaths } from '../../lib/groups';
import { uploadBase64Image } from '../../lib/storageUpload';
import { supabase } from '../../lib/supabase';

const BUCKET = 'group-images';
const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.6;

type ListItem = { type: 'date'; key: string; label: string } | { type: 'message'; key: string; message: GroupMessage; showAuthor: boolean };

function dateSeparatorLabel(iso: string, t: (key: string, params?: Record<string, string | number>) => string, locale: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t('groups.conversation.today');
  if (date.toDateString() === yesterday.toDateString()) return t('groups.conversation.yesterday');
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildListItems(
  messagesNewestFirst: GroupMessage[],
  t: (key: string, params?: Record<string, string | number>) => string,
  locale: string
): ListItem[] {
  const chronological = [...messagesNewestFirst].reverse();
  const items: ListItem[] = [];
  let lastDateKey: string | null = null;
  let lastAuthor: string | null = null;

  chronological.forEach((message) => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (dateKey !== lastDateKey) {
      items.push({ type: 'date', key: `date-${dateKey}`, label: dateSeparatorLabel(message.createdAt, t, locale) });
      lastDateKey = dateKey;
      lastAuthor = null;
    }
    const showAuthor = message.userId !== lastAuthor;
    items.push({ type: 'message', key: message.id, message, showAuthor });
    lastAuthor = message.userId;
  });

  return items.reverse();
}

export default function GroupConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listRef = useRef<FlatList<ListItem>>(null);

  const [groupName, setGroupName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string | null>(null);
  const [groupBannerUrl, setGroupBannerUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [actionSheetMessageId, setActionSheetMessageId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const {
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
  } = useGroupMessages(id, user?.id);
  const { reactionsByMessage, toggleReaction } = useMessageReactions(id, user?.id);
  const { blockedIds } = useBlockedUsers(user?.id);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data: group } = await supabase
        .from('groups')
        .select('nom, avatar_path, banner_path')
        .eq('id', id)
        .maybeSingle();
      const { count } = await supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', id);
      if (!cancelled) {
        setGroupName(group?.nom ?? '');
        setMemberCount(count ?? 0);
      }

      const paths = [group?.avatar_path, group?.banner_path].filter((p): p is string => !!p);
      if (paths.length > 0) {
        const urls = await signGroupImagePaths(paths);
        if (!cancelled) {
          setGroupAvatarUrl(group?.avatar_path ? urls[group.avatar_path] ?? null : null);
          setGroupBannerUrl(group?.banner_path ? urls[group.banner_path] ?? null : null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const visibleMessages = useMemo(
    () => messages.filter((m) => !blockedIds.has(m.userId)),
    [messages, blockedIds]
  );
  const listItems = useMemo(() => buildListItems(visibleMessages, t, locale), [visibleMessages, t, locale]);

  const actionSheetMessage = actionSheetMessageId ? getMessageById(actionSheetMessageId) : null;

  const handleSend = async () => {
    const text = draft;
    setDraft('');
    const replying = replyToId;
    setReplyToId(null);
    const result = await sendMessage(text, null, replying);
    if (!result.ok && result.error) showAlert(t('common.error'), result.error);
  };

  const handleAttach = async () => {
    if (attaching) return;
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || result.assets.length === 0 || !id || !user) return;

    setAttaching(true);
    try {
      const asset = result.assets[0];
      const targetWidth = asset.width > 0 ? Math.min(asset.width, MAX_WIDTH) : MAX_WIDTH;
      const context = ImageManipulator.manipulate(asset.uri).resize({ width: targetWidth });
      const rendered = await context.renderAsync();
      const compressed = await rendered.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG, base64: true });
      if (!compressed.base64) {
        showAlert(t('common.error'), t('groups.errors.imageUploadFailed'));
        return;
      }

      const path = `${id}/${Date.now()}.jpg`;
      const uploadResult = await uploadBase64Image(BUCKET, path, compressed.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        showAlert(t('common.error'), uploadResult.error ?? t('groups.errors.imageUploadFailed'));
        return;
      }

      const replying = replyToId;
      setReplyToId(null);
      const sendResult = await sendMessage(null, uploadResult.path, replying);
      if (!sendResult.ok && sendResult.error) showAlert(t('common.error'), sendResult.error);
    } finally {
      setAttaching(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    setActionSheetMessageId(null);
    const result = await deleteMessage(messageId);
    if (!result.ok && result.error) showAlert(t('common.error'), result.error);
  };

  const handleCopy = async (message: GroupMessage) => {
    setActionSheetMessageId(null);
    if (message.contenu) await Clipboard.setStringAsync(message.contenu);
  };

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = listItems.findIndex((item) => item.type === 'message' && item.message.id === messageId);
      if (index === -1) return;
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setHighlightedId(messageId);
      setTimeout(() => setHighlightedId((current) => (current === messageId ? null : current)), 1500);
    },
    [listItems]
  );

  const replyTargetForInput = replyToId
    ? { message: getMessageById(replyToId), authorName: null }
    : null;
  const replyTargetAuthorName =
    replyTargetForInput?.message && profiles[replyTargetForInput.message.userId]
      ? profiles[replyTargetForInput.message.userId].prenom
      : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {groupBannerUrl && (
          <>
            <Image source={{ uri: groupBannerUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(10,13,12,0.4)', 'rgba(10,13,12,0.8)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.conversation.backAccessibility')}
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            {groupAvatarUrl ? (
              <Image source={{ uri: groupAvatarUrl }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerAvatarText}>{(groupName.trim().charAt(0) || '?').toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {groupName}
            </Text>
            <Text style={styles.headerSubtitle}>{t('groups.conversation.membersCount', { count: memberCount })}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.conversation.infoAccessibility')}
          onPress={() => router.push(`/group/${id}/info`)}
          hitSlop={12}
          style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
        >
          <Info color={colors.textPrimary} size={20} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            inverted
            data={listItems}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text style={styles.loadingMoreText}>{t('groups.conversation.loadingMore')}</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              if (item.type === 'date') {
                return (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>{item.label}</Text>
                  </View>
                );
              }

              const message = item.message;
              const isOwn = message.userId === user?.id;
              const author = profiles[message.userId];
              const replyTarget = message.replyToId ? getMessageById(message.replyToId) : null;
              const replyAuthor = replyTarget ? profiles[replyTarget.userId] : null;

              return (
                <View style={highlightedId === message.id ? styles.highlighted : undefined}>
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    showAuthor={item.showAuthor && !isOwn}
                    authorName={author?.prenom ?? null}
                    replyPreview={
                      message.replyToId
                        ? {
                            authorName: replyAuthor?.prenom ?? null,
                            contenu: replyTarget?.contenu ?? null,
                            hasImage: !!replyTarget?.imagePath,
                            deleted: !!replyTarget?.deletedAt,
                          }
                        : null
                    }
                    reactions={reactionsByMessage(message.id)}
                    onLongPress={() => setActionSheetMessageId(message.id)}
                    onPressReplyBanner={() => message.replyToId && scrollToMessage(message.replyToId)}
                    onPressImage={setViewerUri}
                    onToggleReaction={(emoji) => toggleReaction(message.id, message.groupId, emoji)}
                    onLongPressReaction={(_emoji, names) => {
                      if (names.length > 0) showAlert(t('groups.conversation.reactionsListTitle'), names.join(', '));
                    }}
                  />
                </View>
              );
            }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View style={styles.inputWrap}>
          <ChatInputBar
            value={draft}
            onChangeText={setDraft}
            onSend={handleSend}
            onAttach={handleAttach}
            sending={sending}
            attaching={attaching}
            replyTarget={
              replyTargetForInput?.message ? { message: replyTargetForInput.message, authorName: replyTargetAuthorName } : null
            }
            onCancelReply={() => setReplyToId(null)}
          />
        </View>
      </KeyboardAvoidingView>

      <MessageActionSheet
        visible={!!actionSheetMessage}
        isOwn={actionSheetMessage?.userId === user?.id}
        onCancel={() => setActionSheetMessageId(null)}
        onReact={(emoji) => {
          if (actionSheetMessage) toggleReaction(actionSheetMessage.id, actionSheetMessage.groupId, emoji);
          setActionSheetMessageId(null);
        }}
        onReply={() => {
          if (actionSheetMessage) setReplyToId(actionSheetMessage.id);
          setActionSheetMessageId(null);
        }}
        onCopy={() => actionSheetMessage && handleCopy(actionSheetMessage)}
        onReport={() => {
          const messageId = actionSheetMessageId;
          setActionSheetMessageId(null);
          if (messageId) setReportMessageId(messageId);
        }}
        onDelete={() => actionSheetMessage && handleDelete(actionSheetMessage.id)}
      />

      <TextInputModal
        visible={!!reportMessageId}
        title={t('groups.conversation.reportModal.title')}
        initialValue=""
        placeholder={t('groups.conversation.reportModal.placeholder')}
        onCancel={() => setReportMessageId(null)}
        onSave={async (motif) => {
          if (!reportMessageId) return;
          const result = await reportMessage(reportMessageId, motif);
          if (!result.ok) return result.error;
          setReportMessageId(null);
          showAlert(t('groups.conversation.reportModal.sentTitle'), t('groups.conversation.reportModal.sentMessage'));
        }}
      />

      <ImageViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
      position: 'relative',
      overflow: 'hidden',
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    infoButton: {
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
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    headerAvatar: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    headerAvatarImage: {
      width: '100%',
      height: '100%',
    },
    headerAvatarText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
    },
    headerTexts: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    dateSeparator: {
      alignItems: 'center',
      marginVertical: spacing.xs,
    },
    dateSeparatorText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      backgroundColor: colors.surface,
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    highlighted: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.lg,
    },
    loadingMore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    loadingMoreText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    inputWrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
  });
}
