import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../lib/supabase';
import { uploadBase64Image } from '../lib/storageUpload';

const BUCKET = 'skin-photos';
const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.6;
// 24h — same TTL as the other private-bucket signers in this app (useAvatar, useProgressPhotos).
const SIGNED_URL_TTL_SECONDS = 86400;

export type SkinPhotoType = 'evolution' | 'probleme';

export type SkinPhoto = {
  id: string;
  type: SkinPhotoType;
  storagePath: string;
  takenAt: string;
  analysis: Record<string, unknown> | null;
  signedUrl: string | null;
};

type SkinPhotoRow = {
  id: string;
  storage_path: string;
  type: SkinPhotoType;
  taken_at: string;
  analysis: Record<string, unknown> | null;
};

async function signRow(row: SkinPhotoRow): Promise<SkinPhoto> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error(`Failed to sign skin photo URL for ${row.storage_path}:`, error);
  }
  return {
    id: row.id,
    type: row.type,
    storagePath: row.storage_path,
    takenAt: row.taken_at,
    analysis: row.analysis,
    // Same anti-cache fix as the profile avatar upload: force a fresh URL after every upload
    // rather than risk an Image component treating this as a resource it's already cached.
    signedUrl: data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null,
  };
}

type AddPhotoResult = { ok: true; photo: SkinPhoto } | { ok: false; error?: string };

/**
 * Reads/writes `skin_photos` + the private `skin-photos` storage bucket. `type: 'evolution'`
 * rows have no dedicated "before"/"now" slot column — they're plain history rows, and the
 * oldest/newest of that set are what the "Mon évolution" tab labels "Avant"/"Maintenant".
 * `type: 'probleme'` rows are a flat history, newest first.
 */
export function useSkinPhotos(userId: string | undefined) {
  const { t } = useLocale();
  const [photos, setPhotos] = useState<SkinPhoto[]>([]);
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
      .from('skin_photos')
      .select('id, storage_path, type, taken_at, analysis')
      .eq('user_id', userId)
      .order('taken_at', { ascending: true });

    const signed = await Promise.all(((data ?? []) as SkinPhotoRow[]).map(signRow));
    setPhotos(signed);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const evolutionPhotos = photos.filter((p) => p.type === 'evolution');
  const beforePhoto = evolutionPhotos[0] ?? null;
  const nowPhoto = evolutionPhotos.length > 1 ? evolutionPhotos[evolutionPhotos.length - 1] : null;
  const problemPhotos = [...photos.filter((p) => p.type === 'probleme')].reverse();

  /** Compresses, uploads to `{user_id}/{timestamp}.jpg` and inserts a new history row. */
  const addPhoto = async (type: SkinPhotoType, uri: string, originalWidth: number): Promise<AddPhotoResult> => {
    if (!userId) return { ok: false };
    setUploading(true);

    try {
      const targetWidth = originalWidth > 0 ? Math.min(originalWidth, MAX_WIDTH) : MAX_WIDTH;
      const context = ImageManipulator.manipulate(uri).resize({ width: targetWidth });
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG, base64: true });

      if (!result.base64) {
        console.error('Image compression did not return base64 data for the skin photo.');
        return { ok: false, error: t('skincare.errors.prepareFailed') };
      }

      const storagePath = `${userId}/${Date.now()}.jpg`;
      const uploadResult = await uploadBase64Image(BUCKET, storagePath, result.base64, 'image/jpeg');
      if (!uploadResult.ok) {
        return { ok: false, error: uploadResult.error };
      }

      const { data, error } = await supabase
        .from('skin_photos')
        .insert({ user_id: userId, storage_path: storagePath, type })
        .select('id, storage_path, type, taken_at, analysis')
        .single();
      if (error || !data) {
        console.error('Failed to insert skin_photos row:', error);
        return { ok: false, error: t('skincare.errors.saveFailed') };
      }

      const photo = await signRow(data as SkinPhotoRow);
      setPhotos((prev) => [...prev, photo]);
      return { ok: true, photo };
    } catch (err) {
      console.error('Failed to add skin photo:', err);
      return { ok: false, error: t('skincare.errors.photoError') };
    } finally {
      setUploading(false);
    }
  };

  const saveAnalysis = async (photoId: string, analysis: Record<string, unknown>): Promise<boolean> => {
    const { error } = await supabase.from('skin_photos').update({ analysis }).eq('id', photoId);
    if (error) {
      console.error('Failed to save skin photo analysis:', error);
      return false;
    }
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, analysis } : p)));
    return true;
  };

  return { evolutionPhotos, beforePhoto, nowPhoto, problemPhotos, loading, uploading, addPhoto, saveAnalysis };
}

/** Lightweight count-only query for the profile screen's "Skincare" row — avoids loading and signing every photo just to show a number. */
export function useSkincareAnalysesCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { count: total } = await supabase
        .from('skin_photos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('analysis', 'is', null);
      if (!cancelled) {
        setCount(total ?? 0);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { count, loading };
}
