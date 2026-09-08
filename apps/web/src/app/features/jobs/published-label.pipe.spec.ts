import { EN } from '../../core/i18n/en';
import { FR } from '../../core/i18n/fr';
import { PublishedLabelPipe } from './published-label.pipe';

/**
 * Relative date labels.
 */
describe('PublishedLabelPipe', () => {
  const pipe = new PublishedLabelPipe();
  const now = new Date('2026-09-04T15:00:00');

  it('is empty without a date', () => {
    expect(pipe.transform(null, FR, now)).toBe('');
  });

  it('labels today and yesterday', () => {
    expect(pipe.transform('2026-09-04T08:00:00', FR, now)).toBe("Aujourd'hui");
    expect(pipe.transform('2026-09-03T23:00:00', FR, now)).toBe('Hier');
  });

  it('counts days for the past week', () => {
    expect(pipe.transform('2026-09-01T10:00:00', FR, now)).toBe('Il y a 3 jours');
  });

  it('shows the full date beyond a week', () => {
    expect(pipe.transform('2026-08-20T10:00:00', FR, now)).toBe('20/08/2026');
  });

  it('reads in the language it is given', () => {
    expect(pipe.transform('2026-09-04T08:00:00', EN, now)).toBe('Today');
    expect(pipe.transform('2026-09-01T10:00:00', EN, now)).toBe('3 days ago');
  });
});
