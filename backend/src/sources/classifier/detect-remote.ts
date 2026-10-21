import { keywordRegex } from '../../shared/helpers/keyword-match.js';
import { normalize } from '../../shared/helpers/normalize-text.js';
import type { RawJob } from '../raw-job.js';
import { NEGATION_BEFORE, NEGATION_LOOKBEHIND, REMOTE_PATTERNS } from './classifier.constants.js';

/**
 * Sources rarely flag remote explicitly, so the wording is inspected as well.
 * A mention preceded by a negation ("pas de full remote") does not count.
 */
export function detectRemote(job: RawJob): boolean {
  if (job.isRemote) return true;
  const haystack = normalize(`${job.title} ${job.locationText ?? ''} ${job.description ?? ''}`);
  return REMOTE_PATTERNS.some((pattern) =>
    [...haystack.matchAll(keywordRegex(pattern))].some(
      (match) =>
        !NEGATION_BEFORE.test(
          haystack.slice(Math.max(0, match.index - NEGATION_LOOKBEHIND), match.index),
        ),
    ),
  );
}
