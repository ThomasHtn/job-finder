import type { JobListResponse, JobSummary } from '@job-finder/contract';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import {
  applyJobPatch,
  buildTabItems,
  newOffersMessage,
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

  describe('applyJobPatch', () => {
    it('replaces the row and keeps the others in order', () => {
      const patched = { ...row('b', false), title: 'renamed' };

      const result = applyJobPatch(list(row('a', false), row('b', false)), patched);

      expect(result?.jobs.map((job) => job.title)).toEqual(['a', 'renamed']);
    });

    it('moves the favourites count when the star changes', () => {
      const starred = applyJobPatch(list(row('a', false)), row('a', true));
      const unstarred = applyJobPatch(list(row('a', true)), row('a', false));

      expect(starred?.counts.favorites).toBe(2);
      expect(unstarred?.counts.favorites).toBe(0);
    });

    it('leaves the list untouched when the offer is not in it', () => {
      const current = list(row('a', false));

      expect(applyJobPatch(current, row('z', true))).toBe(current);
      expect(applyJobPatch(null, row('z', true))).toBeNull();
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
  });

  describe('newOffersMessage', () => {
    it('counts what a refresh brought', () => {
      expect(newOffersMessage(0)).toBe('Aucune nouvelle offre.');
      expect(newOffersMessage(1)).toBe('1 nouvelle offre.');
      expect(newOffersMessage(4)).toBe('4 nouvelles offres.');
    });
  });
});
