import { TestBed } from '@angular/core/testing';

import type { SourceStatus } from '@job-finder/contract';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { SourceBoard } from './source-board';

/**
 * One failing source with two runs, and one without credentials.
 */
const STATUSES: SourceStatus[] = [
  {
    source: 'APEC',
    enabled: true,
    lastRunAt: '2026-09-08T10:00:00.000Z',
    ok: false,
    error: 'timeout',
    lastSuccessAt: null,
    jobCount: 2,
    runs: [
      {
        startedAt: '2026-09-08T09:59:00.000Z',
        finishedAt: '2026-09-08T10:00:00.000Z',
        fetched: 0,
        kept: 0,
        inserted: 0,
        error: 'timeout',
      },
    ],
  },
  {
    source: 'JOOBLE',
    enabled: false,
    lastRunAt: null,
    ok: false,
    error: null,
    lastSuccessAt: null,
    jobCount: 0,
    runs: [],
  },
];

describe('SourceBoard', () => {
  useFrenchTexts();

  it('words the health, stock and runs of every source', () => {
    const fixture = TestBed.createComponent(SourceBoard);
    fixture.componentRef.setInput('statuses', STATUSES);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('APEC');
    expect(host.textContent).toContain('En échec');
    expect(host.textContent).toContain('2 offres');
    expect(host.textContent).toContain('1 dernière exécution');
    expect(host.textContent).toContain('Jamais synchronisé');
    expect(host.textContent).toContain('Non configurée');
    expect(host.textContent).toContain('Identifiants absents du .env');
    expect(host.querySelector('.source-board__source--failed')).not.toBeNull();
  });
});
