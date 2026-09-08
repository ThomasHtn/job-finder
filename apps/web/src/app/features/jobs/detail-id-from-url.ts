/**
 * Matches the offer id of the detail route, whatever precedes or follows it.
 */
const DETAIL_URL = /\/offres\/([^/?#]+)/;

/**
 * Id of the offer the URL has open, null when the detail route is closed.
 */
export function detailIdFromUrl(url: string): string | null {
  return DETAIL_URL.exec(url)?.[1] ?? null;
}
