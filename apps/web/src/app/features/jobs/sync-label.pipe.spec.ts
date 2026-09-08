import { SyncLabelPipe } from './sync-label.pipe';

/**
 * The header's sync stamp, at every distance from now.
 */
describe('SyncLabelPipe', () => {
  const pipe = new SyncLabelPipe();
  const now = new Date('2026-09-08T12:00:00.000Z');

  it('says so when the sources were never read', () => {
    expect(pipe.transform(null, now)).toBe('Jamais synchronisé');
  });

  it('counts minutes within the hour', () => {
    expect(pipe.transform('2026-09-08T11:43:00.000Z', now)).toBe('Il y a 17 min');
  });

  it('counts hours within the day', () => {
    expect(pipe.transform('2026-09-08T09:30:00.000Z', now)).toBe('Il y a 2 h');
  });

  it('names yesterday rather than counting 26 hours', () => {
    expect(pipe.transform('2026-09-07T10:00:00.000Z', now)).toBe('Hier');
  });

  it('falls back to the date beyond two days', () => {
    expect(pipe.transform('2026-09-01T10:00:00.000Z', now)).toBe('Le 01/09/2026');
  });
});
