/**
 * Search endpoint backing apec.fr, public and unauthenticated.
 */
export const SEARCH_URL = 'https://www.apec.fr/cms/webservices/rechercheOffre';

/**
 * Ad page an offer number resolves to.
 */
export const DETAIL_URL =
  'https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre';

/**
 * Referential ids: APEC filters on numeric keys, not on labels.
 */
export const CDI_CONTRACT = '101888';

/**
 * Fully remote tier of the `typesTeletravail` facet; the other two are partial.
 */
export const FULL_REMOTE = '20767';

/**
 * Largest page the endpoint serves.
 */
export const PAGE_SIZE = 100;

/**
 * The local pass is scoped to a macro-region, so it is worth several pages.
 */
export const LOCAL_MAX_PAGES = 3;

/**
 * The remote pass is nationwide and only needs the most recent offers.
 */
export const REMOTE_MAX_PAGES = 1;

/**
 * Politeness delay, the endpoint has no documented rate limit.
 */
export const DELAY_BETWEEN_REQUESTS_MS = 500;

/**
 * Time given to one search request.
 */
export const TIMEOUT_MS = 25_000;
