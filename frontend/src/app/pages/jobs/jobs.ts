import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { type JobTab, toJobTab } from '@job-finder/contract';

import { AppConfigApi } from '@core/config/app-config-api';
import { Clock } from '@core/date/clock';
import type { ActionFailure } from '@core/http/action-failure.model';
import { actionFailureText } from '@core/http/action-failure.utils';
import { Language } from '@core/i18n/language';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
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
import { HealthAlert } from './health-alert/health-alert';
import { JobRow } from './job-row/job-row';
import { JobTabs } from './job-tabs/job-tabs';
import { SOURCES_TAB } from './jobs.constants';
import { ShellTab } from './jobs.model';
import { buildTabItems, pickNewJobs, pickSeenJobs, toShellTab } from './jobs.utils';
import { JobsFeed } from './jobs-feed';
import { JobsRefresh } from './jobs-refresh';
import { JobsSheet } from './jobs-sheet';
import { SettingsMenu } from './settings-menu/settings-menu';
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
    HealthAlert,
    Icon,
    IconButton,
    JobRow,
    JobTabs,
    Notice,
    RouterOutlet,
    ScanLine,
    SettingsMenu,
    SourceBoard,
    SyncLabelPipe,
    TranslocoPipe,
  ],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
  providers: [JobPatchBus, JobsRefresh, JobsSheet, SourceHealth],
})
export class JobsPage {
  /**
   * Source health, for the refresh button and the sources tab.
   */
  protected readonly health = inject(SourceHealth);

  /**
   * The manual refresh and what it reports.
   */
  protected readonly refresh = inject(JobsRefresh);

  /**
   * The panel an offer opens into.
   */
  protected readonly sheet = inject(JobsSheet);

  /**
   * Reflects the tab in the URL.
   */
  private readonly router = inject(Router);

  /**
   * Previous visit timestamp, which splits the new offers from the ones already seen.
   */
  protected readonly previousVisitAt = inject(LastVisit).previousVisitAt;

  /**
   * Page document, scrolled to the top on a tab change.
   */
  private readonly document = inject(DOCUMENT);

  /**
   * The feed column, which scrolls on its own.
   */
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

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
   * The offers of the current tab.
   */
  protected readonly feed = new JobsFeed(this.currentTab);

  /**
   * Why the last refresh or star failed: a notice above the list, which stays in place.
   */
  private readonly actionFailure = signal<ActionFailure | null>(null);

  /**
   * That failure in the active language.
   */
  protected readonly actionError = computed(() => {
    this.language.active();
    const failure = this.actionFailure();
    return failure ? actionFailureText(failure) : null;
  });

  /**
   * The tab strip entries: where they lead, how they read, how many offers they hold.
   */
  protected readonly tabItems = computed(() => {
    this.language.active();
    return buildTabItems(this.configApi.areaLabel(), this.feed.counts());
  });

  /**
   * Offers first seen after the previous visit, listed first.
   */
  protected readonly newJobs = computed(() => pickNewJobs(this.feed.jobs(), this.previousVisitAt));

  /**
   * Offers already there at the previous visit, listed under the new ones.
   */
  protected readonly seenJobs = computed(() =>
    pickSeenJobs(this.feed.jobs(), this.previousVisitAt),
  );

  /**
   * Offers actually rendered, new ones first.
   */
  protected readonly jobs = computed(() => [...this.newJobs(), ...this.seenJobs()]);

  /**
   * Loads the public settings and starts every tab at its first offer, reloading the sources when
   * their tab opens.
   */
  constructor() {
    void this.configApi.load();
    let firstView = true;
    effect(() => {
      const view = this.currentView();
      untracked(() => {
        this.actionFailure.set(null);
        if (view === SOURCES_TAB && !firstView) {
          this.health.refresh();
        }
        firstView = false;
        /* Another tab is another list: it starts at its first offer, not where the last one ended. */
        this.document.defaultView?.scrollTo({ top: 0 });
        this.scroller()?.nativeElement.scrollTo({ top: 0 });
      });
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
   * Reloads the current tab.
   */
  protected reload(): void {
    this.actionFailure.set(null);
    this.feed.reload();
  }

  /**
   * Manual trigger: reads every source again before reloading the list.
   */
  protected async refreshJobs(): Promise<void> {
    this.actionFailure.set(null);
    try {
      if (await this.refresh.run()) {
        this.feed.reload();
      }
    } catch (error: unknown) {
      this.actionFailure.set({ key: 'feed.refreshFailed', cause: error });
    }
  }

  /**
   * Stars or un-stars a row in place: the panel and the counts follow through the patch bus.
   */
  protected async toggleFavorite(id: string): Promise<void> {
    this.actionFailure.set(null);
    try {
      await this.feed.toggleFavorite(id);
    } catch (error: unknown) {
      this.actionFailure.set({ key: 'feed.favoriteFailed', cause: error });
    }
  }
}
