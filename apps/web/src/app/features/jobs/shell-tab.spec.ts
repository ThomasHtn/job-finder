import { toShellTab } from './shell-tab';

/**
 * Reading the `?tab=` query parameter.
 */
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
