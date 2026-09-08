import { Injectable, computed, signal } from '@angular/core';
import { browserLocale } from './browser-locale';
import { EN } from './en';
import { FR } from './fr';
import { toLocale, type Locale } from './locale';
import type { Translations } from './translations';

/**
 * localStorage key of the reader's explicit choice.
 */
const STORAGE_KEY = 'job-finder-locale';

/**
 * The language the UI speaks, and the wording that goes with it. The choice is browser-local,
 * like the last visit: nothing about it is sent to the api.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  /**
   * Every shipped dictionary.
   */
  private readonly dictionaries: Record<Locale, Translations> = { fr: FR, en: EN };

  /**
   * Writable side of the exposed signal.
   */
  private readonly current = signal(this.initialLocale());

  /**
   * Language currently in use.
   */
  readonly locale = this.current.asReadonly();

  /**
   * Wording of that language. Components expose it as `t` and read `t().section.key`, so the
   * template re-renders on its own when the language changes.
   */
  readonly t = computed<Translations>(() => this.dictionaries[this.current()]);

  /**
   * Announces the initial language to the document.
   */
  constructor() {
    this.applyDocumentLang();
  }

  /**
   * Switches language and remembers it for the next visit.
   */
  setLocale(locale: Locale): void {
    this.current.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    this.applyDocumentLang();
  }

  /**
   * An explicit choice wins; failing that, the browser decides.
   */
  private initialLocale(): Locale {
    return (
      toLocale(localStorage.getItem(STORAGE_KEY)) ??
      browserLocale(navigator.languages ?? [navigator.language])
    );
  }

  /**
   * Keeps `<html lang>` truthful, which is what screen readers pronounce from.
   */
  private applyDocumentLang(): void {
    document.documentElement.lang = this.current();
  }
}
