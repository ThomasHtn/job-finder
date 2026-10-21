import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';

import { useFrenchTexts } from '@core/i18n/i18n.fixtures';

import { SinceVisitLabelPipe } from './since-visit-label.pipe';

/**
 * The line under the count of new offers, at every distance from the previous visit.
 */
describe('SinceVisitLabelPipe', () => {
  useFrenchTexts();

  const pipe = new SinceVisitLabelPipe();
  const now = new Date('2026-10-21T10:00:00');

  it('says nothing on the very first visit', () => {
    expect(pipe.transform(null, 'fr', now)).toBe('');
  });

  it('gives the hour of a visit the same day', () => {
    expect(pipe.transform(new Date('2026-10-21T08:05:00').toISOString(), 'fr', now)).toBe(
      'depuis votre visite à 08 h 05',
    );
  });

  it('names yesterday with its hour', () => {
    expect(pipe.transform(new Date('2026-10-20T18:40:00').toISOString(), 'fr', now)).toBe(
      "depuis votre visite d'hier à 18 h 40",
    );
  });

  it('falls back to the date beyond yesterday', () => {
    expect(pipe.transform(new Date('2026-10-14T18:40:00').toISOString(), 'fr', now)).toBe(
      'depuis votre visite du 14/10',
    );
  });

  it('reads in the active language', () => {
    TestBed.inject(TranslocoService).setActiveLang('en');
    expect(pipe.transform(new Date('2026-10-20T18:40:00').toISOString(), 'en', now)).toBe(
      'since your visit yesterday at 18:40',
    );
  });
});
