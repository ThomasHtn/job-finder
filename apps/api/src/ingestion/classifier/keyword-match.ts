import { normalize } from '../../common/text.js';

/**
 * Word-boundary match for plain keywords, so "java" does not match "javascript".
 * Keywords carrying punctuation (".net", "c#", "node.js") fall back to a plain
 * substring test since word boundaries do not apply to those characters.
 */
export function keywordRegex(keyword: string): RegExp {
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
export function matchesKeyword(text: string, keyword: string): boolean {
  return keywordRegex(keyword).test(text);
}

/**
 * True when the normalized text contains at least one of the keywords.
 */
export function matchesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => matchesKeyword(text, keyword));
}
