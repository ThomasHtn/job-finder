import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthEndpoint = req.url.startsWith('/api/auth/');

  const token = auth.token();
  const authorized =
    token && req.url.startsWith('/api') ? req.clone({ setHeaders: { 'x-app-token': token } }) : req;

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
