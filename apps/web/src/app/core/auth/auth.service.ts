import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

const STORAGE_KEY = 'job-finder-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  login(password: string): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>('/api/auth/login', { password }).pipe(
      tap(() => {
        localStorage.setItem(STORAGE_KEY, password);
        this.token.set(password);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.token.set(null);
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
