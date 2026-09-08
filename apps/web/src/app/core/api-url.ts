/**
 * Prefix of every API route. Same-origin: the dev proxy and nginx both forward it.
 */
export const API_BASE_URL = '/api';

/**
 * Builds an API URL from a path relative to the prefix, e.g. apiUrl('jobs').
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path}`;
}

/**
 * True when the request targets the API, so the auth header should be attached.
 */
export function isApiUrl(url: string): boolean {
  return url === API_BASE_URL || url.startsWith(`${API_BASE_URL}/`);
}
