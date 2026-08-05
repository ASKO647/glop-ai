export type AuthErrorField = 'email' | 'password' | 'form';

export type MappedAuthError = {
  field: AuthErrorField;
  message: string;
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Translates a raw Supabase auth error message into a localized message, attached to a form field. */
export function mapAuthError(t: Translate, rawMessage: string | null | undefined): MappedAuthError {
  const normalized = (rawMessage ?? '').toLowerCase();

  if (!normalized) {
    return { field: 'form', message: t('errors.generic') };
  }
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return { field: 'email', message: t('errors.auth.emailTaken') };
  }
  if (normalized.includes('invalid email') || normalized.includes('unable to validate email')) {
    return { field: 'email', message: t('errors.auth.invalidEmail') };
  }
  if (normalized.includes('email not confirmed')) {
    return { field: 'email', message: t('errors.auth.emailNotConfirmed') };
  }
  if (normalized.includes('password should be at least')) {
    return { field: 'password', message: t('errors.auth.passwordTooShort') };
  }
  if (normalized.includes('invalid login credentials')) {
    return { field: 'password', message: t('errors.auth.invalidCredentials') };
  }
  if (normalized.includes('network')) {
    return { field: 'form', message: t('errors.network') };
  }

  return { field: 'form', message: t('errors.generic') };
}
