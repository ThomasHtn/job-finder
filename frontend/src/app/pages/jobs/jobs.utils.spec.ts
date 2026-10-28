import type { JobListResponse, JobSummary } from '@job-finder/contract';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import {
  applyJobPatches,
  buildTabItems,
  newOffersMessage,
  pickNewJobs,
  pickSeenJobs,
  sourceName,
  toShellTab,
} from './jobs.utils';

/**
 * A minimal row: only the fields the patch reads matter here.
 */
function row(id: string, isFavorite: boolean): JobSummary {
  return { id, isFavorite, title: id } as JobSummary;
}

/**
 * A list holding the given rows, with one favourite already counted.
 */
function list(...jobs: JobSummary[]): JobListResponse {
  return {
    jobs,
    counts: { local: jobs.length, remote: 0, favorites: 1 },
    lastIngestionAt: null,
  };
}

describe('jobs utils', () => {
  useFrenchTexts();

  describe('toShellTab', () => {
    it('keeps the offer tabs and the sources tab', () => {
      expect(toShellTab('remote')).toBe('remote');
      expect(toShellTab('sources')).toBe('sources');
    });

    it('falls back to the default tab on garbage', () => {
      expect(toShellTab('nope')).toBe('local');
      expect(toShellTab(undefined)).toBe('local');
    });
  });

  describe('sourceName', () => {
    it('names a source as the reader knows it', () => {
      expect(sourceName('FREE_WORK')).toBe('Free-Work');
      expect(sourceName('ATS')).toBe('Sites carrière (ATS)');
    });
  });

  describe('applyJobPatches', () => {
    it('replaces the rows and keeps the others in order', () => {
      const patches = new Map([['b', { ...row('b', false), title: 'renamed' }]]);

      const result = applyJobPatches(list(row('a', false), row('b', false)), patches);

      expect(result?.jobs.map((job) => job.title)).toEqual(['a', 'renamed']);
    });

    it('moves the favourites count when the star changes', () => {
      const starred = applyJobPatches(list(row('a', false)), new Map([['a', row('a', true)]]));
      const unstarred = applyJobPatches(list(row('a', true)), new Map([['a', row('a', false)]]));

      expect(starred?.counts.favorites).toBe(2);
      expect(unstarred?.counts.favorites).toBe(0);
    });

    it('applies several changes at once', () => {
      const patches = new Map([
        ['a', row('a', true)],
        ['b', row('b', true)],
      ]);

      const result = applyJobPatches(list(row('a', false), row('b', false)), patches);

      expect(result?.counts.favorites).toBe(3);
    });

    it('leaves a row the list already shows as patched alone', () => {
      const result = applyJobPatches(list(row('a', true)), new Map([['a', row('a', true)]]));

      expect(result?.counts.favorites).toBe(1);
    });

    it('leaves the list untouched when no offer of it changed', () => {
      const current = list(row('a', false));

      expect(applyJobPatches(current, new Map([['z', row('z', true)]]))?.jobs).toEqual(
        current.jobs,
      );
      expect(applyJobPatches(current, new Map())).toBe(current);
      expect(applyJobPatches(null, new Map([['z', row('z', true)]]))).toBeNull();
    });
  });

  describe('pickNewJobs and pickSeenJobs', () => {
    const jobs = [
      { ...row('old', false), firstSeenAt: '2026-09-01T00:00:00.000Z' },
      { ...row('new', false), firstSeenAt: '2026-09-06T00:00:00.000Z' },
    ];

    it('split the offers around the previous visit', () => {
      expect(pickNewJobs(jobs, '2026-09-05T00:00:00.000Z').map((job) => job.id)).toEqual(['new']);
      expect(pickSeenJobs(jobs, '2026-09-05T00:00:00.000Z').map((job) => job.id)).toEqual(['old']);
    });

    it('call everything seen on the very first visit', () => {
      expect(pickNewJobs(jobs, null)).toEqual([]);
      expect(pickSeenJobs(jobs, null)).toHaveLength(2);
    });
  });

  describe('buildTabItems', () => {
    it('lists the three offer tabs, the on-site one named after the area once known', () => {
      const counts = { local: 3, remote: 2, favorites: 1 };

      expect(buildTabItems(null, counts)[0].label).toBe('Sur site');
      expect(buildTabItems('Normandie', counts).map((item) => [item.label, item.count])).toEqual([
        ['Normandie', 3],
        ['Full remote', 2],
        ['Favoris', 1],
      ]);
    });

    it('leaves the counts unknown until the first list answers', () => {
      expect(buildTabItems('Normandie', null).map((item) => item.count)).toEqual([
        null,
        null,
        null,
      ]);
    });
  });

  describe('newOffersMessage', () => {
    it('counts what a refresh brought', () => {
      expect(newOffersMessage(0)).toBe('Aucune nouvelle offre.');
      expect(newOffersMessage(1)).toBe('1 nouvelle offre.');
      expect(newOffersMessage(4)).toBe('4 nouvelles offres.');
    });
  });
});
