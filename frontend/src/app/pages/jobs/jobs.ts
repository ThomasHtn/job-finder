import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { translate, TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { type JobListResponse, type JobSummary, type JobTab, toJobTab } from '@job-finder/contract';

import { AppConfigApi } from '@core/config/app-config-api';
import { Clock } from '@core/date/clock';
import { API_ENDPOINTS } from '@core/http/api-endpoints';
import { apiErrorCode, describeHttpError } from '@core/http/api-error.utils';
import { lastValue, resourceValue } from '@core/http/resource.utils';
import { isSingular } from '@core/i18n/i18n.utils';
import { Language } from '@core/i18n/language';
import { IngestionApi } from '@core/ingestion/ingestion-api';
import { isNewSince } from '@core/jobs/job.utils';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { JOB_ID_PARAM } from '@core/jobs/jobs.constants';
import { JobsApi } from '@core/jobs/jobs-api';
import { LastVisit } from '@core/jobs/last-visit';
import { Viewport } from '@core/layout/viewport';
import { Brand } from '@shared/brand/brand';
import { Button } from '@shared/button/button';
import { EmptyState } from '@shared/empty-state/empty-state';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { Notice } from '@shared/notice/notice';
import { ScanLine } from '@shared/scan-line/scan-line';

import { FeedSkeleton } from './feed-skeleton/feed-skeleton';
import { JobRow } from './job-row/job-row';
import { JobTabs } from './job-tabs/job-tabs';
import { REFRESH_MESSAGE_MS, SOURCES_TAB } from './jobs.constants';
import { ShellTab } from './jobs.model';
import {
  applyJobPatch,
  buildTabItems,
  newOffersMessage,
  sourceName,
  toShellTab,
} from './jobs.utils';
import { SettingsMenu } from './settings-menu/settings-menu';
import { SinceVisitLabelPipe } from './since-visit-label/since-visit-label.pipe';
import { SourceBoard } from './source-board/source-board';
import { SourceHealth } from './source-health';
import { SyncLabelPipe } from './sync-label/sync-label.pipe';

/**
 * The shell: the feed, its tabs, the sources, and the panel one offer opens into.
 */
@Component({
  selector: 'app-jobs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Brand,
    Button,
    EmptyState,
    FeedSkeleton,
    Icon,
    IconButton,
    JobRow,
    JobTabs,
    NgTemplateOutlet,
    Notice,
    RouterOutlet,
    ScanLine,
    SettingsMenu,
    SinceVisitLabelPipe,
    SourceBoard,
    SyncLabelPipe,
    TranslocoPipe,
  ],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
  providers: [SourceHealth],
})
export class JobsPage {
  /**
   * Writes on one offer: the star.
   */
  private readonly jobsApi = inject(JobsApi);

  /**
   * The manual refresh.
   */
  private readonly ingestion = inject(IngestionApi);

  /**
   * Source health, for the refresh button and the sources tab.
   */
  protected readonly health = inject(SourceHealth);

  /**
   * Reflects the tab in the URL.
   */
  private readonly router = inject(Router);

  /**
   * The feed's route, whose child is the open offer.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Previous visit timestamp, for the "new" filter and the line under the count of new offers.
   */
  protected readonly previousVisitAt = inject(LastVisit).previousVisitAt;

  /**
   * Offers changed from inside the detail panel.
   */
  private readonly patches = inject(JobPatchBus);

  /**
   * Page document: scrolled to the top on a tab change, frozen behind an open sheet.
   */
  private readonly document = inject(DOCUMENT);

  /**
   * The feed column, which scrolls on its own on a wide screen.
   */
  private readonly feed = viewChild<ElementRef<HTMLElement>>('feed');

  /**
   * Name of the on-site tab, from the public settings.
   */
  private readonly configApi = inject(AppConfigApi);

  /**
   * Language in use, which every computed text follows.
   */
  protected readonly language = inject(Language);

  /**
   * The current minute, so the sync time ages while the app stays open.
   */
  protected readonly now = inject(Clock).now;

  /**
   * True on phones: tabs move to the bottom bar and the detail opens as a sheet.
   */
  protected readonly compact = inject(Viewport).isCompact;

  /**
   * Schedules the focus handed back once the sheet has closed.
   */
  private readonly injector = inject(Injector);

  /**
   * Bound from the `?tab=` query parameter, so a reload or a shared link reopens the same tab. A tab
   * switch replaces the history entry: back leaves the app instead of stepping through the tabs.
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
   * The sources view, reached from the settings rather than from the tabs.
   */
  protected readonly sourcesTab = SOURCES_TAB;

