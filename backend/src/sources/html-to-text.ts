import { stripNul } from '../shared/helpers/strip-nul.js';
import { ENTITIES, MAX_CODE_POINT, REAL_TAG } from './html-to-text.constants.js';

/**
 * Replaces named, decimal and hexadecimal entities; unknown or invalid ones are left as is.
 */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Turns an HTML description into readable plain text. Some boards (Greenhouse) return HTML that is
 * itself entity-escaped, so it is unescaped once before the tags go. Text entities are decoded only
 * after, or an escaped "&lt;" would read as the start of a tag and swallow the text behind it.
 */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null;

  const markup = REAL_TAG.test(html) ? html : decodeEntities(html);
  const stripped = markup
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '');
  /* A decoded `&#0;` leaves a NUL, which PostgreSQL refuses. */
  const text = stripNul(decodeEntities(stripped))
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text || null;
}
