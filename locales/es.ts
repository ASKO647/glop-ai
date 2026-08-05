import type { TranslationSchema } from './fr';

const es: TranslationSchema = {
  common: {
    tabs: {
      home: 'Inicio',
      coach: 'Coach',
      scanner: 'Escáner',
      profile: 'Perfil',
    },
    explore: 'Explorar',
    cancel: 'Cancelar',
    save: 'Guardar',
    retry: 'Reintentar',
    error: 'Error',
    close: 'Cerrar',
    today: 'Hoy',
    comingSoon: 'Pronto',
    comingSoonAlertTitle: 'Próximamente',
    comingSoonAlertMessage: '%{label} estará disponible próximamente.',
    comingSoonAccessibility: '%{label} — próximamente',
    navItems: {
      progression: 'Progreso',
      workout: 'Mis sesiones',
      meals: 'Mis comidas',
      notifications: 'Notificaciones',
      badges: 'Insignias',
      groups: 'Grupos',
      widgets: 'Widgets',
      recipes: 'Recetas',
    },
    notifications: {
      title: 'Notificaciones',
      emptyTitle: 'Sin notificaciones',
      emptyText: 'Aquí te avisaremos en cuanto haya algo nuevo.',
    },
    legal: {
      termsTitle: 'Condiciones de uso',
      termsBody1:
        'Estas condiciones de uso regulan el acceso y el uso de la aplicación GlowUp AI. Al crear una cuenta, aceptas los términos descritos a continuación.',
      termsBody2: 'Este texto es un marcador de posición — el contenido legal definitivo se redactará antes de la puesta en producción de la aplicación.',
      privacyTitle: 'Política de privacidad',
      privacyBody1:
        'Esta política de privacidad describe qué datos recopila GlowUp AI (perfil, comidas, pesajes, fotos de progreso, historial del coach) y cómo se utilizan para el funcionamiento de la aplicación.',
      privacyBody2: 'Este texto es un marcador de posición — el contenido legal definitivo se redactará antes de la puesta en producción de la aplicación.',
    },
  },

  errors: {
    generic: 'Se produjo un error. Inténtalo de nuevo.',
    network: 'Problema de conexión. Comprueba tu conexión a internet.',
    auth: {
      emailTaken: 'Ya existe una cuenta con este email.',
      invalidEmail: 'Dirección de email no válida.',
      emailNotConfirmed: 'Confirma tu email antes de iniciar sesión.',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres.',
      invalidCredentials: 'Email o contraseña incorrectos.',
    },
    anthropic: {
      invalidKey: '%{action}: clave de API de Anthropic no válida o caducada.',
      insufficientCredit: '%{action}: crédito de Anthropic insuficiente. Recarga la cuenta de Anthropic para continuar.',
      rateLimited: '%{action}: demasiadas solicitudes enviadas a la IA en este momento. Inténtalo de nuevo en unos instantes.',
      invalidRequest: '%{action}: la solicitud enviada no era válida. Inténtalo de nuevo en un momento.',
      unknown: '%{action} (error %{status}). Inténtalo de nuevo en un momento.',
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

export default es;
