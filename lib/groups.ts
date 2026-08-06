import { supabase } from './supabase';

const GROUP_IMAGES_BUCKET = 'group-images';
// 24h — long enough that a screen left mounted in the background doesn't need to re-sign.
const GROUP_IMAGE_SIGNED_URL_TTL_SECONDS = 86400;

/** Signs a batch of `group-images` paths (avatar/banner) at once — same batching approach as `useGroupMessages`' image signing. */
export async function signGroupImagePaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(GROUP_IMAGES_BUCKET)
    .createSignedUrls(paths, GROUP_IMAGE_SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  });
  return map;
}

const CODE_LENGTH = 6;
const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_ATTEMPTS = 10;

function randomCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return out;
}

/** Generates a 6-char uppercase alphanumeric group invite code, retrying on collision. */
export async function generateUniqueGroupCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomCode();
    const { data } = await supabase.from('groups').select('id').eq('code_invitation', candidate).maybeSingle();
    if (!data) return candidate;
  }
  // Astronomically unlikely fallback after MAX_ATTEMPTS collisions.
  return randomCode();
}
