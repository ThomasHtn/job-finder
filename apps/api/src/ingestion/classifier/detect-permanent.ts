import { normalize } from '../../common/text.js';
import type { RawJob } from '../../sources/raw-job.js';
import { NON_PERMANENT, PERMANENT } from './classifier.patterns.js';

/**
 * Maps an ATS contract label to a decision, or null when the label says nothing
 * useful (Lever's "GE Employee" and the like).
 */
export function permanentFromLabel(
  label: string | null | undefined,
): boolean | null {
  if (!label) return null;
  const normalized = normalize(label);
  if (NON_PERMANENT.test(normalized)) return false;
  if (PERMANENT.test(normalized)) return true;
  return null;
}

/**
 * Falls back to reading the text when the source does not state the contract type.
 */
export function detectPermanent(job: RawJob): boolean {
  if (job.isPermanent !== null) return job.isPermanent;

  const haystack = normalize(
    `${job.title} ${job.contractLabel ?? ''} ${job.description ?? ''}`,
  );
  if (NON_PERMANENT.test(haystack)) return false;
  return PERMANENT.test(haystack);
}
