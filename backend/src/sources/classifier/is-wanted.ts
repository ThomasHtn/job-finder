import type { SearchProfile } from '../../shared/config/search-profile.types.js';
import { matchesAny } from '../../shared/helpers/keyword-match.js';
import { normalize } from '../../shared/helpers/normalize-text.js';
import type { RawJob } from '../raw-job.js';
import { THIN_DESCRIPTION_LENGTH } from './classifier.constants.js';

/**
 * True when the offer is the trade described by the profile: the title looks
 * like the role, is not excluded, and the ad mentions one of the wanted technologies.
 * A truncated description too short to judge (under THIN_DESCRIPTION_LENGTH) is
 * exempted from the stack check once the title has matched the trade: there is
 * no fuller text to search. A longer snippet, like Adzuna's, is still checked.
 */
export function isWanted(job: RawJob, profile: SearchProfile): boolean {
  const title = normalize(job.title);
  if (matchesAny(title, profile.titleExclude)) return false;
  if (!matchesAny(title, profile.titleInclude)) return false;

  const description = normalize(job.description ?? '');
  if (!job.hasFullDescription && description.length < THIN_DESCRIPTION_LENGTH) {
    return true;
  }

  return matchesAny(`${title} ${description}`, profile.stackKeywords);
}
