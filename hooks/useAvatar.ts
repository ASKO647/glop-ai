import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const sign = async () => {
      if (!avatarPath) {
        setSignedUrl(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(avatarPath, SIGNED_URL_TTL_SECONDS);
      if (error) {
        console.error(`Failed to sign avatar URL for ${avatarPath}:`, error);
      }
      if (!cancelled) {
        setSignedUrl(data?.signedUrl ?? null);
        setLoading(false);
      }
    };

    sign();
    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

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
        return { ok: false, error: "Impossible de préparer cette image. Réessaie." };
      }

      const storagePath = `${userId}/avatar.jpg`;
      const uploadResult = await uploadBase64Image(BUCKET, storagePath, result.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        return { ok: false, error: uploadResult.error };
      }

      const { error } = await supabase.from('profiles').update({ avatar_path: storagePath }).eq('id', userId);
      if (error) {
        console.error('Failed to save avatar_path on profile:', error);
        return { ok: false, error: "L'enregistrement de ta photo de profil a échoué. Réessaie." };
      }

      return { ok: true };
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      return { ok: false, error: "Impossible d'enregistrer ta photo de profil. Réessaie." };
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
