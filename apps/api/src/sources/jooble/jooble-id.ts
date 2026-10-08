/**
 * Offer id taken from its `/jdp/<id>` link, exact where the numeric `id` field is not.
 */
export function joobleId(link: string): string {
  return /\/jdp\/(-?\d+)/.exec(link)?.[1] ?? link;
}
