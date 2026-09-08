import { createHash } from 'node:crypto';
import { normalize } from '../common/text.js';

/**
 * Strips gender markers, bracketed suffixes and punctuation, which vary between boards.
 */
function slugify(value: string | null | undefined): string {
  if (!value) return '';
  return normalize(value)
    .replace(/\((?:[^)]*)\)/g, ' ')
    .replace(/\b(h\/f|f\/h|m\/f|x\/f\/m|h-f|f-h)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Similarity key used to spot the same offer republished across sources.
 * Deliberately coarse: title, company and city are what a human compares.
 */
export function computeDedupeHash(
  title: string,
  company: string | null,
  city: string | null,
): string {
  const key = [slugify(title), slugify(company), slugify(city)].join('|');
  return createHash('sha1').update(key).digest('hex');
}
