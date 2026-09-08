import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  JOB_TABS,
  toJobTab,
  type JobCounts,
  type JobListResponse,
  type JobTab,
  type SourceStatus,
} from '@job-finder/shared';
import { map } from 'rxjs';
import { AppConfigService } from '../../../core/app-config.service';
import { LastVisitService } from '../../../core/last-visit.service';
import { Icon } from '../../../shared/icon/icon';
import { IngestionApi } from '../ingestion-api';
import { JobRow } from '../job-row/job-row';
import { JobsApi } from '../jobs-api';

/**
 * How long the "N new offers" message stays next to the timestamp.
 */
const REFRESH_MESSAGE_MS = 6000;

/**
 * Label of the on-site tab until the config arrives.
 */
const AREA_LABEL_PLACEHOLDER = 'Sur site';

/**
 * Counts shown before the first response.
 */
const NO_COUNTS: JobCounts = { local: 0, remote: 0, favorites: 0 };

/**
 * Turns an HTTP failure into a message that says what actually went wrong.
 */
function describeError(error: HttpErrorResponse): string {
  if (error.status === 0) return "L'API est-elle démarrée ?";
  if (error.status >= 500) return 'Le serveur a rencontré une erreur, réessayez plus tard.';
  return `Erreur ${error.status}.`;
}

/**
 * "1 nouvelle offre" / "3 nouvelles offres".
 */
function newOffersLabel(count: number): string {
  if (count === 0) return 'Aucune nouvelle offre.';
  const plural = count > 1 ? 's' : '';
  return `${count} nouvelle${plural} offre${plural}.`;
}

/**
 * The feed: three tabs bound to the URL, manual refresh, and the "new since last visit" filter.
 */
