import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatInput from '../../components/coach/ChatInput';
import MessageBubble from '../../components/coach/MessageBubble';
import SuggestionChip from '../../components/coach/SuggestionChip';
import TypingIndicator from '../../components/coach/TypingIndicator';
import { colors, radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useCoachMessages } from '../../hooks/useCoachMessages';

const SUGGESTIONS = ['Comment perdre du gras ?', 'Que manger ce soir ?', 'Je manque de motivation'];

export default function CoachScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
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
          <Text style={styles.avatarText}>C</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Coach IA</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>En ligne</Text>
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
            <Text style={styles.emptyTitle}>Pose ta première question</Text>
            <Text style={styles.emptyText}>Ton coach IA est là pour t'aider, à tout moment.</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <SuggestionChip key={suggestion} label={suggestion} onPress={() => handleSend(suggestion)} />
              ))}
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

const styles = StyleSheet.create({
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
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
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
    paddingBottom: 100,
  },
});
