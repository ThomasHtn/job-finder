/**
 * Failed attempts tolerated per client before it is locked out.
 */
export const MAX_ATTEMPTS = 5;

/**
 * Sliding window over which the attempts are counted.
 */
export const WINDOW_MS = 15 * 60 * 1000;