@Component({
  selector: 'app-job-list',
  imports: [DatePipe, Icon, JobRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-list.html',
  styleUrl: './job-list.scss',
})
export class JobList {
  /**
   * Offers API.
   */
  private readonly api = inject(JobsApi);

  /**
   * Ingestion API, for the refresh button and the source health.
   */
  private readonly ingestion = inject(IngestionApi);

  /**
   * Router, to reflect the tab in the URL.
   */
  private readonly router = inject(Router);

  /**
   * Previous visit timestamp, for the "new" filter.
   */
  private readonly lastVisit = inject(LastVisitService);

  /**
   * Ends every subscription with the component.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Bound from the `?tab=` query parameter, so the browser's back button restores it.
   */
  readonly tab = input<string>();

  /**
   * Validated tab, defaulting when the URL carries garbage.
   */
  protected readonly currentTab = computed<JobTab>(() => toJobTab(this.tab()));

  /**
   * Position of the tab, drives the sliding thumb of the segmented control.
   */
  protected readonly tabIndex = computed(() => JOB_TABS.indexOf(this.currentTab()));

  /**
   * Name of the on-site tab, from the API config.
   */
  protected readonly areaLabel = toSignal(
    inject(AppConfigService)
      .load()
      .pipe(map((config) => config.areaLabel)),
    { initialValue: AREA_LABEL_PLACEHOLDER },
  );

  /**
   * Last list response.
   */
  protected readonly data = signal<JobListResponse | null>(null);

  /**
   * True while the list is being (re)loaded.
   */
  protected readonly loading = signal(false);

  /**
   * True while a manual ingestion is running.
   */
  protected readonly refreshing = signal(false);

  /**
   * Blocking error shown instead of the list.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Transient outcome of the last manual refresh.
   */
  protected readonly refreshMessage = signal<string | null>(null);

  /**
   * Non-blocking warning when some sources failed during the last refresh.
   */
  protected readonly sourceWarning = signal<string | null>(null);

  /**
   * Health of every source, from the API.
   */
  protected readonly sourceStatus = signal<SourceStatus[]>([]);

  /**
   * Narrows the feed to the offers that appeared since the previous visit.
   */
  protected readonly onlyNew = signal(false);

  /**
   * Timer clearing the refresh message.
   */
  private refreshMessageTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Counts for the three tabs.
   */
  protected readonly counts = computed(() => this.data()?.counts ?? NO_COUNTS);

  /**
   * End of the last successful ingestion.
   */
  protected readonly lastIngestionAt = computed(() => this.data()?.lastIngestionAt ?? null);

  /**
   * The segmented control entries: tab, label, count.
   */
  protected readonly segments = computed(() => [
    { tab: 'local' as const, label: this.areaLabel(), count: this.counts().local },
    { tab: 'remote' as const, label: 'Full remote', count: this.counts().remote },
    { tab: 'favorites' as const, label: 'Favoris', count: this.counts().favorites },
  ]);

  /**
   * Every offer of the current tab, before the "new" filter.
   */
  private readonly allJobs = computed(() => this.data()?.jobs ?? []);

  /**
   * Offers first seen after the previous visit.
   */
  private readonly newJobs = computed(() => {
    const previous = this.lastVisit.previousVisitAt;
    if (previous === null) return [];
    return this.allJobs().filter((job) => job.firstSeenAt > previous);
  });

  /**
   * Same rule as the row's own badge: first seen after the previous visit.
   */
  protected readonly newCount = computed(() => this.newJobs().length);

  /**
   * Offers actually rendered.
   */
  protected readonly jobs = computed(() => (this.onlyNew() ? this.newJobs() : this.allJobs()));

  /**
   * Enabled sources whose last run failed.
   */
  private readonly failedSources = computed(() =>
    this.sourceStatus().filter((status) => status.enabled && !status.ok),
  );

  /**
   * True when at least one enabled source is down.
   */
  protected readonly sourcesDegraded = computed(() => this.failedSources().length > 0);

  /**
   * e.g. "3/4 sources disponibles" plus the down ones, shown as the refresh button's tooltip.
   */
  protected readonly sourceStatusLabel = computed(() => {
    const enabled = this.sourceStatus().filter((status) => status.enabled);
    if (enabled.length === 0) return '';
    const down = this.failedSources().map((status) => status.source);
    const summary = `${enabled.length - down.length}/${enabled.length} sources disponibles`;
    return down.length ? `${summary} - en échec : ${down.join(', ')}` : summary;
  });

  /**
   * Reloads whenever the tab changes, resetting the "new" filter; clears the timer on destroy.
   */
  constructor() {
    effect(() => {
      const tab = this.currentTab();
      untracked(() => {
        this.onlyNew.set(false);
        this.load(tab);
      });
    });
    this.loadStatus();
    this.destroyRef.onDestroy(() => clearTimeout(this.refreshMessageTimer));
  }

  /**
   * Switches tab through the URL, so the effect above does the loading.
   */
  protected selectTab(tab: JobTab): void {
    if (tab === this.currentTab()) return;
    void this.router.navigate([], { queryParams: { tab }, replaceUrl: true });
  }

  /**
   * Toggles the "new since last visit" filter.
   */
  protected toggleOnlyNew(): void {
    this.onlyNew.update((value) => !value);
  }

  /**
   * Reloads the current tab.
   */
  protected reload(): void {
    this.load(this.currentTab());
  }

  /**
   * Manual trigger: fetches every source again before reloading the list.
   */
  protected refreshJobs(): void {
    this.refreshing.set(true);
    this.error.set(null);
    this.sourceWarning.set(null);
    this.ingestion
      .run()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.refreshing.set(false);
          this.reload();
          this.loadStatus();
          this.showRefreshMessage(newOffersLabel(summary.inserted));
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

  /**
   * Stars or un-stars, then reloads so counts and the favourites tab stay in sync.
   */
  protected toggleFavorite(id: string): void {
    this.api
      .toggleFavorite(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.reload() });
  }

  /**
   * Hides the offer, then reloads.
   */
  protected hideJob(id: string): void {
    this.api
      .hide(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.reload() });
  }

  /**
   * Fetches the source health for the tooltip and the degraded state.
   */
  private loadStatus(): void {
    this.ingestion
      .status()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (statuses) => this.sourceStatus.set(statuses) });
  }

  /**
   * Shown next to the last-updated date for a few seconds, then cleared.
   */
  private showRefreshMessage(message: string): void {
    clearTimeout(this.refreshMessageTimer);
    this.refreshMessage.set(message);
    this.refreshMessageTimer = setTimeout(
      () => this.refreshMessage.set(null),
      REFRESH_MESSAGE_MS,
    );
  }

  /**
   * Loads one tab into `data`.
   */
  private load(tab: JobTab): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(tab)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
