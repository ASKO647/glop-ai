import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { GroupMessage } from '../../hooks/useGroupMessages';
import type { ReactionSummary } from '../../hooks/useMessageReactions';

type ReplyPreview = {
  authorName: string | null;
  contenu: string | null;
  hasImage: boolean;
  deleted: boolean;
};

type MessageBubbleProps = {
  message: GroupMessage;
  isOwn: boolean;
  showAuthor: boolean;
  authorName: string | null;
  replyPreview: ReplyPreview | null;
  reactions: ReactionSummary[];
  onLongPress: () => void;
  onPressReplyBanner: () => void;
  onPressImage: (url: string) => void;
  onToggleReaction: (emoji: string) => void;
  onLongPressReaction: (emoji: string, names: string[]) => void;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({
  message,
  isOwn,
  showAuthor,
  authorName,
  replyPreview,
  reactions,
  onLongPress,
  onPressReplyBanner,
  onPressImage,
  onToggleReaction,
  onLongPressReaction,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = makeStyles(colors);

  const initial = (authorName ?? '?').trim().charAt(0).toUpperCase() || '?';
  const isDeleted = !!message.deletedAt;

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <View style={styles.avatarSlot}>
          {showAuthor && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.bubbleColumn}>
        {!isOwn && showAuthor && authorName && <Text style={styles.authorName}>{authorName}</Text>}

        <Pressable
          accessibilityRole="button"
          onLongPress={isDeleted ? undefined : onLongPress}
          disabled={isDeleted}
          style={({ pressed }) => [
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
            isDeleted && styles.bubbleDeleted,
            pressed && !isDeleted && styles.pressed,
          ]}
        >
          {isDeleted ? (
            <Text style={styles.deletedText}>{t('groups.conversation.deletedMessage')}</Text>
          ) : (
            <>
              {replyPreview && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onPressReplyBanner}
                  style={[styles.replyBanner, isOwn ? styles.replyBannerOwn : styles.replyBannerOther]}
                >
                  <Text style={[styles.replyAuthor, isOwn && styles.replyAuthorOwn]} numberOfLines={1}>
                    {replyPreview.authorName ?? ''}
                  </Text>
                  <Text style={[styles.replyExcerpt, isOwn && styles.replyExcerptOwn]} numberOfLines={1}>
                    {replyPreview.deleted
                      ? t('groups.conversation.deletedMessage')
                      : replyPreview.hasImage && !replyPreview.contenu
                        ? t('groups.lastMessageImage')
                        : (replyPreview.contenu ?? '')}
                  </Text>
                </Pressable>
              )}

              {message.imagePath && message.imageSignedUrl && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.conversation.photoAccessibility')}
                  onPress={() => onPressImage(message.imageSignedUrl as string)}
                >
                  <Image source={{ uri: message.imageSignedUrl }} style={styles.image} resizeMode="cover" />
                </Pressable>
              )}

              {message.contenu && (
                <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>{message.contenu}</Text>
              )}
            </>
          )}
        </Pressable>

        {reactions.length > 0 && (
          <View style={[styles.reactionsRow, isOwn && styles.reactionsRowOwn]}>
            {reactions.map((reaction) => (
              <Pressable
                key={reaction.emoji}
                accessibilityRole="button"
                onPress={() => onToggleReaction(reaction.emoji)}
                onLongPress={() => onLongPressReaction(reaction.emoji, reaction.reactorNames)}
                style={[styles.reactionPill, reaction.reactedByMe && styles.reactionPillActive]}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                {reaction.count > 1 && <Text style={styles.reactionCount}>{reaction.count}</Text>}
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    rowOwn: {
      justifyContent: 'flex-end',
    },
    rowOther: {
      justifyContent: 'flex-start',
    },
    avatarSlot: {
      width: 28,
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: radii.full,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    bubbleColumn: {
      maxWidth: '78%',
      gap: 2,
    },
    authorName: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      marginLeft: spacing.sm,
    },
    bubble: {
      borderRadius: radii.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    bubbleOther: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
    },
    bubbleOwn: {
      backgroundColor: colors.accent,
      borderBottomRightRadius: 4,
    },
    bubbleDeleted: {
      backgroundColor: colors.surface,
      opacity: 0.6,
    },
    pressed: {
      opacity: 0.85,
    },
    deletedText: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.textTertiary,
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
    },
    textOther: {
      color: colors.stepTextDone,
    },
    textOwn: {
      color: colors.onAccent,
    },
    image: {
      width: 200,
      height: 200,
      borderRadius: radii.md,
    },
    replyBanner: {
      borderLeftWidth: 2,
      paddingLeft: spacing.sm,
      paddingVertical: 2,
    },
    replyBannerOther: {
      borderLeftColor: colors.accent,
    },
    replyBannerOwn: {
      borderLeftColor: colors.onAccent,
    },
    replyAuthor: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
    },
    replyAuthorOwn: {
      color: colors.onAccent,
    },
    replyExcerpt: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    replyExcerptOwn: {
      color: colors.onAccent,
      opacity: 0.8,
    },
    reactionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginLeft: spacing.sm,
    },
    reactionsRowOwn: {
      justifyContent: 'flex-end',
      marginLeft: 0,
      marginRight: spacing.sm,
    },
    reactionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    reactionPillActive: {
      borderColor: colors.accent,
    },
    reactionEmoji: {
      fontSize: 12,
    },
    reactionCount: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    time: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    timeOther: {
      marginLeft: spacing.sm,
    },
    timeOwn: {
      alignSelf: 'flex-end',
      marginRight: spacing.sm,
    },
  });
}
