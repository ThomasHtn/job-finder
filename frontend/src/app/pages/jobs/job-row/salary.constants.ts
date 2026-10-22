/**
 * An amount as the sources write it: "45000.0", "42 000" with any kind of space, "35 k" or "75k".
 */
export const SALARY_AMOUNT = /(\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|\d+)(?:[.,]\d+)?\s?(k)?/gi;

/**
 * A "k" anywhere means thousands, even on the bare "40" of "40 - 50 k€".
 */
export const SALARY_THOUSANDS_HINT = /\dk|k€|k\s€/i;

/**
 * A floor rather than a range.
 */
export const SALARY_FROM_HINT = /partir|dès|from|minimum/i;

/**
 * A monthly pay; "sur 12 mois" alone is still a yearly one.
 */
export const SALARY_MONTHLY_HINT = /mensuel|par mois|\/\s?mois|monthly|per month/i;

/**
 * Pay in another currency, left as the source wrote it.
 */
export const SALARY_FOREIGN_CURRENCY = /[$£]|usd|gbp|chf/i;

/**
 * Below this an amount is a count ("12 mois") or an hourly rate, not a salary the row can shorten.
 */
export const SALARY_MIN_AMOUNT = 1000;
