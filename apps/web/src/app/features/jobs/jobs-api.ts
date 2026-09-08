import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { JobDetail, JobListResponse, JobSummary, JobTab } from '@job-finder/shared';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/api-url';

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
  list(tab: JobTab): Observable<JobListResponse> {
    return this.http.get<JobListResponse>(apiUrl('jobs'), { params: { tab } });
  }

  /**
   * Full offer; the API marks it as viewed.
   */
  detail(id: string): Observable<JobDetail> {
    return this.http.get<JobDetail>(apiUrl(`jobs/${id}`));
  }

  /**
   * Stars or un-stars the offer.
   */
  toggleFavorite(id: string): Observable<JobSummary> {
    return this.http.patch<JobSummary>(apiUrl(`jobs/${id}/favorite`), {});
  }

  /**
   * "Not interested": the offer stops appearing in every tab.
   */
  hide(id: string): Observable<JobSummary> {
    return this.http.patch<JobSummary>(apiUrl(`jobs/${id}/hide`), {});
  }
}
