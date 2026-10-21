/**
 * Statuses worth retrying: rate limiting and server-side outages.
 */
export function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}
