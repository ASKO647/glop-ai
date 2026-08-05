// Reference locale — every other file in this directory must have exactly the same keys.
// Run `node scripts/check-locale-keys.js` after editing any locale file.
//
// Pluralized keys use i18n-js's real pluralization mechanism — an object keyed by plural form
// (`one`/`other`, occasionally `zero`) rather than a single ICU-style string — since that's what
// this library actually parses at runtime (see the Pluralization section of its README).
const fr = {
  common: {
    tabs: {
      home: 'Accueil',
      coach: 'Coach',
      scanner: 'Scanner',
      profile: 'Profil',
    },
    explore: 'Explorer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    retry: 'Réessayer',
    error: 'Erreur',
    close: 'Fermer',
    today: "Aujourd'hui",
    comingSoon: 'Bientôt',
    comingSoonAlertTitle: 'Bientôt disponible',
    comingSoonAlertMessage: '%{label} arrive prochainement.',
    comingSoonAccessibility: '%{label} — bientôt disponible',
    navItems: {
      progression: 'Progression',
      workout: 'Mes séances',
      meals: 'Mes repas',
      notifications: 'Notifications',
      badges: 'Badges',
      groups: 'Groupes',
      widgets: 'Widgets',
      recipes: 'Recettes',
    },
    notifications: {
      title: 'Notifications',
      emptyTitle: 'Aucune notification',
      emptyText: "Tu seras prévenu ici dès qu'il y aura du nouveau.",
    },
    legal: {
      termsTitle: "Conditions d'utilisation",
      termsBody1:
        "Ces conditions d'utilisation régissent l'accès et l'usage de l'application GlowUp AI. En créant un compte, tu acceptes les termes décrits ci-dessous.",
      termsBody2:
        'Ce texte est un placeholder — le contenu juridique définitif sera rédigé avant la mise en production de l\'application.',
      privacyTitle: 'Politique de confidentialité',
      privacyBody1:
        'Cette politique de confidentialité décrit quelles données GlowUp AI collecte (profil, repas, pesées, photos de progression, historique du coach) et comment elles sont utilisées pour faire fonctionner l\'application.',
      privacyBody2:
        'Ce texte est un placeholder — le contenu juridique définitif sera rédigé avant la mise en production de l\'application.',
    },
  },

  errors: {
    generic: 'Une erreur est survenue. Réessaie.',
    network: 'Problème de connexion. Vérifie ta connexion internet.',
    auth: {
      emailTaken: 'Un compte existe déjà avec cet email.',
      invalidEmail: 'Adresse email invalide.',
      emailNotConfirmed: 'Confirme ton email avant de te connecter.',
      passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
      invalidCredentials: 'Email ou mot de passe incorrect.',
    },
    anthropic: {
      invalidKey: '%{action} : clé API Anthropic invalide ou expirée.',
      insufficientCredit: '%{action} : crédit Anthropic insuffisant. Recharge le compte Anthropic pour continuer.',
      rateLimited: '%{action} : trop de requêtes envoyées à l\'IA pour le moment. Réessaie dans quelques instants.',
      invalidRequest: '%{action} : la requête envoyée était invalide. Réessaie dans un instant.',
      unknown: '%{action} (erreur %{status}). Réessaie dans un instant.',
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
} as const;

export default fr;
export type TranslationSchema = typeof fr;
