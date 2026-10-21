import type { SourceRun, SourceStatus } from '@job-finder/contract';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { countLabel, runFigures, sourceState, toSourceRow } from './source-board.utils';

/**
 * A finished run with the given figures.
 */
function run(fetched: number, kept: number, inserted: number): SourceRun {
  return {
    startedAt: '2026-09-08T10:00:00.000Z',
    finishedAt: '2026-09-08T10:01:00.000Z',
    fetched,
    kept,
    inserted,
    updated: 0,
    error: null,
  };
}

/**
 * A source status with sensible defaults.
 */
function status(overrides: Partial<SourceStatus>): SourceStatus {
  return {
    source: 'ADZUNA',
    enabled: true,
    lastRunAt: null,
    ok: true,
    error: null,
    lastSuccessAt: null,
    jobCount: 0,
    runs: [],
    ...overrides,
  };
}

describe('source board utils', () => {
  useFrenchTexts();

  it('tells a source apart by its last run', () => {
    expect(sourceState(status({ enabled: false }))).toBe('disabled');
    expect(sourceState(status({ runs: [] }))).toBe('never');
    expect(sourceState(status({ runs: [run(1, 1, 1)], ok: true }))).toBe('ok');
    expect(sourceState(status({ runs: [run(1, 1, 1)], ok: false }))).toBe('failed');
  });

  it('agrees the noun with its count', () => {
    expect(countLabel('sources.offers', 1)).toBe('1 offre');
    expect(countLabel('sources.offers', 3)).toBe('3 offres');
  });

  it('spells out the figures of a run', () => {
    expect(runFigures(run(12, 1, 0))).toBe('12 récupérées, 1 retenue, 0 nouvelle');
  });

  it('words a whole source, a failed run showing its error', () => {
    const failed = { ...run(0, 0, 0), error: 'Adzuna answered 503' };
    const row = toSourceRow(status({ jobCount: 2, runs: [failed, run(3, 2, 1)], ok: false }));

    expect(row.state).toBe('failed');
    expect(row.offers).toBe('2 offres');
    expect(row.history).toBe('2 dernières exécutions');
    expect(row.runs.map((line) => line.result)).toEqual([
      'Adzuna answered 503',
      '3 récupérées, 2 retenues, 1 nouvelle',
    ]);
  });
});
