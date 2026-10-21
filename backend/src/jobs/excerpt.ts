/**
 * Longest excerpt shown in the feed, before the ellipsis.
 */
const EXCERPT_LENGTH = 220;

/**
 * Flattens the description to a single line and cuts it on a word boundary.
 */
export function excerpt(description: string | null): string | null {
  if (!description) return null;
  const flat = description.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return flat;
  const cut = flat.lastIndexOf(' ', EXCERPT_LENGTH);
  return `${flat.slice(0, cut > 0 ? cut : EXCERPT_LENGTH)}…`;
}
