import { keywordRegex } from '../shared/helpers/keyword-match.js';
import { normalize } from '../shared/helpers/normalize-text.js';

/**
 * Stack keywords the offer mentions, in the profile's order and spelling. A keyword found only
 * inside a longer one also found ("spring" in "spring boot") is dropped as a duplicate.
 */
export function matchedStack(text: string, keywords: readonly string[]): string[] {
  const haystack = normalize(text);
  const found = keywords.filter((keyword) => keywordRegex(keyword).test(haystack));
  return found.filter(
    (keyword) =>
      !found.some(
        (other) =>
          other !== keyword &&
          normalize(other).length > normalize(keyword).length &&
          normalize(other).includes(normalize(keyword)),
      ),
  );
}
