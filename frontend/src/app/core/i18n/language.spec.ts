import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { useCleanStorage } from '@core/storage/storage.fixtures';

import { LOCALE_STORAGE_KEY } from './i18n.constants';
import { useFrenchTexts } from './i18n.fixtures';
import { Language } from './language';

describe('Language', () => {
  useFrenchTexts();
  useCleanStorage();

  afterEach(() => vi.restoreAllMocks());

  /**
   * Gives the browser these preferred languages.
   */
  function browserLanguages(languages: string[]): void {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  }

  it('keeps the choice stored on a previous visit', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    browserLanguages(['fr-FR']);

    expect(TestBed.inject(Language).active()).toBe('en');
  });

  it('lets the browser decide on a first visit, by its first language the app speaks', () => {
    browserLanguages(['de-DE', 'fr-CA', 'en-GB']);

    expect(TestBed.inject(Language).active()).toBe('fr');
  });

  it('falls back to English when the browser asks for neither', () => {
    browserLanguages(['de-DE']);

    expect(TestBed.inject(Language).active()).toBe('en');
  });

  it('starts in the source language when the stored one cannot load', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const transloco = TestBed.inject(TranslocoService);
    vi.spyOn(transloco, 'load').mockImplementation((locale) =>
      locale === 'en' ? throwError(() => new Error('chunk gone')) : of({}),
    );
    const language = TestBed.inject(Language);

    await language.start();

    expect(language.active()).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('gives up when even the source language cannot load', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    vi.spyOn(TestBed.inject(TranslocoService), 'load').mockReturnValue(
      throwError(() => new Error('offline')),
    );

    await expect(TestBed.inject(Language).start()).rejects.toThrow('offline');
  });

  it('switches, tells screen readers, and remembers it for the next visit', async () => {
    browserLanguages(['fr-FR']);
    const language = TestBed.inject(Language);

    await language.use('en');

    expect(language.active()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });
});
