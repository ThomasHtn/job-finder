import { computed, DestroyRef, inject, Service, signal } from '@angular/core';

import { translate } from '@jsverse/transloco';

import { apiErrorCode } from '@core/http/api-error.utils';
import { Language } from '@core/i18n/language';
import { IngestionApi } from '@core/ingestion/ingestion-api';

import { REFRESH_MESSAGE_MS } from './jobs.constants';
import { RefreshOutcome } from './jobs.model';
import { newOffersMessage, sourceName } from './jobs.utils';
import { SourceHealth } from './source-health';

/**
 * The manual refresh: reading every source again, then telling what it brought. Provided by the page,
 * like the source health it asks to reload.
 */
@Service({ autoProvided: false })
export class JobsRefresh {
  /**
   * The manual ingestion.
   */
  private readonly ingestion = inject(IngestionApi);

  /**
   * Source health, reloaded once the sources have been read.
   */
  private readonly health = inject(SourceHealth);

  /**
   * Language in use, which the messages follow.
   */
  private readonly language = inject(Language);

  /**
   * True while a manual ingestion is running.
   */
  public readonly running = signal(false);

  /**
   * Outcome of the last refresh, cleared a few seconds later.
   */
  private readonly outcome = signal<RefreshOutcome | null>(null);

  /**
   * Sources that failed during the last refresh.
   */
  private readonly failedSources = signal<string[]>([]);

  /**
   * Timer clearing the outcome.
   */
  private outcomeTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Transient message about the last refresh, shown in place of the sync time.
   */
  public readonly message = computed(() => {
    this.language.active();
    const outcome = this.outcome();
    if (!outcome) {
      return null;
    }
    return outcome.kind === 'busy' ? translate('errors.conflict') : newOffersMessage(outcome.count);
  });

  /**
   * Non-blocking warning when some sources failed during the last refresh.
   */
  public readonly warning = computed(() => {
    this.language.active();
    const sources = this.failedSources().map(sourceName).join(', ');
    return sources ? translate('feed.sourcesUnavailable', { sources }) : null;
  });

  /**
   * Stops the timer with the page.
   */
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.outcomeTimer));
  }

  /**
   * Reads every source again. Resolves to whether the offers changed and the list should be fetched
   * again; a run already in progress (the cron, another device) is no failure, it says so for a few
   * seconds. Any other failure is thrown for the caller to show.
   */
  public async run(): Promise<boolean> {
    this.running.set(true);
    this.failedSources.set([]);
    try {
      const summary = await this.ingestion.run();
      this.health.refresh();
      this.failedSources.set(summary.failedSources);
      this.showOutcome({ kind: 'inserted', count: summary.inserted });
      return true;
    } catch (error: unknown) {
      if (apiErrorCode(error) !== 'CONFLICT') {
        throw error;
      }
      this.showOutcome({ kind: 'busy' });
      return false;
    } finally {
      this.running.set(false);
    }
  }

  /**
   * Shows the outcome in place of the sync time for a few seconds, then clears it.
   */
  private showOutcome(outcome: RefreshOutcome): void {
    clearTimeout(this.outcomeTimer);
    this.outcome.set(outcome);
    this.outcomeTimer = setTimeout(() => this.outcome.set(null), REFRESH_MESSAGE_MS);
  }
}
