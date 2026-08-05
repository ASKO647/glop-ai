import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatInput from '../../components/coach/ChatInput';
import MessageBubble from '../../components/coach/MessageBubble';
import SuggestionChip from '../../components/coach/SuggestionChip';
import TypingIndicator from '../../components/coach/TypingIndicator';
import AppImage from '../../components/ui/AppImage';
import { appImage } from '../../constants/images';
import { TAB_BAR_CLEARANCE } from '../../constants/layout';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { useCoachMessages } from '../../hooks/useCoachMessages';

const SUGGESTION_KEYS = ['loseFat', 'dinner', 'motivation'] as const;

export default function CoachScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { messages, loading, sending, send } = useCoachMessages(user?.id, profile);
  const [draft, setDraft] = useState('');

  const handleSend = (text: string) => {
    if (!text.trim() || sending) return;
    send(text);
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppImage source={appImage('logo-mark.png')} style={styles.avatarLogo} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('coach.headerTitle')}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{t('coach.online')}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('coach.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('coach.emptyText')}</Text>
            <View style={styles.suggestions}>
              {SUGGESTION_KEYS.map((key) => {
                const label = t(`coach.suggestions.${key}`);
                return <SuggestionChip key={key} label={label} onPress={() => handleSend(label)} />;
              })}
            </View>
          </View>
        ) : (
          <FlatList
            inverted
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble role={item.role} text={item.content} />}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {sending && messages.length > 0 && (
          <View style={styles.typingWrap}>
            <TypingIndicator />
          </View>
        )}

        <View style={styles.inputWrap}>
          <ChatInput value={draft} onChangeText={setDraft} onSend={() => handleSend(draft)} disabled={sending} />
        </View>
      </KeyboardAvoidingView>
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
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ~65% of the 40px circle.
  avatarLogo: {
    width: 26,
    height: 26,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  typingWrap: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  inputWrap: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  });
}
