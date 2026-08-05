import { supabase } from './supabase';

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
