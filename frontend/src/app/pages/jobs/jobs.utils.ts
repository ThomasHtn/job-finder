import { translate } from '@jsverse/transloco';

import {
  type JobCounts,
  type JobListResponse,
  type JobSummary,
  toJobTab,
} from '@job-finder/contract';

import { isSingular } from '@core/i18n/i18n.utils';
import { isNewSince } from '@core/jobs/job.utils';

import { SOURCES_TAB } from './jobs.constants';
import { JobTabItem, ShellTab } from './jobs.model';

/**
 * Narrows the `?tab=` value, falling back to the default offer tab like `toJobTab`.
 */
export function toShellTab(value: unknown): ShellTab {
  return value === SOURCES_TAB ? SOURCES_TAB : toJobTab(value);
}

/**
 * The list with every known change applied to its rows, the favourites count moving with them. A
 * change to an offer the list does not hold is ignored; applying the same change twice is harmless.
 */
export function applyJobPatches(
  current: JobListResponse | null,
  patches: ReadonlyMap<string, JobSummary>,
): JobListResponse | null {
  if (!current || patches.size === 0) {
    return current;
  }
  let favorites = current.counts.favorites;
  const jobs = current.jobs.map((job) => {
    const patched = patches.get(job.id);
    if (!patched) {
      return job;
    }
    favorites += Number(patched.isFavorite) - Number(job.isFavorite);
    return patched;
  });
  return { ...current, jobs, counts: { ...current.counts, favorites } };
}

/**
 * The tab strip entries, in the active language. The on-site tab is named after the configured
 * area, a placeholder until it is known; the counts stay unknown until the first list answers.
 */
export function buildTabItems(areaLabel: string | null, counts: JobCounts | null): JobTabItem[] {
  return [
    {
      tab: 'local',
      label: areaLabel ?? translate('tabs.areaPlaceholder'),
      count: counts?.local ?? null,
      icon: 'pin',
    },
    {
      tab: 'remote',
      label: translate('tabs.remote'),
      count: counts?.remote ?? null,
      icon: 'remote',
    },
    {
      tab: 'favorites',
      label: translate('tabs.favorites'),
      count: counts?.favorites ?? null,
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

/**
 * The offers first seen after the previous visit, by the same rule as the row's own dot.
 */
export function pickNewJobs(jobs: JobSummary[], previousVisitAt: string | null): JobSummary[] {
  return jobs.filter((job) => isNewSince(job, previousVisitAt));
}

/**
 * The offers already there at the previous visit.
 */
export function pickSeenJobs(jobs: JobSummary[], previousVisitAt: string | null): JobSummary[] {
  return jobs.filter((job) => !isNewSince(job, previousVisitAt));
}
