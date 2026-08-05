import { supabase } from './supabase';

const MAX_ATTEMPTS = 10;
const MIN_LENGTH = 3;
// Leaves room for a 3-digit numeric suffix without exceeding the 20-char username limit.
const MAX_BASE_LENGTH = 17;

function randomDigits(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

/** "lucas.35@x.com" -> base "lucas35" (lowercase letters/digits/underscore only, up to 17 chars). */
function buildBase(email: string): string {
  const local = email.split('@')[0] ?? '';
  const cleaned = local.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, MAX_BASE_LENGTH);
  return cleaned.length >= MIN_LENGTH ? cleaned : cleaned.padEnd(MIN_LENGTH, '0');
}

/**
 * Generates a username from the start of the email, lowercased — the plain base first, only
 * appending 3 random digits (and retrying) if that base is already taken.
 */
export async function generateUniqueUsername(email: string): Promise<string> {
  const base = buildBase(email);

  const { data: exact } = await supabase.from('profiles').select('id').eq('username', base).maybeSingle();
  if (!exact) return base;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${base}${randomDigits(3)}`;
    const { data } = await supabase.from('profiles').select('id').eq('username', candidate).maybeSingle();
    if (!data) return candidate;
  }
  // Astronomically unlikely fallback after MAX_ATTEMPTS collisions on the suffixed form too.
  return `${base}${randomDigits(6)}`;
}
