import { Copy, Flag, Reply, Trash2 } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { REACTION_EMOJIS } from '../../hooks/useMessageReactions';

type MessageActionSheetProps = {
  visible: boolean;
  isOwn: boolean;
  onCancel: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onReport: () => void;
  onDelete: () => void;
};

export default function MessageActionSheet({
  visible,
  isOwn,
  onCancel,
  onReact,
  onReply,
  onCopy,
  onReport,
  onDelete,
}: MessageActionSheetProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={onCancel} />

        <View style={styles.sheet}>
          <View style={styles.reactionRow}>
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                accessibilityRole="button"
                onPress={() => onReact(emoji)}
                style={({ pressed }) => [styles.reactionButton, pressed && styles.pressed]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.menu}>
            <MenuRow icon={<Reply color={colors.textPrimary} size={18} />} label={t('groups.conversation.menu.reply')} onPress={onReply} />
            <MenuRow icon={<Copy color={colors.textPrimary} size={18} />} label={t('groups.conversation.menu.copy')} onPress={onCopy} />
            {!isOwn && (
              <MenuRow icon={<Flag color={colors.danger} size={18} />} label={t('groups.conversation.menu.report')} onPress={onReport} danger />
            )}
            {isOwn && (
              <MenuRow icon={<Trash2 color={colors.danger} size={18} />} label={t('groups.conversation.menu.delete')} onPress={onDelete} danger />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MenuRow({ icon, label, onPress, danger }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      {icon}
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii['2xl'],
      borderTopRightRadius: radii['2xl'],
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    reactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: radii.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    reactionButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reactionEmoji: {
      fontSize: 24,
    },
    pressed: {
      opacity: 0.6,
    },
    menu: {
      gap: spacing.xs,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    menuLabelDanger: {
      color: colors.danger,
    },
  });
}
