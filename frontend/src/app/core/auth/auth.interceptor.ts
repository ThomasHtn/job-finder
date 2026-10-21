import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { APP_TOKEN_HEADER } from '@job-finder/contract';

import { API_ENDPOINTS, isApiUrl } from '@core/http/api-endpoints';
import { apiErrorCode } from '@core/http/api-error.utils';

import { LOGIN_ROUTE } from './auth.constants';
import { AuthSession } from './auth-session';

/**
 * Attaches the session token to API calls, and sends the reader back to the login screen when the API
 * refuses it. A wrong password answers 401 too: the login screen handles that one itself.
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
        void router.navigateByUrl(LOGIN_ROUTE);
      }
      return throwError(() => error);
    }),
  );
};
