import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { APP_TOKEN_HEADER } from '@job-finder/contract';

import { API_ENDPOINTS, isApiUrl } from '@core/http/api-endpoints';
import { apiErrorCode } from '@core/http/api-error.utils';

import { AuthSession } from './auth-session';
import { loginUrlFor } from './return-url.utils';

/**
 * Attaches the session token to API calls, and sends the reader back to the login screen when the API
 * refuses it, remembering the page to come back to. A wrong password answers 401 too: the login screen handles that one itself.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSession);
  const router = inject(Router);
  const token = session.token();
  const authorized =
    token && isApiUrl(request.url)
      ? request.clone({ setHeaders: { [APP_TOKEN_HEADER]: token } })
      : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (request.url !== API_ENDPOINTS.login && apiErrorCode(error) === 'UNAUTHORIZED') {
        session.signOut();
        void router.navigateByUrl(loginUrlFor(router.url));
      }
      return throwError(() => error);
    }),
  );
};
