/**
 * Languages the UI ships with, in the order the switcher walks through them.
 */
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;

/**
 * One of the shipped languages.
 */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Used when the browser asks for a language the UI does not speak.
 */
export const FALLBACK_LOCALE: Locale = 'en';

/**
 * Narrows a tag to a shipped language, null when it is not one. The region is dropped:
 * "fr-CA" and "fr" get the same wording.
 */
export function toLocale(tag: string | null | undefined): Locale | null {
  const candidate = tag?.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(candidate as Locale) ? (candidate as Locale) : null;
}
