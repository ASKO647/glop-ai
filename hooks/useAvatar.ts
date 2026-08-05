import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabase';
import { uploadBase64Image } from '../lib/storageUpload';

const BUCKET = 'avatars';
const MAX_WIDTH = 512;
const COMPRESS_QUALITY = 0.7;
// 24h — long enough that a screen left mounted in the background doesn't need to re-sign.
const SIGNED_URL_TTL_SECONDS = 86400;

/**
 * Signs `avatarPath` (from `profiles.avatar_path`) for display, and writes to the private
 * `avatars` bucket + that same column. The caller owns `avatarPath` (via `ProfileContext`)
 * and is expected to call `refreshProfile()` after a successful upload/delete.
 */
export function useAvatar(userId: string | undefined, avatarPath: string | null | undefined) {
  const { t } = useLocale();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Extracted so uploadAvatar() can force a fresh sign after a replacement — the storage path
  // is always `{user_id}/avatar.jpg`, so `avatarPath` never actually changes on re-upload and
  // the effect below wouldn't rerun on its own, leaving the old photo on screen.
  const sign = useCallback(async (path: string | null) => {
    if (!path) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) {
      console.error(`Failed to sign avatar URL for ${path}:`, error);
    }
    // Cache-bust: same path in, same signed token shape out — append a fresh timestamp so
    // RN's <Image> (and any HTTP cache in front of Storage) treats this as a new resource
    // instead of reusing whatever it fetched for the previous photo at this path.
    setSignedUrl(data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    sign(avatarPath ?? null);
  }, [avatarPath, sign]);

  /** Compresses, uploads to `{user_id}/avatar.jpg` (overwriting any existing photo) and saves the path on `profiles`. */
  const uploadAvatar = async (uri: string, originalWidth: number): Promise<{ ok: boolean; error?: string }> => {
    if (!userId) return { ok: false };
    setUploading(true);

    try {
      const targetWidth = originalWidth > 0 ? Math.min(originalWidth, MAX_WIDTH) : MAX_WIDTH;
      const context = ImageManipulator.manipulate(uri).resize({ width: targetWidth });
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG, base64: true });

      if (!result.base64) {
        console.error('Image compression did not return base64 data for the avatar.');
        return { ok: false, error: t('profile.avatar.prepareFailed') };
      }

      const storagePath = `${userId}/avatar.jpg`;
      const uploadResult = await uploadBase64Image(BUCKET, storagePath, result.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        return { ok: false, error: uploadResult.error };
      }

      const { error } = await supabase.from('profiles').update({ avatar_path: storagePath }).eq('id', userId);
      if (error) {
        console.error('Failed to save avatar_path on profile:', error);
        return { ok: false, error: t('profile.avatar.saveFailed') };
      }

      // The path is unchanged from before this upload (always `{user_id}/avatar.jpg`), so
      // nothing will otherwise trigger a re-sign — force it here rather than relying on the
      // `avatarPath` effect.
      await sign(storagePath);
      return { ok: true };
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      return { ok: false, error: t('profile.avatar.uploadFailed') };
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!userId || !avatarPath) return false;
    // Best-effort: an already-missing storage object shouldn't block clearing the column.
    await supabase.storage.from(BUCKET).remove([avatarPath]);
    const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', userId);
    if (error) {
      console.error('Failed to clear avatar_path on profile:', error);
      return false;
    }
    return true;
  };

  return { signedUrl, loading, uploading, uploadAvatar, deleteAvatar };
}
