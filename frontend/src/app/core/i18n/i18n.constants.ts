import { AppLocale } from './i18n.model';

/**
 * Language the texts are written in first: `fr.json` sets the keys `en.json` follows.
 */
export const SOURCE_LOCALE: AppLocale = 'fr';

/**
 * Every language the app speaks, in the order the switch walks through them.
 */
export const APP_LOCALES: readonly AppLocale[] = [SOURCE_LOCALE, 'en'];

/**
 * Used when the browser asks for no language the app speaks.
 */
export const FALLBACK_LOCALE: AppLocale = 'en';

/**
 * localStorage key of the reader's explicit choice, kept on this browser only.
 */
export const LOCALE_STORAGE_KEY = 'job-finder-locale';
