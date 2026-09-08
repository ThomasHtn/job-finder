/**
 * Public search endpoint of free-work.com, no credentials needed.
 */
export const SEARCH_URL = 'https://www.free-work.com/api/job_postings';

/**
 * Ad page: the job family slug then the offer slug.
 */
export const DETAIL_URL = 'https://www.free-work.com/fr/tech-it/job-mission';

/**
 * Job family used in the URL when the offer names none.
 */
export const DEFAULT_JOB_SLUG = 'autre';

/**
 * The board mixes freelance missions and salaried roles; only the latter are in scope.
 */
export const PERMANENT = 'permanent';

/**
 * Value of `remoteMode` on a fully remote offer.
 */
export const FULL_REMOTE = 'full';

/**
 * Location key matching the whole country: the board also lists UK and Canadian
 * offers, which are out of scope even when fully remote.
 */
export const FRANCE = 'fr~~~';

/**
 * Largest page the endpoint serves.
 */
export const PAGE_SIZE = 100;

/**
 * The board is small enough that the whole area fits in a couple of pages, so no
 * keyword loop is needed: everything is fetched and filtered.
 */
export const MAX_PAGES = 3;

/**
 * Politeness delay, the endpoint has no documented rate limit.
 */
export const DELAY_BETWEEN_REQUESTS_MS = 500;

/**
 * Time given to one search request.
 */
export const TIMEOUT_MS = 25_000;
