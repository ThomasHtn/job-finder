import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import type { JobSummary } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';

/**
 * Writes on one offer; reads go through `httpResource` in the screens that show them.
 */
@Service()
export class JobsApi {
  /**
   * Sends the write calls.
   */
  private readonly http = inject(HttpClient);

  /**
   * Stars or un-stars the offer, answering its new state.
   */
  public toggleFavorite(id: string): Promise<JobSummary> {
    return firstValueFrom(this.http.patch<JobSummary>(API_ENDPOINTS.favorite(id), {}));
  }

  /**
   * "Not interested": the offer stops appearing in every tab.
   */
  public hide(id: string): Promise<JobSummary> {
    return firstValueFrom(this.http.patch<JobSummary>(API_ENDPOINTS.hide(id), {}));
  }
}
