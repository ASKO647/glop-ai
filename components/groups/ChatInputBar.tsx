import { Paperclip, Send, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { GroupMessage } from '../../hooks/useGroupMessages';

type ChatInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  sending: boolean;
  attaching: boolean;
  replyTarget: { message: GroupMessage; authorName: string | null } | null;
  onCancelReply: () => void;
};

export default function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onAttach,
  sending,
  attaching,
  replyTarget,
  onCancelReply,
}: ChatInputBarProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = makeStyles(colors);
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View>
      {replyTarget && (
        <View style={styles.replyPreview}>
          <View style={styles.replyPreviewBody}>
            <Text style={styles.replyPreviewLabel} numberOfLines={1}>
              {t('groups.conversation.replyingTo', { name: replyTarget.authorName ?? '' })}
            </Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              {replyTarget.message.deletedAt
                ? t('groups.conversation.deletedMessage')
                : replyTarget.message.contenu ?? (replyTarget.message.imagePath ? t('groups.lastMessageImage') : '')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.conversation.cancelReplyAccessibility')}
            onPress={onCancelReply}
            hitSlop={8}
          >
            <X color={colors.textSecondary} size={16} />
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.conversation.attachAccessibility')}
          onPress={onAttach}
          disabled={attaching}
          hitSlop={8}
          style={({ pressed }) => [styles.attachButton, pressed && styles.pressed]}
        >
          {attaching ? <ActivityIndicator color={colors.textSecondary} size="small" /> : <Paperclip color={colors.textSecondary} size={20} />}
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('groups.conversation.inputPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          multiline
          numberOfLines={4}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.conversation.sendAccessibility')}
          onPress={onSend}
          disabled={!canSend}
          style={({ pressed }) => [styles.sendButton, !canSend && styles.sendButtonDisabled, pressed && canSend && styles.pressed]}
        >
          <Send color={colors.onAccent} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    pressed: {
      opacity: 0.7,
    },
    attachButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
    replyPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: colors.accent,
      borderRadius: radii.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
    },
    replyPreviewBody: {
      flex: 1,
      marginRight: spacing.sm,
    },
    replyPreviewLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    replyPreviewText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
