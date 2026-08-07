import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import type { Profile } from '../context/ProfileContext';
import { moderateCoachImage, sendMessage, type ChatImage, type ChatMessage } from '../lib/coach';
import { compressImage } from '../lib/foodScanner';
import { uploadBase64Image } from '../lib/storageUpload';
import { supabase } from '../lib/supabase';

export type CoachMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  imagePath: string | null;
  imageSignedUrl: string | null;
};

export type PickedImage = { uri: string; width: number };

const HISTORY_LIMIT = 50;
const BUCKET = 'coach-images';
// compressImage() itself caps width at 1024px — this only overrides its default 0.5 quality.
const IMAGE_QUALITY = 0.6;
// 24h — same TTL as the other private-bucket signers in this app (useAvatar, useGroupMessages).
const SIGNED_URL_TTL_SECONDS = 86400;

type MessageRow = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  image_path: string | null;
};

/** Signs a batch of `coach-images` paths at once — same batching approach as `useGroupMessages`' image signing. */
async function signImagePaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  });
  return map;
}

function fromRow(row: MessageRow, imageSignedUrl: string | null): CoachMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    created_at: row.created_at,
    imagePath: row.image_path,
    imageSignedUrl,
  };
}

export function useCoachMessages(userId: string | undefined, profile: Profile | null) {
  const { locale, t } = useLocale();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);

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
        .select('id, role, content, created_at, image_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);

      const rows = ([...(data ?? [])].reverse() as MessageRow[]) ?? [];
      const imagePaths = rows.map((row) => row.image_path).filter((path): path is string => !!path);
      const urlByPath = await signImagePaths(imagePaths);

      if (!cancelled) {
        setMessages(rows.map((row) => fromRow(row, row.image_path ? urlByPath[row.image_path] ?? null : null)));
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = async (role: 'user' | 'assistant', content: string, imagePath: string | null): Promise<MessageRow | null> => {
    if (!userId) return null;
    const { data } = await supabase
      .from('messages')
      .insert({ user_id: userId, role, content, image_path: imagePath })
      .select('id, role, content, created_at, image_path')
      .single();
    return (data as MessageRow) ?? null;
  };

  const pushSystemMessage = (content: string) => {
    setMessages((current) => [
      ...current,
      { id: `local-error-${Date.now()}`, role: 'system', content, created_at: new Date().toISOString(), imagePath: null, imageSignedUrl: null },
    ]);
  };

  const send = async (text: string, picked?: PickedImage) => {
    const trimmed = text.trim();
    if (!trimmed && !picked) return;
    if (!userId) return;

    // Compression + moderation happen before anything is shown as "sending to the coach" — a
    // rejected image never reaches the conversation, the upload, or the Anthropic call.
    let compressed: ChatImage | null = null;
    if (picked) {
      setPreparingImage(true);
      try {
        compressed = await compressImage(picked.uri, picked.width, t, IMAGE_QUALITY);
        const moderation = await moderateCoachImage(compressed);
        if (moderation === 'rejected') {
          pushSystemMessage(t('coach.errors.imageRejected'));
          return;
        }
        if (moderation === 'check_failed') {
          pushSystemMessage(t('coach.errors.imageModerationFailed'));
          return;
        }
      } catch {
        pushSystemMessage(t('coach.errors.imagePrepareFailed'));
        return;
      } finally {
        setPreparingImage(false);
      }
    }

    let imagePath: string | null = null;
    let imageSignedUrl: string | null = null;
    if (compressed) {
      const path = `${userId}/${Date.now()}.jpg`;
      const uploadResult = await uploadBase64Image(BUCKET, path, compressed.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        pushSystemMessage(uploadResult.error ?? t('coach.errors.imageUploadFailed'));
        return;
      }
      imagePath = uploadResult.path;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(imagePath, SIGNED_URL_TTL_SECONDS);
      // Same anti-cache fix as the profile avatar upload: force a fresh URL rather than risk an
      // Image component treating this as a cached resource it's already seen.
      imageSignedUrl = data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null;
    }

    const optimisticUser: CoachMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
      imagePath,
      imageSignedUrl,
    };
    const historyForCoach = [...messages, optimisticUser];
    setMessages(historyForCoach);
    setSending(true);

    const savedUser = await persist('user', trimmed, imagePath);
    if (savedUser) {
      setMessages((current) => current.map((m) => (m.id === optimisticUser.id ? fromRow(savedUser, imageSignedUrl) : m)));
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
      const reply = await sendMessage(chatHistory, profile, locale, t, compressed ?? undefined);
      const savedAssistant = await persist('assistant', reply, null);
      setMessages((current) => [
        ...current,
        savedAssistant
          ? fromRow(savedAssistant, null)
          : {
              id: `local-${Date.now()}-a`,
              role: 'assistant',
              content: reply,
              created_at: new Date().toISOString(),
              imagePath: null,
              imageSignedUrl: null,
            },
      ]);
    } catch (error) {
      // sendMessage() throws distinct, French, status-specific messages (invalid key,
      // insufficient credit, rate limit, malformed request, ...) — show that instead of
      // a single generic string, or a 401 looks identical to a 429 to the user.
      const content = error instanceof Error ? error.message : t('coach.errors.fallback');
      pushSystemMessage(content);
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, preparingImage, send };
}
