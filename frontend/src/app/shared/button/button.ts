import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ButtonVariant } from './button.model';

/**
 * Text button on a native `<button>` or `<a>`, so forms, links and focus behave as the browser does.
 * Usage: `<button app-button type="button" variant="primary">...</button>`.
 */
@Component({
  selector: 'button[app-button], a[app-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    class: 'button',
    '[class.button--primary]': "variant() === 'primary'",
  },
})
export class Button {
  /**
   * Neutral by default; `primary` for the one main action of a screen.
   */
  public readonly variant = input<ButtonVariant>('default');
}
