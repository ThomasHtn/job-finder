import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AppConfigApi } from '@core/config/app-config-api';

import { AuthSession } from './auth-session';
import { loginUrlFor } from './return-url.utils';

/**
 * Sends to the login screen when the API asks for a password and no token is held. The API stays the
 * real guard; this only avoids a screen full of 401s. The page asked for is remembered, so signing in
 * leads back to it.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  /* Injected before awaiting: the injection context ends at the first `await`. */
  const session = inject(AuthSession);
  const router = inject(Router);
  const configApi = inject(AppConfigApi);
  if (session.signedIn()) {
    return true;
  }
  const config = await configApi.load();
  /* An API out of reach lets the page load: its own error message says why. */
  return config?.authRequired ? router.parseUrl(loginUrlFor(state.url)) : true;
};
