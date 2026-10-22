import { NUL } from './text.constants.js';

/**
 * Removes the NUL characters PostgreSQL would reject, e.g. the one a decoded `&#0;` leaves.
 */
export function stripNul(text: string): string {
  return text.replaceAll(NUL, '');
}
