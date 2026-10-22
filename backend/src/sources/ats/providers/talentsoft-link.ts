/**
 * Absolute address of an item link, relative ones being read from the career site host; null when
 * the link is not an address at all, so one bad item never costs the whole feed.
 */
export function resolveLink(link: string | undefined, host: string): string | null {
  if (!link) return null;
  try {
    return new URL(link, `https://${host}/`).href;
  } catch {
    return null;
  }
}
