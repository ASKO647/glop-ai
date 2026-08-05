import type { TranslationSchema } from './fr';

const pt: TranslationSchema = {
  common: {
    tabs: {
      home: 'Início',
      coach: 'Coach',
      scanner: 'Scanner',
      profile: 'Perfil',
    },
    explore: 'Explorar',
    cancel: 'Cancelar',
    save: 'Guardar',
    retry: 'Tentar novamente',
    error: 'Erro',
    close: 'Fechar',
    today: 'Hoje',
    comingSoon: 'Em breve',
    comingSoonAlertTitle: 'Brevemente disponível',
    comingSoonAlertMessage: '%{label} estará disponível brevemente.',
    comingSoonAccessibility: '%{label} — brevemente disponível',
    navItems: {
      progression: 'Progresso',
      workout: 'Meus treinos',
      meals: 'Minhas refeições',
      notifications: 'Notificações',
      badges: 'Emblemas',
      groups: 'Grupos',
      widgets: 'Widgets',
      recipes: 'Receitas',
    },
    notifications: {
      title: 'Notificações',
      emptyTitle: 'Nenhuma notificação',
      emptyText: 'Serás avisado aqui assim que houver novidades.',
    },
    legal: {
      termsTitle: 'Termos de utilização',
      termsBody1:
        'Estes termos de utilização regem o acesso e a utilização da aplicação GlowUp AI. Ao criar uma conta, aceitas os termos descritos abaixo.',
      termsBody2: 'Este texto é um placeholder — o conteúdo legal definitivo será redigido antes do lançamento da aplicação em produção.',
      privacyTitle: 'Política de privacidade',
      privacyBody1:
        'Esta política de privacidade descreve que dados a GlowUp AI recolhe (perfil, refeições, pesagens, fotos de progresso, histórico do coach) e como são utilizados para o funcionamento da aplicação.',
      privacyBody2: 'Este texto é um placeholder — o conteúdo legal definitivo será redigido antes do lançamento da aplicação em produção.',
    },
  },

  errors: {
    generic: 'Ocorreu um erro. Tenta novamente.',
    network: 'Problema de ligação. Verifica a tua ligação à internet.',
    auth: {
      emailTaken: 'Já existe uma conta com este email.',
      invalidEmail: 'Endereço de email inválido.',
      emailNotConfirmed: 'Confirma o teu email antes de iniciares sessão.',
      passwordTooShort: 'A palavra-passe deve ter pelo menos 6 caracteres.',
      invalidCredentials: 'Email ou palavra-passe incorretos.',
    },
    anthropic: {
      invalidKey: '%{action}: chave da API Anthropic inválida ou expirada.',
      insufficientCredit: '%{action}: crédito Anthropic insuficiente. Carrega a conta Anthropic para continuar.',
      rateLimited: '%{action}: demasiados pedidos enviados à IA neste momento. Tenta novamente dentro de instantes.',
      invalidRequest: '%{action}: o pedido enviado era inválido. Tenta novamente dentro de instantes.',
      unknown: '%{action} (erro %{status}). Tenta novamente dentro de instantes.',
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

export default pt;
