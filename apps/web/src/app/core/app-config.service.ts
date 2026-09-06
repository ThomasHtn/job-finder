import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AppConfig } from '@job-finder/shared';
import { Observable, shareReplay } from 'rxjs';

/** Public runtime settings, fetched once and shared for the whole session. */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private cache: Observable<AppConfig> | null = null;

  load(): Observable<AppConfig> {
    this.cache ??= this.http.get<AppConfig>('/api/config').pipe(shareReplay(1));
    return this.cache;
  }
}
