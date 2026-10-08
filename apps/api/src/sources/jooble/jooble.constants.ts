/**
 * Search endpoint; the key goes in the path.
 */
export const BASE_URL = 'https://jooble.org/api';

/**
 * Keywords of the profile actually queried: the key's quota is set per partner and unpublished.
 */
export const MAX_KEYWORDS = 3;

/**
 * Largest radius the API accepts, in km; the isochrone does the real cut.
 */
export const SEARCH_RADIUS_KM = '80';

/**
 * Results asked for per query.
 */
export const RESULTS_PER_PAGE = '50';

/**
 * Pause between two queries, to stay polite with an unknown rate limit.
 */
export const DELAY_BETWEEN_REQUESTS_MS = 1_000;

/**
 * Time given to one search request.
 */
export const TIMEOUT_MS = 20_000;
