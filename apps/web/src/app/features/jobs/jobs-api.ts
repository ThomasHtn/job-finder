import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import type { JobDetail, JobListResponse, JobSummary, JobTab } from '@job-finder/shared';

import { apiUrl } from '@core/api-url';

/**
 * Calls behind the /jobs routes.
 */
@Injectable({ providedIn: 'root' })
export class JobsApi {
  /**
   * HTTP client.
   */
  private readonly http = inject(HttpClient);

  /**
   * Offers of one tab plus the counts of every tab.
   */
  public list(tab: JobTab): Observable<JobListResponse> {
    return this.http.get<JobListResponse>(apiUrl('jobs'), { params: { tab } });
  }

  /**
   * Full offer; the API marks it as viewed.
   */
  public detail(id: string): Observable<JobDetail> {
    return this.http.get<JobDetail>(apiUrl(`jobs/${id}`));
  }

  /**
   * Stars or un-stars the offer.
   */
  public toggleFavorite(id: string): Observable<JobSummary> {
    return this.http.patch<JobSummary>(apiUrl(`jobs/${id}/favorite`), {});
  }

  /**
   * "Not interested": the offer stops appearing in every tab.
   */
  public hide(id: string): Observable<JobSummary> {
    return this.http.patch<JobSummary>(apiUrl(`jobs/${id}/hide`), {});
  }
}
