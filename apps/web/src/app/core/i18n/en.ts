import type { Translations } from './translations';

/**
 * English wording, in the shape French sets.
 */
export const EN: Translations = {
  tag: 'en-GB',

  languages: {
    fr: 'French',
    en: 'English',
  },

  language: {
    switchTo: (name) => `Switch to ${name}`,
  },

  head: {
    lastSync: 'Last sync:',
    searching: 'Searching…',
    refresh: 'Search for new offers',
  },

  sync: {
    never: 'Never synced',
    justNow: 'Just now',
    minutesAgo: (minutes) => `${minutes} min ago`,
    hoursAgo: (hours) => `${hours} h ago`,
    yesterday: 'Yesterday',
    onDate: (date) => `On ${date}`,
  },

  published: {
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: (days) => `${days} days ago`,
  },

  tabs: {
    areaPlaceholder: 'On site',
    remote: 'Full remote',
    favorites: 'Favorites',
  },

  feed: {
    newSince: (count) => `offer${count > 1 ? 's' : ''} since your last visit`,
    showOnlyNew: 'Show',
    showAll: 'Show all',
    retry: 'Try again',
    nothingNew: 'Nothing new since your last visit.',
    nothingNewHint: 'The offers you have already seen are still there.',
    showEveryOffer: 'Show every offer',
    noFavorites: 'No favorites.',
    noFavoritesHint: "Tap an offer's star to keep it here.",
    noRemote: 'No full remote offer.',
    noOffers: 'No offers yet.',
    noOffersHint: 'Query the sources to fill the list.',
    fetchOffers: 'Search for offers',
    idlePanel: 'Pick an offer to read it here.',
    newOffers: (count) =>
      count === 0 ? 'No new offer.' : `${count} new offer${count > 1 ? 's' : ''}.`,
    sourcesAvailable: (ok, total) => `${ok}/${total} sources available`,
    sourcesFailed: (summary, sources) => `${summary} - failing: ${sources}`,
    sourcesUnavailable: (sources) => `Unavailable source(s): ${sources}.`,
    refreshFailed: (detail) => `Could not fetch new offers. ${detail}`,
    loadFailed: (detail) => `Could not load the offers. ${detail}`,
  },

  row: {
    unknownCompany: 'Company not stated',
    approximateCity: 'town not stated',
    new: 'New',
    hide: 'Not interested, hide this offer',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
  },

  place: {
    remote: 'Full remote',
    unknown: 'Location not stated',
    approximate: (city) => `${city} (town not stated)`,
  },

  detail: {
    close: 'Close the offer',
    backToList: 'Back to the list',
    contract: 'Contract',
    defaultContract: 'Permanent',
    salary: 'Salary',
    unknownSalary: 'Not stated',
    publishedOn: 'Published on',
    unknownDate: 'Unknown date',
    dateFormat: 'd MMM yyyy',
    excerptOnly: 'This source only publishes an excerpt. The full listing is on the original site.',
    offerSection: 'The role',
    companySection: 'The company',
    alsoPublishedOn: 'Also published on',
    applyOn: (source) => `View the offer on ${source}`,
    notFound: 'This offer cannot be found.',
    loadFailed: 'Could not load this offer, try again later.',
  },

  login: {
    title: 'Your job watch',
    lead: 'Enter the password to open it.',
    password: 'Password',
    checking: 'Checking…',
    submit: 'Enter',
    wrongPassword: 'Wrong password.',
    throttled: 'Too many attempts, try again in a few minutes.',
  },

  http: {
    unreachable: 'Is the API running?',
    serverError: 'The server hit an error, try again later.',
    status: (status) => `Error ${status}.`,
  },
};
