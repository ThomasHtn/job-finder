import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { storageOf, writeStorage } from '@core/storage/storage.utils';

import { LOCALE_STORAGE_KEY, SOURCE_LOCALE } from './i18n.constants';
import { AppLocale } from './i18n.model';
import { pickLocale, toLocale } from './i18n.utils';

/**
 * Language the app speaks. The choice is browser-local, like the last visit: nothing about it reaches
 * the API. Computed texts read `active()` so they follow a switch without a reload.
 */
@Service()
export class Language {
  /**
   * Page document, whose `<html lang>` screen readers pronounce from.
   */
  private readonly document = inject(DOCUMENT);

  /**
   * Loads and activates the translations.
   */
  private readonly transloco = inject(TranslocoService);

  /**
   * Remembers an explicit choice, `null` when the browser blocks storage.
   */
  private readonly storage = storageOf(this.document);

  /**
   * Writable side of `active`.
   */
  private readonly current = signal<AppLocale>(this.initialLocale());

  /**
   * Language in use, set once its translations are loaded.
   */
  public readonly active = this.current.asReadonly();

  /**
   * Loads the starting language before the first screen, so no key ever shows. When its texts cannot
   * load, the source language is tried instead; if that fails too, the error is the caller's.
   */
  public async start(): Promise<void> {
    const wanted = this.current();
    try {
      await this.apply(wanted);
    } catch (error: unknown) {
      if (wanted === SOURCE_LOCALE) {
        throw error;
      }
      console.error(`Texts of "${wanted}" could not load, using "${SOURCE_LOCALE}".`, error);
      await this.apply(SOURCE_LOCALE);
    }
  }

  /**
   * Switches language and remembers it. The choice is stored first, so the reload that recovers a
   * translation chunk gone with a deployment lands in the language asked for.
   */
  public async use(locale: AppLocale): Promise<void> {
    writeStorage(this.storage, LOCALE_STORAGE_KEY, locale);
    await this.apply(locale);
  }

  /**
   * Loads a language, then makes it the active one everywhere at once.
   */
  private async apply(locale: AppLocale): Promise<void> {
    await firstValueFrom(this.transloco.load(locale));
    this.document.documentElement.lang = locale;
    this.transloco.setActiveLang(locale);
    this.current.set(locale);
  }

  /**
   * An explicit choice wins; failing that, the browser decides.
   */
  private initialLocale(): AppLocale {
    const navigator = this.document.defaultView?.navigator;
    return (
      toLocale(this.storage?.getItem(LOCALE_STORAGE_KEY)) ??
      pickLocale(navigator?.languages ?? [navigator?.language ?? ''])
    );
  }
}
