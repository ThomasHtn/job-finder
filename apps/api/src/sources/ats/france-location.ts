import { FOREIGN_COUNTRIES } from './ats.constants.js';

/**
 * ATS boards are international; only French positions are worth ingesting.
 */
export function isFrance(
  ...candidates: (string | null | undefined)[]
): boolean {
  return candidates.some(
    (value) => value && /\bfrance\b|^fr$/i.test(value.trim()),
  );
}

/**
 * Guards against boards whose country metadata contradicts the office location.
 */
export function mentionsForeignCountry(
  location: string | null | undefined,
): boolean {
  return Boolean(
    location && FOREIGN_COUNTRIES.test(location) && !isFrance(location),
  );
}
