import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { apiUrl } from '../api-url';

/**
 * localStorage key of the token.
 */
const STORAGE_KEY = 'job-finder-token';

/**
 * Payload of a successful login.
 */
interface LoginResponse {
  /**
   * Opaque session token to send back in the app token header.
   */
  token: string;
}

/**
 * Holds the shared-password token for the session, persisted across reloads.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * HTTP client.
   */
  private readonly http = inject(HttpClient);

  /**
   * Current token, null when logged out.
   */
  readonly token = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  /**
   * Checks the password with the API and keeps the returned session token.
   * The password itself is never stored in the browser.
   */
  login(password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(apiUrl('auth/login'), { password }).pipe(
      tap(({ token }) => {
        localStorage.setItem(STORAGE_KEY, token);
        this.token.set(token);
      }),
    );
  }

  /**
   * Forgets the token.
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.token.set(null);
  }

  /**
   * True when a token is stored, whether or not the API still accepts it.
   */
  isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
