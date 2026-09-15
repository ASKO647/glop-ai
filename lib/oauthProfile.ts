import type { User } from '@supabase/supabase-js';
import type { Profile } from '../context/ProfileContext';
import { generateUniqueReferralCode } from './referral';
import { generateUniqueUsername } from './username';
import { supabase } from './supabase';

/** Google's OAuth userinfo maps to `user_metadata.given_name`/`full_name`/`name` depending on
 * what the provider actually returned — fall back through them before giving up on a first name. */
function extractGivenName(user: User): string | null {
  const meta = user.user_metadata ?? {};
  if (typeof meta.given_name === 'string' && meta.given_name.trim()) return meta.given_name.trim();
  const full = typeof meta.full_name === 'string' ? meta.full_name : typeof meta.name === 'string' ? meta.name : null;
  if (full && full.trim()) return full.trim().split(/\s+/)[0];
  return null;
}

/**
 * First sign-in via an OAuth provider (Google) never goes through `signup.tsx`'s explicit
 * `profiles` insert, so `ProfileContext` calls this itself the first time it finds a session
 * with no matching row. Onboarding questionnaire fields are left null — the user answers those
 * on `/q/0` right after (see `(onboarding)/_layout.tsx` and `plan.tsx`'s authenticated branch).
 */
export async function createProfileFromOAuthUser(user: User): Promise<Profile | null> {
  const email = user.email ?? (typeof user.user_metadata?.email === 'string' ? user.user_metadata.email : null);
  const prenom = extractGivenName(user);
  const usernameSeed = email ?? user.id;

  const [codeParrainage, username] = await Promise.all([
    generateUniqueReferralCode(usernameSeed),
    generateUniqueUsername(usernameSeed),
  ]);

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email,
      prenom,
      username,
      code_parrainage: codeParrainage,
    })
    .select()
    .single();

  if (!error && data) return data as Profile;

  // Someone else already created the row in the same instant (e.g. two tabs signing in at
  // once, or `onAuthStateChange` firing twice) — re-read it instead of leaving `profile` null.
  const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return (existing as Profile) ?? null;
}
