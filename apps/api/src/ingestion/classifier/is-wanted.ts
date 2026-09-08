import { normalize } from '../../common/text.js';
import type { SearchProfile } from '../../config/search-profile.js';
import type { RawJob } from '../../sources/raw-job.js';
import { THIN_DESCRIPTION_LENGTH } from './classifier.patterns.js';
import { matchesAny } from './keyword-match.js';

/**
 * True when the offer is the trade described by the profile: the title looks
 * like the role, is not excluded, and the ad mentions one of the wanted technologies.
 * Sources that only expose a short snippet (Adzuna) are exempted from the stack
 * check once the title has already matched the trade, since there is no fuller
 * text to search and the snippet alone would otherwise reject valid offers.
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
