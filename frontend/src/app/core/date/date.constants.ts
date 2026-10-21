/**
 * Milliseconds in one minute.
 */
export const MINUTE_MS = 60 * 1000;

/**
 * Milliseconds in one hour.
 */
export const HOUR_MS = 60 * MINUTE_MS;

/**
 * Milliseconds in one day.
 */
export const DAY_MS = 24 * HOUR_MS;

/**
 * How often the clock moves: the finest grain a label shows is the minute.
 */
export const CLOCK_TICK_MS = MINUTE_MS;

/**
 * Locale handed to Angular's date formatting: the only one it ships, and the patterns used are
 * numeric or follow the active language's own wording.
 */
export const FORMAT_LOCALE = 'en-US';
