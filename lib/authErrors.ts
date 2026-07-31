export type AuthErrorField = 'email' | 'password' | 'form';

export type MappedAuthError = {
  field: AuthErrorField;
  message: string;
};

/** Translates a raw Supabase auth error message into a French message, attached to a form field. */
export function mapAuthError(rawMessage: string | null | undefined): MappedAuthError {
  const normalized = (rawMessage ?? '').toLowerCase();

  if (!normalized) {
    return { field: 'form', message: 'Une erreur est survenue. Réessaie.' };
  }
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return { field: 'email', message: 'Un compte existe déjà avec cet email.' };
  }
  if (normalized.includes('invalid email') || normalized.includes('unable to validate email')) {
    return { field: 'email', message: 'Adresse email invalide.' };
  }
  if (normalized.includes('email not confirmed')) {
    return { field: 'email', message: 'Confirme ton email avant de te connecter.' };
  }
  if (normalized.includes('password should be at least')) {
    return { field: 'password', message: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }
  if (normalized.includes('invalid login credentials')) {
    return { field: 'password', message: 'Email ou mot de passe incorrect.' };
  }
  if (normalized.includes('network')) {
    return { field: 'form', message: 'Problème de connexion. Vérifie ta connexion internet.' };
  }

  return { field: 'form', message: 'Une erreur est survenue. Réessaie.' };
}
