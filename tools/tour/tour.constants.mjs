/**
 * The app as `tour.sh` serves it, on ports of its own so `make dev` can keep its 4201 and 3001.
 */
export const APP_URL = 'http://localhost:4301';

/**
 * The API behind it, signed into directly to skip the login screen.
 */
export const API_URL = 'http://localhost:3101';

/**
 * Password `tour.sh` sets on the throwaway database.
 */
export const TOUR_PASSWORD = 'job-finder-tour-password';

/**
 * Hour of yesterday's fake visit: every offer seeded after it reads as new.
 */
export const LAST_VISIT_HOUR = 18.5;

/**
 * Size of the tour, the same as littlewords' so both READMEs look alike.
 */
export const STAGE_VIEWPORT = { width: 1200, height: 760 };

/**
 * A common phone, at twice the density so the framed screens stay sharp.
 */
export const PHONE_DEVICE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

/**
 * Selector of an offer title in the feed, the sign that a list has loaded.
 */
export const ROW_TITLE = '.job-row__title';
