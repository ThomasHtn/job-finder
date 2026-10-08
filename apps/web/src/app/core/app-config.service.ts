import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable, shareReplay } from 'rxjs';

import type { AppConfig } from '@job-finder/shared';

import { apiUrl } from './api-url';

/**
 * Public runtime settings, fetched once and shared for the whole session.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  /**
   * HTTP client.
   */
  private readonly http = inject(HttpClient);

  /**
   * Replayed request, created on first use.
   */
  private cache: Observable<AppConfig> | null = null;

  /**
   * Returns the shared config stream, firing the request only the first time.
   */
  load(): Observable<AppConfig> {
    this.cache ??= this.http.get<AppConfig>(apiUrl('config')).pipe(shareReplay(1));
    return this.cache;
  }
}
