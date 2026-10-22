import { EnvironmentProviders, inject, isDevMode, provideAppInitializer } from '@angular/core';

import { provideTransloco } from '@jsverse/transloco';

import { APP_LOCALES, SOURCE_LOCALE } from './i18n.constants';
import { startLanguage } from './i18n.utils';
import { Language } from './language';
import { TranslationLoader } from './translation-loader';

/**
 * Transloco, started in the stored or browser language before the first screen, and re-rendering
 * every text when the reader switches from the header or the login screen.
 */
export function provideI18n(): EnvironmentProviders[] {
  return [
    ...provideTransloco({
      config: {
        availableLangs: [...APP_LOCALES],
        defaultLang: SOURCE_LOCALE,
        fallbackLang: SOURCE_LOCALE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslationLoader,
    }),
    provideAppInitializer(() => startLanguage(inject(Language))),
  ];
}
