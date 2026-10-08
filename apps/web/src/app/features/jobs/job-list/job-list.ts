import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { filter, map } from 'rxjs';

import { type JobListResponse, type JobSummary, type JobTab, toJobTab } from '@job-finder/shared';

import { AppConfigService } from '@core/app-config.service';
import { describeHttpError } from '@core/http/describe-http-error';
import { I18n } from '@core/i18n/i18n.service';
import { IngestionApi } from '@core/ingestion-api';
import { LastVisitService } from '@core/last-visit.service';
import { Viewport } from '@core/viewport';
import { SourceBoard } from '@features/sources/source-board/source-board';
import { SourceHealth } from '@features/sources/source-health';
import { Brand } from '@shared/brand/brand';
import { Icon } from '@shared/icon/icon';
import { LanguageToggle } from '@shared/language-toggle/language-toggle';
import { SyncLabelPipe } from '@shared/sync-label/sync-label.pipe';

import { detailIdFromUrl } from '../detail-id-from-url';
import { JobPatchBus } from '../job-patch-bus';
import { JobRow } from '../job-row/job-row';
import type { JobTabItem } from '../job-tabs/job-tab-item';
import { JobTabs } from '../job-tabs/job-tabs';
import { JobsApi } from '../jobs-api';
import { type ShellTab, SOURCES_TAB, toShellTab } from '../shell-tab';
import { applyJobPatch } from './apply-job-patch';
import { buildTabItems } from './build-tab-items';
import { NO_COUNTS, REFRESH_MESSAGE_MS } from './job-list.constants';

/**
 * The shell: the feed, its tabs, the sources, and the panel one offer opens into.
 */
@Component({
  selector: 'app-job-list',
  imports: [Brand, Icon, JobRow, JobTabs, LanguageToggle, RouterOutlet, SourceBoard, SyncLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-list.html',
  styleUrl: './job-list.scss',
  providers: [SourceHealth],
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
   * Source health, for the refresh button and the sources tab.
   */
  private readonly health = inject(SourceHealth);

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
   * Wording of the language in use; every string of the template comes from it.
   */
  protected readonly t = inject(I18n).t;

  /**
   * True on phones: tabs move to the bottom bar and the detail opens as a sheet.
   */
  protected readonly compact = inject(Viewport).isCompact;

  /**
   * Bound from the `?tab=` query parameter, so the browser's back button restores it.
   */
  public readonly tab = input<string>();

  /**
   * Validated tab, defaulting when the URL carries garbage.
   */
  protected readonly currentView = computed<ShellTab>(() => toShellTab(this.tab()));

  /**
   * True while the sources tab replaces the feed.
   */
  protected readonly showingSources = computed(() => this.currentView() === SOURCES_TAB);

  /**
   * Offer list behind the current view; the sources tab keeps the default one for the counts.
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
   * Name of the on-site tab, from the API config; null until it arrives.
   */
  private readonly areaLabel = toSignal<string | null>(
    inject(AppConfigService)
      .load()
      .pipe(map((config): string | null => config.areaLabel)),
    { initialValue: null },
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
  protected readonly sourceStatus = this.health.statuses;

  /**
   * True when the last status request failed, so the sources tab is not left blank.
   */
  protected readonly statusFailed = this.health.failed;

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
  protected readonly tabItems = computed<JobTabItem[]>(() =>
    buildTabItems(this.t(), this.areaLabel(), this.counts()),
  );

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
   * True when at least one enabled source is down.
   */
  protected readonly sourcesDegraded = this.health.degraded;

  /**
   * Refresh button tooltip: how many sources answer, and which ones do not.
   */
  protected readonly sourceStatusLabel = this.health.label;

  /**
   * Reloads on tab change, folds in offers changed from the panel, and keeps the page behind
   * an open sheet from scrolling under it.
   */
  constructor() {
    effect(() => {
      const view = this.currentView();
      untracked(() => {
        this.onlyNew.set(false);
        if (view === SOURCES_TAB) {
          this.health.load();
          /* Landing straight on the sources still needs the tab counts. */
          if (!this.data()) this.load(this.currentTab());
        } else {
          this.load(view);
        }
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

    this.health.load();
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.refreshMessageTimer);
      document.body.classList.remove('is-sheet-open');
    });
  }

  /**
   * Switches tab through the URL, so the effect above does the loading. Navigating to the feed
   * itself closes the panel: an offer from the tab just left has nothing to sit next to.
   */
  protected selectTab(tab: ShellTab): void {
    if (tab === this.currentView()) return;
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
          this.health.load();
          this.showRefreshMessage(this.t().feed.newOffers(summary.inserted));
          if (summary.failedSources.length) {
            this.sourceWarning.set(
              this.t().feed.sourcesUnavailable(summary.failedSources.join(', ')),
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          this.refreshing.set(false);
          this.error.set(this.t().feed.refreshFailed(describeHttpError(error, this.t())));
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
    this.data.update((current) => applyJobPatch(current, patched));
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
          this.error.set(this.t().feed.loadFailed(describeHttpError(error, this.t())));
          this.loading.set(false);
        },
      });
  }
}
