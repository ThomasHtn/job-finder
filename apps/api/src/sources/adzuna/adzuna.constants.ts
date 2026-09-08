/**
 * Search endpoint, France only.
 */
export const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/fr/search';

/**
 * Largest page the API accepts.
 */
export const RESULTS_PER_PAGE = 50;

/**
 * The free tier is 2500 requests/month. With a 2h cron (~360 runs/month), one page for
 * each of the first MAX_KEYWORDS queries plus two nationwide remote sweeps stays
 * around 1800/month, leaving headroom for manual `/api/ingestion/run` triggers.
 */
export const MAX_PAGES = 1;

/**
 * Keywords of the profile actually queried, for the same quota reason.
 */
export const MAX_KEYWORDS = 3;

/**
 * Straight-line km around the configured city, wider than the drive on purpose:
 * the isochrone does the real cut.
 */
export const SEARCH_RADIUS_KM = 100;

/**
 * Time given to one search request.
 */
export const TIMEOUT_MS = 20_000;

/**
 * Adzuna keeps ads alive for years; anything older is a zombie.
 */
export const MAX_DAYS_OLD = 60;

/**
 * Exact phrases matched in the full ad, which the API sees even though it only
 * returns a snippet to us. Plain "télétravail" would also match hybrid roles.
 */
export const REMOTE_PHRASES = ['full remote', '100% télétravail'] as const;
