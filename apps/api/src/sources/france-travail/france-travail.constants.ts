/**
 * OAuth2 client-credentials endpoint.
 */
export const TOKEN_URL =
  'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';

/**
 * Offer search endpoint.
 */
export const SEARCH_URL =
  'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

/**
 * Scopes granted to the application.
 */
export const SCOPE = 'api_offresdemploiv2 o2dsoffre';

/**
 * Straight-line km around the configured city, wider than the drive on purpose:
 * the isochrone does the real cut.
 */
export const SEARCH_RADIUS_KM = 100;

/**
 * Largest page the API accepts.
 */
export const PAGE_SIZE = 150;

/**
 * Pages fetched around the configured city.
 */
export const LOCAL_MAX_PAGES = 7;

/**
 * Nationwide remote sweep, kept short since the local filter does the sorting out.
 */
export const REMOTE_MAX_PAGES = 2;

/**
 * The API rate-limits bursts, so requests are spaced out and 429s are retried.
 */
export const DELAY_BETWEEN_REQUESTS_MS = 400;

/**
 * Attempts made after a 429 before giving up on the page.
 */
export const MAX_RETRIES = 3;

/**
 * Fallback wait when the 429 carries no Retry-After header.
 */
export const RETRY_BACKOFF_MS = 5_000;

/**
 * Time given to one search request.
 */
export const SEARCH_TIMEOUT_MS = 20_000;

/**
 * Time given to the token endpoint.
 */
export const TOKEN_TIMEOUT_MS = 15_000;

/**
 * Tokens are refreshed this early so one never expires mid-run.
 */
export const TOKEN_REFRESH_MARGIN_S = 60;

/**
 * Ad page an offer id resolves to, when the source gives no direct link.
 */
export const DETAIL_URL =
  'https://candidat.francetravail.fr/offres/recherche/detail';

/**
 * Explicit full-remote wording; the API's "Possibilité de télétravail" is only partial.
 */
export const FULL_REMOTE_TEXT =
  /t[ée]l[ée]travail (total|complet|(a|à) 100)|100 ?% t[ée]l[ée]travail|full remote/i;
