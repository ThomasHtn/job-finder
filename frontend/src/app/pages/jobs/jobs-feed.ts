import { httpResource } from '@angular/common/http';
import { computed, inject, linkedSignal, Signal, untracked } from '@angular/core';

import { translate } from '@jsverse/transloco';

import type { JobListResponse, JobTab } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';
import { describeHttpError } from '@core/http/api-error.utils';
import { lastValue, resourceValue } from '@core/http/resource.utils';
import { Language } from '@core/i18n/language';
import { JobPatchBus } from '@core/jobs/job-patch-bus';
import { JobsApi } from '@core/jobs/jobs-api';

import { applyJobPatches } from './jobs.utils';

/**
 * The offers of the tab on screen: fetching them, keeping the last answer while the next one loads,
 * and folding in what changed in the panel or on a star, with no reload. Built by the page, which
 * hands it the tab on screen; its patch bus is the page's own.
 */
export class JobsFeed {
  /**
   * Writes on one offer: the star.
   */
  private readonly jobsApi = inject(JobsApi);

  /**
   * Offers changed elsewhere (the panel, a star), applied on top of every list that arrives.
   */
  private readonly patches = inject(JobPatchBus);

  /**
   * Language in use, which the failure message follows.
   */
  private readonly language = inject(Language);

  /**
   * Tab whose offers are listed.
   */
  private readonly tab: Signal<JobTab>;

  /**
   * Offers of the tab on screen, fetched again whenever the tab changes.
   */
  private readonly list = httpResource<JobListResponse>(() => ({
    url: API_ENDPOINTS.jobs,
    params: { tab: this.tab() },
  }));

  /**
   * Last list loaded, kept while another tab loads.
   */
  private readonly loaded = lastValue<JobListResponse | null>(this.list, null);

  /**
   * Tab whose offers `loaded` holds: a failed reload of that same tab leaves them on screen.
   */
  private readonly loadedTab = linkedSignal<JobListResponse | undefined, JobTab | null>({
    source: () => resourceValue(this.list, undefined),
    computation: (loaded, previous) => (loaded ? untracked(this.tab) : (previous?.value ?? null)),
  });

  /**
   * The last list with every change made since applied to its rows and its favourites count.
   */
  private readonly response = computed(() =>
    applyJobPatches(this.loaded(), this.patches.patches()),
  );

  /**
   * True while the list is being (re)loaded.
   */
  public readonly loading = this.list.isLoading;

  /**
   * Counts for the three tabs, `null` until the first list answers.
   */
  public readonly counts = computed(() => this.response()?.counts ?? null);

  /**
   * True once a list has answered, so the header stops guessing its sync time and counts.
   */
  public readonly listed = computed(() => this.response() !== null);

  /**
   * End of the last successful ingestion.
   */
  public readonly lastIngestionAt = computed(() => this.response()?.lastIngestionAt ?? null);

  /**
   * Every offer of the tab, as last listed and changed since.
   */
  public readonly jobs = computed(() => this.response()?.jobs ?? []);

  /**
   * Why the list of the tab could not load.
   */
  private readonly loadFailure = computed(() => {
    this.language.active();
    const failure = this.list.error();
    return failure ? translate('feed.loadFailed', { detail: describeHttpError(failure) }) : null;
  });

  /**
   * True when the offers on screen belong to the tab, from an earlier load.
   */
  private readonly showsCurrentTab = computed(() => this.loadedTab() === this.tab());

  /**
   * Blocking error shown instead of the list: nothing of this tab to show.
   */
  public readonly error = computed(() => (this.showsCurrentTab() ? null : this.loadFailure()));

  /**
   * A reload that failed while the tab's offers stay on screen: said above them.
   */
  public readonly reloadError = computed(() =>
    this.showsCurrentTab() ? this.loadFailure() : null,
  );

  /**
   * Remembers the tab the list follows.
   */
  constructor(tab: Signal<JobTab>) {
    this.tab = tab;
  }

  /**
   * Fetches the tab again.
   */
  public reload(): void {
    this.list.reload();
  }

  /**
   * Stars or un-stars an offer. The answer is published as a change, so the row, the panel and the
   * favourites count follow without reloading the list; a failure is the caller's to show.
   */
  public async toggleFavorite(id: string): Promise<void> {
    const job = this.jobs().find((listed) => listed.id === id);
    if (!job) {
      return;
    }
    this.patches.publish(await this.jobsApi.setFavorite(id, !job.isFavorite));
  }
}
