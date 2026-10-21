import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import type { IngestionSummary } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

/**
 * The manual trigger of the ingestion; the source health is read through `httpResource`.
 */
@Service()
export class IngestionApi {
  /**
   * Sends the call.
   */
  private readonly http = inject(HttpClient);

  /**
   * Reads every source again; can take a couple of minutes.
   */
  public run(): Promise<IngestionSummary> {
    return firstValueFrom(this.http.post<IngestionSummary>(API_ENDPOINTS.ingestionRun, {}));
  }
}
