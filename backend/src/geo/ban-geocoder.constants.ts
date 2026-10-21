/**
 * Public endpoint of the French national address base (BAN).
 */
export const GEOCODER_URL = 'https://data.geopf.fr/geocodage/search';

/**
 * Below this the BAN match is too loose to be trusted (wrong town, partial street).
 */
export const MIN_SCORE = 0.4;

/**
 * Time given to the geocoder before the query counts as a miss.
 */
export const TIMEOUT_MS = 10_000;
