import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export type StorageUploadResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Uploads a base64-encoded image to a private Supabase Storage bucket as an `ArrayBuffer`.
 *
 * Supabase Storage doesn't reliably handle `File`/`Blob`/local-URI bodies in React Native —
 * uploads can report success while leaving the object missing or empty in the bucket. Every
 * image upload in this app must go through this helper: convert the compressed image to
 * base64 (`expo-image-manipulator`'s `saveAsync({ base64: true })`), decode it to an
 * `ArrayBuffer`, and upload that instead.
 *
 * The upload result alone isn't trusted either — this also lists the destination folder
 * afterward and only reports success once the object is actually there, so a caller never
 * inserts a database row (or shows a photo) that points at a file that doesn't exist.
 */
export async function uploadBase64Image(
  bucket: string,
  path: string,
  base64: string,
  contentType: string
): Promise<StorageUploadResult> {
  const arrayBuffer = decode(base64);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType, upsert: true });

  if (uploadError || !uploadData?.path) {
    console.error(`Failed to upload "${path}" to bucket "${bucket}":`, uploadError);
    return { ok: false, error: "Le téléversement de l'image a échoué. Vérifie ta connexion et réessaie." };
  }
  console.log(`Uploaded "${path}" to bucket "${bucket}" successfully.`);

  const slashIndex = path.lastIndexOf('/');
  const folder = slashIndex >= 0 ? path.slice(0, slashIndex) : '';
  const fileName = slashIndex >= 0 ? path.slice(slashIndex + 1) : path;

  const { data: listData, error: listError } = await supabase.storage.from(bucket).list(folder, { search: fileName });
  if (listError) {
    console.error(`Failed to verify "${path}" in bucket "${bucket}" after upload:`, listError);
    return { ok: false, error: "Impossible de confirmer l'enregistrement de l'image. Réessaie." };
  }
  const found = (listData ?? []).some((item) => item.name === fileName);
  if (!found) {
    console.error(`Upload reported success but "${path}" is not listed in bucket "${bucket}" afterward.`);
    return { ok: false, error: "Le fichier n'a pas été retrouvé dans le stockage après l'envoi. Réessaie." };
  }

  return { ok: true, path: uploadData.path };
}
