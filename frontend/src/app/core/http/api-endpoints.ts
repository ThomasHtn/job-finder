/**
 * Prefix of every API route. Same origin: the dev proxy and nginx both relay it.
 */
const API_PREFIX = '/api';

/**
 * Backend routes, declared once here; components never build URLs.
 */
export const API_ENDPOINTS = {
  /**
   * Public settings: name of the on-site tab, and whether a password guards the app.
   */
  config: `${API_PREFIX}/config`,

  /**
   * Exchanges the shared password for a session token.
   */
  login: `${API_PREFIX}/auth/login`,

  /**
   * Offers of one tab (`?tab=`), with the counts of every tab.
   */
  jobs: `${API_PREFIX}/jobs`,

  /**
   * One full offer; reading it marks it viewed.
   */
  job: (id: string): string => `${API_PREFIX}/jobs/${encodeURIComponent(id)}`,

  /**
   * Stars or un-stars one offer.
   */
  favorite: (id: string): string => `${API_PREFIX}/jobs/${encodeURIComponent(id)}/favorite`,

  /**
   * Reads every source again, by hand.
   */
  ingestionRun: `${API_PREFIX}/ingestion/run`,

  /**
   * Health of every source and its latest runs.
   */
  ingestionStatus: `${API_PREFIX}/ingestion/status`,
} as const;

/**
 * Whether a request goes to the API, so it carries the session token.
 */
export function isApiUrl(url: string): boolean {
  return url === API_PREFIX || url.startsWith(`${API_PREFIX}/`);
}
