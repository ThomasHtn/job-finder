import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { reloadIfStaleBuild } from '@core/http/stale-build.utils';
import { APP_LOCALES } from '@core/i18n/i18n.constants';
import { AppLocale } from '@core/i18n/i18n.model';
import { Language } from '@core/i18n/language';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';

import { LANGUAGE_NATIVE_NAMES } from './settings-menu.constants';

/**
 * The gear at the top right: a disclosure holding the sources board and the language. Not an ARIA
 * menu, which would promise arrow-key navigation: a button that shows a group of plain buttons.
 */
@Component({
  selector: 'app-settings-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, IconButton, TranslocoPipe],
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.scss',
  host: {
    class: 'settings-menu',
    '(document:pointerdown)': 'closeFromOutside($event)',
    '(document:keydown.escape)': 'closeWithEscape()',
  },
})
export class SettingsMenu {
  /**
   * Holder of the current language.
   */
  protected readonly language = inject(Language);

  /**
   * Page reloaded when the other language's chunk is gone with a deployment.
   */
  private readonly document = inject(DOCUMENT);

  /**
   * This component's element, to tell a click inside from one outside.
   */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * The gear, given the focus back when the panel closes from the keyboard.
   */
  private readonly trigger = viewChild.required<string, ElementRef<HTMLButtonElement>>('trigger', {
    read: ElementRef,
  });

  /**
   * True while the sources board is the view on screen.
   */
  public readonly sourcesActive = input(false);

  /**
   * True when a source is down: the entry says so, like the refresh button.
   */
  public readonly degraded = input(false);

  /**
   * Emits when the reader asks for the sources board.
   */
  public readonly sourcesSelected = output<void>();

  /**
   * Whether the panel is showing.
   */
  protected readonly open = signal(false);

  /**
   * The languages offered, in the order of the app.
   */
  protected readonly locales = APP_LOCALES;

  /**
   * Each language named in itself.
   */
  protected readonly names = LANGUAGE_NATIVE_NAMES;

  /**
   * Shows or hides the panel.
   */
  protected toggle(): void {
    this.open.update((open) => !open);
  }

  /**
   * Sources picked: the panel closes on the way.
   */
  protected showSources(): void {
    this.open.set(false);
    this.sourcesSelected.emit();
  }

  /**
   * Switches language; a tab left open across a deployment reloads to find the other one.
   */
  protected useLanguage(locale: AppLocale): void {
    this.open.set(false);
    if (locale === this.language.active()) {
      return;
    }
    const window = this.document.defaultView;
    this.language
      .use(locale)
      .catch((error: unknown) => reloadIfStaleBuild(window, error, window?.location.href ?? ''));
  }

  /**
   * A press anywhere else closes the panel, as any popover does.
   */
  protected closeFromOutside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  /**
   * Escape closes the panel and puts the focus back on the gear.
   */
  protected closeWithEscape(): void {
    if (this.open()) {
      this.open.set(false);
      this.trigger().nativeElement.focus();
    }
  }
}
