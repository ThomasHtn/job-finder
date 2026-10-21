import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { SyncLabelPipe } from './sync-label.pipe';

/**
 * The header's sync stamp, at every distance from now.
 */
describe('SyncLabelPipe', () => {
  useFrenchTexts();

  const pipe = new SyncLabelPipe();
  const now = new Date('2026-09-08T12:00:00.000Z');

  it('says so when the sources were never read', () => {
    expect(pipe.transform(null, 'fr', now)).toBe('Jamais synchronisé');
  });

  it('says just now within the minute', () => {
    expect(pipe.transform('2026-09-08T11:59:30.000Z', 'fr', now)).toBe("À l'instant");
  });

  it('counts minutes within the hour', () => {
    expect(pipe.transform('2026-09-08T11:43:00.000Z', 'fr', now)).toBe('Il y a 17 min');
  });

  it('counts hours within the day', () => {
    expect(pipe.transform('2026-09-08T09:30:00.000Z', 'fr', now)).toBe('Il y a 2 h');
  });

  it('names yesterday rather than counting 26 hours', () => {
    expect(pipe.transform('2026-09-07T10:00:00.000Z', 'fr', now)).toBe('Hier');
  });

  it('gives the date rather than yesterday when two midnights have passed, even within 48 hours', () => {
    expect(pipe.transform('2026-09-06T13:00:00.000Z', 'fr', now)).toBe('Le 06/09/2026');
  });

  it('falls back to the date beyond two days', () => {
    expect(pipe.transform('2026-09-01T10:00:00.000Z', 'fr', now)).toBe('Le 01/09/2026');
  });

  it('reads in the active language', () => {
    TestBed.inject(TranslocoService).setActiveLang('en');
    expect(pipe.transform('2026-09-08T11:43:00.000Z', 'en', now)).toBe('17 min ago');
    expect(pipe.transform(null, 'en', now)).toBe('Never synced');
  });
});
