import { stripNul } from '../shared/helpers/strip-nul.js';
import type { RawJob } from '../sources/raw-job.js';

/**
 * Cleans one value of a raw offer: strings, and lists of strings such as the alternative links.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return stripNul(value);
  return Array.isArray(value) ? value.map(sanitizeValue) : value;
}

/**
 * Strips the NUL characters PostgreSQL rejects from every text field of an offer, wherever the
 * board let one slip in, so a single bad offer cannot fail its write.
 */
export function sanitizeJob(raw: RawJob): RawJob {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, sanitizeValue(value)]),
  ) as unknown as RawJob;
}
