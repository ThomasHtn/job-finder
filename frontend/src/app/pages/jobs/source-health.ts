import { httpResource } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';

import { translate } from '@jsverse/transloco';

import type { SourceStatus } from '@job-finder/contract';

import { API_ENDPOINTS } from '@core/http/api-endpoints';
import { lastValue } from '@core/http/resource.utils';
import { Language } from '@core/i18n/language';

import { sourceName } from './jobs.utils';

/**
 * Health of every source, shared by the refresh button and the sources tab.
 * Provided by the page that shows it, so it lives and dies with that screen.
 */
@Service({ autoProvided: false })
export class SourceHealth {
  /**
   * Language in use, for the tooltip.
   */
  private readonly language = inject(Language);

  /**
   * Last runs of each source, as the API reports them.
   */
  private readonly status = httpResource<SourceStatus[]>(() => API_ENDPOINTS.ingestionStatus);

  /**
   * Health of every source; a failed request keeps the previous statuses.
   */
  public readonly statuses = lastValue(this.status, []);

  /**
   * True when the last status request failed, so the sources tab is not left blank.
   */
  public readonly failed = computed(() => this.status.status() === 'error');

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
    this.language.active();
    const enabled = this.statuses().filter((status) => status.enabled);
    if (enabled.length === 0) {
      return '';
    }
    const down = this.failedSources().map((status) => sourceName(status.source));
    const summary = translate('feed.sourcesAvailable', {
      ok: enabled.length - down.length,
      total: enabled.length,
    });
    return down.length
      ? translate('feed.sourcesFailed', { summary, sources: down.join(', ') })
      : summary;
  });

  /**
   * Fetches the latest health, unless a request is already on its way.
   */
  public refresh(): void {
    if (!this.status.isLoading()) {
      this.status.reload();
    }
  }
}
