/**
 * Named entities met in source descriptions; numeric ones are decoded generically.
 */
export const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  agrave: 'à',
  ccedil: 'ç',
  ugrave: 'ù',
  ocirc: 'ô',
  icirc: 'î',
  rsquo: '’',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

/**
 * Highest Unicode code point: a numeric entity above it is not a character.
 */
export const MAX_CODE_POINT = 0x10ffff;

/**
 * Markup that is real HTML rather than entity-escaped HTML.
 */
export const REAL_TAG = /<[a-z/!]/i;
