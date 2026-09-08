import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon/icon';

/**
 * Single-field password screen.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  /**
   * Session holder.
   */
  private readonly auth = inject(AuthService);

  /**
   * Router, to reach the feed once logged in.
   */
  private readonly router = inject(Router);

  /**
   * Ends the request with the component.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Field value.
   */
  protected readonly password = signal('');

  /**
   * Message shown under the field on failure.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * True while the password is being checked.
   */
  protected readonly loading = signal(false);

  /**
   * Checks the password; the API answers 401 on a wrong one, 429 when throttled.
   */
  protected submit(): void {
    if (!this.password()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .login(this.password())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (error: { status?: number }) => {
          this.error.set(
            error.status === 429
              ? 'Trop de tentatives, réessayez dans quelques minutes.'
              : 'Mot de passe incorrect.',
          );
          this.loading.set(false);
        },
      });
  }
}
