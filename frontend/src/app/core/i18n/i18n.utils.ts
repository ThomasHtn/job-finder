import { APP_LOCALES, FALLBACK_LOCALE } from './i18n.constants';
import { AppLocale } from './i18n.model';

/**
 * Narrows a language tag to one the app speaks, `null` otherwise; "fr-CA" gives French.
 */
export function toLocale(tag: string | null | undefined): AppLocale | null {
  const base = tag?.toLowerCase().split('-')[0];
  return APP_LOCALES.find((locale) => locale === base) ?? null;
}

/**
 * First language of the browser that the app speaks, else English.
 */
export function pickLocale(languages: readonly string[]): AppLocale {
  for (const language of languages) {
    const locale = toLocale(language);
    if (locale) {
      return locale;
    }
  }
  return FALLBACK_LOCALE;
}

/**
 * Language in use, read from `<html lang>` where `Language` writes it.
 */
export function activeLocale(): AppLocale {
  return toLocale(document.documentElement.lang) ?? FALLBACK_LOCALE;
}

/**
 * Starts the language so the app boots whatever happens: a failure is logged and the screens show
 * their text keys, rather than the start-up screen staying up for ever.
 */
export async function startLanguage(language: { start(): Promise<void> }): Promise<void> {
  try {
    await language.start();
  } catch (error: unknown) {
    console.error('No texts could be loaded, the app starts without translations.', error);
  }
}

/**
 * Whether `count` takes the singular in the active language: 0 and 1 in French, only 1 in English.
 */
export function isSingular(count: number): boolean {
  return new Intl.PluralRules(activeLocale()).select(count) === 'one';
}
