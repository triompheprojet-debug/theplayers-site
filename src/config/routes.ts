/**
 * Routes typées de l'application.
 *
 * Centralise toutes les URLs pour :
 *  - éviter les chaînes en dur disséminées dans le code
 *  - permettre une refactorisation aisée
 *  - typer les params dynamiques (séries [id], [slug])
 */

export const ROUTES = {
  // ----- Public -----
  home: '/',
  tournament: '/tournoi',
  bracket: '/bracket',
  ranking: '/classement',
  contact: '/contact',
  eventTypes: '/types-evenements',
  history: '/historique',
  historyDetail: (slug: string) => `/historique/${slug}`,

  // ----- Auth -----
  signIn: '/connexion',
  signUp: '/inscription',
  signOut: '/deconnexion',

  // ----- Espace joueur (mobile-first) -----
  player: {
    dashboard: '/joueur',
    bracket: '/joueur/bracket',
    ranking: '/joueur/classement',
    documents: '/joueur/documents',
    messages: '/joueur/messages',
    messageDetail: (id: string) => `/joueur/messages/${id}`,
    registration: '/joueur/inscription',  
    profile: '/joueur/profil',
    payment: '/joueur/paiement',
  },

  // ----- Espace arbitre (mobile-first) -----
  referee: {
    dashboard: '/arbitre',
    matches: '/arbitre/matchs',
    scoreEntry: '/arbitre/saisie',
    bracket: '/arbitre/bracket',
  },

  // ----- Back-office admin (desktop-first) -----
  admin: {
    root: '/admin',
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    tournament: '/admin/tournoi',
    editions: {
      root: '/admin/editions',
      newOffSeason: '/admin/editions/hors-saison/nouvelle',
      newSeason: '/admin/editions/saisons/nouvelle',
      seasonDetail: (id: string) => `/admin/editions/saisons/${id}`,
      newSeasonTournament: (id: string) =>
        `/admin/editions/saisons/${id}/tournois/nouveau`,
      newGrandFinal: (id: string) =>
        `/admin/editions/saisons/${id}/grande-finale/nouvelle`,
    },
    registrations: {
      root: '/admin/inscriptions',
      detail: (id: string) => `/admin/inscriptions/${id}`,
      manual: '/admin/inscriptions/nouvelle',
    },
    payments: '/admin/paiements',
    badgeNumbers: '/admin/numeros',
    documents: '/admin/documents',
    scan: '/admin/scan',
    statistics: '/admin/statistiques',
    messaging: {
      root: '/admin/messagerie',
      received: '/admin/messagerie/recus',
    },
    configuration: {
      root: '/admin/configuration',
      accounts: '/admin/configuration/comptes',
      social: '/admin/configuration/reseaux',
      templates: '/admin/configuration/templates',
      qr: '/admin/configuration/qr',
    },
  },

  // ----- API internes -----
  api: {
    qrVerify: '/api/qr/verify',
    turnstileVerify: '/api/turnstile/verify',
    cronProcessJobs: '/api/cron/process-jobs',
    cronDailyCleanup: '/api/cron/daily-cleanup',
  },
} as const