  /**
   * Offer list behind the current view; the sources tab keeps the default one for the counts.
   */
  protected readonly currentTab = computed<JobTab>(() => toJobTab(this.tab()));

  /**
   * Offers of the current tab, fetched again whenever the tab changes.
   */
  private readonly list = httpResource<JobListResponse>(() => ({
    url: API_ENDPOINTS.jobs,
    params: { tab: this.currentTab() },
  }));

  /**
   * Last list loaded, kept while another tab loads and patched in place from the panel.
   */
  private readonly data = lastValue<JobListResponse | null>(this.list, null);

  /**
   * Tab whose offers `data` holds: a failed reload of that same tab leaves them on screen.
   */
  private readonly loadedTab = linkedSignal<JobListResponse | undefined, JobTab | null>({
    source: () => resourceValue(this.list, undefined),
    computation: (loaded, previous) =>
      loaded ? untracked(this.currentTab) : (previous?.value ?? null),
  });

  /**
   * True while the list is being (re)loaded.
   */
  protected readonly loading = this.list.isLoading;

  /**
   * Id of the offer the URL has open, `null` when the panel is empty.
   */
  protected readonly selectedId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.openOfferId()),
    ),
    { initialValue: this.openOfferId() },
  );

  /**
   * True while an offer is rendered in the panel.
   */
  protected readonly detailOpen = signal(false);

  /**
   * True while the panel covers the feed as a sheet: what lies behind is then out of reach.
   */
  protected readonly sheetOpen = computed(() => this.compact() && this.detailOpen());

  /**
   * Element focused when the sheet opened, given the focus back when it closes.
   */
  private sheetOpener: HTMLElement | null = null;

  /**
   * True while a manual ingestion is running.
   */
  protected readonly refreshing = signal(false);

  /**
   * Why the last refresh or star failed: a notice above the list, which stays in place.
   */
  protected readonly actionError = signal<string | null>(null);

  /**
   * Why the list of the current tab could not load.
   */
  private readonly loadFailure = computed(() => {
    this.language.active();
    const failure = this.list.error();
    return failure ? translate('feed.loadFailed', { detail: describeHttpError(failure) }) : null;
  });

  /**
   * True when the offers on screen belong to the current tab, from an earlier load.
   */
  private readonly showsCurrentTab = computed(() => this.loadedTab() === this.currentTab());

  /**
   * Blocking error shown instead of the list: nothing of this tab to show.
   */
  protected readonly error = computed(() => (this.showsCurrentTab() ? null : this.loadFailure()));

  /**
   * A reload that failed while the tab's offers stay on screen: said above them.
   */
  protected readonly reloadError = computed(() =>
    this.showsCurrentTab() ? this.loadFailure() : null,
  );

  /**
   * Transient outcome of the last manual refresh.
   */
  protected readonly refreshMessage = signal<string | null>(null);

  /**
   * Non-blocking warning when some sources failed during the last refresh.
   */
  protected readonly sourceWarning = signal<string | null>(null);

  /**
   * Narrows the feed to the offers that appeared since the previous visit.
   */
  protected readonly onlyNew = signal(false);

  /**
   * Timer clearing the refresh message.
   */
  private refreshMessageTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Counts for the three tabs, `null` until the first list answers.
   */
  protected readonly counts = computed(() => this.data()?.counts ?? null);

  /**
   * True once a list has answered, so the header stops guessing its sync time and counts.
   */
  protected readonly listed = computed(() => this.data() !== null);

  /**
   * End of the last successful ingestion.
   */
  protected readonly lastIngestionAt = computed(() => this.data()?.lastIngestionAt ?? null);

  /**
   * The tab strip entries: where they lead, how they read, how many offers they hold.
   */
  protected readonly tabItems = computed(() => {
    this.language.active();
    return buildTabItems(this.configApi.areaLabel(), this.counts());
  });

  /**
   * Every offer of the current tab, before the "new" filter.
   */
  private readonly allJobs = computed(() => this.data()?.jobs ?? []);

  /**
   * Offers first seen after the previous visit, by the same rule as the row's own dot; listed first.
   */
  protected readonly newJobs = computed(() =>
    this.allJobs().filter((job) => isNewSince(job, this.previousVisitAt)),
  );

  /**
   * How many offers arrived since the previous visit.
   */
  protected readonly newCount = computed(() => this.newJobs().length);

  /**
   * "3 new offers", agreed with the count.
   */
  protected readonly newHeadline = computed(() => {
    this.language.active();
    const count = this.newCount();
    return translate(isSingular(count) ? 'feed.newHeadlineOne' : 'feed.newHeadlineOther', {
      count,
    });
  });

  /**
   * Offers already there at the previous visit, listed under the new ones; none while the filter
   * keeps only the new.
   */
  protected readonly seenJobs = computed(() =>
    this.onlyNew() ? [] : this.allJobs().filter((job) => !isNewSince(job, this.previousVisitAt)),
  );

  /**
   * Offers actually rendered, new ones first.
   */
  protected readonly jobs = computed(() => [...this.newJobs(), ...this.seenJobs()]);

  /**
   * Loads the public settings, reloads the sources on their tab, folds in offers changed from the
   * panel, and keeps the page behind an open sheet from scrolling under it.
   */
  constructor() {
    void this.configApi.load();
    let firstView = true;
    effect(() => {
      const view = this.currentView();
      untracked(() => {
        this.onlyNew.set(false);
        this.actionError.set(null);
        if (view === SOURCES_TAB && !firstView) {
          this.health.refresh();
        }
        firstView = false;
        /* Another tab is another list: it starts at its first offer, not where the last one ended. */
        this.document.defaultView?.scrollTo({ top: 0 });
        this.feed()?.nativeElement.scrollTo({ top: 0 });
      });
    });

    effect(() => {
      const patch = this.patches.lastPatch();
      if (patch) {
        untracked(() => this.applyPatch(patch));
      }
    });

    effect(() => {
      this.document.body.classList.toggle('is-sheet-open', this.sheetOpen());
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.refreshMessageTimer);
      this.document.body.classList.remove('is-sheet-open');
    });
  }

  /**
   * Switches tab through the URL, so the list follows. Navigating to the feed itself closes the
   * panel: an offer from the tab just left has nothing to sit next to.
   */
  protected selectTab(tab: ShellTab): void {
    if (tab === this.currentView()) {
      return;
    }
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
    this.actionError.set(null);
    this.list.reload();
  }

  /**
   * Manual trigger: reads every source again before reloading the list. A run already in progress
   * (from the cron, or another device) is no failure: it says so for a few seconds.
   */
  protected async refreshJobs(): Promise<void> {
    this.refreshing.set(true);
    this.actionError.set(null);
    this.sourceWarning.set(null);
    try {
      const summary = await this.ingestion.run();
      this.list.reload();
      this.health.refresh();
      this.showRefreshMessage(newOffersMessage(summary.inserted));
      if (summary.failedSources.length) {
        const sources = summary.failedSources.map(sourceName).join(', ');
        this.sourceWarning.set(translate('feed.sourcesUnavailable', { sources }));
      }
    } catch (error: unknown) {
      if (apiErrorCode(error) === 'CONFLICT') {
        this.showRefreshMessage(describeHttpError(error));
      } else {
        this.actionError.set(translate('feed.refreshFailed', { detail: describeHttpError(error) }));
      }
    } finally {
      this.refreshing.set(false);
    }
  }

  /**
   * Stars or un-stars; the panel and the counts follow through the patch bus.
   */
  protected async toggleFavorite(id: string): Promise<void> {
    this.actionError.set(null);
    try {
      this.patches.publish(await this.jobsApi.toggleFavorite(id));
      this.list.reload();
    } catch (error: unknown) {
      this.actionError.set(translate('feed.favoriteFailed', { detail: describeHttpError(error) }));
    }
  }

  /**
   * An offer rendered in the panel; as a sheet, it takes the focus from the row that opened it.
   */
  protected panelActivated(): void {
    this.detailOpen.set(true);
    if (this.compact()) {
      this.sheetOpener = this.document.activeElement as HTMLElement | null;
    }
  }

  /**
   * The panel emptied; a closed sheet gives the focus back once the feed is reachable again.
   */
  protected panelDeactivated(): void {
    this.detailOpen.set(false);
    const opener = this.sheetOpener;
    this.sheetOpener = null;
    if (opener) {
      afterNextRender(() => opener.focus(), { injector: this.injector });
    }
  }

  /**
   * Id parameter of the detail route rendered in the panel, `null` while the panel is empty.
   */
  private openOfferId(): string | null {
    return this.route.snapshot.firstChild?.paramMap.get(JOB_ID_PARAM) ?? null;
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
}
