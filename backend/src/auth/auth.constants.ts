import { DAY_MS, MINUTE_MS } from '../shared/helpers/time.constants.js';

/**
 * How long a login stays valid.
 */
export const SESSION_TTL_MS = 30 * DAY_MS;

/**
 * Sign-in attempts tolerated per client within the window, successful or not.
 */
export const MAX_ATTEMPTS = 5;

/**
 * Sliding window over which the sign-in attempts are counted.
 */
export const WINDOW_MS = 15 * MINUTE_MS;
