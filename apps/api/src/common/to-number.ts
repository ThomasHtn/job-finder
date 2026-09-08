/**
 * Coordinates come as strings on several sources; an unparseable one is treated as missing.
 */
export function toNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
