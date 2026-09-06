import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected submit(): void {
    if (!this.password()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.password()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.error.set('Mot de passe incorrect.');
        this.loading.set(false);
      },
    });
  }
}
