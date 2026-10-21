import { translate } from '@jsverse/transloco';

import {
  type JobCounts,
  type JobListResponse,
  type JobSummary,
  toJobTab,
} from '@job-finder/contract';

import { isSingular } from '@core/i18n/i18n.utils';

import { SOURCES_TAB } from './jobs.constants';
import { JobTabItem, ShellTab } from './jobs.model';

/**
 * Narrows the `?tab=` value, falling back to the default offer tab like `toJobTab`.
 */
export function toShellTab(value: unknown): ShellTab {
  return value === SOURCES_TAB ? SOURCES_TAB : toJobTab(value);
}

/**
 * Replaces one row of the list in place and moves the favourites count with it.
 * Returns the list untouched when the offer is not in it.
 */
export function applyJobPatch(
  current: JobListResponse | null,
  patched: JobSummary,
): JobListResponse | null {
  const previous = current?.jobs.find((job) => job.id === patched.id);
  if (!current || !previous) {
    return current;
  }
  const favorites =
    current.counts.favorites + (patched.isFavorite ? 1 : 0) - (previous.isFavorite ? 1 : 0);
  return {
    ...current,
    jobs: current.jobs.map((job) => (job.id === patched.id ? patched : job)),
    counts: { ...current.counts, favorites },
  };
}

/**
 * The tab strip entries, in the active language. The on-site tab is named after the configured
 * area, a placeholder until it is known.
 */
export function buildTabItems(areaLabel: string | null, counts: JobCounts): JobTabItem[] {
  return [
    {
      tab: 'local',
      label: areaLabel ?? translate('tabs.areaPlaceholder'),
      count: counts.local,
      icon: 'pin',
    },
    { tab: 'remote', label: translate('tabs.remote'), count: counts.remote, icon: 'remote' },
    {
      tab: 'favorites',
      label: translate('tabs.favorites'),
      count: counts.favorites,
      icon: 'star',
    },
  ];
}

/**
 * What a manual refresh brought, in the active language.
 */
export function newOffersMessage(count: number): string {
  if (count === 0) {
    return translate('feed.newOffersNone');
  }
  return translate(isSingular(count) ? 'feed.newOffersOne' : 'feed.newOffersOther', { count });
}

/**
 * A source as the reader knows it ("France Travail"), never its API identifier ("FRANCE_TRAVAIL").
 */
export function sourceName(source: string): string {
  return translate(`sources.names.${source}`);
}
