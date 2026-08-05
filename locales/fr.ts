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

  onboarding: {
    common: {
      continue: 'Continuer',
    },
    step: {
      defaultDescription: 'Cet écran sera implémenté prochainement.',
    },
    auth: {
      continueWithApple: 'Continuer avec Apple',
      continueWithGoogle: 'Continuer avec Google',
      or: 'ou',
      emailLabel: 'Email',
      emailPlaceholder: 'toi@exemple.com',
      passwordLabel: 'Mot de passe',
      emailRequired: "L'email est requis.",
      passwordRequired: 'Le mot de passe est requis.',
    },
    welcome: {
      title: "Ta transformation, guidée par l'IA.",
      subtitle: 'Coaching fitness personnalisé, suivi de progression et plan sur mesure.',
      start: 'Commencer',
      haveAccount: "J'ai déjà un compte",
    },
    login: {
      title: 'Content de te revoir',
      subtitle: 'Connecte-toi pour retrouver ton plan.',
      passwordPlaceholder: 'Ton mot de passe',
      forgotPassword: 'Mot de passe oublié ?',
      submit: 'Se connecter',
      noAccount: 'Pas encore de compte ? Créer un compte',
    },
    signup: {
      title: 'Créer un compte',
      subtitle: 'Sauvegarde ton plan et débloque ton coach IA.',
      passwordPlaceholder: '6 caractères minimum',
      submit: 'Créer mon compte',
      haveAccount: "J'ai déjà un compte",
    },
    forgotPassword: {
      title: 'Mot de passe oublié',
      subtitle: "Indique ton email, on t'envoie un lien pour le réinitialiser.",
      submit: 'Envoyer le lien',
      backToLogin: 'Retour à la connexion',
      confirmation:
        "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé. Vérifie ta boîte de réception.",
    },
    questionnaire: {
      progress: '%{current} / %{total}',
      units: {
        years: 'ans',
        cm: 'cm',
        kg: 'kg',
      },
      goal: {
        title: 'Quel est ton objectif principal ?',
        options: {
          weightLoss: 'Perte de poids',
          muscleGain: 'Prise de muscle',
          glowUp: 'Glow up & esthétique',
          discipline: 'Être plus discipliné',
        },
      },
      gender: {
        title: 'Tu es…',
        options: { male: 'Homme', female: 'Femme', other: 'Autre' },
      },
      age: { title: 'Quel âge as-tu ?' },
      height: { title: 'Quelle est ta taille ?' },
      currentWeight: { title: 'Quel est ton poids actuel ?' },
      targetWeight: { title: 'Quel est ton poids objectif ?' },
      pace: {
        title: 'Quelle vitesse souhaites-tu ?',
        options: { progressive: 'Progressif', moderate: 'Modéré', fast: 'Rapide' },
      },
      activityLevel: {
        title: "Quel est ton niveau d'activité ?",
        options: {
          sedentary: 'Sédentaire',
          light: 'Léger',
          moderate: 'Modéré',
          veryActive: 'Très actif',
        },
      },
      workoutsPerWeek: {
        title: "Combien d'entraînements par semaine ?",
        options: { oneTwo: '1-2', threeFour: '3-4', fiveSix: '5-6', daily: 'Tous les jours' },
      },
      trainingLocation: {
        title: "Où t'entraînes-tu ?",
        options: { gym: 'Salle', home: 'Maison', both: 'Les deux' },
      },
      dietQuality: {
        title: 'Comment est ton alimentation actuelle ?',
        options: {
          messy: 'Désordonnée',
          okay: 'Correcte',
          healthy: 'Plutôt saine',
          structured: 'Très structurée',
        },
      },
      sleepHours: {
        title: "Combien d'heures dors-tu ?",
        options: { under5: 'Moins de 5', fiveSix: '5-6', sevenEight: '7-8', over8: 'Plus de 8' },
      },
      blocker: {
        title: "Qu'est-ce qui t'a bloqué jusqu'ici ?",
        options: {
          motivation: 'Manque de motivation',
          time: 'Manque de temps',
          direction: 'Je ne sais pas quoi faire',
          consistency: "Je n'ai pas tenu",
        },
      },
      dietaryRestrictions: {
        title: 'As-tu des restrictions alimentaires ?',
        options: {
          none: 'Aucune',
          vegetarian: 'Végétarien',
          vegan: 'Végan',
          glutenFree: 'Sans gluten',
          lactoseFree: 'Sans lactose',
        },
      },
      commitmentLevel: {
        title: "Quel est ton niveau d'engagement ?",
        options: {
          testing: 'Je teste',
          motivated: 'Je suis motivé',
          determined: 'Je suis déterminé à changer',
        },
      },
    },
    analysis: {
      title: 'Analyse en cours...',
      steps: {
        profile: 'Analyse de ton profil',
        lifestyle: 'Évaluation de ton mode de vie',
        habits: 'Analyse de tes habitudes',
        improvementAreas: "Identification de tes axes d'amélioration",
        planCreation: 'Création de ton plan perso',
      },
    },
    plan: {
      title: 'Ton plan est prêt 🎉',
      subtitle: 'Ta transformation commence maintenant.',
      defaultGoal: 'Transformation personnalisée',
      cta: 'Voir mon plan',
      sectionLabel: 'Objectifs principaux',
      weightStable: 'Poids stable',
      weightChange: '%{sign}%{amount} kg',
      duration: '%{weight} en %{days} jours',
      objectiveTitles: {
        training: 'Entraînement',
        nutrition: 'Nutrition',
        sleep: 'Sommeil',
        discipline: 'Discipline',
      },
      training: {
        sentence: '%{base}%{location}.',
        base: {
          oneTwo: 'Programme efficace en 1 à 2 séances par semaine',
          threeFour: 'Programme structuré sur 3 à 4 séances par semaine',
          fiveSix: 'Programme intensif sur 5 à 6 séances par semaine',
          daily: 'Routine quotidienne pour progresser sans relâche',
          default: 'Programme structuré adapté à ton rythme',
        },
        location: {
          gym: ', en salle',
          home: ', à la maison',
          both: ', entre salle et maison',
        },
      },
      nutrition: {
        withRestrictions: 'Plan %{adjectives} structuré, adapté à ton objectif.',
        default: 'Plan alimentaire structuré, adapté à ton objectif.',
        adjectiveSeparator: ' et ',
        adjectives: {
          vegetarian: 'végétarien',
          vegan: 'végan',
          glutenFree: 'sans gluten',
          lactoseFree: 'sans lactose',
        },
      },
      sleep: {
        under5: 'Routine pour gagner 2h de récupération chaque nuit.',
        fiveSix: 'Routine pour gagner 1h de récupération chaque nuit.',
        sevenEight: 'Routine pour consolider ton rythme de sommeil actuel.',
        over8: 'Routine pour optimiser la qualité de ton sommeil.',
        default: 'Routine de sommeil optimisée pour ta récupération.',
      },
      discipline: {
        time: 'Routine express pour avancer même avec un planning chargé, sur %{days} jours.',
        direction: 'Feuille de route claire, étape par étape, sur %{days} jours.',
        consistency: 'Suivi quotidien pour rester régulier sur %{days} jours.',
        default: 'Missions quotidiennes pour tenir sur %{days} jours.',
      },
    },
    paywall: {
      title: 'Choisis ton plan',
      subtitle: "Débloque ton coach IA et commence ta transformation dès aujourd'hui.",
      benefits: {
        coach: 'Coach IA illimité, chat & vocal',
        scanner: 'Scanner de repas par photo',
        workout: 'Programmes muscu personnalisés',
        progress: 'Suivi de progression & statistiques',
      },
      plans: {
        annualBadge: 'MEILLEURE OFFRE',
        annualName: 'Annuel',
        annualPrice: '59,99€ / an',
        annualOriginalPrice: '180€',
        annualSubline: 'Soit 4,99€ / mois. Puis 59,99€ par an. Annulable à tout moment.',
        monthlyName: 'Mensuel',
        monthlyPrice: '9,99€ / mois',
        monthlyOriginalPrice: '35€',
        monthlySubline: 'Puis 9,99€ par mois. Annulable à tout moment.',
        trial: '3 jours offerts',
      },
      cta: 'Commencer mon essai gratuit',
      restore: 'Restaurer',
      terms: 'Conditions',
      privacy: 'Confidentialité',
    },
  },

  dashboard: {},

  coach: {
    headerTitle: 'Coach IA',
    online: 'En ligne',
    emptyTitle: 'Pose ta première question',
    emptyText: "Ton coach IA est là pour t'aider, à tout moment.",
    suggestions: {
      loseFat: 'Comment perdre du gras ?',
      dinner: 'Que manger ce soir ?',
      motivation: 'Je manque de motivation',
    },
    inputPlaceholder: 'Écris un message...',
    send: 'Envoyer',
    errors: {
      missingApiKey: 'Clé API Anthropic manquante. Ajoute EXPO_PUBLIC_ANTHROPIC_API_KEY dans ton fichier .env.',
      networkError: 'Impossible de contacter le coach. Vérifie ta connexion internet et réessaie.',
      failedAction: "Le coach n'a pas pu répondre",
      unreadableResponse: 'Réponse du coach illisible. Réessaie dans un instant.',
      emptyResponse: "Le coach n'a pas renvoyé de réponse.",
      fallback: "Le coach n'a pas pu répondre. Vérifie ta connexion et réessaie.",
    },
  },

  scanner: {
    title: 'Scanne ton repas',
    subtitle: 'Prends ton plat en photo pour connaître ses calories',
    analyzing: 'Analyse en cours...',
    noFoodDetected: 'Aucun aliment détecté sur cette photo.',
    cameraDeniedTitle: "Accès à l'appareil photo refusé",
    cameraDeniedMessage:
      "GlowUp AI a besoin d'accéder à l'appareil photo pour analyser tes repas. Active l'accès dans les réglages de ton téléphone.",
    libraryDeniedTitle: 'Accès à tes photos refusé',
    libraryDeniedMessage:
      "GlowUp AI a besoin d'accéder à tes photos pour analyser tes repas. Active l'accès dans les réglages de ton téléphone.",
    macros: {
      proteins: 'Protéines',
      carbs: 'Glucides',
      fats: 'Lipides',
    },
    addTo: 'Ajouter à',
    saveButton: 'Enregistrer ce repas',
    restartButton: 'Recommencer',
    takePhotoButton: 'Prendre une photo',
    pickFromLibraryButton: 'Choisir dans la galerie',
    saveErrorMessage: "Impossible d'enregistrer ce repas. Réessaie.",
    savedTitle: 'Repas enregistré',
    savedMessage: '%{name} a été ajouté à ton suivi du jour.',
    errors: {
      missingApiKey: 'Clé API Anthropic manquante. Ajoute EXPO_PUBLIC_ANTHROPIC_API_KEY dans ton fichier .env.',
      prepareFailed: 'Impossible de préparer la photo. Réessaie.',
      networkError: "Impossible d'analyser la photo. Vérifie ta connexion internet et réessaie.",
      failedAction: "L'analyse a échoué",
      unreadableResponse: 'Réponse illisible. Réessaie dans un instant.',
      emptyResult: "L'analyse n'a renvoyé aucun résultat. Réessaie.",
      unparsableResult: "Impossible de lire le résultat de l'analyse. Réessaie.",
    },
  },

  progression: {},
  recipes: {},
  profile: {},
  badges: {},
} as const;

export default fr;

// `as const` above gives every string a literal type (e.g. `"Accueil"`), which is exactly what
// we want for key-shape checking but would otherwise force every other locale to use the exact
// same French words. Widen every string leaf back to `string` while keeping the nested shape,
// so `en.ts` etc. only have to match fr.ts's *structure*, not its literal text.
type Widen<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? T
    : { [K in keyof T]: Widen<T[K]> };

export type TranslationSchema = Widen<typeof fr>;
