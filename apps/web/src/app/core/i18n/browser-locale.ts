import { FALLBACK_LOCALE, type Locale, toLocale } from './locale';

/**
 * First of the reader's preferred languages the UI actually speaks.
 */
export function browserLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const locale = toLocale(tag);
    if (locale) return locale;
  }
  return FALLBACK_LOCALE;
}
