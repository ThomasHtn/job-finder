/**
 * Public search endpoint of the EURES portal.
 */
export const SEARCH_URL =
  'https://europa.eu/eures/api/jv-searchengine/public/jv-search/search';

/**
 * Detail page linked from the UI.
 */
export const DETAILS_URL = 'https://europa.eu/eures/portal/jv-se/jv-details';

/**
 * Largest page the endpoint serves.
 */
export const RESULTS_PER_PAGE = 50;

/**
 * Two pages per keyword cover a region's recent offers.
 */
export const MAX_PAGES = 2;

/**
 * Politeness delay, the portal has no documented rate limit.
 */
export const DELAY_BETWEEN_REQUESTS_MS = 700;

/**
 * Time given to one search request.
 */
export const TIMEOUT_MS = 25_000;

/**
 * Anything other than a direct hire is out of scope (temp work, apprenticeship, freelance).
 */
export const DIRECT_HIRE = 'directhire';

/**
 * Wording that disqualifies a direct hire from being permanent.
 */
export const NON_PERMANENT_TEXT =
  /\bcdd\b|int[ée]rim|\bstage\b|alternance|apprentissage/i;
