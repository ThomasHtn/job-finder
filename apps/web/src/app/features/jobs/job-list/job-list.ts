import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { JOB_TABS, type JobListResponse, type JobTab, type SourceStatus } from '@job-finder/shared';
import { map } from 'rxjs';
import { AppConfigService } from '../../../core/app-config.service';
import { LastVisitService } from '../../../core/last-visit.service';
import { Icon } from '../../../shared/icon/icon';
import { IngestionApi } from '../ingestion-api';
import { JobRow } from '../job-row/job-row';
import { JobsApi } from '../jobs-api';

@Component({
  selector: 'app-job-list',
  imports: [DatePipe, Icon, JobRow],
  templateUrl: './job-list.html',
  styleUrl: './job-list.scss',
})
export class JobList {
  private readonly api = inject(JobsApi);
  private readonly ingestion = inject(IngestionApi);
  private readonly router = inject(Router);
  private readonly lastVisit = inject(LastVisitService);

  /** Bound from the `?tab=` query parameter, so the browser's back button restores it. */
  readonly tab = input<string>();

  protected readonly currentTab = computed<JobTab>(() => {
    const value = this.tab();
    return JOB_TABS.includes(value as JobTab) ? (value as JobTab) : 'local';
  });
  protected readonly tabIndex = computed(() => JOB_TABS.indexOf(this.currentTab()));

  protected readonly areaLabel = toSignal(
    inject(AppConfigService)
      .load()
      .pipe(map((config) => config.areaLabel)),
    { initialValue: 'Sur site' },
  );

  protected readonly data = signal<JobListResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly refreshing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly refreshMessage = signal<string | null>(null);
  protected readonly sourceWarning = signal<string | null>(null);
  protected readonly sourceStatus = signal<SourceStatus[]>([]);
  /** Narrows the feed to the offers that appeared since the previous visit. */
  protected readonly onlyNew = signal(false);
  private refreshMessageTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly counts = computed(
    () => this.data()?.counts ?? { local: 0, remote: 0, favorites: 0 },
  );
  protected readonly lastIngestionAt = computed(() => this.data()?.lastIngestionAt ?? null);

  protected readonly segments = computed(() => [
    { tab: 'local' as const, label: this.areaLabel(), count: this.counts().local },
    { tab: 'remote' as const, label: 'Full remote', count: this.counts().remote },
    { tab: 'favorites' as const, label: 'Favoris', count: this.counts().favorites },
  ]);

  private readonly allJobs = computed(() => this.data()?.jobs ?? []);

  /** Same rule as the row's own badge: first seen after the previous visit. */
  protected readonly newCount = computed(() => {
    const previous = this.lastVisit.previousVisitAt;
    if (previous === null) return 0;
    return this.allJobs().filter((job) => job.firstSeenAt > previous).length;
  });

  protected readonly jobs = computed(() => {
    const previous = this.lastVisit.previousVisitAt;
    if (!this.onlyNew() || previous === null) return this.allJobs();
    return this.allJobs().filter((job) => job.firstSeenAt > previous);
  });

  /** e.g. "3/4 sources OK" plus the down ones, shown as the refresh button's tooltip. */
  protected readonly sourceStatusLabel = computed(() => {
    const statuses = this.sourceStatus().filter((status) => status.enabled);
    if (statuses.length === 0) return '';
    const healthy = statuses.filter((status) => status.ok);
    const down = statuses.filter((status) => !status.ok).map((status) => status.source);
    const summary = `${healthy.length}/${statuses.length} sources disponibles`;
    return down.length ? `${summary} - en échec : ${down.join(', ')}` : summary;
  });

  protected readonly sourcesDegraded = computed(() => this.sourceStatusLabel().includes('échec'));

  constructor() {
    effect(() => {
      const tab = this.currentTab();
      untracked(() => {
        this.onlyNew.set(false);
        this.load(tab);
      });
    });
    this.loadStatus();
  }

  protected selectTab(tab: JobTab): void {
    if (tab === this.currentTab()) return;
    void this.router.navigate([], { queryParams: { tab }, replaceUrl: true });
  }

  protected toggleOnlyNew(): void {
    this.onlyNew.update((value) => !value);
  }

  protected reload(): void {
    this.load(this.currentTab());
  }

  /** Manual trigger: fetches every source again before reloading the list. */
  protected refreshJobs(): void {
    this.refreshing.set(true);
    this.error.set(null);
    this.sourceWarning.set(null);
    this.ingestion.run().subscribe({
      next: (summary) => {
        this.refreshing.set(false);
        this.load(this.currentTab());
        this.loadStatus();
        this.showRefreshMessage(
          summary.inserted === 0
            ? 'Aucune nouvelle offre.'
            : `${summary.inserted} nouvelle${summary.inserted > 1 ? 's' : ''} offre${summary.inserted > 1 ? 's' : ''}.`,
        );
        if (summary.failedSources.length) {
          this.sourceWarning.set(
            `Source(s) indisponible(s) : ${summary.failedSources.join(', ')}.`,
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.refreshing.set(false);
        this.error.set(`Impossible de récupérer de nouvelles offres. ${describeError(error)}`);
      },
    });
  }

  private loadStatus(): void {
    this.ingestion.status().subscribe({ next: (statuses) => this.sourceStatus.set(statuses) });
  }

  /** Shown next to the last-updated date for a few seconds, then cleared. */
  private showRefreshMessage(message: string): void {
    clearTimeout(this.refreshMessageTimer);
    this.refreshMessage.set(message);
    this.refreshMessageTimer = setTimeout(() => this.refreshMessage.set(null), 6000);
  }

  protected toggleFavorite(id: string): void {
    // Reload so counts and the favourites tab stay in sync.
    this.api.toggleFavorite(id).subscribe({ next: () => this.reload() });
  }

  protected hideJob(id: string): void {
    this.api.hide(id).subscribe({ next: () => this.reload() });
  }

  private load(tab: JobTab): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(tab).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(`Impossible de charger les offres. ${describeError(error)}`);
        this.loading.set(false);
      },
    });
  }
}

/** Turns an HTTP failure into a message that says what actually went wrong. */
function describeError(error: HttpErrorResponse): string {
  if (error.status === 0) return "L'API est-elle démarrée ?";
  if (error.status >= 500) return 'Le serveur a rencontré une erreur, réessayez plus tard.';
  return `Erreur ${error.status}.`;
}
