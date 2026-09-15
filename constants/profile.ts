import type { Profile } from '../context/ProfileContext';

type UserLike = { email?: string | null } | null | undefined;

/**
 * Prénom > nom d'utilisateur > email (partie locale dérivée, capitalisée) — remplace l'ancien
 * repli "toujours sur l'email" maintenant que `profiles.prenom`/`.username` existent.
 */
export function getDisplayName(profile: Profile | null, user: UserLike): string | null {
  if (profile?.prenom) return profile.prenom;
  if (profile?.username) return profile.username;

  const email = profile?.email ?? user?.email ?? null;
  if (!email) return null;
  const local = email.split('@')[0];
  const match = local.match(/^[a-zA-Z]+/);
  const name = match ? match[0] : local;
  if (!name) return null;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Whether this account has ever finished the onboarding questionnaire — used to route a
 * signed-in, not-yet-subscribed user to `/q/0` instead of straight to `/paywall`
 * ((onboarding)/_layout.tsx). No dedicated column for this: `objectif` ("goal") is the very
 * first mandatory, non-skippable question in the flow (see constants/onboardingFlow.ts) and is
 * always written in the same insert/update as every other answer, so it's already a reliable,
 * all-or-nothing signal that the whole questionnaire was completed — a Google sign-in leaves it
 * null until the user actually goes through `/q/0`..`/plan` (see lib/oauthProfile.ts).
 */
export function hasCompletedOnboardingQuestionnaire(profile: Profile | null): boolean {
  return !!profile && profile.objectif !== null;
}
