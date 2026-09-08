import { normalize } from '../common/text.js';
import type { SearchProfile } from '../config/search-profile.js';
import type { RawJob } from '../sources/source.types.js';

/**
 * Wording used by sources to flag a fully remote position.
 */
const REMOTE_PATTERNS = [
  'teletravail total',
  'teletravail complet',
  '100% teletravail',
  '100 % teletravail',
  'teletravail a 100',
  'full remote',
  'full-remote',
  'fully remote',
  'remote france',
  'anywhere in france',
  'totalement a distance',
] as const;

/**
 * Words that flip a remote mention, as in "pas de full remote" or "no remote work".
 */
const NEGATION_BEFORE =
  /(\bpas (de |d'|d |en )?|\bsans |\baucune? |\bni |\bnon? |\bnot )$/;

/**
 * Characters inspected before a remote mention when looking for a negation.
 */
const NEGATION_LOOKBEHIND = 12;

/**
 * Wording of every contract that is not a permanent hire.
 */
const NON_PERMANENT =
  /\bcdd\b|\binterim\b|\bstage\b|\bstagiaire\b|\balternance\b|\bapprenti|\bfreelance\b|\bintern\b|internship|working student|fixed[ -]?term|temporary|\bcontractor\b|duree determinee|part[ -]?time/;

/**
 * English boards say "Full-time" or "Unlimited Contract" where French ones say CDI.
 */
const PERMANENT =
  /\bcdi\b|permanent|unlimited contract|duree indeterminee|full[ -]?time|temps plein/;

/**
 * Below this length a truncated description has nothing to check the stack against.
 */
const THIN_DESCRIPTION_LENGTH = 40;

/**
 * Word-boundary match for plain keywords, so "java" does not match "javascript".
 * Keywords carrying punctuation (".net", "c#", "node.js") fall back to a plain
 * substring test since word boundaries do not apply to those characters.
 */
function keywordRegex(keyword: string): RegExp {
  const needle = normalize(keyword);
  const escaped = needle
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/ /g, '\\s+');
  return /^[a-z0-9 ]+$/.test(needle)
    ? new RegExp(`\\b${escaped}\\b`, 'g')
    : new RegExp(escaped, 'g');
}

/**
 * True when the normalized text contains the keyword.
 */
function matchesKeyword(text: string, keyword: string): boolean {
  return keywordRegex(keyword).test(text);
}

/**
 * True when the normalized text contains at least one of the keywords.
 */
function matchesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => matchesKeyword(text, keyword));
}

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

/**
 * Sources rarely flag remote explicitly, so the wording is inspected as well.
 * A mention preceded by a negation ("pas de full remote") does not count.
 */
export function detectRemote(job: RawJob): boolean {
  if (job.isRemote) return true;
  const haystack = normalize(
    `${job.title} ${job.locationText ?? ''} ${job.description ?? ''}`,
  );
  return REMOTE_PATTERNS.some((pattern) =>
    [...haystack.matchAll(keywordRegex(pattern))].some(
      (match) =>
        !NEGATION_BEFORE.test(
          haystack.slice(
            Math.max(0, match.index - NEGATION_LOOKBEHIND),
            match.index,
          ),
        ),
    ),
  );
}

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
