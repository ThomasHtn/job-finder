import { hostLabel } from './job-detail.utils';

/**
 * Twin listings named by their board.
 */
describe('hostLabel', () => {
  it('keeps the hostname without www', () => {
    expect(hostLabel('https://www.apec.fr/offre/1')).toBe('apec.fr');
  });

  it('falls back to the raw text when it is not a URL', () => {
    expect(hostLabel('not a url')).toBe('not a url');
  });
});
