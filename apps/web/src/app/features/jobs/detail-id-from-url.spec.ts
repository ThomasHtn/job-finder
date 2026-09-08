import { detailIdFromUrl } from './detail-id-from-url';

/**
 * Which offer the URL has open, whatever else it carries.
 */
describe('detailIdFromUrl', () => {
  it('reads the id of the detail route', () => {
    expect(detailIdFromUrl('/offres/job-1')).toBe('job-1');
  });

  it('ignores the query string kept alongside it', () => {
    expect(detailIdFromUrl('/offres/job-1?tab=remote')).toBe('job-1');
  });

  it('returns null on the feed alone', () => {
    expect(detailIdFromUrl('/?tab=favorites')).toBeNull();
  });
});
