import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Compares two secrets in constant time, so the response delay never leaks
 * how many leading characters of the expected value were right.
 * Both values are hashed first so their lengths cannot be compared either.
 */
export function secretsMatch(candidate: unknown, expected: string): boolean {
  if (typeof candidate !== 'string') return false;
  const digest = (value: string): Buffer =>
    createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}
