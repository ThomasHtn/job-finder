import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AppConfigApi } from '@core/config/app-config-api';

import { LOGIN_ROUTE } from './auth.constants';
import { AuthSession } from './auth-session';

/**
 * Sends to the login screen when the API asks for a password and no token is held. The API stays the
 * real guard; this only avoids a screen full of 401s.
 */
export const authGuard: CanActivateFn = async () => {
  /* Injected before awaiting: the injection context ends at the first `await`. */
  const session = inject(AuthSession);
  const router = inject(Router);
  const configApi = inject(AppConfigApi);
  if (session.signedIn()) {
    return true;
  }
  const config = await configApi.load();
  /* An API out of reach lets the page load: its own error message says why. */
  return config?.authRequired ? router.parseUrl(LOGIN_ROUTE) : true;
};
