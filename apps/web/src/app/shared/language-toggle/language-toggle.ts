import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { SUPPORTED_LOCALES, type Locale } from '../../core/i18n/locale';

/**
 * The language switch: one button, showing the language in use and swapping to the next one.
 */
@Component({
  selector: 'app-language-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-toggle.html',
  styleUrl: './language-toggle.scss',
})
export class LanguageToggle {
  /**
   * Holder of the current language.
   */
  private readonly i18n = inject(I18n);

  /**
   * Wording of the language in use.
   */
  private readonly t = this.i18n.t;

  /**
   * Two letters is all the room the header has: "FR", "EN".
   */
  protected readonly code = computed(() => this.i18n.locale().toUpperCase());

  /**
   * The one the button switches to; with two languages, the other one.
   */
  private readonly next = computed<Locale>(() => {
    const index = SUPPORTED_LOCALES.indexOf(this.i18n.locale());
    return SUPPORTED_LOCALES[(index + 1) % SUPPORTED_LOCALES.length];
  });

  /**
   * Says what pressing does, since the code alone only says where we are.
   */
  protected readonly label = computed(() =>
    this.t().language.switchTo(this.t().languages[this.next()]),
  );

  /**
   * Moves to the next language.
   */
  protected switchLanguage(): void {
    this.i18n.setLocale(this.next());
  }
}
