import type { TranslationSchema } from './fr';

const en: TranslationSchema = {
  common: {
    tabs: {
      home: 'Home',
      coach: 'Coach',
      scanner: 'Scanner',
      profile: 'Profile',
    },
    explore: 'Explore',
    cancel: 'Cancel',
    save: 'Save',
    retry: 'Retry',
    error: 'Error',
    close: 'Close',
    today: 'Today',
    comingSoon: 'Soon',
    comingSoonAlertTitle: 'Coming soon',
    comingSoonAlertMessage: '%{label} is coming soon.',
    comingSoonAccessibility: '%{label} — coming soon',
    navItems: {
      progression: 'Progress',
      workout: 'My workouts',
      meals: 'My meals',
      notifications: 'Notifications',
      badges: 'Badges',
      groups: 'Groups',
      widgets: 'Widgets',
      recipes: 'Recipes',
    },
    notifications: {
      title: 'Notifications',
      emptyTitle: 'No notifications',
      emptyText: "You'll be notified here as soon as there's something new.",
    },
    legal: {
      termsTitle: 'Terms of use',
      termsBody1:
        'These terms of use govern access to and use of the GlowUp AI application. By creating an account, you agree to the terms described below.',
      termsBody2: 'This text is a placeholder — the final legal content will be written before the application goes into production.',
      privacyTitle: 'Privacy policy',
      privacyBody1:
        'This privacy policy describes what data GlowUp AI collects (profile, meals, weigh-ins, progress photos, coach history) and how it is used to run the application.',
      privacyBody2: 'This text is a placeholder — the final legal content will be written before the application goes into production.',
    },
  },

  errors: {
    generic: 'Something went wrong. Try again.',
    network: 'Connection issue. Check your internet connection.',
    auth: {
      emailTaken: 'An account already exists with this email.',
      invalidEmail: 'Invalid email address.',
      emailNotConfirmed: 'Confirm your email before signing in.',
      passwordTooShort: 'Your password must be at least 6 characters.',
      invalidCredentials: 'Incorrect email or password.',
    },
    anthropic: {
      invalidKey: '%{action}: invalid or expired Anthropic API key.',
      insufficientCredit: '%{action}: insufficient Anthropic credit. Top up the Anthropic account to continue.',
      rateLimited: '%{action}: too many requests sent to the AI right now. Try again in a moment.',
      invalidRequest: '%{action}: the request sent was invalid. Try again in a moment.',
      unknown: '%{action} (error %{status}). Try again in a moment.',
    },
  },

  onboarding: {},
  dashboard: {},
  coach: {},
  scanner: {},
  progression: {},
  recipes: {},
  profile: {},
  badges: {},
};

export default en;
