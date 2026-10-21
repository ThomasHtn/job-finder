import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { translate } from '@jsverse/transloco';

import { APP_LOCALES } from '@core/i18n/i18n.constants';
import { AppLocale } from '@core/i18n/i18n.model';
import { Language } from '@core/i18n/language';
import { IconButton } from '@shared/icon-button/icon-button';

/**
 * The language switch: one button, showing the language in use and swapping to the next one.
 */
@Component({
  selector: 'app-language-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconButton],
  templateUrl: './language-toggle.html',
  styleUrl: './language-toggle.scss',
})
export class LanguageToggle {
  /**
   * Holder of the current language.
   */
  private readonly language = inject(Language);

  /**
   * Two letters is all the room the header has: "FR", "EN".
   */
  protected readonly code = computed(() => this.language.active().toUpperCase());

  /**
   * The one the button switches to; with two languages, the other one.
   */
  private readonly next = computed<AppLocale>(() => {
    const index = APP_LOCALES.indexOf(this.language.active());
    return APP_LOCALES[(index + 1) % APP_LOCALES.length];
  });

  /**
   * Says what pressing does, in the language in use, since the code alone only says where we are.
   */
  protected readonly label = computed(() => {
    this.language.active();
    return translate('language.switchTo', { name: translate<string>(`languages.${this.next()}`) });
  });

  /**
   * Moves to the next language.
   */
  protected switchLanguage(): void {
    void this.language.use(this.next());
  }
}
