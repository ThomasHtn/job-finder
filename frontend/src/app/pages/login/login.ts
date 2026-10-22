import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { AuthSession } from '@core/auth/auth-session';
import { safeReturnUrl } from '@core/auth/return-url.utils';
import { Brand } from '@shared/brand/brand';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { LanguageToggle } from '@shared/language-toggle/language-toggle';

import { loginErrorMessage } from './login.utils';

/**
 * Single-field password screen.
 */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Brand, Button, Icon, LanguageToggle, TranslocoPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  /**
   * Exchanges the password for a session token.
   */
  private readonly session = inject(AuthSession);

  /**
   * Leaves for the page the reader came for once signed in.
   */
  private readonly router = inject(Router);

  /**
   * Bound from the `?returnUrl=` query parameter: where the guard or a refused token sent the reader from.
   */
  public readonly returnUrl = input<string>();

  /**
   * Password as typed.
   */
  protected readonly password = signal('');

  /**
   * Why the last attempt failed, `null` when there is nothing to say.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * True while the password is being checked.
   */
  protected readonly loading = signal(false);

  /**
   * Keeps the typed password.
   */
  protected onInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  /**
   * Checks the password; the API answers 401 on a wrong one, 429 when throttled.
   */
  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.password()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.session.signIn(this.password());
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } catch (error: unknown) {
      this.error.set(loginErrorMessage(error));
      this.loading.set(false);
    }
  }
}
