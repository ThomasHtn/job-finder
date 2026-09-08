import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { IngestionSummary, SourceStatus } from '@job-finder/shared';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/api-url';

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
  run(): Observable<IngestionSummary> {
    return this.http.post<IngestionSummary>(apiUrl('ingestion/run'), {});
  }

  /**
   * Health of the last completed run of each source.
   */
  status(): Observable<SourceStatus[]> {
    return this.http.get<SourceStatus[]>(apiUrl('ingestion/status'));
  }
}
