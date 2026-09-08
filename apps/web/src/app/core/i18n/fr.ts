/**
 * French wording, and the shape every other dictionary follows.
 */
export const FR = {
  /**
   * BCP 47 tag, for the dates the platform formats itself.
   */
  tag: 'fr-FR',

  /**
   * Every shipped language, named in this one.
   */
  languages: {
    fr: 'français',
    en: 'anglais',
  },

  /**
   * The language switcher.
   */
  language: {
    switchTo: (name: string) => `Passer en ${name}`,
  },

  /**
   * Header: when the sources were last read, and the way to read them again.
   */
  head: {
    lastSync: 'Dernière synchronisation :',
    searching: 'Recherche en cours…',
    refresh: 'Rechercher de nouvelles offres',
  },

  /**
   * How long ago the sources were last read.
   */
  sync: {
    never: 'Jamais synchronisé',
    justNow: "À l'instant",
    minutesAgo: (minutes: number) => `Il y a ${minutes} min`,
    hoursAgo: (hours: number) => `Il y a ${hours} h`,
    yesterday: 'Hier',
    onDate: (date: string) => `Le ${date}`,
  },

  /**
   * When an offer was published, on its row.
   */
  published: {
    today: "Aujourd'hui",
    yesterday: 'Hier',
    daysAgo: (days: number) => `Il y a ${days} jours`,
  },

  /**
   * The three tabs; the on-site one is renamed by the API once the config arrives.
   */
  tabs: {
    areaPlaceholder: 'Sur site',
    remote: 'Full remote',
    favorites: 'Favoris',
  },

  /**
   * The feed, its filters, its empty states and what a refresh reports.
   */
  feed: {
    /**
     * Follows the count, which the template renders on its own to keep its figures aligned.
     */
    newSince: (count: number) => `offre${count > 1 ? 's' : ''} depuis votre dernière visite`,
    showOnlyNew: 'Voir',
    showAll: 'Tout afficher',
    retry: 'Réessayer',
    nothingNew: 'Rien de nouveau depuis votre dernière visite.',
    nothingNewHint: 'Les offres déjà vues sont toujours là.',
    showEveryOffer: 'Voir toutes les offres',
    noFavorites: 'Aucun favori.',
    noFavoritesHint: "Touchez l'étoile d'une offre pour la garder ici.",
    noRemote: 'Aucune offre en full remote.',
    noOffers: "Aucune offre pour l'instant.",
    noOffersHint: 'Interrogez les sources pour remplir la liste.',
    fetchOffers: 'Rechercher des offres',
    idlePanel: 'Choisissez une offre pour la lire ici.',
    newOffers: (count: number) =>
      count === 0
        ? 'Aucune nouvelle offre.'
        : `${count} nouvelle${count > 1 ? 's' : ''} offre${count > 1 ? 's' : ''}.`,
    sourcesAvailable: (ok: number, total: number) => `${ok}/${total} sources disponibles`,
    sourcesFailed: (summary: string, sources: string) => `${summary} - en échec : ${sources}`,
    sourcesUnavailable: (sources: string) => `Source(s) indisponible(s) : ${sources}.`,
    refreshFailed: (detail: string) => `Impossible de récupérer de nouvelles offres. ${detail}`,
    loadFailed: (detail: string) => `Impossible de charger les offres. ${detail}`,
  },

  /**
   * One row of the feed.
   */
  row: {
    unknownCompany: 'Entreprise non précisée',
    approximateCity: 'commune non précisée',
    new: 'Nouveau',
    hide: 'Pas intéressé, masquer cette offre',
    addFavorite: 'Ajouter aux favoris',
    removeFavorite: 'Retirer des favoris',
  },

  /**
   * Where the job is.
   */
  place: {
    remote: 'Full remote',
    unknown: 'Lieu non précisé',
    approximate: (city: string) => `${city} (commune non précisée)`,
  },

  /**
   * The offer opened in the panel.
   */
  detail: {
    close: "Fermer l'offre",
    backToList: 'Revenir à la liste',
    contract: 'Contrat',
    defaultContract: 'CDI',
    salary: 'Salaire',
    unknownSalary: 'Non communiqué',
    publishedOn: 'Publiée le',
    unknownDate: 'Date inconnue',
    dateFormat: 'dd/MM/yyyy',
    excerptOnly:
      "Cette source ne publie qu'un extrait. L'annonce complète est sur le site d'origine.",
    offerSection: "L'offre",
    companySection: "L'entreprise",
    alsoPublishedOn: 'Également publiée sur',
    applyOn: (source: string) => `Voir l'offre sur ${source}`,
    notFound: 'Cette offre est introuvable.',
    loadFailed: 'Impossible de charger cette offre, réessayez plus tard.',
  },

  /**
   * The password screen.
   */
  login: {
    title: "Votre veille d'offres",
    lead: "Entrez le mot de passe pour l'ouvrir.",
    password: 'Mot de passe',
    checking: 'Vérification…',
    submit: 'Entrer',
    wrongPassword: 'Mot de passe incorrect.',
    throttled: 'Trop de tentatives, réessayez dans quelques minutes.',
  },

  /**
   * What went wrong with a request, appended to the message naming the action.
   */
  http: {
    unreachable: "L'API est-elle démarrée ?",
    serverError: 'Le serveur a rencontré une erreur, réessayez plus tard.',
    status: (status: number) => `Erreur ${status}.`,
  },
};
