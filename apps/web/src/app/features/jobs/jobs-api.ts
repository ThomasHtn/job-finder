import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { JobDetail, JobListResponse, JobSummary, JobTab } from '@job-finder/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JobsApi {
  private readonly http = inject(HttpClient);

  list(tab: JobTab): Observable<JobListResponse> {
    return this.http.get<JobListResponse>('/api/jobs', { params: { tab } });
  }

  detail(id: string): Observable<JobDetail> {
    return this.http.get<JobDetail>(`/api/jobs/${id}`);
  }

  toggleFavorite(id: string): Observable<JobSummary> {
    return this.http.patch<JobSummary>(`/api/jobs/${id}/favorite`, {});
  }

  /** "Not interested": the offer stops appearing in every tab. */
  hide(id: string): Observable<JobSummary> {
    return this.http.patch<JobSummary>(`/api/jobs/${id}/hide`, {});
  }
}
