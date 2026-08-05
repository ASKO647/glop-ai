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
