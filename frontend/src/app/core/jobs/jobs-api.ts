import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import type { FavoriteUpdate, JobSummary } from '@job-finder/contract';

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
   * Sets the star of the offer to the state asked, answering the offer as saved.
   */
  public setFavorite(id: string, isFavorite: boolean): Promise<JobSummary> {
    const body: FavoriteUpdate = { isFavorite };
    return firstValueFrom(this.http.patch<JobSummary>(API_ENDPOINTS.favorite(id), body));
  }
}
