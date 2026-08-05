import type { TranslationSchema } from './fr';

const de: TranslationSchema = {
  common: {
    tabs: {
      home: 'Start',
      coach: 'Coach',
      scanner: 'Scanner',
      profile: 'Profil',
    },
    explore: 'Entdecken',
    cancel: 'Abbrechen',
    save: 'Speichern',
    retry: 'Erneut versuchen',
    error: 'Fehler',
    close: 'Schließen',
    today: 'Heute',
    comingSoon: 'Bald',
    comingSoonAlertTitle: 'Demnächst verfügbar',
    comingSoonAlertMessage: '%{label} ist bald verfügbar.',
    comingSoonAccessibility: '%{label} — demnächst verfügbar',
    navItems: {
      progression: 'Fortschritt',
      workout: 'Meine Einheiten',
      meals: 'Meine Mahlzeiten',
      notifications: 'Benachrichtigungen',
      badges: 'Abzeichen',
      groups: 'Gruppen',
      widgets: 'Widgets',
      recipes: 'Rezepte',
    },
    notifications: {
      title: 'Benachrichtigungen',
      emptyTitle: 'Keine Benachrichtigungen',
      emptyText: 'Du wirst hier benachrichtigt, sobald es Neuigkeiten gibt.',
    },
    legal: {
      termsTitle: 'Nutzungsbedingungen',
      termsBody1:
        'Diese Nutzungsbedingungen regeln den Zugang zu und die Nutzung der GlowUp AI App. Mit der Erstellung eines Kontos akzeptierst du die unten beschriebenen Bedingungen.',
      termsBody2: 'Dieser Text ist ein Platzhalter — der endgültige Rechtstext wird vor dem Produktivstart der App verfasst.',
      privacyTitle: 'Datenschutzerklärung',
      privacyBody1:
        'Diese Datenschutzerklärung beschreibt, welche Daten GlowUp AI erhebt (Profil, Mahlzeiten, Gewichtsmessungen, Fortschrittsfotos, Coach-Verlauf) und wie sie zum Betrieb der App verwendet werden.',
      privacyBody2: 'Dieser Text ist ein Platzhalter — der endgültige Rechtstext wird vor dem Produktivstart der App verfasst.',
    },
  },

  errors: {
    generic: 'Ein Fehler ist aufgetreten. Versuche es erneut.',
    network: 'Verbindungsproblem. Überprüfe deine Internetverbindung.',
    auth: {
      emailTaken: 'Es existiert bereits ein Konto mit dieser E-Mail-Adresse.',
      invalidEmail: 'Ungültige E-Mail-Adresse.',
      emailNotConfirmed: 'Bestätige deine E-Mail-Adresse, bevor du dich anmeldest.',
      passwordTooShort: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
      invalidCredentials: 'E-Mail-Adresse oder Passwort falsch.',
    },
    anthropic: {
      invalidKey: '%{action}: ungültiger oder abgelaufener Anthropic-API-Schlüssel.',
      insufficientCredit: '%{action}: unzureichendes Anthropic-Guthaben. Lade das Anthropic-Konto auf, um fortzufahren.',
      rateLimited: '%{action}: gerade zu viele Anfragen an die KI gesendet. Versuche es in ein paar Momenten erneut.',
      invalidRequest: '%{action}: die gesendete Anfrage war ungültig. Versuche es in einem Moment erneut.',
      unknown: '%{action} (Fehler %{status}). Versuche es in einem Moment erneut.',
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

export default de;
