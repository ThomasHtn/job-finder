import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import type { IngestionSummary, SourceStatus } from '@job-finder/shared';

import { apiUrl } from './api-url';

/**
 * Calls behind the /ingestion routes.
 */
@Injectable({ providedIn: 'root' })
export class IngestionApi {
  /**
   * HTTP client.
   */
  private readonly http = inject(HttpClient);

  /**
   * Triggers a manual fetch of every job source, right before the list is reloaded.
   */
  public run(): Observable<IngestionSummary> {
    return this.http.post<IngestionSummary>(apiUrl('ingestion/run'), {});
  }

  /**
   * Health of the last completed run of each source.
   */
  public status(): Observable<SourceStatus[]> {
    return this.http.get<SourceStatus[]>(apiUrl('ingestion/status'));
  }
}
