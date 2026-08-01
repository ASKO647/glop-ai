import { useEffect, useState } from 'react';
import type { Profile } from '../context/ProfileContext';
import { sendMessage, type ChatMessage } from '../lib/coach';
import { supabase } from '../lib/supabase';

export type CoachMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

const HISTORY_LIMIT = 50;
const FALLBACK_ERROR_TEXT = "Le coach n'a pas pu répondre. Vérifie ta connexion et réessaie.";

export function useCoachMessages(userId: string | undefined, profile: Profile | null) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);

      if (!cancelled) {
        setMessages([...(data ?? [])].reverse() as CoachMessage[]);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = async (role: 'user' | 'assistant', content: string): Promise<CoachMessage | null> => {
    if (!userId) return null;
    const { data } = await supabase
      .from('messages')
      .insert({ user_id: userId, role, content })
      .select('id, role, content, created_at')
      .single();
    return (data as CoachMessage) ?? null;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;

    const optimisticUser: CoachMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    const historyForCoach = [...messages, optimisticUser];
    setMessages(historyForCoach);
    setSending(true);

    const savedUser = await persist('user', trimmed);
    if (savedUser) {
      setMessages((current) => current.map((m) => (m.id === optimisticUser.id ? savedUser : m)));
    }

    try {
      // Drop 'system' entries (local-only error bubbles, never persisted) instead of folding
      // them into 'user' — otherwise a system bubble sitting between two real user turns sends
      // Anthropic two consecutive user messages, which the API rejects with a 400.
      const chatHistory: ChatMessage[] = historyForCoach
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }));
      const reply = await sendMessage(chatHistory, profile);
      const savedAssistant = await persist('assistant', reply);
      setMessages((current) => [
        ...current,
        savedAssistant ?? {
          id: `local-${Date.now()}-a`,
          role: 'assistant',
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      // sendMessage() throws distinct, French, status-specific messages (invalid key,
      // insufficient credit, rate limit, malformed request, ...) — show that instead of
      // a single generic string, or a 401 looks identical to a 429 to the user.
      const content = error instanceof Error ? error.message : FALLBACK_ERROR_TEXT;
      setMessages((current) => [
        ...current,
        {
          id: `local-error-${Date.now()}`,
          role: 'system',
          content,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, send };
}
