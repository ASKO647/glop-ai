import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useState } from 'react';
import { todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';
import { uploadBase64Image } from '../lib/storageUpload';

const BUCKET = 'progress-photos';
const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.6;
// 24h — long enough that a screen left mounted in the background doesn't need to re-sign.
const SIGNED_URL_TTL_SECONDS = 86400;

export type PhotoSlot = 'avant' | 'milieu' | 'apres';

export const PHOTO_SLOTS: PhotoSlot[] = ['avant', 'milieu', 'apres'];

export const SLOT_LABELS: Record<PhotoSlot, string> = {
  avant: 'Avant',
  milieu: 'Milieu',
  apres: 'Après',
};

export type ProgressPhoto = {
  id: string;
  slot: PhotoSlot;
  date: string;
  storagePath: string;
  poids: number | null;
  createdAt: string;
  signedUrl: string | null;
};

type ProgressPhotoRow = {
  id: string;
  slot: PhotoSlot;
  date: string;
  storage_path: string;
  poids: number | null;
  created_at: string;
};

async function signRow(row: ProgressPhotoRow): Promise<ProgressPhoto> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error(`Failed to sign progress photo URL for ${row.storage_path}:`, error);
  }
  return {
    id: row.id,
    slot: row.slot,
    date: row.date,
    storagePath: row.storage_path,
    poids: row.poids,
    createdAt: row.created_at,
    // Cache-bust: the storage path is fixed per slot (`{user_id}/{slot}.jpg`), so replacing a
    // photo reuses the exact same path — append a fresh timestamp so RN's <Image> treats the
    // new signed URL as a different resource instead of reusing whatever it fetched before.
    signedUrl: data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null,
  };
}

type PhotosBySlot = Record<PhotoSlot, ProgressPhoto | null>;
const EMPTY_SLOTS: PhotosBySlot = { avant: null, milieu: null, apres: null };

/** Reads/writes `progress_photos` + the private `progress-photos` storage bucket — exactly one photo per slot (avant/milieu/après). */
export function useProgressPhotos(userId: string | undefined) {
  const [photosBySlot, setPhotosBySlot] = useState<PhotosBySlot>(EMPTY_SLOTS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setPhotosBySlot(EMPTY_SLOTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('progress_photos')
      .select('id, slot, date, storage_path, poids, created_at')
      .eq('user_id', userId);

    const signed = await Promise.all(((data ?? []) as ProgressPhotoRow[]).map(signRow));
    const next: PhotosBySlot = { ...EMPTY_SLOTS };
    signed.forEach((photo) => {
      next[photo.slot] = photo;
    });
    setPhotosBySlot(next);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Compresses, uploads to `{user_id}/{slot}.jpg` (overwriting that slot's photo if one exists) and upserts the row. */
  const addPhoto = async (
    slot: PhotoSlot,
    uri: string,
    originalWidth: number,
    poidsToday: number | null
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!userId) return { ok: false };
    setUploading(true);

    try {
      const targetWidth = originalWidth > 0 ? Math.min(originalWidth, MAX_WIDTH) : MAX_WIDTH;
      const context = ImageManipulator.manipulate(uri).resize({ width: targetWidth });
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG, base64: true });

      if (!result.base64) {
        console.error('Image compression did not return base64 data for the progress photo.');
        return { ok: false, error: "Impossible de préparer cette image. Réessaie." };
      }

      const storagePath = `${userId}/${slot}.jpg`;
      const uploadResult = await uploadBase64Image(BUCKET, storagePath, result.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        return { ok: false, error: uploadResult.error };
      }

      const today = todayISODate();
      const existing = photosBySlot[slot];
      if (existing) {
        const { error } = await supabase
          .from('progress_photos')
          .update({ date: today, storage_path: storagePath, poids: poidsToday })
          .eq('id', existing.id);
        if (error) {
          console.error('Failed to update progress photo row:', error);
          return { ok: false, error: "L'enregistrement de la photo a échoué. Réessaie." };
        }
      } else {
        const { error } = await supabase
          .from('progress_photos')
          .insert({ user_id: userId, slot, date: today, storage_path: storagePath, poids: poidsToday });
        if (error) {
          console.error('Failed to insert progress photo row:', error);
          return { ok: false, error: "L'enregistrement de la photo a échoué. Réessaie." };
        }
      }

      await load();
      return { ok: true };
    } catch (err) {
      console.error('Failed to add progress photo:', err);
      return { ok: false, error: "Impossible d'enregistrer cette photo. Réessaie." };
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (slot: PhotoSlot): Promise<boolean> => {
    const existing = photosBySlot[slot];
    if (!existing) return false;
    // Best-effort: an already-missing storage object shouldn't block removing the row.
    await supabase.storage.from(BUCKET).remove([existing.storagePath]);
    const { error } = await supabase.from('progress_photos').delete().eq('id', existing.id);
    if (error) {
      console.error('Failed to delete progress photo row:', error);
      return false;
    }
    setPhotosBySlot((prev) => ({ ...prev, [slot]: null }));
    return true;
  };

  return { photosBySlot, loading, uploading, addPhoto, deletePhoto };
}
