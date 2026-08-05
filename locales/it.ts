import type { TranslationSchema } from './fr';

const it: TranslationSchema = {
  common: {
    tabs: {
      home: 'Home',
      coach: 'Coach',
      scanner: 'Scanner',
      profile: 'Profilo',
    },
    explore: 'Esplora',
    cancel: 'Annulla',
    save: 'Salva',
    retry: 'Riprova',
    error: 'Errore',
    close: 'Chiudi',
    today: 'Oggi',
    comingSoon: 'Presto',
    comingSoonAlertTitle: 'Prossimamente',
    comingSoonAlertMessage: '%{label} sarà disponibile a breve.',
    comingSoonAccessibility: '%{label} — prossimamente',
    navItems: {
      progression: 'Progressi',
      workout: 'I miei allenamenti',
      meals: 'I miei pasti',
      notifications: 'Notifiche',
      badges: 'Badge',
      groups: 'Gruppi',
      widgets: 'Widget',
      recipes: 'Ricette',
    },
    notifications: {
      title: 'Notifiche',
      emptyTitle: 'Nessuna notifica',
      emptyText: 'Sarai avvisato qui non appena ci sarà qualcosa di nuovo.',
    },
    legal: {
      termsTitle: "Termini di utilizzo",
      termsBody1:
        "Questi termini di utilizzo regolano l'accesso e l'uso dell'applicazione GlowUp AI. Creando un account, accetti i termini descritti di seguito.",
      termsBody2: "Questo testo è un segnaposto — il contenuto legale definitivo sarà redatto prima della messa in produzione dell'applicazione.",
      privacyTitle: 'Informativa sulla privacy',
      privacyBody1:
        "Questa informativa sulla privacy descrive quali dati raccoglie GlowUp AI (profilo, pasti, pesate, foto dei progressi, cronologia del coach) e come vengono utilizzati per il funzionamento dell'applicazione.",
      privacyBody2: "Questo testo è un segnaposto — il contenuto legale definitivo sarà redatto prima della messa in produzione dell'applicazione.",
    },
  },

  errors: {
    generic: 'Si è verificato un errore. Riprova.',
    network: 'Problema di connessione. Controlla la tua connessione internet.',
    auth: {
      emailTaken: 'Esiste già un account con questa email.',
      invalidEmail: 'Indirizzo email non valido.',
      emailNotConfirmed: "Conferma la tua email prima di accedere.",
      passwordTooShort: 'La password deve contenere almeno 6 caratteri.',
      invalidCredentials: 'Email o password errati.',
    },
    anthropic: {
      invalidKey: '%{action}: chiave API Anthropic non valida o scaduta.',
      insufficientCredit: '%{action}: credito Anthropic insufficiente. Ricarica il conto Anthropic per continuare.',
      rateLimited: "%{action}: troppe richieste inviate all'IA in questo momento. Riprova tra qualche istante.",
      invalidRequest: '%{action}: la richiesta inviata non era valida. Riprova tra un momento.',
      unknown: '%{action} (errore %{status}). Riprova tra un momento.',
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

export default it;
