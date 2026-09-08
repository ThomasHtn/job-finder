/**
 * Characters sources use to open a bullet line.
 */
export const BULLET = /^[-–—•*▪>]\s+/;

/**
 * A short line ending in a colon introduces what follows: it stands on its own.
 */
export const LEAD_IN = /:$/;

/**
 * Longest line still treated as a lead-in.
 */
export const LEAD_IN_MAX = 90;
