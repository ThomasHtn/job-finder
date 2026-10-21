import { EnvironmentProviders, importProvidersFrom, Provider, Service } from '@angular/core';

import {
  provideTranslocoMissingHandler,
  TranslocoMissingHandler,
  TranslocoTestingModule,
} from '@jsverse/transloco';

import en from './i18n/en.json';
import fr from './i18n/fr.json';

/**
 * Fails the spec on a key absent from the translations, instead of rendering the key.
 */
@Service()
export class FailingMissingHandler implements TranslocoMissingHandler {
  /**
   * Throws with the missing key.
   */
  public handle(key: string): never {
    throw new Error(`Missing translation: ${key}`);
  }
}

/**
 * Providers of every spec: Transloco with both languages loaded before the first render, French
 * active, so specs read the texts the reader reads and can switch to English.
 */
export default [
  importProvidersFrom(
    TranslocoTestingModule.forRoot({
      langs: { fr, en },
      translocoConfig: {
        availableLangs: ['fr', 'en'],
        defaultLang: 'fr',
        reRenderOnLangChange: true,
      },
      preloadLangs: true,
    }),
  ),
  provideTranslocoMissingHandler(FailingMissingHandler),
] satisfies (Provider | EnvironmentProviders)[];
