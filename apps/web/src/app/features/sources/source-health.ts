import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { SourceStatus } from '@job-finder/shared';

import { I18n } from '../../core/i18n/i18n.service';
import { IngestionApi } from '../jobs/ingestion-api';

/**
 * Health of every source, shared by the refresh button and the sources tab.
 * Provided by the component that shows it, so it lives and dies with that screen.
 */
@Injectable()
export class SourceHealth {
  /**
   * Ingestion API, which reports the last runs of each source.
   */
  private readonly ingestion = inject(IngestionApi);

  /**
   * Ends the pending request with the screen that provided this store.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Wording of the language in use, for the tooltip.
   */
  private readonly t = inject(I18n).t;

  /**
   * Health of every source, as last reported by the API.
   */
  public readonly statuses = signal<SourceStatus[]>([]);

  /**
   * True when the last status request failed, so the sources tab is not left blank.
   */
  public readonly failed = signal(false);

  /**
   * Enabled sources whose last run failed.
   */
  private readonly failedSources = computed(() =>
    this.statuses().filter((status) => status.enabled && !status.ok),
  );

  /**
   * True when at least one enabled source is down.
   */
  public readonly degraded = computed(() => this.failedSources().length > 0);

  /**
   * e.g. "3/4 sources available" plus the down ones, shown as the refresh button's tooltip.
   */
  public readonly label = computed(() => {
    const enabled = this.statuses().filter((status) => status.enabled);
    if (enabled.length === 0) return '';
    const text = this.t();
    const down = this.failedSources().map((status) => status.source);
    const summary = text.feed.sourcesAvailable(enabled.length - down.length, enabled.length);
    return down.length ? text.feed.sourcesFailed(summary, down.join(', ')) : summary;
  });

  /**
   * Fetches the latest health; a failure keeps the previous statuses and raises `failed`.
   */
  public load(): void {
    this.ingestion
      .status()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (statuses) => {
          this.statuses.set(statuses);
          this.failed.set(false);
        },
        error: () => this.failed.set(true),
      });
  }
}
