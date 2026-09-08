/**
 * Wording used by sources to flag a fully remote position.
 */
export const REMOTE_PATTERNS = [
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
export const NEGATION_BEFORE =
  /(\bpas (de |d'|d |en )?|\bsans |\baucune? |\bni |\bnon? |\bnot )$/;

/**
 * Characters inspected before a remote mention when looking for a negation.
 */
export const NEGATION_LOOKBEHIND = 12;

/**
 * Wording of every contract that is not a permanent hire.
 */
export const NON_PERMANENT =
  /\bcdd\b|\binterim\b|\bstage\b|\bstagiaire\b|\balternance\b|\bapprenti|\bfreelance\b|\bintern\b|internship|working student|fixed[ -]?term|temporary|\bcontractor\b|duree determinee|part[ -]?time/;

/**
 * English boards say "Full-time" or "Unlimited Contract" where French ones say CDI.
 */
export const PERMANENT =
  /\bcdi\b|permanent|unlimited contract|duree indeterminee|full[ -]?time|temps plein/;

/**
 * Below this length a truncated description has nothing to check the stack against.
 */
export const THIN_DESCRIPTION_LENGTH = 40;
