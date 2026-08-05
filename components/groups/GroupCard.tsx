import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { GroupSummary } from '../../hooks/useGroups';

type GroupCardProps = {
  group: GroupSummary;
  onPress: () => void;
};

/** "14:32" for messages sent today, otherwise a short date — mirrors WeekStrip's compactness. */
function formatMessageTime(iso: string, locale: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export default function GroupCard({ group, onPress }: GroupCardProps) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = makeStyles(colors);

  const initial = group.nom.trim().charAt(0).toUpperCase() || '?';
  const preview = group.lastMessage
    ? group.lastMessage.hasImage && !group.lastMessage.contenu
      ? t('groups.lastMessageImage')
      : group.lastMessage.contenu ?? ''
    : null;
  const previewAuthor = group.lastMessage?.authorPrenom;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {group.nom}
        </Text>
        {preview ? (
          <Text style={styles.preview} numberOfLines={1}>
            {previewAuthor ? <Text style={styles.previewAuthor}>{previewAuthor}: </Text> : null}
            {preview}
          </Text>
        ) : (
          <Text style={styles.preview} numberOfLines={1}>
            {t('groups.memberCount', { count: group.memberCount })}
          </Text>
        )}
      </View>

      <View style={styles.meta}>
        {group.lastMessage ? <Text style={styles.time}>{formatMessageTime(group.lastMessage.createdAt, locale)}</Text> : null}
        {group.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{group.unreadCount > 99 ? '99+' : group.unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    pressed: {
      opacity: 0.8,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    body: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    preview: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    previewAuthor: {
      fontWeight: '600',
    },
    meta: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    time: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadCount: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.onAccent,
    },
  });
}
