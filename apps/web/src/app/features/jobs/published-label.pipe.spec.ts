import { PublishedLabelPipe } from './published-label.pipe';

/**
 * Relative date labels.
 */
describe('PublishedLabelPipe', () => {
  const pipe = new PublishedLabelPipe();
  const now = new Date('2026-09-04T15:00:00');

  it('is empty without a date', () => {
    expect(pipe.transform(null, now)).toBe('');
  });

  it('labels today and yesterday', () => {
    expect(pipe.transform('2026-09-04T08:00:00', now)).toBe("Aujourd'hui");
    expect(pipe.transform('2026-09-03T23:00:00', now)).toBe('Hier');
  });

  it('counts days for the past week', () => {
    expect(pipe.transform('2026-09-01T10:00:00', now)).toBe('Il y a 3 jours');
  });

  it('shows the full date beyond a week', () => {
    expect(pipe.transform('2026-08-20T10:00:00', now)).toBe('20/08/2026');
  });
});
