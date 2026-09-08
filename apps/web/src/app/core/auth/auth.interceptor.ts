import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { apiUrl, isApiUrl } from '../api-url';
import { AuthService } from './auth.service';

/**
 * Header the API reads the shared password from.
 */
const APP_TOKEN_HEADER = 'x-app-token';

/**
 * Attaches the stored token to API calls and drops the session on a 401.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  /* A wrong password answers 401 too: the login page handles that one itself. */
  const isAuthEndpoint = req.url.startsWith(apiUrl('auth/'));

  const token = auth.token();
  const authorized =
    token && isApiUrl(req.url) ? req.clone({ setHeaders: { [APP_TOKEN_HEADER]: token } }) : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!isAuthEndpoint && error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
