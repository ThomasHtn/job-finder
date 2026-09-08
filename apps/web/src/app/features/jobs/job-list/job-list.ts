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
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  toJobTab,
  type JobListResponse,
  type JobSummary,
  type JobTab,
  type SourceStatus,
} from '@job-finder/shared';
import { filter, map } from 'rxjs';
import { AppConfigService } from '../../../core/app-config.service';
import { describeHttpError } from '../../../core/http/describe-http-error';
import { LastVisitService } from '../../../core/last-visit.service';
import { Viewport } from '../../../core/viewport';
import { Brand } from '../../../shared/brand/brand';
import { Icon } from '../../../shared/icon/icon';
import { detailIdFromUrl } from '../detail-id-from-url';
import { IngestionApi } from '../ingestion-api';
import { JobPatchBus } from '../job-patch-bus';
import { JobRow } from '../job-row/job-row';
import { JobTabs } from '../job-tabs/job-tabs';
import type { JobTabItem } from '../job-tabs/job-tab-item';
import { JobsApi } from '../jobs-api';
import { SyncLabelPipe } from '../sync-label.pipe';
import { AREA_LABEL_PLACEHOLDER, NO_COUNTS, REFRESH_MESSAGE_MS } from './job-list.constants';
import { newOffersLabel } from './new-offers-label';

/**
 * The shell: the feed, its three tabs, and the panel one offer opens into.
 */
@Component({
  selector: 'app-job-list',
  imports: [Brand, Icon, JobRow, JobTabs, RouterOutlet, SyncLabelPipe],
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
   * Router, to reflect the tab in the URL and to know which offer is open.
   */
  private readonly router = inject(Router);

  /**
   * Previous visit timestamp, for the "new" filter.
   */
  private readonly lastVisit = inject(LastVisitService);

  /**
   * Offers changed from inside the detail panel.
   */
  private readonly patches = inject(JobPatchBus);

  /**
   * Ends every subscription with the component.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * True on phones: tabs move to the bottom bar and the detail opens as a sheet.
   */
  protected readonly compact = inject(Viewport).isCompact;

  /**
   * Bound from the `?tab=` query parameter, so the browser's back button restores it.
   */
  readonly tab = input<string>();

  /**
   * Validated tab, defaulting when the URL carries garbage.
   */
  protected readonly currentTab = computed<JobTab>(() => toJobTab(this.tab()));

  /**
   * Id of the offer the URL has open, null when the panel is empty.
   */
  protected readonly selectedId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => detailIdFromUrl(this.router.url)),
    ),
    { initialValue: detailIdFromUrl(this.router.url) },
  );

  /**
   * True while an offer is rendered in the panel.
   */
  protected readonly detailOpen = signal(false);

  /**
   * Name of the on-site tab, from the API config.
   */
  private readonly areaLabel = toSignal(
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
   * The tab strip entries: where they lead, how they read, how many offers they hold.
   */
  protected readonly tabItems = computed<JobTabItem[]>(() => [
    { tab: 'local', label: this.areaLabel(), count: this.counts().local, icon: 'pin' },
    { tab: 'remote', label: 'Full remote', count: this.counts().remote, icon: 'remote' },
    { tab: 'favorites', label: 'Favoris', count: this.counts().favorites, icon: 'star' },
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
   * Reloads on tab change, folds in offers changed from the panel, and keeps the page behind
   * an open sheet from scrolling under it.
   */
  constructor() {
    effect(() => {
      const tab = this.currentTab();
      untracked(() => {
        this.onlyNew.set(false);
        this.load(tab);
        /* Another tab is another list: it starts at its first offer, not where the last one ended. */
        window.scrollTo({ top: 0 });
      });
    });

    effect(() => {
      const patch = this.patches.lastPatch();
      if (patch) untracked(() => this.applyPatch(patch));
    });

    effect(() => {
      const locked = this.compact() && this.detailOpen();
      document.body.classList.toggle('is-sheet-open', locked);
    });

    this.loadStatus();
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.refreshMessageTimer);
      document.body.classList.remove('is-sheet-open');
    });
  }

  /**
   * Switches tab through the URL, so the effect above does the loading. Navigating to the feed
   * itself closes the panel: an offer from the tab just left has nothing to sit next to.
   */
  protected selectTab(tab: JobTab): void {
    if (tab === this.currentTab()) return;
    void this.router.navigate(['/'], { queryParams: { tab }, replaceUrl: true });
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
          this.error.set(
            `Impossible de récupérer de nouvelles offres. ${describeHttpError(error)}`,
          );
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
   * Replaces one row in place, keeping the favourites count with it. Reloading instead would
   * pull the open offer out from under the panel.
   */
  private applyPatch(patched: JobSummary): void {
    this.data.update((current) => {
      const previous = current?.jobs.find((job) => job.id === patched.id);
      if (!current || !previous) return current;
      const favorites =
        current.counts.favorites + (patched.isFavorite ? 1 : 0) - (previous.isFavorite ? 1 : 0);
      return {
        ...current,
        jobs: current.jobs.map((job) => (job.id === patched.id ? patched : job)),
        counts: { ...current.counts, favorites },
      };
    });
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
   * Shown in place of the sync time for a few seconds, then cleared.
   */
  private showRefreshMessage(message: string): void {
    clearTimeout(this.refreshMessageTimer);
    this.refreshMessage.set(message);
    this.refreshMessageTimer = setTimeout(() => this.refreshMessage.set(null), REFRESH_MESSAGE_MS);
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
          this.error.set(`Impossible de charger les offres. ${describeHttpError(error)}`);
          this.loading.set(false);
        },
      });
  }
}
