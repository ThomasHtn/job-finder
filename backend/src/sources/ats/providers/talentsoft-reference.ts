/**
 * Offer number Talentsoft puts in the link, e.g. `idOffre=10902`; the link itself as a fallback.
 */
export function talentsoftReference(link: string): string {
  return new URL(link).searchParams.get('idOffre') ?? link;
}

/**
 * Drops the internal reference Talentsoft prefixes titles with, e.g. "2026-10902 - ".
 */
export function stripReference(title: string): string {
  return title.replace(/^\s*\d{4}-\d+\s*-\s*/, '').trim();
}
