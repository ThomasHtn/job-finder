import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import type { AppConfig } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

/**
 * Public runtime settings, fetched once and shared by the guard and the feed.
 */
@Service()
export class AppConfigApi {
  /**
   * Sends the request.
   */
  private readonly http = inject(HttpClient);

  /**
   * Request in flight or answered, shared by every caller; dropped on failure so the next call retries.
   */
  private pending: Promise<AppConfig | null> | null = null;

  /**
   * Settings as the API gave them, `null` until they arrive.
   */
  private readonly config = signal<AppConfig | null>(null);

  /**
   * Name of the on-site tab, `null` until the settings arrive.
   */
  public readonly areaLabel = computed(() => this.config()?.areaLabel ?? null);

  /**
   * The settings, `null` when the API cannot be reached.
   */
  public load(): Promise<AppConfig | null> {
    this.pending ??= firstValueFrom(this.http.get<AppConfig>(API_ENDPOINTS.config)).then(
      (config) => {
        this.config.set(config);
        return config;
      },
      () => {
        this.pending = null;
        return null;
      },
    );
    return this.pending;
  }
}
