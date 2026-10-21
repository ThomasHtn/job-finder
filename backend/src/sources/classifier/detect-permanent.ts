import { normalize } from '../../shared/helpers/normalize-text.js';
import type { RawJob } from '../raw-job.js';
import { EXPLICIT_PERMANENT, NON_PERMANENT, PERMANENT } from './classifier.constants.js';

/**
 * Maps an ATS contract label to a decision, or null when the label says nothing
 * useful (Lever's "GE Employee" and the like).
 */
export function permanentFromLabel(label: string | null | undefined): boolean | null {
  if (!label) return null;
  const normalized = normalize(label);
  if (NON_PERMANENT.test(normalized)) return false;
  if (PERMANENT.test(normalized)) return true;
  return null;
}

/**
 * Reads the contract from the text. The title and contract label are trusted first; a description
 * often names other contracts in passing ("culture de l'apprentissage", "pas d'intérim"), so there
 * an explicit permanent wording outweighs them. Null when the text says nothing.
 */
export function permanentFromText(heading: string, description: string): boolean | null {
  const label = permanentFromLabel(heading);
  if (label !== null) return label;

  const body = normalize(description);
  if (EXPLICIT_PERMANENT.test(body)) return true;
  if (NON_PERMANENT.test(body)) return false;
  return PERMANENT.test(body) ? true : null;
}

/**
 * Falls back to reading the text when the source does not state the contract type.
 */
export function detectPermanent(job: RawJob): boolean {
  if (job.isPermanent !== null) return job.isPermanent;
  return (
    permanentFromText(`${job.title} ${job.contractLabel ?? ''}`, job.description ?? '') ?? false
  );
}
