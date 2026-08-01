import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useState } from 'react';
import { todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

const BUCKET = 'progress-photos';
const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.6;
const SIGNED_URL_TTL_SECONDS = 3600;

export type ProgressPhoto = {
  id: string;
  date: string;
  storagePath: string;
  poids: number | null;
  createdAt: string;
  signedUrl: string | null;
};

type ProgressPhotoRow = {
  id: string;
  date: string;
  storage_path: string;
  poids: number | null;
  created_at: string;
};

async function signPhotos(rows: ProgressPhotoRow[]): Promise<ProgressPhoto[]> {
  return Promise.all(
    rows.map(async (row) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      return {
        id: row.id,
        date: row.date,
        storagePath: row.storage_path,
        poids: row.poids,
        createdAt: row.created_at,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );
}

/** Reads/writes `progress_photos` + the private `progress-photos` storage bucket (one photo per day, keyed by date). */
export function useProgressPhotos(userId: string | undefined) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('progress_photos')
      .select('id, date, storage_path, poids, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    const signed = await signPhotos((data ?? []) as ProgressPhotoRow[]);
    setPhotos(signed);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Compresses, uploads to `{user_id}/{date}.jpg` (overwriting today's photo if one exists) and upserts the row. */
  const addPhoto = async (uri: string, originalWidth: number, poidsToday: number | null): Promise<boolean> => {
    if (!userId) return false;
    setUploading(true);

    try {
      const targetWidth = originalWidth > 0 ? Math.min(originalWidth, MAX_WIDTH) : MAX_WIDTH;
      const context = ImageManipulator.manipulate(uri).resize({ width: targetWidth });
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG });

      const today = todayISODate();
      const storagePath = `${userId}/${today}.jpg`;

      const response = await fetch(result.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) return false;

      const existing = photos.find((photo) => photo.date === today);
      if (existing) {
        const { error } = await supabase
          .from('progress_photos')
          .update({ storage_path: storagePath, poids: poidsToday })
          .eq('id', existing.id);
        if (error) return false;
      } else {
        const { error } = await supabase
          .from('progress_photos')
          .insert({ user_id: userId, date: today, storage_path: storagePath, poids: poidsToday });
        if (error) return false;
      }

      await load();
      return true;
    } catch {
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: ProgressPhoto): Promise<boolean> => {
    // Best-effort: an already-missing storage object shouldn't block removing the row.
    await supabase.storage.from(BUCKET).remove([photo.storagePath]);
    const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id);
    if (error) return false;
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    return true;
  };

  return { photos, loading, uploading, addPhoto, deletePhoto };
}
