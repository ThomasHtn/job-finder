import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import type { LoginResponse } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';
import { storageOf, writeStorage } from '@core/storage/storage.utils';

import { TOKEN_STORAGE_KEY } from './auth.constants';

/**
 * Session token of the shared password, kept across reloads. The password itself never stays in the
 * browser; the API decides whether the token still opens anything.
 */
@Service()
export class AuthSession {
  /**
   * Sends the login call.
   */
  private readonly http = inject(HttpClient);

  /**
   * Keeps the token across reloads, `null` when the browser blocks storage.
   */
  private readonly storage = storageOf(inject(DOCUMENT));

  /**
   * Current token, `null` when signed out.
   */
  public readonly token = signal<string | null>(this.storage?.getItem(TOKEN_STORAGE_KEY) ?? null);

  /**
   * Whether a token is held, whether or not the API still accepts it.
   */
  public readonly signedIn = computed(() => this.token() !== null);

  /**
   * Exchanges the password for a token; rejects with the HTTP error so the login screen can read it.
   */
  public async signIn(password: string): Promise<void> {
    const { token } = await firstValueFrom(
      this.http.post<LoginResponse>(API_ENDPOINTS.login, { password }),
    );
    writeStorage(this.storage, TOKEN_STORAGE_KEY, token);
    this.token.set(token);
  }

  /**
   * Forgets the token, after the API refused it.
   */
  public signOut(): void {
    writeStorage(this.storage, TOKEN_STORAGE_KEY, null);
    this.token.set(null);
  }
}
