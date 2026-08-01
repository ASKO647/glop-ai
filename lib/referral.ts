import { supabase } from './supabase';

const CODE_LENGTH = 8;
const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_ATTEMPTS = 10;

function randomChars(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return out;
}

/** "lucas.35@x.com" -> base "LUCAS" (up to 5 chars, letters/digits only) + a random suffix filling the rest of 8 chars. */
function buildCandidate(email: string): string {
  const local = email.split('@')[0] ?? '';
  const base = local.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  return `${base}${randomChars(CODE_LENGTH - base.length)}`;
}

/** Generates an 8-char referral code derived from the email, retrying on collision. */
export async function generateUniqueReferralCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = buildCandidate(email);
    const { data } = await supabase.from('profiles').select('id').eq('code_parrainage', candidate).maybeSingle();
    if (!data) return candidate;
  }
  // Astronomically unlikely fallback after MAX_ATTEMPTS collisions: pure random code.
  return randomChars(CODE_LENGTH);
}
