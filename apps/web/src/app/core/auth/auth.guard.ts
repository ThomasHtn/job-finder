import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import { AuthService } from './auth.service';

/**
 * Sends to /login when the API requires a password and none is stored.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return inject(AppConfigService)
    .load()
    .pipe(
      map((config) => (config.authRequired ? router.parseUrl('/login') : true)),
      /* Can't reach the API: let the page load, its own error banner will explain why. */
      catchError(() => of(true)),
    );
};
