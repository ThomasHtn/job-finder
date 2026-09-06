import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { IngestionSummary, SourceStatus } from '@job-finder/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IngestionApi {
  private readonly http = inject(HttpClient);

  /** Triggers a manual fetch of every job source, right before the list is reloaded. */
  run(): Observable<IngestionSummary> {
    return this.http.post<IngestionSummary>('/api/ingestion/run', {});
  }

  /** Health of the last completed run of each source. */
  status(): Observable<SourceStatus[]> {
    return this.http.get<SourceStatus[]>('/api/ingestion/status');
  }
}
